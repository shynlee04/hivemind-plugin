import type { Delegation, DelegationResult, DelegationStatus } from "./types.js"
import { buildDelegationResult } from "./state-machine.js"

export interface DelegationLifecycleStateMachine {
  get(delegationId: string): Delegation | undefined
  transition(delegationId: string, toStatus: DelegationStatus): boolean
  transitionToTerminal?: (delegationId: string, toStatus: DelegationStatus, error?: string) => void
}

/** Thin lifecycle adapter over DelegationStateMachine transitions. */
export class DelegationLifecycle {
  constructor(private readonly stateMachine: DelegationLifecycleStateMachine) {}

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
