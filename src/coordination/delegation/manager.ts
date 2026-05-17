import type { CompletionDetector } from "../completion/detector.js"
import type { PtyManager } from "../../features/background-command/pty/pty-manager.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import type { CommandDelegationParams, RuntimePolicy } from "../../shared/types.js"
import type { DelegateParams } from "../spawner/spawn-request-builder.js"
import type { DelegationCoordinator, DispatchParams } from "./coordinator.js"
import { DelegationManager as RuntimeDelegationManager } from "./manager-runtime.js"
import type { Delegation, DelegationResult } from "./types.js"

type FacadeLifecycle = {
  getChildSessionId: (delegationId: string) => string | undefined
  getStatus: (delegationId: string) => Delegation | undefined
  list: () => Delegation[]
  markAborted: (delegationId: string) => DelegationResult
  markCancelled: (delegationId: string) => DelegationResult
}

export type DelegationManagerOptions = {
  coordinator?: Pick<DelegationCoordinator, "dispatch" | "chain">
  lifecycle?: FacadeLifecycle
  ptyManager?: PtyManager | null
  runtimePolicy?: RuntimePolicy
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
    if (!options.coordinator || !options.lifecycle) {
      if (!client) throw new Error("[Harness] DelegationManager requires a client when v2 modules are not injected.")
      this.runtime = new RuntimeDelegationManager(client, {
        ptyManager: options.ptyManager,
        runtimePolicy: options.runtimePolicy,
      })
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
  }

  /** Forward session-deleted events to the runtime adapter. */
  handleSessionDeleted(sessionId: string): void {
    this.runtime?.handleSessionDeleted(sessionId)
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
    if (this.options.lifecycle) return this.options.lifecycle.markAborted(delegationId)
    return this.terminalFallback(delegationId, "[Harness] Delegation aborted")
  }

  /** Mark a delegation cancelled via the lifecycle module. */
  cancelDelegation(delegationId: string): DelegationResult {
    if (this.options.lifecycle) return this.options.lifecycle.markCancelled(delegationId)
    return this.terminalFallback(delegationId, "[Harness] Delegation cancelled")
  }

  /** Return the child session id for a delegation when known. */
  getChildSessionId(delegationId: string): string | undefined {
    return this.options.lifecycle?.getChildSessionId(delegationId) ?? this.getStatus(delegationId)?.childSessionId
  }

  canSessionAccessDelegation(callerSessionId: string | undefined, delegation: Delegation | undefined): boolean {
    return this.runtime?.canSessionAccessDelegation(callerSessionId, delegation) ?? (!!callerSessionId && !!delegation && delegation.parentSessionId === callerSessionId)
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

  private requireRuntime(): RuntimeDelegationManager {
    if (!this.runtime) throw new Error("[Harness] DelegationManager runtime adapter is not configured.")
    return this.runtime
  }
}
