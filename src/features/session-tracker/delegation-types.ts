/**
 * Delegation event types for session tracker.
 *
 * Extracted from types.ts to satisfy the ≤500 LOC gate (GA-4).
 * Contains the discriminated union and supporting types for the
 * Phase 58 (G6) delegation lifecycle event log.
 *
 * @module session-tracker/delegation-types
 */

// ---------------------------------------------------------------------------
// Phase 58 (G6, REQ-58-06): Delegation lifecycle types
// ---------------------------------------------------------------------------

/**
 * Phase 58 G6: Lifecycle status of a delegation. Mirrors the
 * `DelegationLifecycleStatus` from `src/coordination/delegation/pool-types.ts`
 * (the 7-literal superset: queued, dispatched, running, completed, failed,
 * aborted, paused). Re-declared here to keep the session-tracker module
 * self-contained (the G6 plan accepts the duplication per SPEC).
 */
export type DelegationLifecycleStatus =
  | "queued"
  | "dispatched"
  | "running"
  | "completed"
  | "failed"
  | "aborted"
  | "paused"

/**
 * TODO-2 (2026-06-04, user-locked enum): Discriminator for the delegation
 * mechanism that produced a child session. Differentiates Hivemind-owned
 * tools (delegate-task, execute-slash-command) from OpenCode's native
 * `task` tool and direct SDK calls.
 *
 * Mapping:
 * - `"async-spawn"` — Hivemind's `delegate-task` custom tool (creates child
 *   session, returns immediately with delegation ID — async WaiterModel)
 * - `"native-task"` — OpenCode's native `task` tool (user-issued, sync
 *   behavior in main session)
 * - `"slash-cmd"` — Hivemind's `execute-slash-command` tool (orchestrated
 *   command, may recurse)
 * - `"sdk-direct"` — direct SDK calls bypassing any tool (rare, completeness)
 *
 * Set at WRITE time only (per R7 mitigation). Optional everywhere so
 * existing on-disk files remain valid (R1 mitigation, zero schema breaks).
 * MVD scope: 10 files, ~80 lines. See
 * `.planning/research/session-tracker-cluster-map-2026-06-04.md` §12.
 */
export type DelegationType =
  | "async-spawn"
  | "native-task"
  | "slash-cmd"
  | "sdk-direct"

/**
 * Phase 58 G6 (REQ-58-06, D-58-13): Base shape for all 3 delegation lifecycle
 * events. Numeric `emittedAt` epoch enables monotonic ordering assertions
 * in BATS slot 66.
 */
export interface DelegationEventBase {
  /** Delegation id (child session id). */
  delegationId: string
  /** Agent name dispatched. */
  agent: string
  /** Lifecycle status at the time of emission. */
  status: DelegationLifecycleStatus
  /** Delegation nesting depth. */
  depth: number
  /** Parent delegation id, or null for top-level delegations. */
  parentId: string | null
  /** Tmux session id if attached; null otherwise. */
  tmuxSessionId: string | null
  /** Date.now() ms epoch — monotonic, sort-friendly. */
  emittedAt: number
}

/**
 * Phase 58 G6 (REQ-58-06): 3-event delegation lifecycle contract.
 *
 * Each delegation emits:
 *   - `delegation-queued` (when `recordChildTaskDelegation` is called)
 *   - `delegation-dispatched` (after SDK child-session creation)
 *   - `delegation-terminal` (when status transitions to a terminal state)
 *
 * Monotonic via `emittedAt` numeric epoch. The 3 events flow through the
 * existing "delegation" SSE filter category at
 * `src/sidecar/server/routes/events.ts:15-31` without any filter array
 * changes (Q2 finding).
 */
export type SessionTrackerEvent =
  | (DelegationEventBase & { type: "delegation-queued" })
  | (DelegationEventBase & { type: "delegation-dispatched" })
  | (DelegationEventBase & { type: "delegation-terminal" })
