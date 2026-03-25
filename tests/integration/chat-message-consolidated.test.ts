/**
 * TDD Test 5: Chat Message Handler → User Message Capture
 *
 * RED PHASE: This test defines the expected behavior for user message capture.
 * When the chat.message hook fires with a user message, the session JSON file
 * should contain a turn with the user message and increment userMessageCount.
 *
 * What users can see:
 * - Session file exists at .hivemind/sessions/{sessionId}.json
 * - turns array contains an entry with userMessage
 * - counters.userMessageCount increments
 *
 * Real file system, no mocks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'

const HIVEMIND_DIR = '.hivemind'
const SESSIONS_DIR = 'sessions'
const TEST_DIR = join(process.cwd(), '.test-chat-message')

describe('Chat Message Handler → User Message Capture', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
    mkdirSync(join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR), { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('captures user message and increments userMessageCount', async () => {
    const sessionId = 'ses_test_user_msg'
    const projectRoot = TEST_DIR

    // Import the chat message handler — this will fail if handleChatMessage does not exist
    const { handleChatMessage } = await import(
      '../../src/hooks/chat-message-handler.js'
    )

    // Call with real SDK input shape
    await handleChatMessage(
      { sessionID: sessionId, agent: 'hiveminder' },
      {
        message: { role: 'user', content: 'Hello from user' },
        parts: [],
      },
      projectRoot
    )

    // Read the consolidated session file
    const sessionPath = join(
      projectRoot,
      HIVEMIND_DIR,
      SESSIONS_DIR,
      `${sessionId}.json`
    )

    expect(existsSync(sessionPath)).toBe(true)

    const content = JSON.parse(readFileSync(sessionPath, 'utf-8'))

    // Assert: user message captured in turns
    expect(content.turns).toHaveLength(1)
    expect(content.turns[0].userMessage).toBe('Hello from user')

    // Assert: userMessageCount incremented
    expect(content.counters.userMessageCount).toBe(1)
  })
})
