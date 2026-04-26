import type { OpencodeClient as OpenCodeClient } from "@opencode-ai/sdk"

import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import { persistDelegations, readPersistedDelegations } from "./delegation-persistence.js"
import { notifyDelegationTerminal } from "./notification-handler.js"
import { unwrapData } from "./helpers.js"
import type { PtyManager } from "./pty/pty-manager.js"
import { CommandDelegationHandler } from "./command-delegation.js"
import { SdkDelegationHandler } from "./sdk-delegation.js"
import { resolveDelegationConcurrencyKey } from "./spawner/concurrency-key.js"
import { resolveParentWorkingDirectory } from "./spawner/parent-directory.js"
import { spawnDelegatedSession } from "./spawner/session-creator.js"
import { buildSdkSpawnRequest, type DelegateParams, type ValidatedAgent } from "./spawner/spawn-request-builder.js"
import {
  DEFAULT_SAFETY_CEILING_MS,
  type CommandDelegationParams,
  type Delegation,
  type DelegationRecoveryGuarantee,
  type DelegationResult,
  type DelegationSurface,
  type DelegationStatus,
  type DelegationTerminalKind,
  MAX_DELEGATIONS_BEFORE_PRUNE,
  DEFAULT_PRUNE_MAX_AGE_MS,
  MAX_DELEGATION_DEPTH,
  TASK_CLEANUP_DELAY_MS,
} from "./types.js"

function deriveDelegationSurface(executionMode: Delegation["executionMode"]): DelegationSurface {
  return executionMode === "sdk" ? "agent-delegation" : "command-process"
}

function deriveRecoveryGuarantee(executionMode: Delegation["executionMode"]): DelegationRecoveryGuarantee {
  if (executionMode === "sdk") {
    return "resumable"
  }
  if (executionMode === "pty") {
    return "best-effort"
  }
  return "non-resumable-after-restart"
}

type QueueContext = { provider?: string; model?: string; agent?: string; category?: string }

