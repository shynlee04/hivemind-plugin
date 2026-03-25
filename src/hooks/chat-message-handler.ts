/**
 * Chat message hook handler.
 *
 * Captures user messages in the session journal via the `chat.message` hook.
 * Uses the consolidated writer for atomic writes to a single JSON file per session.
 *
 * @module hooks/chat-message-handler
 */

import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import {
  initSession,
  addTurn,
  getSessionPath,
  loadSession,
  findSessionBySdkId,
  createSdkSymlink,
} from '../features/event-tracker/consolidated-writer.js'

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
  const sessionsDir = join(projectRoot, '.hivemind', 'sessions')
  await mkdir(sessionsDir, { recursive: true })

  const sdkSessionId = input.sessionID

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
      agent: input.agent || 'unknown',
      sdkSessionId,
    })

    // Create backwards-compat symlink from SDK ID to semantic file
    await createSdkSymlink(sessionsDir, sdkSessionId, semanticSessionId)
  }

  // Load existing session to calculate correct turn number
  const existing = await loadSession(sessionsDir, semanticSessionId)
  const turnNumber = existing.turns.length + 1

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
}
