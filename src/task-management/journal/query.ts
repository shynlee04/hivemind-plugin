/**
 * Session Journal query API (Phase 41 / JOURNAL-02).
 *
 * Pure read-side helpers for the append-only Session Journal written by
 * `appendJournalEntry()` in `session-journal.ts`. This module is independent
 * of `continuity.ts` (JOURNAL-01) — it only reads JSONL files produced by
 * the journal writer and never mutates state, the journal file, or
 * continuity-store records.
 *
 * Three orthogonal filters are exposed plus a composed `queryJournal()`
 * convenience that operates over a file path:
 *   - {@link queryBySession}      filter by `sessionId`
 *   - {@link queryByEventType}    filter by one or more `eventType`s
 *   - {@link queryByTimeRange}    filter by inclusive `[fromMs, toMs]` window
 *   - {@link queryJournal}        compose all three (plus optional `stateRole`)
 *
 * Corrupt JSONL lines are skipped silently to mirror the recovery
 * semantics already used by `existingIdempotencyKeys()` in
 * `session-journal.ts` — a single bad line must not block reads of an
 * append-only audit trail.
 */

import { existsSync, readFileSync } from "node:fs"

import type { SessionJournalEntry, SessionJournalStateRole } from "./index.js"

/**
 * Composable filter criteria accepted by {@link queryJournal}.
 *
 * Every field is optional; an empty criteria object returns the full file.
 * `eventType` accepts a single string or an array (any-of match).
 * `fromMs` / `toMs` are millisecond-since-epoch values, both inclusive.
 */
export type JournalQueryCriteria = {
  sessionId?: string
  eventType?: string | readonly string[]
  fromMs?: number
  toMs?: number
  stateRole?: SessionJournalStateRole
}

/**
 * Read every entry from a journal JSONL file in file order.
 *
 * Returns an empty array if the file does not exist (a brand-new journal
 * has the same observable shape as one with zero entries). Corrupt lines
 * are skipped silently.
 *
 * @param filePath Absolute or workspace-relative path to a journal JSONL file.
 * @returns Parsed entries in file order.
 */
export function readJournalEntries(filePath: string): SessionJournalEntry[] {
  if (!existsSync(filePath)) {
    return []
  }

  const lines = readFileSync(filePath, "utf-8")
    .split("\n")
    .filter((line) => line.trim().length > 0)

  const entries: SessionJournalEntry[] = []
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as SessionJournalEntry
      entries.push(parsed)
    } catch {
      // Corrupt historical lines are ignored so a single bad projection does
      // not block append-only recovery — same policy as session-journal.ts.
    }
  }
  return entries
}

/**
 * Filter entries by `sessionId` (exact match).
 *
 * @param entries Source entries (already loaded — usually from {@link readJournalEntries}).
 * @param sessionId The session identifier to match.
 * @returns A new array of entries whose `sessionId` equals the input.
 */
export function queryBySession(
  entries: readonly SessionJournalEntry[],
  sessionId: string,
): SessionJournalEntry[] {
  return entries.filter((entry) => entry.sessionId === sessionId)
}

/**
 * Filter entries by one or more `eventType` values (any-of match).
 *
 * Pass a single string for a single-event filter, or an array for "any of
 * these event types".
 *
 * @param entries Source entries.
 * @param eventType A single event type string or an array of event types.
 * @returns A new array of entries whose `eventType` matches.
 */
export function queryByEventType(
  entries: readonly SessionJournalEntry[],
  eventType: string | readonly string[],
): SessionJournalEntry[] {
  const allowed = new Set(typeof eventType === "string" ? [eventType] : eventType)
  return entries.filter((entry) => allowed.has(entry.eventType))
}

/**
 * Filter entries by an inclusive timestamp range.
 *
 * `fromMs` and `toMs` are both optional. Omit either to leave that side of
 * the window open-ended. Inverted ranges (`fromMs > toMs`) throw a
 * `[Hivemind]` error rather than silently returning an empty array — this
 * surfaces caller bugs early.
 *
 * @param entries Source entries.
 * @param window  Inclusive `[fromMs, toMs]` window. Either bound may be omitted.
 * @throws Error if `fromMs` and `toMs` are both provided and `fromMs > toMs`.
 * @returns A new array of entries whose `timestamp` falls inside the window.
 */
export function queryByTimeRange(
  entries: readonly SessionJournalEntry[],
  window: { fromMs?: number; toMs?: number },
): SessionJournalEntry[] {
  const { fromMs, toMs } = window
  if (typeof fromMs === "number" && typeof toMs === "number" && fromMs > toMs) {
    throw new Error(
      `[Hivemind] Inverted journal time range — fromMs ${fromMs} must not exceed toMs ${toMs}`,
    )
  }

  return entries.filter((entry) => {
    if (typeof fromMs === "number" && entry.timestamp < fromMs) return false
    if (typeof toMs === "number" && entry.timestamp > toMs) return false
    return true
  })
}

/**
 * Read a journal file and apply every supplied filter as a single query.
 *
 * Filters compose by intersection — only entries that match every supplied
 * filter are returned. An empty criteria object simply returns the full
 * file contents.
 *
 * @param filePath Absolute or workspace-relative path to a journal JSONL file.
 * @param criteria Composable filter set; see {@link JournalQueryCriteria}.
 * @returns Entries matching every criterion in file order (no sort applied here).
 */
export function queryJournal(
  filePath: string,
  criteria: JournalQueryCriteria,
): SessionJournalEntry[] {
  let entries = readJournalEntries(filePath)

  if (criteria.sessionId !== undefined) {
    entries = queryBySession(entries, criteria.sessionId)
  }
  if (criteria.eventType !== undefined) {
    entries = queryByEventType(entries, criteria.eventType)
  }
  if (criteria.fromMs !== undefined || criteria.toMs !== undefined) {
    entries = queryByTimeRange(entries, { fromMs: criteria.fromMs, toMs: criteria.toMs })
  }
  if (criteria.stateRole !== undefined) {
    entries = entries.filter((entry) => entry.stateRole === criteria.stateRole)
  }

  return entries
}
