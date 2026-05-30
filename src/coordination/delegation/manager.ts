import type { CompletionDetector } from "../completion/detector.js"
import type { PtyManager } from "../../features/background-command/pty/pty-manager.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import type { CommandDelegationParams, RuntimePolicy } from "../../shared/types.js"
import type { DelegateParams } from "../spawner/spawn-request-builder.js"
import type { DelegationCoordinator, DispatchParams } from "./coordinator.js"
import { DelegationManager as RuntimeDelegationManager } from "./manager-runtime.js"
import type { DelegationMonitor } from "./monitor.js"
import type { NotificationRouter } from "./notification-router.js"
import type { DelegationStateMachine } from "./state-machine.js"
import type { Delegation, DelegationResult } from "./types.js"

type NativeTask = (params: { agent: string; prompt: string; disabledTools: string[] }) => Promise<unknown>

type FacadeLifecycle = {
  getChildSessionId: (delegationId: string) => string | undefined
  getStatus: (delegationId: string) => Delegation | undefined
  list: () => Delegation[]
  markAborted: (delegationId: string) => DelegationResult
  markCancelled: (delegationId: string) => DelegationResult
  register?: (record: Delegation) => void
}

export type DelegationManagerOptions = {
  coordinator?: Pick<DelegationCoordinator, "chain" | "dispatch"> & Partial<Pick<DelegationCoordinator, "abortDelegation" | "attachChildSession" | "cancelDelegation" | "failDispatch" | "handleSessionDeleted" | "handleSessionError" | "handleSessionIdle" | "recordChildMessageSignal" | "recordChildToolSignal">>
  lifecycle?: FacadeLifecycle
  monitor?: Pick<DelegationMonitor, "start">
  notificationRouter?: Pick<NotificationRouter, "register">
  ptyManager?: PtyManager | null
  runtimePolicy?: RuntimePolicy
  sendPromptAsync?: (sessionId: string, prompt: string) => Promise<void>
  stateMachine?: DelegationStateMachine
}

export type DelegationControlRequest = {
  action: "abort" | "cancel" | "restart" | "resume" | "chain" | "adjust-prompt" | "change-agent"
  chainParentSessionId?: string
  delegationId: string
  nativeTask?: NativeTask
  restartPrompt?: string
  agent?: string
}

/**
 * Thin public facade for delegation operations.
 *
 * The facade keeps the historical `DelegationManager` import stable while the
 * heavy runtime implementation lives in `manager-runtime.ts`. Tests and newer
 * callers can inject the coordinator/lifecycle modules directly; legacy plugin
 * wiring still falls back to the runtime adapter until the remaining command and
 * SDK paths are migrated behind the v2 coordinator.
 */
export class DelegationManager {
  private readonly runtime?: RuntimeDelegationManager

  constructor(client?: OpenCodeClient, private readonly options: DelegationManagerOptions = {}) {
    if (client) {
      this.runtime = new RuntimeDelegationManager(client, {
        monitor: options.monitor,
        notificationRouter: options.notificationRouter,
        ptyManager: options.ptyManager,
        runtimePolicy: options.runtimePolicy,
        stateMachine: options.stateMachine,
      })
    } else if (!options.coordinator || !options.lifecycle) {
      throw new Error("[Harness] DelegationManager requires a client when v2 modules are not injected.")
    }
  }

  /** Wires the lifecycle-owned completion detector into the legacy runtime adapter. */
  setCompletionDetector(detector: CompletionDetector): void {
    this.runtime?.setCompletionDetector(detector)
  }

  /** Preserve the historical SDK dispatch API. */
  async dispatch(params: DelegateParams): Promise<DelegationResult> {
    if (this.options.coordinator) return this.options.coordinator.dispatch(this.toDispatchParams(params))
    return this.requireRuntime().dispatch(params)
  }

  /** Attach the real native Task child session ID to a prepared v2 delegation. */
  attachChildSession(delegationId: string, childSessionId: string): void {
    this.options.coordinator?.attachChildSession?.(delegationId, childSessionId)
  }

  /** Roll back a prepared v2 delegation after native Task dispatch fails. */
  failDispatch(delegationId: string, caughtError: unknown): void {
    this.options.coordinator?.failDispatch?.(delegationId, caughtError)
  }

  /** Compatibility alias for callers that use the Plan 04 facade name. */
  async dispatchDelegation(_client: OpenCodeClient | undefined, params: DispatchParams): Promise<DelegationResult> {
    if (!this.options.coordinator) return this.requireRuntime().dispatch(params as DelegateParams)
    return this.options.coordinator.dispatch(params)
  }

  /** Preserve command delegation until it is migrated to the coordinator lane. */
  async dispatchCommand(params: CommandDelegationParams): Promise<DelegationResult> {
    return this.requireRuntime().dispatchCommand(params)
  }

