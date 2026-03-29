/**
 * Text complete hook handler.
 *
 * Primary per-turn journal writer via `text.complete` hook.
 * Captures assistant output, updates session metadata, writes diagnostics.
 * Uses consolidated writer for atomic writes to single JSON file per session.
 *
 * @module hooks/text-complete-handler
 */

import { PURPOSE_CLASS_VALUES } from '../features/event-tracker/types.js'
import type { PurposeClass } from '../features/event-tracker/types.js'
import { getAndClearInjectionPayload } from '../plugin/injection-store.js'
import {
  addTurn,
  addEvent,
  addDiagnostic,
  incrementCounter,
  updateStatus,
  loadSession,
} from '../features/event-tracker/consolidated-writer.js'
import {
  appendTurnToMarkdown,
  ensureEventsMarkdown,
  updateSessionTimestamp,
} from '../features/event-tracker/markdown-writer.js'
import { createSessionResolver } from '../features/session-journal/session-resolver.js'

/** Narrow a string to PurposeClass via sentinel array lookup. */
function isPurposeClass(value: string): value is PurposeClass {
  return (PURPOSE_CLASS_VALUES as readonly string[]).includes(value)
}

/** Dependencies injected into the text-complete handler factory. */
export interface TextCompleteHandlerDeps {
  directory: string
}

/**
 * Creates a handler for the `text.complete` hook.
 *
 * @param deps Dependencies (directory path for session journal root).
 * @returns Async handler function matching the SDK hook signature.
 */
export function createTextCompleteHandler(deps: TextCompleteHandlerDeps) {
  const { directory } = deps
  const sessionResolver = createSessionResolver(directory)
  const sessionsDir = sessionResolver.getSessionsDir()

  /** In-memory cache mapping SDK sessionId to consolidated sessionId. */
  const sessionCache = new Map<string, string>()

  /** Turn counter per SDK sessionId. */
  const turnCounter = new Map<string, number>()

  return async (
    input: { sessionID?: string; messageID: string; partID: string },
    output: { text: string },
  ): Promise<void> => {
    const sdkSessionId = input.sessionID
    const assistantText = typeof output.text === 'string' ? output.text : ''

    if (!sdkSessionId || assistantText.length === 0) {
      return
    }

    const timestamp = new Date().toISOString()
    const injection = getAndClearInjectionPayload(sdkSessionId)

    const purposeClass: PurposeClass =
      injection?.purposeClass && isPurposeClass(injection.purposeClass)
        ? injection.purposeClass
        : 'implementation'

    const agent = injection?.agent ?? 'unknown'
    const lineage: 'hivefiver' | 'hiveminder' = 'hiveminder'

    try {
      // Resolve or create consolidated session
      let consolidatedSessionId = sessionCache.get(sdkSessionId)

      if (!consolidatedSessionId) {
        consolidatedSessionId = await sessionResolver.resolveOrCreate(sdkSessionId, {
          lineage,
          purposeClass,
          agent,
        })
        sessionCache.set(sdkSessionId, consolidatedSessionId)
      }

      // Get current turn number
      const currentTurnNumber = (turnCounter.get(sdkSessionId) ?? 0) + 1
      turnCounter.set(sdkSessionId, currentTurnNumber)

      // 1. Add turn to session
      await addTurn(sessionsDir, {
        sessionId: consolidatedSessionId,
        turn: {
          turnNumber: currentTurnNumber,
          timestamp,
          agent,
          model: 'unknown',
          duration: null,
          userMessage: '',
          assistantContent: assistantText,
        },
      })

      const markdownSession = await loadSession(sessionsDir, consolidatedSessionId)
      const markdownFilePath = await ensureEventsMarkdown(sessionsDir, markdownSession).catch(() => '')

      if (markdownFilePath) {
        await appendTurnToMarkdown(markdownFilePath, {
          turnNumber: currentTurnNumber,
          timestamp,
          type: 'assistant_output',
          content: assistantText,
          metadata: {
            model: 'unknown',
          },
        }).catch(() => undefined)
        await updateSessionTimestamp(markdownFilePath).catch(() => undefined)
      }

      // 2. Write assistant_output event
      await addEvent(sessionsDir, {
        sessionId: consolidatedSessionId,
        event: {
          turnNumber: currentTurnNumber,
          type: 'assistant_output',
          importance: 'medium',
          timestamp,
          data: {
            text: assistantText.slice(0, 500),
            actor: agent,
          },
        },
      })

      // 3. Increment assistant output counter
      await incrementCounter(sessionsDir, consolidatedSessionId, 'assistantOutputCount', 1)

      // 4. Write diagnostic entry
      await addDiagnostic(sessionsDir, {
        sessionId: consolidatedSessionId,
        diagnostic: {
          timestamp,
          level: 'info',
          message: `turn_complete agent=${agent} text_len=${assistantText.length}`,
        },
      })

      // 5. Update session status
      await updateStatus(sessionsDir, consolidatedSessionId, 'active')
    } catch (err) {
      console.error('[session-journal] consolidated write failed:', err)
    }
  }
}

/**
 * Standalone handler for the `text.complete` hook.
 * Creates a consolidated session file at `.hivemind/sessions/{semanticId}.json`
 * with the SDK session ID stored in metadata for cross-referencing.
 *
 * @param input - SDK hook input with sessionID, messageID, partID
 * @param output - SDK hook output with text
 * @param projectRoot - Project root directory
 */
export async function handleTextComplete(
  input: { sessionID?: string; messageID: string; partID: string },
  output: { text: string },
  projectRoot: string
): Promise<void> {
  const sdkSessionId = input.sessionID
  if (!sdkSessionId) return

  const resolver = createSessionResolver(projectRoot)
  const sessionsDir = resolver.getSessionsDir()
  const assistantText = typeof output.text === 'string' ? output.text : ''
  const semanticSessionId = await resolver.resolveOrCreate(sdkSessionId, {
    lineage: 'hiveminder',
    purposeClass: 'implementation',
    agent: 'unknown',
  })

  const existing = await loadSession(sessionsDir, semanticSessionId)
  const turnNumber = existing.turns.length + 1

  await addTurn(sessionsDir, {
    sessionId: semanticSessionId,
    turn: {
      turnNumber,
      timestamp: new Date().toISOString(),
      agent: 'unknown',
      model: 'unknown',
      duration: null,
      userMessage: '',
      assistantContent: assistantText,
    },
  })

  const markdownSession = await loadSession(sessionsDir, semanticSessionId)
  const markdownFilePath = await ensureEventsMarkdown(sessionsDir, markdownSession).catch(() => '')

  if (markdownFilePath) {
    await appendTurnToMarkdown(markdownFilePath, {
      turnNumber,
      timestamp: new Date().toISOString(),
      type: 'assistant_output',
      content: assistantText,
      metadata: {
        model: 'unknown',
      },
    }).catch(() => undefined)
    await updateSessionTimestamp(markdownFilePath).catch(() => undefined)
  }
}
