/**
 * Tool execution hook handler.
 *
 * Writes a tool_invocation event to the consolidated session file on `tool.execute.after` hook.
 * Uses consolidated writer for atomic writes to single JSON file per session.
 *
 * @module hooks/tool-execution-handler
 */

import {
  addEvent,
  incrementCounter,
  loadSession,
} from '../features/event-tracker/consolidated-writer.js'
import {
  appendTurnToMarkdown,
  ensureEventsMarkdown,
  updateSessionTimestamp,
} from '../features/event-tracker/markdown-writer.js'
import { createSessionResolver } from '../features/session-journal/session-resolver.js'

/**
 * Standalone handler for tool execution events.
 * Creates a consolidated session file at `.hivemind/sessions/{semanticId}.json`
 * with the SDK session ID stored in metadata for cross-referencing.
 *
 * @param input - SDK hook input with tool name, sessionID, callID, and args
 * @param output - SDK hook output with title, output, and metadata
 * @param projectRoot - Project root directory
 */
export async function handleToolExecution(
  input: { tool: string; sessionID: string; callID: string; args: any },
  output: { title: string; output: string; metadata: any },
  projectRoot: string,
): Promise<void> {
  const sdkSessionId = input.sessionID
  if (!sdkSessionId) return

  const resolver = createSessionResolver(projectRoot)
  const sessionsDir = resolver.getSessionsDir()
  const semanticSessionId = await resolver.resolve(sdkSessionId).catch(() => null)

  if (!semanticSessionId) return

  // Add tool invocation event
  await addEvent(sessionsDir, {
    sessionId: semanticSessionId,
    event: {
      turnNumber: 0,
      type: 'tool_invocation',
      importance: 'medium',
      timestamp: new Date().toISOString(),
      toolName: input.tool,
      callID: input.callID,
      data: {
        title: output.title,
        args: input.args,
      },
    } as any,
  })

  // Increment tool call counter (resilient for partial session files)
  try {
    await incrementCounter(sessionsDir, semanticSessionId, 'toolCallCount', 1)
  } catch {
    // Session file may lack counters structure — non-critical
  }

  const markdownSession = await loadSession(sessionsDir, semanticSessionId)
  const markdownFilePath = await ensureEventsMarkdown(sessionsDir, markdownSession).catch(() => '')

  if (markdownFilePath) {
    await appendTurnToMarkdown(markdownFilePath, {
      turnNumber: markdownSession.turnCount + markdownSession.toc.length,
      timestamp: new Date().toISOString(),
      type: 'tool_call',
      content: output.output || output.title || input.tool,
      metadata: {
        tool: input.tool,
        action: JSON.stringify(input.args ?? {}),
      },
    }).catch(() => undefined)
    await updateSessionTimestamp(markdownFilePath).catch(() => undefined)
  }
}
