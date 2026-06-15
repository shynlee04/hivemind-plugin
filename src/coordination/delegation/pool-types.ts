/**
 * Phase 58 (G2, REQ-58-02): Frozen DelegationPool contract.
 *
 * The DelegationPool is a typed, JSON-serializable snapshot of every delegation
 * known to the in-memory map. It is consumed by:
 *   - tmux-copilot (D-58-03 test seam + G2 wire)
 *   - SC-01 SSE pool (delegation events fan-in)
 *   - SC-04 / SC-05 dashboards (deferred renderers)
 *
 * Contract invariants (locked at this phase; any widening requires a
 * `schemaVersion` bump):
 *   - `schemaVersion` is a NUMERIC literal `1` (per D-53-13 numeric-literal
 *     convention, NOT a string).
 *   - `DelegationPoolEntry.promptPreview` is a single-line string (no `\n`)
 *     truncated to 200 characters max; truncation uses suffix-ellipsis `…`
 *     (U+2026). Caller responsibility to pass raw prompt; `sanitizePreview`
 *     enforces the contract.
 *   - `DelegationLifecycleStatus` is the lifecycle superset of the existing
 *     `DelegationStatus` (src/coordination/delegation/types.ts:1-9) plus the
 *     `paused` literal. The `error | timeout` collapse to `failed`; the
 *     `cancelled` literal collapses to `aborted`.
 *   - Top-level `DelegationPool` AND each `DelegationPoolEntry` are
 *     deep-frozen via `Object.freeze` (D-58-04 immutability invariant).
 *   - Snapshot is a pure read — no async I/O, no mutation. Consumed by JSON
 *     round-trip for SSE transport.
 *
 * @module coordination/delegation/pool-types
 * @phase 58
 */

/**
 * Lifecycle status superset for the delegation pool.
 * Includes the existing `DelegationStatus` literals plus the G3
 * `paused` literal (for tmux-session preservation across abort).
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
 * Single entry in the frozen DelegationPool snapshot.
 * All fields are `readonly` to enforce compile-time immutability; runtime
 * immutability is enforced via `Object.freeze` in `freezeDelegationPool`.
 */
export interface DelegationPoolEntry {
  /** Delegation id (UUIDv7 per P54 D-54-07 convention). */
  readonly id: string
  /** Agent name dispatched (e.g. "hm-l2-researcher"). */
  readonly agent: string
  /** Lifecycle status (superset of DelegationStatus). */
  readonly status: DelegationLifecycleStatus
  /** Delegation nesting depth (1 = top-level). */
  readonly depth: number
  /** Parent delegation id, or null for top-level delegations. */
  readonly parentId: string | null
  /** Date.now() ms epoch when the delegation started. */
  readonly startedAt: number
  /**
   * Single-line, <= 200 chars prompt preview. MUST NOT contain `\n`.
   * Caller responsibility to pass the raw prompt — `sanitizePreview`
   * enforces the contract by replacing newlines with a single space
   * and truncating with U+2026 suffix-ellipsis when the raw exceeds
   * the 200-char cap.
   */
  readonly promptPreview: string
}

/**
 * Frozen delegation pool envelope. `schemaVersion: 1` is a numeric literal
 * (D-53-13). `delegations` is a `readonly` array of frozen entries.
 */
export interface DelegationPool {
  /** Schema version (NUMERIC literal — bump requires migration). */
  readonly schemaVersion: 1
  /** Date.now() ms epoch when the snapshot was composed. */
  readonly capturedAt: number
  /** Array of frozen DelegationPoolEntry records. */
  readonly delegations: readonly DelegationPoolEntry[]
}

/**
 * Sanitize a raw prompt string into a single-line preview of <= 200 chars.
 *
 * Pipeline:
 *   1. Replace all `\r`, `\n`, and `\t` with a single space.
 *   2. Collapse runs of whitespace to a single space.
 *   3. Trim leading/trailing whitespace.
 *   4. Truncate to 200 chars; suffix-ellipsize with U+2026 when truncated.
 *
 * Pure function — no side effects, no allocation beyond the return value.
 *
 * @param raw - The raw prompt string (may contain newlines, may exceed 200 chars).
 * @returns A single-line preview of <= 200 chars (201 chars when truncated: 200 + `…`).
 */
export function sanitizePreview(raw: string): string {
  const single = raw.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200)
  if (raw.length > 200) {
    return single + "\u2026"
  }
  return single
}

/**
 * Deep-freeze a DelegationPool snapshot. The top-level `DelegationPool` AND
 * each `DelegationPoolEntry` are frozen via `Object.freeze`. The `delegations`
 * array is also frozen (so `push`/`pop` are caught at runtime).
 *
 * Pure function — returns the SAME object reference after in-place freezing.
 * No new object is allocated.
 *
 * @param snapshot - The DelegationPool snapshot to freeze in-place.
 * @returns The same snapshot, now deeply frozen.
 */
export function freezeDelegationPool(snapshot: DelegationPool): DelegationPool {
  for (const entry of snapshot.delegations) {
    Object.freeze(entry)
  }
  Object.freeze(snapshot.delegations)
  Object.freeze(snapshot)
  return snapshot
}
