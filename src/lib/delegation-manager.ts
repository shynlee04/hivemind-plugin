import fs from "node:fs"
import { dirname, join } from "node:path"
import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import { getContinuityStoragePath } from "./continuity.js"
import { unwrapData } from "./helpers.js"
import {
  DEFAULT_DELEGATION_TIMEOUT_MS,
  VALID_AGENTS,
  type Delegation,
  type DelegationResult,
} from "./types.js"

type DelegationCallbacks = {
  resolve: (result: DelegationResult) => void
  reject: (error: Error) => void
}

type DelegateParams = {
  parentSessionId: string
  agent: string
  prompt: string
  title?: string
  timeoutMs?: number
}

type PersistedDelegation = Delegation
type TextPart = { type?: string; text?: string }
type MessageLike = { role?: string; info?: { role?: string }; parts?: TextPart[] }

export class DelegationManager {
  private readonly client: OpenCodeClient
  private readonly delegations = new Map<string, Delegation>()
  private readonly delegationsBySession = new Map<string, string>()
  private readonly timeoutTimers = new Map<string, NodeJS.Timeout>()
  private readonly completionCallbacks = new Map<string, DelegationCallbacks>()
  private readonly semaphore = new DelegationConcurrencyQueue()

  constructor(client: OpenCodeClient) {
    this.client = client
  }

  async delegateSync(params: DelegateParams): Promise<DelegationResult> {
    const delegation = await this.createDelegation(params)

    return new Promise<DelegationResult>((resolve, reject) => {
      this.completionCallbacks.set(delegation.id, { resolve, reject })
    })
  }

  async delegateAsync(params: DelegateParams): Promise<{ delegationId: string }> {
    const delegation = await this.createDelegation(params)
    return { delegationId: delegation.id }
  }

