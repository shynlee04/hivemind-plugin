/**
 * Compaction hook handler.
 *
 * Writes a compaction event to the consolidated session file on `session.compacting` hook.
 * Uses consolidated writer for atomic writes to single JSON file per session.
 *
 * @module hooks/compaction-handler
 */

import {
  addEvent,
  incrementCounter,
} from '../features/event-tracker/consolidated-writer.js'
import { createSessionResolver } from '../features/session-journal/session-resolver.js'

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
  const sessionResolver = createSessionResolver(directory)
  const sessionsDir = sessionResolver.getSessionsDir()

  return async (
    input: { sessionID: string },
    output: { context: string[]; prompt?: string },
  ): Promise<void> => {
    const sessionId = input.sessionID
    if (!sessionId) return

    const timestamp = new Date().toISOString()
    const contextLength = output.context.length

    // Determine importance based on context size
    const importance: 'high' | 'medium' | 'low' =
      contextLength > 30 ? 'high' : contextLength > 10 ? 'medium' : 'low'

    try {
      const consolidatedSessionId = await sessionResolver.resolveOrCreate(sessionId, {
        lineage: 'hiveminder',
        purposeClass: 'implementation',
        agent: 'unknown',
      })

      // Add compaction event to session
      await addEvent(sessionsDir, {
        sessionId: consolidatedSessionId,
        event: {
          turnNumber: 0, // Compaction events are not tied to specific turns
          type: 'compaction',
          importance,
          timestamp,
          data: {
            contextLength,
            prompt: output.prompt,
          },
        },
      })

      // Increment compaction counter
      await incrementCounter(sessionsDir, consolidatedSessionId, 'compactionCount', 1)
    } catch (err) {
      console.error('[session-journal] writeEvent (compaction) failed:', err)
    }
  }
}

/**
 * Standalone handler for compaction events.
 * Creates a consolidated session file at `.hivemind/sessions/{semanticId}.json`
 * with the SDK session ID stored in metadata for cross-referencing.
 *
 * @param input - SDK hook input with sessionID
 * @param output - SDK hook output with context and prompt
 * @param projectRoot - Project root directory
 */
export async function handleCompaction(
  input: { sessionID: string },
  output: { context: string[]; prompt?: string },
  projectRoot: string
): Promise<void> {
  const sdkSessionId = input.sessionID
  if (!sdkSessionId) return

  const resolver = createSessionResolver(projectRoot)
  const sessionsDir = resolver.getSessionsDir()
  const semanticSessionId = await resolver.resolveOrCreate(sdkSessionId, {
    lineage: 'hiveminder',
    purposeClass: 'implementation',
    agent: 'unknown',
  })

  // Add compaction event
  await addEvent(sessionsDir, {
    sessionId: semanticSessionId,
    event: {
      turnNumber: 0,
      type: 'compaction',
      importance: 'medium',
      timestamp: new Date().toISOString(),
      data: {
        contextLength: output.context.length,
        prompt: output.prompt,
      },
    },
  })

  // Increment compaction counter
  await incrementCounter(sessionsDir, semanticSessionId, 'compactionCount', 1)
}
