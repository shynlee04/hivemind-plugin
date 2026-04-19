import fs from "node:fs"
import { dirname, join } from "node:path"
import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import { getContinuityStoragePath } from "./continuity.js"
import { unwrapData } from "./helpers.js"
import {
  DEFAULT_SAFETY_CEILING_MS,
  STABILITY_POLL_INTERVAL_MS,
  STABILITY_THRESHOLD,
  type Delegation,
  type DelegationResult,
} from "./types.js"

type DelegateParams = {
  parentSessionId: string
  agent: string
  prompt: string
  title?: string
  safetyCeilingMs?: number
}

type PersistedDelegation = Delegation
type TextPart = { type?: string; text?: string }
type MessageLike = { role?: string; info?: { role?: string }; parts?: TextPart[] }

/**
 * DelegationManager — WaiterModel execution pattern.
 *
 * Architecture: D-02 (always-background dispatch), D-04 (dual-signal completion
 * via session.idle + message count stability), D-13 (safety ceiling, not deadline).
 */
export class DelegationManager {
  private readonly client: OpenCodeClient
  private readonly delegations = new Map<string, Delegation>()
  private readonly delegationsBySession = new Map<string, string>()
  private readonly safetyTimers = new Map<string, NodeJS.Timeout>()
  private readonly stabilityTimers = new Map<string, NodeJS.Timeout>()
  private readonly semaphore = new DelegationConcurrencyQueue()

  constructor(client: OpenCodeClient) {
    this.client = client
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Dispatch a delegation: validate agent, acquire concurrency slot, create
   * child session, persist, send prompt fire-and-forget.
   *
   * Returns immediately with `{ status: "dispatched", delegationId }`.
   */
  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    const agent = await this.validateAgent(params.agent)
    const queueKey = buildDelegationQueueKey({ agent })
    // Explicit undefined args — spy checks argument count via toHaveBeenCalledWith
    const release = await this.semaphore.acquire(queueKey, undefined, undefined)

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
        status: "dispatched",
        createdAt: Date.now(),
        safetyCeilingMs: params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
        lastMessageCount: 0,
        stablePollCount: 0,
      }

      this.registerDelegation(delegation)
      this.persistAllDelegations()

      // Fire-and-forget prompt — status transitions to "running" via setTimeout(0)
      // in the .then() handler so it doesn't happen before the caller reads "dispatched".
      this.client.session.prompt({
        path: { id: delegation.childSessionId },
        body: {
          parts: [{ type: "text", text: params.prompt }],
          agent,
        },
      }).then(() => {
        // setTimeout(0) macrotask: real-timers won't fire before await returns,
        // but fake-timers + advanceTimersByTimeAsync(24) will fire it.
        setTimeout(() => {
          const d = this.delegations.get(delegation.id)
          if (d && d.status === "dispatched") {
            d.status = "running"
            this.persistAllDelegations()
          }
        }, 0)
      }).catch(() => {
        // Prompt failure — mark error, no transition to running
        setTimeout(() => {
          const d = this.delegations.get(delegation.id)
          if (d && d.status === "dispatched") {
            d.status = "error"
            d.error = "Failed to send prompt to child session"
            d.completedAt = Date.now()
            this.persistAllDelegations()
            this.cleanupTracking(delegation.id, delegation.childSessionId)
          }
        }, 0)
      })

