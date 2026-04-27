import { buildDelegationQueueKey, DelegationConcurrencyQueue } from "./concurrency.js"
import { persistDelegations, readPersistedDelegations } from "./delegation-persistence.js"
import { notifyDelegationTerminal } from "./notification-handler.js"
import type { PtyManager } from "./pty/pty-manager.js"
import { CommandDelegationHandler } from "./command-delegation.js"
import { SdkDelegationHandler } from "./sdk-delegation.js"
import { resolveCategoryGateDecision } from "./category-gates.js"
import { recordCategoryGateDeny } from "./category-gate-audit.js"
import { getAppAgents } from "./app-api.js"
import { abortSession, sendPromptAsync, type OpenCodeClient } from "./session-api.js"
import { enrichAgentFromPrimitives, parsePermissionRecord, parseToolBooleans } from "./spawner/agent-primitive-policy.js"
import { resolveDelegationConcurrencyKey } from "./spawner/concurrency-key.js"
import { resolveParentWorkingDirectory } from "./spawner/parent-directory.js"
import { spawnDelegatedSession } from "./spawner/session-creator.js"
import { buildSdkSpawnRequest, resolveDelegationPermissionProfile, type DelegateParams, type ValidatedAgent } from "./spawner/spawn-request-builder.js"
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

const VALID_DELEGATION_TRANSITIONS: Record<DelegationStatus, DelegationStatus[]> = {
  dispatched: ["running", "completed", "error", "timeout"],
  running: ["completed", "error", "timeout"],
  completed: [],
  error: [],
  timeout: [],
}

/**
 * Checks whether a delegation status transition is allowed by runtime truth rules.
 *
 * @param from - Current delegation status.
 * @param to - Requested next delegation status.
 * @returns True when the transition is permitted.
 */
function canTransitionDelegationStatus(from: DelegationStatus, to: DelegationStatus): boolean {
  return VALID_DELEGATION_TRANSITIONS[from].includes(to)
}

/**
 * Build the OpenCode prompt-time tool map for delegated sessions.
 *
 * @param allowedTools - Tool IDs inherited from the resolved spawn policy.
 * @returns A prompt-compatible tool allow/deny map with recursive delegation disabled.
 */