  /** Forward session-idle events to the runtime adapter. */
  handleSessionIdle(sessionId: string): void {
    this.runtime?.handleSessionIdle(sessionId)
    this.options.coordinator?.handleSessionIdle?.(sessionId)
  }

  /** Forward session-error events to the runtime adapter and v2 coordinator. */
  handleSessionError(sessionId: string, error?: unknown): void {
    this.runtime?.handleSessionError(sessionId, error)
    this.options.coordinator?.handleSessionError?.(sessionId, error)
  }

  /** Forward session-deleted events to the runtime adapter. */
  handleSessionDeleted(sessionId: string): void {
    this.runtime?.handleSessionDeleted(sessionId)
    this.options.coordinator?.handleSessionDeleted?.(sessionId)
  }

  /** Forward child message observations to the v2 coordinator execution collector. */
  recordChildMessageSignal(sessionId: string, finalMessageExcerpt?: string): void {
    this.options.coordinator?.recordChildMessageSignal?.(sessionId, Date.now(), finalMessageExcerpt)
  }

  /** Forward child tool observations to the v2 coordinator execution collector. */
  recordChildToolSignal(sessionId: string): void {
    this.options.coordinator?.recordChildToolSignal?.(sessionId, Date.now())
  }

  /** Recover pending delegations through the runtime adapter. */
  async recoverPending(): Promise<void> {
    await this.runtime?.recoverPending()
  }

  /** Read a single delegation from the injected lifecycle or runtime adapter. */
  getStatus(delegationId: string): Delegation | undefined {
    return this.options.lifecycle?.getStatus(delegationId) ?? this.runtime?.getStatus(delegationId)
  }

  /** List delegations, optionally filtered by parent session. */
  listDelegations(sessionId?: string): Delegation[] {
    // Single source: lifecycle and runtime share the same state machine after consolidation.
    const delegations = this.options.lifecycle?.list() ?? this.runtime?.getAllDelegations() ?? []
    return sessionId ? delegations.filter((delegation) => delegation.parentSessionId === sessionId) : delegations
  }

  /** Historical name retained for existing status tool callers. */
  getAllDelegations(): Delegation[] {
    return this.listDelegations()
  }

  /** Mark a delegation aborted via the lifecycle module. */
  abortDelegation(delegationId: string): DelegationResult {
    if (this.options.coordinator?.abortDelegation) return this.options.coordinator.abortDelegation(delegationId)
    if (this.options.lifecycle) return this.options.lifecycle.markAborted(delegationId)
    return this.terminalFallback(delegationId, "[Harness] Delegation aborted")
  }

  /** Mark a delegation cancelled via the lifecycle module. */
  cancelDelegation(delegationId: string): DelegationResult {
    if (this.options.coordinator?.cancelDelegation) return this.options.coordinator.cancelDelegation(delegationId)
    if (this.options.lifecycle) return this.options.lifecycle.markCancelled(delegationId)
    return this.terminalFallback(delegationId, "[Harness] Delegation cancelled")
  }

