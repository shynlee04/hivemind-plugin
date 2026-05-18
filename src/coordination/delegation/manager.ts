import type { CompletionDetector } from "../completion/detector.js"
import type { PtyManager } from "../../features/background-command/pty/pty-manager.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import type { CommandDelegationParams, RuntimePolicy } from "../../shared/types.js"
import type { DelegateParams } from "../spawner/spawn-request-builder.js"
import type { DelegationCoordinator, DispatchParams } from "./coordinator.js"
import { DelegationManager as RuntimeDelegationManager } from "./manager-runtime.js"
import type { Delegation, DelegationResult } from "./types.js"

type NativeTask = (params: { agent: string; prompt: string; disabledTools: string[] }) => Promise<unknown>

type FacadeLifecycle = {
  getChildSessionId: (delegationId: string) => string | undefined
  getStatus: (delegationId: string) => Delegation | undefined
  list: () => Delegation[]
  markAborted: (delegationId: string) => DelegationResult
  markCancelled: (delegationId: string) => DelegationResult
}

export type DelegationManagerOptions = {
  coordinator?: Pick<DelegationCoordinator, "chain" | "dispatch"> & Partial<Pick<DelegationCoordinator, "abortDelegation" | "attachChildSession" | "cancelDelegation" | "failDispatch" | "handleSessionDeleted" | "handleSessionError" | "handleSessionIdle" | "recordChildMessageSignal" | "recordChildToolSignal">>
  lifecycle?: FacadeLifecycle
  ptyManager?: PtyManager | null
  runtimePolicy?: RuntimePolicy
}

export type DelegationControlRequest = {
  action: "abort" | "cancel" | "restart" | "redirect"
  delegationId: string
  nativeTask?: NativeTask
  redirectAgent?: string
  restartPrompt?: string
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
        ptyManager: options.ptyManager,
        runtimePolicy: options.runtimePolicy,
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

  /** Applies control semantics with coordinator cleanup and optional native replacement dispatch. */
  async controlDelegation(request: DelegationControlRequest): Promise<DelegationResult> {
    const delegation = this.getStatus(request.delegationId)
    if (!delegation) throw new Error(`[Harness] Delegation "${request.delegationId}" not found`)
    if (delegation.status === "completed" || delegation.status === "error" || delegation.status === "timeout") {
      throw new Error("[Harness] cannot control terminal delegation")
    }
    if (request.action === "abort") return this.abortDelegation(request.delegationId)
    if (request.action === "cancel") return this.cancelDelegation(request.delegationId)
    const agent = request.action === "redirect" ? request.redirectAgent : delegation.agent
    if (!agent) throw new Error("[Harness] redirect requires target agent")
    const prompt = request.restartPrompt ?? delegation.prompt
    if (!prompt) throw new Error("[Harness] restart/redirect requires a persisted original prompt or restartPrompt")

    const original = request.action === "restart"
      ? this.options.coordinator?.abortDelegation?.(request.delegationId, "[Harness] Delegation restarted") ?? this.abortDelegation(request.delegationId)
      : this.options.coordinator?.abortDelegation?.(request.delegationId, "[Harness] Delegation redirected") ?? this.abortDelegation(request.delegationId)
    const replacement = this.options.coordinator
      ? await this.options.coordinator.dispatch({ agent, currentDepth: delegation.nestingDepth ?? 0, parentSessionId: delegation.parentSessionId, prompt, queueKey: delegation.queueKey, safetyCeilingMs: delegation.safetyCeilingMs, surface: delegation.surface ?? "agent-delegation" })
      : await this.dispatch({ agent, parentSessionId: delegation.parentSessionId, prompt, safetyCeilingMs: delegation.safetyCeilingMs })
    const replacementRecord = this.getStatus(replacement.delegationId)
    if (replacementRecord) {
      if (request.action === "restart") replacementRecord.restartedFrom = delegation.id
      if (request.action === "redirect") replacementRecord.redirectedFrom = delegation.id
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
    const ownsV2Record = !!callerSessionId && !!delegation && delegation.parentSessionId === callerSessionId
    return ownsV2Record || (this.runtime?.canSessionAccessDelegation(callerSessionId, delegation) ?? false)
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

  private toDispatchParams(params: DelegateParams): DispatchParams {
    return { agent: params.agent, category: params.category, currentDepth: 0, parentSessionId: params.parentSessionId, prompt: params.prompt, queueKey: params.agent, safetyCeilingMs: params.safetyCeilingMs, surface: "agent-delegation" }
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
