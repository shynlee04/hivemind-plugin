/**
 * Chat message hook handler.
 *
 * Captures user messages in the session journal via the `chat.message` hook.
 * Uses the consolidated writer for atomic writes to a single JSON file per session.
 *
 * @module hooks/chat-message-handler
 */

import {
  addTurn,
  loadSession,
} from '../features/event-tracker/consolidated-writer.js'
import {
  appendTurnToMarkdown,
  ensureEventsMarkdown,
  updateSessionTimestamp,
} from '../features/event-tracker/markdown-writer.js'
import { createSessionResolver } from '../features/session-journal/session-resolver.js'

/**
 * Handle `chat.message` hook — captures user messages in session journal.
 *
 * Creates or updates a consolidated session file at
 * `.hivemind/sessions/{semanticId}.json` with the user message as a turn entry.
 * SDK session ID is stored in metadata for cross-referencing.
 *
 * @param input  - SDK hook input with sessionID and agent
 * @param output - SDK hook output with message (role + content) and parts
 * @param projectRoot - Project root directory
 *
 * @example
 * await handleChatMessage(
 *   { sessionID: 'ses_001', agent: 'hiveminder' },
 *   { message: { role: 'user', content: 'Hello' }, parts: [] },
 *   '/path/to/project'
 * )
 */
export async function handleChatMessage(
  input: { sessionID: string; agent?: string },
  output: { message: { role: string; content: string }; parts: unknown[] },
  projectRoot: string
): Promise<void> {
  const resolver = createSessionResolver(projectRoot)
  const sessionsDir = resolver.getSessionsDir()
  const sdkSessionId = input.sessionID
  const semanticSessionId = await resolver.resolveOrCreate(sdkSessionId, {
    lineage: 'hiveminder',
    purposeClass: 'implementation',
    agent: input.agent || 'unknown',
  })

  // Load existing session to calculate correct turn number
  const existing = await loadSession(sessionsDir, semanticSessionId)
  const turnNumber = existing.turnCount + 1

  // Add turn with user message
  await addTurn(sessionsDir, {
    sessionId: semanticSessionId,
    turn: {
      turnNumber,
      timestamp: new Date().toISOString(),
      agent: input.agent || 'unknown',
      model: 'unknown',
      duration: null,
      userMessage: output.message.content,
      assistantContent: '',
    },
  })

  const markdownSession = await loadSession(sessionsDir, semanticSessionId)
  const markdownFilePath = await ensureEventsMarkdown(sessionsDir, markdownSession).catch(() => '')

  if (markdownFilePath) {
    await appendTurnToMarkdown(markdownFilePath, {
      turnNumber,
      timestamp: new Date().toISOString(),
      type: 'user_message',
      content: output.message.content,
    }).catch(() => undefined)
    await updateSessionTimestamp(markdownFilePath).catch(() => undefined)
  }
}