  /**
   * Applies control semantics with two dispatch paths:
   *
   * 1. **sendPromptAsync path** (resume, chain, adjust-prompt, change-agent):
   *    Reuses the existing childSessionId to continue a session without creating a
   *    new child session. Requires `options.sendPromptAsync` to be configured.
   *
   * 2. **abort+dispatch path** (restart, legacy resume/chain fallback):
   *    Aborts the current delegation and dispatches a new one via coordinator.dispatch.
   *    This creates a new childSessionId.
   *
   * Direct terminal actions (abort, cancel) are handled immediately without dispatch.
   */
  async controlDelegation(request: DelegationControlRequest): Promise<DelegationResult> {
    const delegation = this.getStatus(request.delegationId)
    if (!delegation) throw new Error(`[Harness] Delegation "${request.delegationId}" not found`)

    // Resume and chain are ALLOWED on completed delegations — they reuse the session
    const isTerminal = delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout"
    if (isTerminal && request.action !== "resume" && request.action !== "chain") {
      throw new Error("[Harness] cannot control terminal delegation")
    }

    // adjust-prompt only works on running delegations
    if (request.action === "adjust-prompt" && delegation.status !== "running") {
      throw new Error("[Harness] adjust-prompt requires running delegation")
    }

    // Abort/cancel: direct terminal marking
    if (request.action === "abort") return this.abortDelegation(request.delegationId)
    if (request.action === "cancel") return this.cancelDelegation(request.delegationId)

    // adjust-prompt: send supplementary prompt into running session
    if (request.action === "adjust-prompt") {
      const childSessionId = delegation.childSessionId
      if (!childSessionId || !this.options.sendPromptAsync) {
        throw new Error("[Harness] Cannot adjust-prompt: no active session or sendPromptAsync unavailable")
      }
      const prompt = request.restartPrompt ?? delegation.prompt
      if (!prompt) throw new Error("[Harness] adjust-prompt requires a restartPrompt")
      await this.options.sendPromptAsync(childSessionId, prompt)
      return { delegationId: request.delegationId, childSessionId, status: "running" as const }
    }

    // change-agent: abort current session, restart with new agent via sendPromptAsync
    if (request.action === "change-agent") {
      if (!request.agent) throw new Error("[Harness] change-agent requires an agent name")
      const childSessionId = delegation.childSessionId
      if (!childSessionId || !this.options.sendPromptAsync) {
        throw new Error("[Harness] Cannot change-agent: no active session or sendPromptAsync unavailable")
      }
      const prompt = request.restartPrompt ?? delegation.prompt
      if (!prompt) throw new Error("[Harness] change-agent requires a prompt")
      // Abort current session
      this.options.coordinator?.abortDelegation?.(request.delegationId, `[Harness] Delegation change-agent`)
      // Send prompt with new agent context to existing session
      await this.options.sendPromptAsync(childSessionId, prompt)
      return { delegationId: request.delegationId, childSessionId, status: "running" as const }
    }

    // Resume and chain: reuse existing childSessionId via sendPromptAsync
    if ((request.action === "resume" || request.action === "chain") && delegation.childSessionId && this.options.sendPromptAsync) {
      const childSessionId = delegation.childSessionId
      const prompt = request.restartPrompt ?? delegation.prompt
      if (!prompt) throw new Error("[Harness] resume/chain requires a prompt")

      await this.options.sendPromptAsync(childSessionId, prompt)

      // For chain action, update parentSessionId to chainParentSessionId if provided
      const chainParentId = request.action === "chain"
        ? (request.chainParentSessionId ?? delegation.parentSessionId)
        : delegation.parentSessionId

      // Create new delegation record via lifecycle.register
      const newRecord: Delegation = {
        ...delegation,
        id: `dt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        parentSessionId: chainParentId,
        childSessionId,
        prompt,
        status: "running",
        createdAt: Date.now(),
        completedAt: undefined,
        redirectedFrom: undefined,
        restartedFrom: undefined,
        resumedFrom: request.action === "resume" ? delegation.id : undefined,
        chainedFrom: request.action === "chain" ? delegation.id : undefined,
        executionState: "pending",
        firstActionAt: undefined,
        signalSource: undefined,
        actionCount: 0,
        messageCount: 0,
        toolCallCount: 0,
        evidenceLevel: "accepted-only",
        finalMessageExcerpt: undefined,
        result: undefined,
        resultTruncated: undefined,
        error: undefined,
        terminalKind: undefined,
        terminationSignal: undefined,
        explicitCancellation: undefined,
        gracePeriodExpiresAt: undefined,
        lastMessageCount: 0,
        stablePollCount: 0,
        lastMessageCountChangeAt: undefined,
        ptySessionId: undefined,
        fallbackReason: undefined,
      }
      this.options.lifecycle?.register?.(newRecord)
      return { delegationId: newRecord.id, childSessionId, status: "running" as const }
    }

    // Legacy: abort+dispatch path for restart and backward compat
    const agent = request.action === "restart" ? delegation.agent : delegation.agent
    const prompt = request.restartPrompt ?? delegation.prompt
    if (!prompt) throw new Error("[Harness] restart/resume requires a persisted original prompt or restartPrompt")

    const original = this.options.coordinator?.abortDelegation?.(request.delegationId, `[Harness] Delegation ${request.action}d`) ?? this.abortDelegation(request.delegationId)
    const replacement = this.options.coordinator
      ? await this.options.coordinator.dispatch({ agent, currentDepth: delegation.nestingDepth ?? 0, parentSessionId: request.action === "chain" ? request.chainParentSessionId ?? delegation.parentSessionId : delegation.parentSessionId, prompt, queueKey: delegation.queueKey })
      : await this.dispatch({ agent, parentSessionId: delegation.parentSessionId, prompt })
    const replacementRecord = this.getStatus(replacement.delegationId)
    if (replacementRecord) {
      if (request.action === "restart") replacementRecord.restartedFrom = delegation.id
      if (request.action === "resume") replacementRecord.resumedFrom = delegation.id
      if (request.action === "chain") replacementRecord.chainedFrom = delegation.id
    }
    if (!request.nativeTask) {
      return { ...replacement, result: original.terminalKind === "cancelled" ? undefined : original.result }
    }
    try {
      const nativeResult = await request.nativeTask({ agent, prompt, disabledTools: ["delegate-task", "task"] })
      const childSessionId = this.extractNativeTaskSessionId(nativeResult)
      if (childSessionId) this.options.coordinator?.attachChildSession?.(replacement.delegationId, childSessionId)
    } catch (caughtError) {
      this.options.coordinator?.failDispatch?.(replacement.delegationId, caughtError)
      throw caughtError
    }
    return { ...replacement, result: original.terminalKind === "cancelled" ? undefined : original.result }
  }

  /** Return the child session id for a delegation when known. */
  getChildSessionId(delegationId: string): string | undefined {
    return this.options.lifecycle?.getChildSessionId(delegationId) ?? this.getStatus(delegationId)?.childSessionId
  }

  canSessionAccessDelegation(callerSessionId: string | undefined, delegation: Delegation | undefined): boolean {
    if (!callerSessionId || !delegation) {
      return false
    }
    if (delegation.parentSessionId === callerSessionId) {
      return true
    }

    // Single source: lifecycle and runtime share the same state machine.
    const all = this.options.lifecycle?.list() ?? this.runtime?.getAllDelegations() ?? []
    const byId = new Map(all.map((d) => [d.id, d] as const))

    const getDelegationIdForSession = (sessionId: string): string | undefined => {
      // Prefer runtime's direct session→delegation map (same state machine as lifecycle).
      const fromRuntime = this.runtime?.delegationsBySession.get(sessionId)
      if (fromRuntime) return fromRuntime
      // Fallback: scan lifecycle for a delegation whose childSessionId matches.
      return (this.options.lifecycle?.list() ?? []).find((d) => this.options.lifecycle!.getChildSessionId(d.id) === sessionId)?.id
    }

    let currentDelegationId = getDelegationIdForSession(callerSessionId)
    const visited = new Set<string>()

    while (currentDelegationId && !visited.has(currentDelegationId)) {
      visited.add(currentDelegationId)

      if (currentDelegationId === delegation.id) {
        return true
      }

      const current = byId.get(currentDelegationId)
      if (!current) break

      if (current.childSessionId === delegation.parentSessionId) {
        return true
      }
      if (current.parentSessionId === delegation.childSessionId) {
        return true
      }

      if (!current.parentSessionId) break
      currentDelegationId = getDelegationIdForSession(current.parentSessionId)
    }

    return false
  }

  getVisibleDelegationsForSession(callerSessionId: string): Delegation[] {
    return this.runtime?.getVisibleDelegationsForSession(callerSessionId) ?? this.listDelegations(callerSessionId)
  }

  getDelegationForPtySession(ptySessionId: string): Delegation | undefined {
    return this.runtime?.getDelegationForPtySession(ptySessionId)
  }

  markCommandCancellationForPtySession(ptySessionId: string): DelegationResult | undefined {
    return this.runtime?.markCommandCancellationForPtySession(ptySessionId)
  }

  pruneCompletedDelegations(maxAgeMs?: number): number {
    return this.runtime?.pruneCompletedDelegations(maxAgeMs) ?? 0
  }

  applyBehavioralGuardrail(level: Parameters<RuntimeDelegationManager["applyBehavioralGuardrail"]>[0]): number | undefined {
    return this.runtime?.applyBehavioralGuardrail(level)
  }

  get stabilityTimers(): Map<string, NodeJS.Timeout> { return this.requireRuntime().stabilityTimers }
  get delegations(): Map<string, Delegation> { return this.requireRuntime().delegations }
  get delegationsBySession(): Map<string, string> { return this.requireRuntime().delegationsBySession }
  get safetyTimers(): Map<string, NodeJS.Timeout> { return this.requireRuntime().safetyTimers }
  get semaphore(): { acquire: (...args: unknown[]) => Promise<() => void> } {
    return (this.requireRuntime() as unknown as { semaphore: { acquire: (...args: unknown[]) => Promise<() => void> } }).semaphore
  }

  private toDispatchParams(params: DelegateParams): DispatchParams {
    return { agent: params.agent, currentDepth: 0, parentSessionId: params.parentSessionId, prompt: params.prompt, queueKey: `agent:${params.agent}`, surface: "agent-delegation", workingDirectory: params.workingDirectory }
  }

  private terminalFallback(delegationId: string, error: string): DelegationResult {
    return { delegationId, error, status: "error" }
  }

  private extractNativeTaskSessionId(value: unknown): string | undefined {
    if (!value || typeof value !== "object") return undefined
    const record = value as Record<string, unknown>
    for (const key of ["sessionID", "sessionId", "childSessionId", "id"]) {
      const candidate = record[key]
      if (typeof candidate === "string" && candidate.length > 0) return candidate
    }
    return undefined
  }

  private requireRuntime(): RuntimeDelegationManager {
    if (!this.runtime) throw new Error("[Harness] DelegationManager runtime adapter is not configured.")
    return this.runtime
  }
}
