/**
 * Session Journal time-machine replay (Phase 41 / JOURNAL-03).
 *
 * Pure helpers built on top of the append-only Session Journal entries
 * loaded by `journal-query.ts`. This module is independent of
 * `continuity.ts` (JOURNAL-01) and never mutates state; it only reorders
 * and folds entries that callers already loaded.
 *
 * Three operations are exposed:
 *   - {@link replayChronological} — return entries sorted by timestamp ascending,
 *     with deterministic tie-breaking on `id` so the same input set always
 *     produces the same chronological order.
 *   - {@link reconstructStateAt}  — return entries up to `atMs` (inclusive)
 *     filtered by `stateRole` (defaults to `"canonical runtime state"`) and
 *     optionally by `sessionId`. The default is "what was the canonical
 *     runtime state at this point in time" — the smallest set of entries a
 *     caller needs to fold into a state snapshot.
 *   - {@link reduceJournalEntries} — generic chronological fold so callers
 *     can build their own state projections without re-implementing the
 *     sort.
 *
 * Replay is deliberately fold-based rather than schema-aware. Different
 * deep modules attach different state projections to the journal
 * (delegation, lifecycle, runtime-policy, etc.) and each owns its own
 * reducer; this module only guarantees correct chronological ordering and
 * provides primitives, not an opinionated "current state" object.
 */

import type { SessionJournalEntry, SessionJournalStateRole } from "./index.js"

/**
 * Options accepted by {@link reconstructStateAt}.
 *
 * - `atMs`        — inclusive upper-bound timestamp.
 * - `sessionId`   — optional sessionId filter; omit to span every session.
 * - `stateRoles`  — allowed `stateRole` values (intersection). Defaults to
 *                   `["canonical runtime state"]`. Pass an explicit array to
 *                   include audit / derived projections in the reconstruction.
 */
export type ReconstructStateOptions = {
  atMs: number
  sessionId?: string
  stateRoles?: readonly SessionJournalStateRole[]
}

/**
 * Sort entries by `timestamp` ascending with stable, deterministic ordering.
 *
 * Ties on `timestamp` are broken by lexicographic comparison on `id`, so the
 * same input set in any order always produces the same output ordering.
 * The input array is *not* mutated — a new array is returned.
 *
 * @param entries Source entries.
 * @returns A new array sorted in chronological order.
 */
export function replayChronological(
  entries: readonly SessionJournalEntry[],
): SessionJournalEntry[] {
  return [...entries].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  })
}

/**
 * Reconstruct the set of journal entries that comprise the past state at a
 * given moment in time.
 *
 * Applies, in order: optional `sessionId` filter, inclusive
 * `timestamp <= atMs` filter, and `stateRole` membership filter. Output is
 * chronologically sorted via {@link replayChronological}.
 *
 * The default `stateRoles` is `["canonical runtime state"]` — i.e. only the
 * entries that contribute to the canonical projection a deep module would
 * fold into its state snapshot. Audit-trail and derived-projection rows
 * are excluded by default so callers can hand the result straight to a
 * pure reducer without worrying about double-counting derived data.
 *
 * @param entries Source entries (any order).
 * @param options At-time and optional session/role filters.
 * @returns Chronologically sorted entries matching every filter.
 */
export function reconstructStateAt(
  entries: readonly SessionJournalEntry[],
  options: ReconstructStateOptions,
): SessionJournalEntry[] {
  const allowedRoles = new Set<SessionJournalStateRole>(
    options.stateRoles ?? ["canonical runtime state"],
  )

  const filtered = entries.filter((entry) => {
    if (options.sessionId !== undefined && entry.sessionId !== options.sessionId) return false
    if (entry.timestamp > options.atMs) return false
    if (!allowedRoles.has(entry.stateRole)) return false
    return true
  })

  return replayChronological(filtered)
}

/**
 * Generic chronological fold for caller-defined state reconstruction.
 *
 * Sorts the input via {@link replayChronological} (so callers do not have
 * to remember to sort) and applies `reducer` left-to-right. Returns the
 * `initial` accumulator unchanged when `entries` is empty.
 *
 * @typeParam T   - Caller-defined accumulator type.
 * @param entries Source entries (any order).
 * @param initial Initial accumulator value.
 * @param reducer `(acc, entry, index) => nextAcc`.
 * @returns The final accumulator.
 */
export function reduceJournalEntries<T>(
  entries: readonly SessionJournalEntry[],
  initial: T,
  reducer: (acc: T, entry: SessionJournalEntry, index: number) => T,
): T {
  if (entries.length === 0) {
    return initial
  }

  const ordered = replayChronological(entries)
  let acc = initial
  for (let index = 0; index < ordered.length; index += 1) {
    const entry = ordered[index]
    if (entry === undefined) continue
    acc = reducer(acc, entry, index)
  }
  return acc
}
