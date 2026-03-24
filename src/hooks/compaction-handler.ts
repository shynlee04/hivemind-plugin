/**
 * Compaction hook handler.
 *
 * Writes a compaction event to the session journal on `session.compacting` hook.
 * Thin handler — delegates to events-writer only, no compaction output modification.
 *
 * @module hooks/compaction-handler
 */

import { appendSessionEvent } from '../features/event-tracker/writers/events-writer.js'

/** Dependencies injected into the compaction journal handler factory. */
export interface CompactionJournalHandlerDeps {
  directory: string
}

/**
 * Creates a handler for the `session.compacting` hook.
 *
 * @param deps Dependencies (directory path for session journal root).
 * @returns Async handler function matching the SDK hook signature.
 */
export function createCompactionJournalHandler(deps: CompactionJournalHandlerDeps) {
  const { directory } = deps

  return async (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ): Promise<void> => {
    const sessionId = input.sessionID
    if (!sessionId) return

    const timestamp = new Date().toISOString()

    await appendSessionEvent(directory, {
      sessionId,
      timestamp,
      type: 'compaction',
      actor: 'system',
      title: 'Session compaction',
      summary: `Compaction triggered. Context length: ${output.context.length} segments.`,
    }).catch(err => console.error('[session-journal] appendSessionEvent (compaction) failed:', err))
  }
}