  handleSessionIdle(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) return

    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status !== "running") return

    this.clearTimeoutTimer(delegationId)
    void this.finalizeDelegation(delegationId)
  }

  handleSessionDeleted(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) return

    const delegation = this.delegations.get(delegationId)
    if (!delegation) {
      this.cleanupTracking(delegationId, sessionId)
      return
    }

    delegation.status = "error"
    delegation.error = "Delegated session deleted before completion"
    delegation.completedAt = Date.now()

    this.clearTimeoutTimer(delegationId)
    void this.persistDelegation(delegation).finally(() => {
      const callback = this.completionCallbacks.get(delegationId)
      if (callback) {
        callback.reject(new Error(`[Harness] ${delegation.error}`))
        this.completionCallbacks.delete(delegationId)
      }
      this.cleanupTracking(delegationId, sessionId)
    })
  }

  async recoverPending(): Promise<void> {
    const persistedDelegations = this.readPersistedDelegations()

    for (const delegation of persistedDelegations) {
      this.delegations.set(delegation.id, delegation)

      if (delegation.status !== "running") {
        continue
      }

      this.delegationsBySession.set(delegation.childSessionId, delegation.id)

      try {
        const statusMap = unwrapData<Record<string, { type?: string }>>(await this.client.session.status())
        const status = statusMap[delegation.childSessionId]

        if (!status) {
          throw new Error("missing")
        }

        if (status.type === "idle") {
          await this.finalizeDelegation(delegation.id)
          continue
        }

        this.scheduleTimeout(delegation)
      } catch {
        delegation.status = "error"
        delegation.error = "Child session not found on recovery"
        delegation.completedAt = Date.now()
        this.cleanupTracking(delegation.id, delegation.childSessionId)
      }
    }

    this.persistAllDelegations()
  }

  private async createDelegation(params: DelegateParams): Promise<Delegation> {
    const agent = this.validateAgent(params.agent)
    const queueKey = buildDelegationQueueKey({ agent })
    const release = await this.semaphore.acquire(queueKey)

    try {
      const child = unwrapData<{ id: string }>(await this.client.session.create({
        body: {
          title: params.title ?? `Delegation: ${agent}`,
          parentID: params.parentSessionId,
        },
      }))

      const delegation: Delegation = {
        id: crypto.randomUUID(),
        parentSessionId: params.parentSessionId,
        childSessionId: child.id,
        agent,
        status: "running",
        createdAt: Date.now(),
        timeoutMs: params.timeoutMs ?? DEFAULT_DELEGATION_TIMEOUT_MS,
      }

      this.delegations.set(delegation.id, delegation)
      this.delegationsBySession.set(delegation.childSessionId, delegation.id)

      await this.persistDelegation(delegation)
      this.scheduleTimeout(delegation)

      try {
        await this.client.session.prompt({
          path: { id: delegation.childSessionId },
          body: {
            parts: [{ type: "text", text: params.prompt }],
            agent,
          },
        })
      } catch (error) {
        delegation.status = "error"
        delegation.error = error instanceof Error ? error.message : String(error)
        delegation.completedAt = Date.now()
        this.clearTimeoutTimer(delegation.id)
        await this.persistDelegation(delegation)
        this.cleanupTracking(delegation.id, delegation.childSessionId)
        throw error
      }

      return delegation
    } finally {
      release()
    }
  }

  private async finalizeDelegation(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status !== "running") {
      return
    }

    try {
      const messages = unwrapData<MessageLike[]>(await this.client.session.messages({
        path: { id: delegation.childSessionId },
      }))

      delegation.status = "completed"
      delegation.result = this.extractAssistantText(messages)
      delegation.completedAt = Date.now()
      delegation.error = undefined

      await this.persistDelegation(delegation)

      const callback = this.completionCallbacks.get(delegationId)
      if (callback) {
        callback.resolve({
          status: "completed",
          result: delegation.result,
          delegationId,
        })
        this.completionCallbacks.delete(delegationId)
      } else {
        await this.notifyParent(delegation)
      }
    } catch (error) {
      delegation.status = "error"
      delegation.error = error instanceof Error ? error.message : String(error)
      delegation.completedAt = Date.now()

      await this.persistDelegation(delegation)

      const callback = this.completionCallbacks.get(delegationId)
      if (callback) {
        callback.reject(error instanceof Error ? error : new Error(String(error)))
        this.completionCallbacks.delete(delegationId)
      } else {
        await this.notifyParent(delegation)
      }
    } finally {
      this.cleanupTracking(delegationId, delegation.childSessionId)
    }
  }

  private async handleTimeout(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status !== "running") {
      return
    }

    delegation.status = "timeout"
    delegation.error = `[Harness] Delegation timed out after ${delegation.timeoutMs}ms`
    delegation.completedAt = Date.now()

    try {
      await this.client.session.abort({ path: { id: delegation.childSessionId } })
    } catch {
      // Child session may already be gone.
    }

    await this.persistDelegation(delegation)

    const callback = this.completionCallbacks.get(delegationId)
    if (callback) {
      callback.reject(new Error(delegation.error))
      this.completionCallbacks.delete(delegationId)
    } else {
      await this.notifyParent(delegation)
    }

    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  private async notifyParent(delegation: Delegation): Promise<void> {
    try {
      await this.client.session.prompt({
        path: { id: delegation.parentSessionId },
        body: {
          parts: [{ type: "text", text: `[Delegation Complete] ${delegation.agent}: ${delegation.status}` }],
          noReply: true,
        },
      })
    } catch {
      // Best-effort only; delegation is already persisted.
    }
  }

  private async persistDelegation(delegation: Delegation): Promise<void> {
    this.delegations.set(delegation.id, { ...delegation })
    this.persistAllDelegations()
  }

  private persistAllDelegations(): void {
    const filePath = this.getDelegationsFilePath()
    fs.mkdirSync(dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, `${JSON.stringify(Array.from(this.delegations.values()), null, 2)}\n`, "utf-8")
  }

  private readPersistedDelegations(): PersistedDelegation[] {
    const filePath = this.getDelegationsFilePath()
    if (!fs.existsSync(filePath)) {
      return []
    }

    try {
      const raw = fs.readFileSync(filePath, "utf-8")
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.filter(this.isPersistedDelegation)
    } catch {
      return []
    }
  }

  private isPersistedDelegation(value: unknown): value is PersistedDelegation {
    if (typeof value !== "object" || value === null) {
      return false
    }

    const record = value as Record<string, unknown>
    return typeof record.id === "string"
      && typeof record.parentSessionId === "string"
      && typeof record.childSessionId === "string"
      && typeof record.agent === "string"
      && typeof record.status === "string"
      && typeof record.createdAt === "number"
      && typeof record.timeoutMs === "number"
  }

  private validateAgent(agent: string): string {
    if (!VALID_AGENTS.includes(agent as (typeof VALID_AGENTS)[number])) {
      throw new Error(`[Harness] Invalid agent: ${agent}`)
    }

    return agent
  }

  private scheduleTimeout(delegation: Delegation): void {
    const elapsed = Date.now() - delegation.createdAt
    const remaining = Math.max(1, delegation.timeoutMs - elapsed)
    const timer = setTimeout(() => {
      void this.handleTimeout(delegation.id)
    }, remaining)
    this.timeoutTimers.set(delegation.id, timer)
  }

  private clearTimeoutTimer(delegationId: string): void {
    const timer = this.timeoutTimers.get(delegationId)
    if (!timer) return
    clearTimeout(timer)
    this.timeoutTimers.delete(delegationId)
  }

  private cleanupTracking(delegationId: string, childSessionId: string): void {
    this.clearTimeoutTimer(delegationId)
    this.delegationsBySession.delete(childSessionId)
  }

  private extractAssistantText(messages: MessageLike[]): string {
    return messages
      .filter((message) => message.role === "assistant" || message.info?.role === "assistant")
      .flatMap((message) => message.parts ?? [])
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text ?? "")
      .join("\n")
  }

  private getDelegationsFilePath(): string {
    const continuityStore = dirname(getContinuityStoragePath())
    return join(continuityStore, "delegations.json")
  }
}

export type { Delegation, DelegationResult }