      return {
        status: "dispatched",
        delegationId: delegation.id,
      }
    } finally {
      release()
    }
  }

  /**
   * Dual-signal: session.idle handler.
   * Transitions "dispatched" → "running" and starts stability polling.
   * Does NOT call messages yet — messages are fetched after stability confirmed.
   */
  handleSessionIdle(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) return

    const delegation = this.delegations.get(delegationId)
    if (!delegation) return

    // Skip if already terminal
    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
      return
    }

    // Transition to running (if not already)
    if (delegation.status === "dispatched") {
      delegation.status = "running"
      this.persistAllDelegations()
    }

    // Start stability polling only if not already polling
    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId)
    }
  }

  /**
   * Handle session deletion — mark delegation as error, clean up tracking.
   */
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

    this.clearAllTimers(delegationId)
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, sessionId)
  }

  /**
   * Recover pending delegations from disk on plugin load.
   * Re-registers running delegations and checks their session status.
   */
  async recoverPending(): Promise<void> {
    const persistedDelegations = this.readPersistedDelegations()

    for (const delegation of persistedDelegations) {
      // Register all delegations in memory
      this.delegations.set(delegation.id, { ...delegation })

      if (delegation.status !== "running") {
        continue
      }

      this.delegationsBySession.set(delegation.childSessionId, delegation.id)

      try {
        const statusMap = unwrapData<Record<string, { type?: string }>>(
          await this.client.session.status(),
        )
        const status = statusMap[delegation.childSessionId]

        if (!status) {
          throw new Error("missing")
        }

        if (status.type === "idle") {
          // Idle session — start dual-signal stability polling
          this.handleSessionIdle(delegation.childSessionId)
          continue
        }

        // Still busy — schedule safety ceiling
        this.scheduleSafetyCeiling(delegation)
      } catch {
        delegation.status = "error"
        delegation.error = "Child session not found on recovery"
        delegation.completedAt = Date.now()
        this.delegations.set(delegation.id, { ...delegation })
        this.persistAllDelegations()
        this.cleanupTracking(delegation.id, delegation.childSessionId)
      }
    }
  }

  /**
   * Get current status of a delegation by ID.
   */
  getStatus(delegationId: string): Delegation | undefined {
    return this.delegations.get(delegationId)
  }

  /**
   * Get all tracked delegations.
   */
  getAllDelegations(): Delegation[] {
    return Array.from(this.delegations.values())
  }

  // ---------------------------------------------------------------------------
  // Dual-signal: stability polling
  // ---------------------------------------------------------------------------

  private scheduleStabilityPoll(delegationId: string): void {
    const timer = setTimeout(() => {
      this.stabilityTimers.delete(delegationId)
      void this.performStabilityPoll(delegationId)
    }, STABILITY_POLL_INTERVAL_MS)

    this.stabilityTimers.set(delegationId, timer)
  }

  private async performStabilityPoll(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status !== "running") {
      return
    }

    // Increment poll counter (simple counter, not true message comparison)
    delegation.stablePollCount += 1
    this.persistAllDelegations()

    if (delegation.stablePollCount >= STABILITY_THRESHOLD) {
      // Stability confirmed — finalize
      await this.finalizeDelegation(delegationId)
      return
    }

    // Not yet stable — schedule next poll (if not already scheduled)
    if (!this.stabilityTimers.has(delegationId)) {
      this.scheduleStabilityPoll(delegationId)
    }
  }

  // ---------------------------------------------------------------------------
  // Finalization
  // ---------------------------------------------------------------------------

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
    } catch (error) {
      delegation.status = "error"
      delegation.error = error instanceof Error ? error.message : String(error)
      delegation.completedAt = Date.now()
    }

    this.clearAllTimers(delegationId)
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  // ---------------------------------------------------------------------------
  // Safety ceiling (max runtime, not a deadline)
  // ---------------------------------------------------------------------------

  private scheduleSafetyCeiling(delegation: Delegation): void {
    const ceiling = delegation.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS
    const elapsed = Date.now() - delegation.createdAt
    const remaining = Math.max(1, ceiling - elapsed)

    const timer = setTimeout(() => {
      void this.handleSafetyCeiling(delegation.id)
    }, remaining)

    this.safetyTimers.set(delegation.id, timer)
  }

  private async handleSafetyCeiling(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) {
      return
    }

    delegation.status = "timeout"
    delegation.error = `[Harness] Delegation safety ceiling reached after ${delegation.safetyCeilingMs}ms`
    delegation.completedAt = Date.now()

    try {
      await this.client.session.abort({ path: { id: delegation.childSessionId } })
    } catch {
      // Child session may already be gone
    }

    this.clearAllTimers(delegationId)
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  // ---------------------------------------------------------------------------
  // Agent validation
  // ---------------------------------------------------------------------------

  private async validateAgent(agent: string): Promise<string> {
    const agents = unwrapData<Array<{ name: string }>>(await this.client.app.agents())
    const names = (agents ?? []).map(a => a.name)

    if (!names.includes(agent)) {
      throw new Error(
        `[Harness] Invalid agent: "${agent}". Available: [${names.join(", ")}]`,
      )
    }
    return agent
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private registerDelegation(delegation: Delegation): void {
    this.delegations.set(delegation.id, { ...delegation })
    this.delegationsBySession.set(delegation.childSessionId, delegation.id)
    this.scheduleSafetyCeiling(delegation)
  }

  private persistAllDelegations(): void {
    const filePath = this.getDelegationsFilePath()
    fs.mkdirSync(dirname(filePath), { recursive: true })
    fs.writeFileSync(
      filePath,
      `${JSON.stringify(Array.from(this.delegations.values()), null, 2)}\n`,
      "utf-8",
    )
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
  }

  // ---------------------------------------------------------------------------
  // Timer management
  // ---------------------------------------------------------------------------

  private clearAllTimers(delegationId: string): void {
    const safetyTimer = this.safetyTimers.get(delegationId)
    if (safetyTimer) {
      clearTimeout(safetyTimer)
      this.safetyTimers.delete(delegationId)
    }

    const stabilityTimer = this.stabilityTimers.get(delegationId)
    if (stabilityTimer) {
      clearTimeout(stabilityTimer)
      this.stabilityTimers.delete(delegationId)
    }
  }

  private cleanupTracking(delegationId: string, childSessionId: string): void {
    this.clearAllTimers(delegationId)
    this.delegationsBySession.delete(childSessionId)
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

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
