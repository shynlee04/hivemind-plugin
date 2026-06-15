/**
 * Journal Write Path Bridge (SR-02)
 *
 * Re-exports journal write functions from `src/task-management/journal/index.ts`
 * so that C8 shared modules (and other clusters that depend on C8) can write
 * journal entries without importing directly from the C2 task-management module.
 *
 * This prevents coupling between clusters while keeping the journal write path
 * accessible from any layer that imports C8.
 *
 * @example
 * ```ts
 * import { writeJournalEntry, buildJournalId } from "../shared/journal-bridge.js"
 *
 * const entry = writeJournalEntry(
 *   {
 *     sessionId: "ses_xxx",
 *     actor: "agent",
 *     eventType: "delegation.completed",
 *     timestamp: Date.now(),
 *     source: "delegation-manager",
 *     summary: "Delegation completed successfully",
 *     stateRole: "canonical runtime state",
 *   },
 *   "/path/to/journal.jsonl",
 * )
 * ```
 */

import {
  SESSION_JOURNAL_STATE_ROLES,
  createJournalEntry,
  appendJournalEntry,
  buildJournalId,
  renderJournalEntryMarkdown,
} from "../task-management/journal/index.js"

export {
  SESSION_JOURNAL_STATE_ROLES,
  createJournalEntry,
  appendJournalEntry,
  buildJournalId,
  renderJournalEntryMarkdown,
}

// Local import for types used by writeJournalEntry convenience function.
import type {
  SessionJournalEntry,
  SessionJournalAppendInput,
  SessionJournalStateRole,
  SessionJournalActor,
} from "../task-management/journal/index.js"

export type {
  SessionJournalEntry,
  SessionJournalAppendInput,
  SessionJournalStateRole,
  SessionJournalActor,
}

/**
 * Convenience function that combines `createJournalEntry` and
 * `appendJournalEntry` in a single call.
 *
 * Validates the entry fields via `createJournalEntry`, then persists
 * it via `appendJournalEntry` with deduplication by idempotency key.
 *
 * @param entry - Journal entry fields (id is auto-generated if omitted).
 * @param filePath - Absolute path to the JSONL journal file.
 * @param idempotencyKey - Deduplication key; if an entry with this key
 *   already exists in the file, the write is silently skipped.
 * @returns The validated and persisted journal entry.
 */
export function writeJournalEntry(
  entry: Omit<SessionJournalEntry, "id"> & { id?: string },
  filePath: string,
  idempotencyKey?: string,
): SessionJournalEntry {
  const created = createJournalEntry(entry)
  return appendJournalEntry({
    entry: created,
    filePath,
    idempotencyKey: idempotencyKey ?? buildJournalId(created),
  })
}
