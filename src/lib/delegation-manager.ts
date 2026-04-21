import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import { persistDelegations, readPersistedDelegations } from "./delegation-persistence.js"
import { unwrapData } from "./helpers.js"
import type { PtyManager } from "./pty/pty-manager.js"
import { CommandDelegationHandler } from "./command-delegation.js"
import { SdkDelegationHandler } from "./sdk-delegation.js"
import { resolveDelegationConcurrencyKey } from "./spawner/concurrency-key.js"
import { resolveParentWorkingDirectory } from "./spawner/parent-directory.js"
import { spawnDelegatedSession } from "./spawner/session-creator.js"
import type { DelegationSpawnRequest } from "./spawner/spawner-types.js"
import {
  DEFAULT_SAFETY_CEILING_MS,
  type CommandDelegationParams,
  type Delegation,
  type DelegationResult,
} from "./types.js"

type DelegateParams = {
  parentSessionId: string
  agent: string
  prompt: string
  title?: string
  safetyCeilingMs?: number
  workingDirectory?: string
  worktree?: string
  provider?: string
  model?: string
  category?: string
}

type ValidatedAgent = { name: string; provider?: string; model?: string; category?: string }
type QueueContext = { provider?: string; model?: string; agent?: string; category?: string }

export class DelegationManager {
  private readonly delegations = new Map<string, Delegation>()
  private readonly delegationsBySession = new Map<string, string>()
  private readonly safetyTimers = new Map<string, NodeJS.Timeout>()
  private readonly semaphore = new DelegationConcurrencyQueue()
  private readonly commandHandler: CommandDelegationHandler
  private readonly sdkHandler: SdkDelegationHandler