export class DelegationManager {
  private readonly delegations = new Map<string, Delegation>()
  private readonly delegationsBySession = new Map<string, string>()
  private readonly safetyTimers = new Map<string, NodeJS.Timeout>()
  private readonly gracePeriodTimers = new Map<string, NodeJS.Timeout>()
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
      onTerminal: (id, state, err, terminalDetail) => dm.transitionToTerminal(id, state, err, terminalDetail),
    })
    this.sdkHandler = new SdkDelegationHandler(client, {
      getDelegation: (id) => dm.delegations.get(id),
      persistAllDelegations: () => dm.persistAllDelegations(),
      cleanupTracking: (id, sid) => dm.cleanupTracking(id, sid),
      scheduleSafetyCeiling: (d) => dm.scheduleSafetyCeiling(d),
      onSessionIdle: (sid) => dm.handleSessionIdle(sid),
      onTerminal: (id, state, err) => dm.transitionToTerminal(id, state, err),
    })
  }

  private resolveNestingDepth(parentSessionId: string): number {
    const parentDelegationId = this.delegationsBySession.get(parentSessionId)
    if (!parentDelegationId) return 1
    const parentDelegation = this.delegations.get(parentDelegationId)
    return (parentDelegation?.nestingDepth ?? 0) + 1
  }

  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    const nestingDepth = this.resolveNestingDepth(params.parentSessionId)
    if (nestingDepth > MAX_DELEGATION_DEPTH) {
      throw new Error(
        `[Harness] Maximum delegation nesting depth (${MAX_DELEGATION_DEPTH}) exceeded. ` +
        `Current depth: ${nestingDepth}. Use result retrieval pattern instead of further delegation.`,
      )
    }
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
        request: buildSdkSpawnRequest(params, agent, workingDirectory),
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
        lastMessageCountChangeAt: Date.now(),
        nestingDepth,
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
            this.transitionToTerminal(delegation.id, "error", "Failed to send prompt to child session")
          }
        }, 0)
      })
      return this.buildResult(delegation)
    } finally {
      release()
    }
  }

  async dispatchCommand(params: CommandDelegationParams): Promise<DelegationResult> {
    const nestingDepth = this.resolveNestingDepth(params.parentSessionId)
    if (nestingDepth > MAX_DELEGATION_DEPTH) {
      throw new Error(
        `[Harness] Maximum delegation nesting depth (${MAX_DELEGATION_DEPTH}) exceeded. ` +
        `Current depth: ${nestingDepth}. Use result retrieval pattern instead of further delegation.`,
      )
    }
    const queueContext = this.buildCommandQueueContext(params)
    const queueKey = buildDelegationQueueKey(queueContext)
    const release = await this.semaphore.acquire(queueKey, undefined, undefined)
    try {
      return await this.commandHandler.dispatchCommand(params, queueKey, nestingDepth)
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
    this.transitionToTerminal(delegationId, "error", "Delegated session deleted before completion")
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
      delegation.terminalKind = "non-resumable-after-restart"
      delegation.terminationSignal = undefined
      delegation.explicitCancellation = false
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

  markCommandCancellationForPtySession(ptySessionId: string): DelegationResult | undefined {
    for (const delegation of this.delegations.values()) {
      if (delegation.ptySessionId !== ptySessionId) {
        continue
      }
      if (delegation.status !== "running" && delegation.status !== "dispatched") {
        return this.buildResult(delegation)
      }

      delegation.explicitCancellation = true
      delegation.terminalKind = "cancelled"
      this.persistAllDelegations()
      return this.buildResult(delegation)
    }

    return undefined
  }

  private withContractDefaults(delegation: Delegation): Delegation {
    return {
      ...delegation,
      surface: delegation.surface ?? deriveDelegationSurface(delegation.executionMode),
      recoveryGuarantee: delegation.recoveryGuarantee ?? deriveRecoveryGuarantee(delegation.executionMode),
      explicitCancellation: delegation.explicitCancellation ?? false,
    }
  }

  private registerDelegation(delegation: Delegation, scheduleSafetyCeiling: boolean): void {
    const hydratedDelegation = this.withContractDefaults(delegation)
    this.delegations.set(hydratedDelegation.id, hydratedDelegation)
    this.delegationsBySession.set(hydratedDelegation.childSessionId, hydratedDelegation.id)
    if (scheduleSafetyCeiling) this.scheduleSafetyCeiling(hydratedDelegation)
  }

  private persistAllDelegations(): void {
    if (this.delegations.size > MAX_DELEGATIONS_BEFORE_PRUNE) {
      this.pruneCompletedDelegations()
    }
    persistDelegations(Array.from(this.delegations.values()))
  }

  /**
   * Remove terminal delegations (completed, error, timeout) whose completedAt
   * timestamp is older than `maxAgeMs`. Prevents unbounded memory growth in
   * the in-memory delegations Map. Syncs durable state after pruning.
   *
   * @param maxAgeMs - Maximum age in milliseconds for keeping terminal delegations.
   *   Defaults to {@link DEFAULT_PRUNE_MAX_AGE_MS} (30 minutes).
   * @returns Number of delegations pruned.
   */
  pruneCompletedDelegations(maxAgeMs: number = DEFAULT_PRUNE_MAX_AGE_MS): number {
    const now = Date.now()
    const terminalStatuses: ReadonlySet<DelegationStatus> = new Set(["completed", "error", "timeout"])
    const toPrune: string[] = []

    for (const [id, delegation] of this.delegations) {
      if (!terminalStatuses.has(delegation.status)) continue
      if (delegation.completedAt !== undefined && (now - delegation.completedAt) > maxAgeMs) {
        toPrune.push(id)
      }
    }

    for (const id of toPrune) {
      const delegation = this.delegations.get(id)
      if (delegation) {
        this.cleanupTracking(id, delegation.childSessionId)
      }
      this.delegations.delete(id)
    }

    if (toPrune.length > 0) {
      persistDelegations(Array.from(this.delegations.values()))
    }

    return toPrune.length
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
    this.transitionToTerminal(delegationId, "timeout", `[Harness] Delegation safety ceiling reached after ${delegation.safetyCeilingMs}ms`)
    try { await this.client.session.abort({ path: { id: delegation.childSessionId } }) } catch { /* no-op */ }
  }

  /**
   * Unified terminal state transition for all delegation completion paths.
   * Handles status setting, persistence, cleanup, logging, and notification scheduling.
   */
  private transitionToTerminal(
    delegationId: string,
    newState: DelegationStatus,
    error?: string,
    terminalDetail?: {
      terminalKind?: DelegationTerminalKind
      terminationSignal?: string
      explicitCancellation?: boolean
    },
  ): void {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) {
      return
    }

    const previousStatus = delegation.status
    delegation.status = newState
    delegation.completedAt = Date.now()
    delegation.terminalKind = terminalDetail?.terminalKind ?? delegation.terminalKind
    delegation.terminationSignal = terminalDetail?.terminationSignal ?? delegation.terminationSignal
    delegation.explicitCancellation = terminalDetail?.explicitCancellation ?? delegation.explicitCancellation ?? false
    if (error !== undefined) {
      delegation.error = error
    }
    if (newState === "completed") {
      delegation.error = undefined
    }

    this.clearAllTimers(delegationId)
    this.persistAllDelegations()
    this.cleanupTracking(delegationId, delegation.childSessionId)

    // R-OBS-01: Log state transitions with [Harness] prefix
    console.error(`[Harness] Delegation ${delegationId} transitioned: ${previousStatus} → ${newState}${error ? ` (error: ${error})` : ""}`)

    // R-LC-01: Schedule grace period cleanup for terminal delegations
    this.scheduleGracePeriodCleanup(delegationId)

    // R-NOTIF-01: Notify parent session of terminal state (fire-and-forget).
    // Delivery failure queues a durable pending notification that core hooks replay
    // on parent session lifecycle events.
    void notifyDelegationTerminal(this.client, delegation)
  }

  private scheduleGracePeriodCleanup(delegationId: string): void {
    const delegation = this.delegations.get(delegationId)
    if (!delegation) return

    const existingTimer = this.gracePeriodTimers.get(delegationId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }
    delegation.gracePeriodExpiresAt = Date.now() + TASK_CLEANUP_DELAY_MS
    this.persistAllDelegations()

    const timer = setTimeout(() => {
      this.gracePeriodTimers.delete(delegationId)
      // R-LC-03: Remove from in-memory Map only — do NOT touch persistence file
      this.delegations.delete(delegationId)
    }, TASK_CLEANUP_DELAY_MS)
    this.gracePeriodTimers.set(delegationId, timer)
  }

  private clearAllTimers(delegationId: string): void {
    const t = this.safetyTimers.get(delegationId)
    if (t) { clearTimeout(t); this.safetyTimers.delete(delegationId) }
    const gt = this.gracePeriodTimers.get(delegationId)
    if (gt) { clearTimeout(gt); this.gracePeriodTimers.delete(delegationId) }
    this.sdkHandler.clearTimers(delegationId)
    this.commandHandler.clearTimers(delegationId)
  }

  private cleanupTracking(delegationId: string, childSessionId: string): void {
    this.clearAllTimers(delegationId)
    this.delegationsBySession.delete(childSessionId)
  }

  private async validateAgent(agent: string): Promise<ValidatedAgent> {
    let agents: Array<Record<string, unknown>> | undefined

    try {
      const rawResponse = await this.client.app.agents()
      agents = unwrapData<Array<Record<string, unknown>>>(rawResponse)
    } catch (error) {
      // R-AGENT-01: OpenCode server's /agent endpoint occasionally returns agents
      // with missing required string fields, causing SDK Zod validation errors
      // ("expected string, received undefined"). We gracefully degrade to
      // unvalidated agent acceptance rather than blocking all delegation.
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("expected string, received undefined")) {
        console.warn(
          `[Harness] Agent list validation skipped — server returned agents with missing fields. Proceeding with unvalidated agent "${agent}".`,
        )
        return { name: agent }
      }
      throw error
    }

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
    const hydratedDelegation = this.withContractDefaults(delegation)
    return {
      status: hydratedDelegation.status,
      delegationId: hydratedDelegation.id,
      executionMode: hydratedDelegation.executionMode,
      surface: hydratedDelegation.surface,
      recoveryGuarantee: hydratedDelegation.recoveryGuarantee,
      workingDirectory: hydratedDelegation.workingDirectory,
      ptySessionId: hydratedDelegation.ptySessionId,
      fallbackReason: hydratedDelegation.fallbackReason,
      queueKey: hydratedDelegation.queueKey,
      terminalKind: hydratedDelegation.terminalKind,
      terminationSignal: hydratedDelegation.terminationSignal,
      explicitCancellation: hydratedDelegation.explicitCancellation,
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

  /** @internal Test compatibility — proxies to SdkDelegationHandler's timer map */
  get stabilityTimers(): Map<string, NodeJS.Timeout> {
    return this.sdkHandler.getTimerMap()
  }
}

export type { Delegation, DelegationResult }
