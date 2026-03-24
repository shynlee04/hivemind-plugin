/**
 * Text complete hook handler.
 *
 * Primary per-turn journal writer via `text.complete` hook.
 * Captures assistant output, updates session metadata, writes diagnostics.
 * Thin handler — delegates to classifier/writer modules only.
 *
 * @module hooks/text-complete-handler
 */

import { PURPOSE_CLASS_VALUES } from '../features/event-tracker/types.js'
import type { PurposeClass } from '../features/event-tracker/types.js'
import { getAndClearInjectionPayload } from '../plugin/injection-store.js'
import { appendSessionEvent } from '../features/event-tracker/writers/events-writer.js'
import { initOrUpdateSessionMetadata } from '../features/event-tracker/writers/session-writer.js'
import { appendSessionDiagnostic } from '../features/event-tracker/writers/diagnostics-writer.js'

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

  return async (
    input: { sessionID?: string; messageID: string; partID: string },
    output: { text: string },
  ): Promise<void> => {
    const sessionId = input.sessionID
    const assistantText = typeof output.text === 'string' ? output.text : ''

    if (!sessionId || assistantText.length === 0) {
      return
    }

    const timestamp = new Date().toISOString()
    const injection = getAndClearInjectionPayload(sessionId)

    // 1. Write assistant_output event
    await appendSessionEvent(directory, {
      sessionId,
      timestamp,
      type: 'assistant_output',
      actor: injection?.agent ?? 'unknown',
      title: 'Assistant response',
      summary: assistantText.slice(0, 200),
    }).catch(err => console.error('[session-journal] appendSessionEvent failed:', err))

    // 2. Update session metadata
    const purposeClass: PurposeClass =
      injection?.purposeClass && isPurposeClass(injection.purposeClass)
        ? injection.purposeClass
        : 'implementation'

    await initOrUpdateSessionMetadata(directory, {
      sessionId,
      lineage: 'hiveminder',
      purposeClass,
      agent: injection?.agent ?? 'unknown',
      timestamp,
      status: 'active',
    }).catch(err => console.error('[session-journal] initOrUpdateSessionMetadata failed:', err))

    // 3. Write diagnostic log line
    await appendSessionDiagnostic(directory, {
      sessionId,
      timestamp,
      level: 'info',
      message: `turn_complete agent=${injection?.agent ?? 'unknown'} text_len=${assistantText.length}`,
    }).catch(err => console.error('[session-journal] appendSessionDiagnostic failed:', err))
  }
}