  constructor(
    private readonly client: OpenCodeClient,
    options: { ptyManager?: PtyManager | null } = {},
  ) {
    const dm = this
    this.commandHandler = new CommandDelegationHandler(options.ptyManager ?? null, {
      getDelegation: (id) => dm.delegations.get(id),
      registerDelegation: (d, s) => dm.registerDelegation(d, s),
      persistAllDelegations: () => dm.persistAllDelegations(),
      buildResult: (d) => dm.buildResult(d),
      cleanupTracking: (id, sid) => dm.cleanupTracking(id, sid),
    })
    this.sdkHandler = new SdkDelegationHandler(client, {
      getDelegation: (id) => dm.delegations.get(id),
      persistAllDelegations: () => dm.persistAllDelegations(),
      cleanupTracking: (id, sid) => dm.cleanupTracking(id, sid),
      scheduleSafetyCeiling: (d) => dm.scheduleSafetyCeiling(d),
      onSessionIdle: (sid) => dm.handleSessionIdle(sid),
    })
  }

  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    const agent = await this.validateAgent(params.agent)
    const canonicalContext = this.buildCanonicalQueueContext(agent, params)
    const acquireQueueKey = buildDelegationQueueKey(canonicalContext)
    const spawnQueueKey = resolveDelegationConcurrencyKey(canonicalContext)
    if (spawnQueueKey !== acquireQueueKey) {
      throw new Error("[Harness] Canonical delegation queue-key drift detected.")
    }
    const release = await this.semaphore.acquire(acquireQueueKey, undefined, undefined)
    try {
      const workingDirectory = resolveParentWorkingDirectory({
        contextDirectory: params.workingDirectory,
        worktree: params.worktree,
      })
      const child = await spawnDelegatedSession({
        client: this.client as never,
        request: this.buildSpawnRequest({ params, agent, workingDirectory }),
      })
      const delegation: Delegation = {
        id: crypto.randomUUID(),
        parentSessionId: params.parentSessionId,
        childSessionId: child.childSessionId,
        agent: agent.name,
        status: "dispatched",
        createdAt: Date.now(),
        safetyCeilingMs: params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
        lastMessageCount: 0,
        stablePollCount: 0,
        executionMode: "sdk",
        workingDirectory,
        queueKey: acquireQueueKey,
      }
      this.registerDelegation(delegation, true)
      this.persistAllDelegations()
      this.client.session.prompt({
        path: { id: delegation.childSessionId },
        body: { parts: [{ type: "text", text: params.prompt }], agent: agent.name },
      }).then(() => {
        setTimeout(() => {
          const current = this.delegations.get(delegation.id)
          if (current && current.status === "dispatched") {
            current.status = "running"
            this.persistAllDelegations()
          }
        }, 0)
      }).catch(() => {
        setTimeout(() => {
          const current = this.delegations.get(delegation.id)
          if (current && current.status === "dispatched") {
            current.status = "error"
            current.error = "Failed to send prompt to child session"
            current.completedAt = Date.now()
            this.persistAllDelegations()
            this.cleanupTracking(delegation.id, delegation.childSessionId)
          }
        }, 0)
      })
      return this.buildResult(delegation)
    } finally {
      release()
    }
  }

  async dispatchCommand(params: CommandDelegationParams): Promise<DelegationResult> {
    const queueContext = this.buildCommandQueueContext(params)
    const queueKey = buildDelegationQueueKey(queueContext)
    const release = await this.semaphore.acquire(queueKey, undefined, undefined)
    try {
      return await this.commandHandler.dispatchCommand(params, queueKey)
    } finally {
      release()
    }
  }

  handleSessionIdle(sessionId: string): void {
    const delegationId = this.delegationsBySession.get(sessionId)
    if (!delegationId) return
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.executionMode !== "sdk") return
    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") return
    if (delegation.status === "dispatched") {
      delegation.status = "running"
      this.persistAllDelegations()
    }
    if (!this.sdkHandler.isPolling(delegationId)) {
      this.sdkHandler.scheduleStabilityPoll(delegationId)
    }
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
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, sessionId)
  }

  async recoverPending(): Promise<void> {
    for (const persistedDelegation of readPersistedDelegations()) {
      const delegation = { ...persistedDelegation }
      this.delegations.set(delegation.id, delegation)
      if (delegation.status !== "running" && delegation.status !== "dispatched") continue
      if (delegation.executionMode === "sdk") {
        this.delegationsBySession.set(delegation.childSessionId, delegation.id)
        await this.sdkHandler.recoverSdkDelegation(delegation)
        continue
      }
      if (delegation.executionMode === "pty" && delegation.ptySessionId) {
        this.commandHandler.recoverPtyDelegation(delegation)
        continue
      }
      delegation.status = "error"
      delegation.error = "[Harness] Headless command delegation cannot be recovered after restart"
      delegation.completedAt = Date.now()
      this.persistAllDelegations()
    }
  }

  getStatus(delegationId: string): Delegation | undefined {
    return this.delegations.get(delegationId)
  }

  getAllDelegations(): Delegation[] {
    return Array.from(this.delegations.values())
  }

  private registerDelegation(delegation: Delegation, scheduleSafetyCeiling: boolean): void {
    this.delegations.set(delegation.id, { ...delegation })
    this.delegationsBySession.set(delegation.childSessionId, delegation.id)
    if (scheduleSafetyCeiling) this.scheduleSafetyCeiling(delegation)
  }

  private persistAllDelegations(): void {
    persistDelegations(Array.from(this.delegations.values()))
  }

  private scheduleSafetyCeiling(delegation: Delegation): void {
    const ceiling = delegation.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS
    const remaining = Math.max(1, ceiling - (Date.now() - delegation.createdAt))
    const timer = setTimeout(() => { void this.handleSafetyCeiling(delegation.id) }, remaining)
    this.safetyTimers.set(delegation.id, timer)
  }

  private async handleSafetyCeiling(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) return
    delegation.status = "timeout"
    delegation.error = `[Harness] Delegation safety ceiling reached after ${delegation.safetyCeilingMs}ms`
    delegation.completedAt = Date.now()
    try { await this.client.session.abort({ path: { id: delegation.childSessionId } }) } catch { /* no-op */ }
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)
  }

  private clearAllTimers(delegationId: string): void {
    const t = this.safetyTimers.get(delegationId)
    if (t) { clearTimeout(t); this.safetyTimers.delete(delegationId) }
    this.sdkHandler.clearTimers(delegationId)
    this.commandHandler.clearTimers(delegationId)
  }

  private cleanupTracking(delegationId: string, childSessionId: string): void {
    this.clearAllTimers(delegationId)
    this.delegationsBySession.delete(childSessionId)
  }

  private async validateAgent(agent: string): Promise<ValidatedAgent> {
    const agents = unwrapData<Array<Record<string, unknown>>>(await this.client.app.agents())
    const validAgents = (agents ?? []).map((e) => ({
      name: typeof e.name === "string" ? e.name : "",
      provider: typeof e.provider === "string" ? e.provider : undefined,
      model: typeof e.model === "string" ? e.model : undefined,
      category: typeof e.category === "string" ? e.category : undefined,
    })).filter((e) => e.name.length > 0)
    const names = validAgents.map((e) => e.name)
    if (!names.includes(agent)) {
      throw new Error(`[Harness] Invalid agent: "${agent}". Available: [${names.join(", ")}]`)
    }
    return validAgents.find((e) => e.name === agent) ?? { name: agent }
  }

  private buildResult(delegation: Delegation): DelegationResult {
    return {
      status: delegation.status,
      delegationId: delegation.id,
      executionMode: delegation.executionMode,
      workingDirectory: delegation.workingDirectory,
      ptySessionId: delegation.ptySessionId,
      fallbackReason: delegation.fallbackReason,
      queueKey: delegation.queueKey,
    }
  }

  private buildCanonicalQueueContext(agent: ValidatedAgent, params: DelegateParams): QueueContext {
    return {
      provider: params.provider ?? agent.provider,
      model: params.model ?? agent.model,
      agent: agent.name,
      category: params.category ?? agent.category,
    }
  }

  private buildCommandQueueContext(params: CommandDelegationParams): QueueContext {
    return {
      provider: params.queueContext?.provider,
      model: params.queueContext?.model,
      agent: params.queueContext?.agent,
      category: params.queueContext?.category ?? "command",
    }
  }

  private buildSpawnRequest(args: {
    params: DelegateParams
    agent: ValidatedAgent
    workingDirectory: string
  }): DelegationSpawnRequest {
    return {
      parentSessionId: args.params.parentSessionId,
      agent: args.agent.name,
      title: args.params.title ?? `Delegation: ${args.agent.name}`,
      prompt: args.params.prompt,
      workingDirectory: args.workingDirectory,
      executionMode: "sdk",
      safetyCeilingMs: args.params.safetyCeilingMs ?? DEFAULT_SAFETY_CEILING_MS,
      permissionProfile: {
        mode: "write-capable",
        tools: ["read", "edit", "write", "bash", "glob", "grep"],
      },
    }
  }

  /** @internal Test compatibility — proxies to SdkDelegationHandler's timer map */
  get stabilityTimers(): Map<string, NodeJS.Timeout> {
    return this.sdkHandler.getTimerMap()
  }
}

export type { Delegation, DelegationResult }