function buildDelegationPromptTools(allowedTools: readonly string[]): Record<string, boolean> {
  return {
    ...Object.fromEntries(allowedTools.map((toolName) => [toolName, true])),
    "delegate-task": false,
    task: false,
  }
}

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
    const workingDirectory = resolveParentWorkingDirectory({
      contextDirectory: params.workingDirectory,
      worktree: params.worktree,
    })
    const agent = await this.validateAgent(params.agent, workingDirectory)
    const permissionProfile = resolveDelegationPermissionProfile(params, agent)
    const requestedCategory = params.category ?? agent.category
    const categoryDecision = resolveCategoryGateDecision({
      category: requestedCategory,
      surface: "agent-delegation",
      toolProfileMode: permissionProfile.mode,
    })
    if (!categoryDecision.allowed) {
      recordCategoryGateDeny({
        callerSessionId: params.parentSessionId,
        requestedAgent: agent.name,
        requestedCategory,
        surface: "agent-delegation",
        denyReason: categoryDecision.reason,
      })
      throw new Error(`[Harness] Category gate denied: ${categoryDecision.reason}`)
    }
    const canonicalContext = this.buildCanonicalQueueContext(agent, params)
    const acquireQueueKey = buildDelegationQueueKey(canonicalContext)
    const spawnQueueKey = resolveDelegationConcurrencyKey(canonicalContext)
    if (spawnQueueKey !== acquireQueueKey) {
      throw new Error("[Harness] Canonical delegation queue-key drift detected.")
    }
    const release = await this.semaphore.acquire(acquireQueueKey, undefined, undefined)
    try {
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
      try {
        await sendPromptAsync(this.client, delegation.childSessionId, {
          parts: [{ type: "text", text: params.prompt }],
          agent: agent.name,
          tools: buildDelegationPromptTools(child.allowedTools),
        })
        this.transitionDelegationStatus(delegation.id, "running")
      } catch {
        this.transitionToTerminal(delegation.id, "error", "Failed to send prompt to child session")
        return this.buildResult(this.delegations.get(delegation.id) ?? delegation)
      }
      return this.buildResult(this.delegations.get(delegation.id) ?? delegation)
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
    const categoryDecision = resolveCategoryGateDecision({
      category: "command",
      surface: "command-process",
      toolProfileMode: "write-capable",
    })
    if (!categoryDecision.allowed) {
      recordCategoryGateDeny({
        callerSessionId: params.parentSessionId,
        requestedAgent: queueContext.agent,
        requestedCategory: "command",
        surface: "command-process",
        denyReason: categoryDecision.reason,
      })
      throw new Error(`[Harness] Category gate denied: ${categoryDecision.reason}`)
    }
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
      this.transitionDelegationStatus(delegationId, "running")
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
      this.transitionToTerminal(
        delegation.id,
        "error",
        "[Harness] Headless command delegation cannot be recovered after restart",
        {
          terminalKind: "non-resumable-after-restart",
          explicitCancellation: false,
        },
      )
    }
  }

  getStatus(delegationId: string): Delegation | undefined {
    return this.delegations.get(delegationId)
  }

  getAllDelegations(): Delegation[] {
    return Array.from(this.delegations.values())
  }

  /**
   * Check whether a caller session is in the recorded owner lineage for a delegation.
   *
   * @param callerSessionId - Session ID from the current OpenCode tool context.
   * @param delegation - Target delegation record from memory or persisted storage.
   * @returns True only for direct owners or explicitly recorded parent/child lineage.
   */
  canSessionAccessDelegation(callerSessionId: string | undefined, delegation: Delegation | undefined): boolean {
    if (!callerSessionId || !delegation) {
      return false
    }
    if (delegation.parentSessionId === callerSessionId) {
      return true
    }

    const recordedDelegationId = this.delegationsBySession.get(callerSessionId)
    if (!recordedDelegationId) {
      return false
    }
    if (recordedDelegationId === delegation.id) {
      return true
    }

    const recordedDelegation = this.delegations.get(recordedDelegationId)
    if (!recordedDelegation) {
      return false
    }

    return recordedDelegation.parentSessionId === delegation.childSessionId
      || recordedDelegation.childSessionId === delegation.parentSessionId
  }

  /**
   * Return only active delegations visible to the caller's recorded lineage.
   *
   * @param callerSessionId - Session ID from the current OpenCode tool context.
   * @returns In-memory delegation records visible to that caller.
   */
  getVisibleDelegationsForSession(callerSessionId: string): Delegation[] {
    return this.getAllDelegations().filter((delegation) => this.canSessionAccessDelegation(callerSessionId, delegation))
  }

  /**
   * Find the active delegation that owns a PTY session ID.
   *
   * @param ptySessionId - PTY session ID from `run-background-command` input.
   * @returns The backing delegation when the PTY session is recorded.
   */
  getDelegationForPtySession(ptySessionId: string): Delegation | undefined {
    for (const delegation of this.delegations.values()) {
      if (delegation.ptySessionId === ptySessionId) {
        return delegation
      }
    }
    return undefined
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

  /**
   * Applies a guarded delegation status transition without terminal side effects.
   *
   * @param delegationId - Delegation record identifier.
   * @param nextStatus - Non-terminal status to apply.
   * @returns True when the transition was applied.
   */
  private transitionDelegationStatus(delegationId: string, nextStatus: DelegationStatus): boolean {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || delegation.status === nextStatus) {
      return false
    }

    if (!canTransitionDelegationStatus(delegation.status, nextStatus)) {
      return false
    }

    delegation.status = nextStatus
    this.persistAllDelegations()
    return true
  }

  private async handleSafetyCeiling(delegationId: string): Promise<void> {
    const delegation = this.delegations.get(delegationId)
    if (!delegation || (delegation.status !== "running" && delegation.status !== "dispatched")) return
    this.transitionToTerminal(delegationId, "timeout", `[Harness] Delegation safety ceiling reached after ${delegation.safetyCeilingMs}ms`)
    try { await abortSession(this.client, delegation.childSessionId) } catch { /* no-op */ }
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
    if (!canTransitionDelegationStatus(previousStatus, newState)) {
      return
    }

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

  private async validateAgent(agent: string, projectRoot: string): Promise<ValidatedAgent> {
    let agents: Array<Record<string, unknown>> | undefined

    try {
      agents = (await getAppAgents(this.client)).filter(
        (entry): entry is Record<string, unknown> => !!entry && typeof entry === "object" && !Array.isArray(entry),
      )
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
        return enrichAgentFromPrimitives({ name: agent }, projectRoot)
      }
      throw error
    }

    const validAgents = (agents ?? []).map((e) => ({
      name: typeof e.name === "string" ? e.name : "",
      provider: typeof e.provider === "string" ? e.provider : undefined,
      model: typeof e.model === "string" ? e.model : undefined,
      category: typeof e.category === "string" ? e.category : undefined,
      description: typeof e.description === "string" ? e.description : undefined,
      permission: parsePermissionRecord(e.permission),
      tools: parseToolBooleans(e.tools),
    })).filter((e) => e.name.length > 0)
    const names = validAgents.map((e) => e.name)
    if (!names.includes(agent)) {
      throw new Error(`[Harness] Invalid agent: "${agent}". Available: [${names.join(", ")}]`)
    }
    return enrichAgentFromPrimitives(validAgents.find((e) => e.name === agent) ?? { name: agent }, projectRoot)
  }

  private buildResult(delegation: Delegation): DelegationResult {
    const hydratedDelegation = this.withContractDefaults(delegation)
    return {
      status: hydratedDelegation.status,
      result: hydratedDelegation.result,
      resultTruncated: hydratedDelegation.resultTruncated,
      error: hydratedDelegation.error,
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
