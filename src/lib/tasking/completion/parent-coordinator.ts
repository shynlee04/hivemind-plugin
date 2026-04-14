import { getSessionContinuity } from "../../continuity.js"
import type { SessionLifecyclePhase } from "../../types.js"
import type { DelegationCompletionSnapshot } from "./types.js"

function classifyPhase(snapshot: DelegationCompletionSnapshot, childSessionID: string, phase: SessionLifecyclePhase | undefined): void {
  if (phase === "completed") {
    snapshot.completedDelegations.add(childSessionID)
    return
  }

  if (phase === "failed") {
    snapshot.failedDelegations.add(childSessionID)
    return
  }

  snapshot.activeDelegations.add(childSessionID)
}

export class ParentCoordinator {
  private readonly childSessionIDs = new Set<string>()

  registerChild(childSessionID: string): void {
    this.childSessionIDs.add(childSessionID)
  }

  unregisterChild(childSessionID: string): void {
    this.childSessionIDs.delete(childSessionID)
  }

  snapshotDelegationStatus(): DelegationCompletionSnapshot {
    const snapshot: DelegationCompletionSnapshot = {
      activeDelegations: new Set<string>(),
      completedDelegations: new Set<string>(),
      failedDelegations: new Set<string>(),
      totalDelegations: this.childSessionIDs.size,
      allComplete: true,
    }

    for (const childSessionID of this.childSessionIDs) {
      const phase = getSessionContinuity(childSessionID)?.metadata.lifecycle?.phase
      classifyPhase(snapshot, childSessionID, phase)
    }

    snapshot.allComplete =
      snapshot.totalDelegations === 0 ||
      snapshot.completedDelegations.size + snapshot.failedDelegations.size === snapshot.totalDelegations

    return snapshot
  }

  allDelegationsComplete(): boolean {
    return this.snapshotDelegationStatus().allComplete
  }

  canCloseMainSession(args: { parentRequiresAnotherPass: boolean }): boolean {
    return this.allDelegationsComplete() && !args.parentRequiresAnotherPass
  }
}

export type { DelegationCompletionSnapshot }
