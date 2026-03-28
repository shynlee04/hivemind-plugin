/**
 * Compaction hook handler.
 *
 * Writes a compaction event to the consolidated session file on `session.compacting` hook.
 * Uses consolidated writer for atomic writes to single JSON file per session.
 *
 * @module hooks/compaction-handler
 */

import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  addEvent,
  incrementCounter,
  initSession,
  getSessionPath,
  findSessionBySdkId,
  createSdkSymlink,
} from '../features/event-tracker/consolidated-writer.js'

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
  const sessionsDir = join(directory, '.hivemind', 'sessions')

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
      // Resolve or create consolidated session
      let consolidatedSessionId: string | null = null
      try {
        consolidatedSessionId = await findSessionBySdkId(sessionsDir, sessionId)
      } catch {
        // ignore
      }
      if (!consolidatedSessionId) {
        consolidatedSessionId = await initSession(sessionsDir, {
          sdkSessionId: sessionId,
          lineage: 'hiveminder',
          purposeClass: 'implementation',
          agent: 'unknown',
        })
      }

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

  const sessionsDir = join(projectRoot, '.hivemind', 'sessions')
  await mkdir(sessionsDir, { recursive: true })

  // Resolve semantic session ID: try by SDK ID first, then direct path, then create
  let semanticSessionId: string | null = null

  // 1. Try finding existing session by SDK session ID in metadata
  semanticSessionId = await findSessionBySdkId(sessionsDir, sdkSessionId)

  // 2. Try loading by direct path (backwards compat with SDK-named files)
  if (!semanticSessionId) {
    const directPath = getSessionPath(sessionsDir, sdkSessionId)
    if (existsSync(directPath)) {
      semanticSessionId = sdkSessionId
    }
  }

  if (!semanticSessionId) {
    // Create new session with semantic name, store SDK ID in metadata
    semanticSessionId = await initSession(sessionsDir, {
      lineage: 'hiveminder',
      purposeClass: 'implementation',
      agent: 'unknown',
      sdkSessionId,
    })

    // Create backwards-compat symlink from SDK ID to semantic file
    await createSdkSymlink(sessionsDir, sdkSessionId, semanticSessionId)
  }

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
