import type { DelegationCheckpointState, FailureCheckpointResult, FailureLevel } from "./types.js"
import { FAILURE_CHECKPOINTS } from "./types.js"

/**
 * Tracks failure checkpoints for delegated sessions.
 *
 * At each checkpoint (60, 120, 180, 300 seconds), compares the current
 * action count against the previous checkpoint's count. If unchanged,
 * increments the failure level. At level 4 (300s), injection stops.
 */
export class FailureCheckpointTracker {
  private readonly checkpoints = new Map<string, DelegationCheckpointState>()

  /** Initialize checkpoint state for a delegation. */
  start(delegationId: string): void {
    this.checkpoints.set(delegationId, {
      lastCheckpointActionCount: 0,
      failureLevel: 0,
      injectionStopped: false,
      completed: false,
    })
  }

  /**
   * Evaluate a failure checkpoint.
   *
   * Called when elapsedSeconds matches one of the failure checkpoint
   * thresholds. Compares currentActionCount to the stored previous count.
   * If equal, increments failureLevel and invokes onFailure.
   */
  check(
    delegationId: string,
    elapsedSeconds: number,
    currentActionCount: number,
    onFailure: (result: FailureCheckpointResult) => void,
  ): void {
    const state = this.checkpoints.get(delegationId)
    if (!state || state.injectionStopped || state.completed) return

    if (!FAILURE_CHECKPOINTS.includes(elapsedSeconds as (typeof FAILURE_CHECKPOINTS)[number])) return

    const previousCount = state.lastCheckpointActionCount

    if (currentActionCount === previousCount) {
      const newLevel = (state.failureLevel + 1) as FailureLevel
      state.failureLevel = newLevel > 4 ? 4 : newLevel

      const result: FailureCheckpointResult = {
        delegationId,
        level: state.failureLevel,
        elapsedSeconds,
        actionCountAtCheckpoint: currentActionCount,
        actionCountAtPreviousCheckpoint: previousCount,
        isFinal: state.failureLevel === 4,
      }

      if (state.failureLevel === 4) {
        state.injectionStopped = true
      }

      onFailure(result)
    }

    state.lastCheckpointActionCount = currentActionCount
  }

  /** Returns true if thin-line injection should continue for this delegation. */
  shouldInject(delegationId: string): boolean {
    const state = this.checkpoints.get(delegationId)
    if (!state) return true
    return !state.injectionStopped && !state.completed
  }

  /** Mark a delegation as completed and stop tracking. */
  stop(delegationId: string): void {
    const state = this.checkpoints.get(delegationId)
    if (state) {
      state.completed = true
    }
  }

  /** Return the current checkpoint state for a delegation. */
  getState(delegationId: string): DelegationCheckpointState | undefined {
    return this.checkpoints.get(delegationId)
  }
}
