import type { Delegation, DelegationResult, DelegationStatus } from "./types.js"
import { buildDelegationResult } from "./state-machine.js"

export interface DelegationLifecycleStateMachine {
  get(delegationId: string): Delegation | undefined
  getAll?: () => Delegation[]
  registerDelegation?: (delegation: Delegation, scheduleSafetyCeiling: boolean) => void
  transition(delegationId: string, toStatus: DelegationStatus): boolean
  transitionToTerminal?: (delegationId: string, toStatus: DelegationStatus, error?: string) => void
}

/** Thin lifecycle adapter over DelegationStateMachine transitions. */
export class DelegationLifecycle {
  constructor(private readonly stateMachine: DelegationLifecycleStateMachine) {}

  /**
   * Register a newly prepared delegation before status transitions begin.
   *
   * @param delegation - Prepared delegation record created by the coordinator.
   * @param scheduleSafetyCeiling - When true, arm the 30-minute safety ceiling timer.
   */
  register(delegation: Delegation, scheduleSafetyCeiling?: boolean): void {
    this.stateMachine.registerDelegation?.(delegation, scheduleSafetyCeiling ?? false)
  }

  /**
   * Read a delegation record by ID from the lifecycle state owner.
   *
   * @param delegationId - Delegation identifier to look up.
   * @returns The matching delegation record, or undefined when unknown.
   */
  getStatus(delegationId: string): Delegation | undefined {
    return this.stateMachine.get(delegationId)
  }

  /**
   * List all known delegation records for manager/status-tool consumers.
   *
   * @returns Snapshot of records currently owned by the lifecycle state owner.
   */
  list(): Delegation[] {
    return this.stateMachine.getAll?.() ?? []
  }

  /**
   * Return the child session associated with a delegation, when known.
   *
   * @param delegationId - Delegation identifier to inspect.
   * @returns The child session ID, or undefined when the delegation is unknown.
   */
  getChildSessionId(delegationId: string): string | undefined {
    return this.getStatus(delegationId)?.childSessionId
  }

  /** Transition a delegation and return its projected result. */
  transition(delegationId: string, toStatus: DelegationStatus): DelegationResult {
    this.stateMachine.transition(delegationId, toStatus)
    return this.resultFor(delegationId)
  }

  /** Returns true for terminal delegation states. */
  isTerminal(status: DelegationStatus): boolean {
    return status === "completed" || status === "error" || status === "timeout"
  }

  /** Mark a delegation timed out. */
  markTimeout(delegationId: string): DelegationResult {
    this.transitionTerminal(delegationId, "timeout", "[Harness] Delegation timed out")
    return this.resultFor(delegationId)
  }

  /** Mark a delegation aborted by the caller. */
  markAborted(delegationId: string): DelegationResult {
    this.transitionTerminal(delegationId, "error", "[Harness] Delegation aborted")
    return this.resultFor(delegationId)
  }

  /** Mark a delegation cancelled by the caller. */
  markCancelled(delegationId: string): DelegationResult {
    this.transitionTerminal(delegationId, "error", "[Harness] Delegation cancelled")
    return this.resultFor(delegationId)
  }

  private transitionTerminal(delegationId: string, status: DelegationStatus, error: string): void {
    if (this.stateMachine.transitionToTerminal) this.stateMachine.transitionToTerminal(delegationId, status, error)
    else this.stateMachine.transition(delegationId, status)
  }

  private resultFor(delegationId: string): DelegationResult {
    const delegation = this.stateMachine.get(delegationId)
    if (!delegation) throw new Error(`[Harness] Unknown delegation "${delegationId}"`)
    return buildDelegationResult(delegation)
  }
}
