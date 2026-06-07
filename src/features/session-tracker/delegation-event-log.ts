/**
 * In-memory delegation event log for lifecycle tracking.
 *
 * Extracted from tool-delegation.ts to satisfy the ≤500 LOC gate (GA-4).
 * Single source of truth across all ToolDelegation instances — module-level
 * array, not a class field.
 *
 * @module session-tracker/delegation-event-log
 */

import type { DelegationLifecycleStatus, SessionTrackerEvent } from "./types.js"

// ---------------------------------------------------------------------------
// Phase 58 (G6, REQ-58-06): In-memory event log
// ---------------------------------------------------------------------------

const delegationEventLog: SessionTrackerEvent[] = []

/** P58 G6: Test seam — returns the in-memory event log for BATS assertions. */
export function getDelegationEventLog(): readonly SessionTrackerEvent[] {
  return delegationEventLog
}

/** P58 G6: Test seam — clears the in-memory event log (test isolation). */
export function clearDelegationEventLog(): void {
  delegationEventLog.length = 0
}

/** P58 G6: Internal helper to append a delegation event to the in-memory log. */
export function appendDelegationEvent(event: SessionTrackerEvent): void {
  delegationEventLog.push(event)
}

/**
 * P58 PLAN-07 (Gap 4 fix): Module-level delegation-terminal emission.
 *
 * Allows BATS tests and other consumers to emit a delegation-terminal event
 * WITHOUT instantiating `ToolDelegation`.
 *
 * @param delegationId - The delegation id reaching terminal state.
 * @param status - The final status. Must be a DelegationLifecycleStatus.
 * @param tmuxSessionId - Optional tmux session id; null when no tmux pane attached.
 */
export function recordDelegationTerminal(
  delegationId: string,
  status: DelegationLifecycleStatus,
  tmuxSessionId: string | null = null,
): void {
  appendDelegationEvent({
    type: "delegation-terminal",
    delegationId,
    agent: "unknown",
    status,
    depth: 0,
    parentId: null,
    tmuxSessionId,
    emittedAt: Date.now(),
  })
}
