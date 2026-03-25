/**
 * TDD Test 7: Multi-Turn Accumulation Across Handlers
 *
 * RED PHASE: Verifies that turns accumulate in order when alternating
 * user messages (chat.message hook) and assistant responses (text.complete hook)
 * fire multiple times for the same session.
 *
 * What users can see:
 * - Session JSON file has turns array with entries in chronological order
 * - User messages and assistant responses alternate correctly
 * - Counters reflect the correct number of user messages and assistant outputs
 *
 * Real file system, no mocks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'

const HIVEMIND_DIR = '.hivemind'
const SESSIONS_DIR = 'sessions'
const TEST_DIR = join(process.cwd(), '.test-multi-turn')

describe('Multi-Turn Accumulation Across Handlers', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
    mkdirSync(join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR), { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('accumulates turns in order when hook fires multiple times', async () => {
    const sessionId = 'ses_test_multi_turn'
    const projectRoot = TEST_DIR

    const { handleChatMessage } = await import(
      '../../src/hooks/chat-message-handler.js'
    )
    const { handleTextComplete } = await import(
      '../../src/hooks/text-complete-handler.js'
    )

    // Turn 1: User message
    await handleChatMessage(
      { sessionID: sessionId, agent: 'hiveminder' },
      {
        message: { role: 'user', content: 'Hello' },
        parts: [],
      },
      projectRoot
    )

    // Turn 2: Assistant response
    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_001', partID: 'part_001' },
      { text: 'Hi there!' },
      projectRoot
    )

    // Turn 3: User follow-up
    await handleChatMessage(
      { sessionID: sessionId, agent: 'hiveminder' },
      {
        message: { role: 'user', content: 'How are you?' },
        parts: [],
      },
      projectRoot
    )

    // Turn 4: Assistant response
    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_002', partID: 'part_002' },
      { text: 'I am fine!' },
      projectRoot
    )

    // Read the consolidated session file
    const sessionPath = join(
      projectRoot,
      HIVEMIND_DIR,
      SESSIONS_DIR,
      `${sessionId}.json`
    )

    const content = JSON.parse(readFileSync(sessionPath, 'utf-8'))

    // Assert: 4 turns accumulated in order
    expect(content.turns).toHaveLength(4)
    expect(content.turns[0].userMessage).toBe('Hello')
    expect(content.turns[1].assistantContent).toBe('Hi there!')
    expect(content.turns[2].userMessage).toBe('How are you?')
    expect(content.turns[3].assistantContent).toBe('I am fine!')

    // Assert: counters reflect correct counts
    expect(content.counters.userMessageCount).toBe(2)
    expect(content.counters.assistantOutputCount).toBe(2)
  })

  it('assigns sequential turnNumber to each turn across handlers', async () => {
    const sessionId = 'ses_test_turn_numbers'
    const projectRoot = TEST_DIR

    const { handleChatMessage } = await import(
      '../../src/hooks/chat-message-handler.js'
    )
    const { handleTextComplete } = await import(
      '../../src/hooks/text-complete-handler.js'
    )

    // Turn 1: User message
    await handleChatMessage(
      { sessionID: sessionId, agent: 'hiveminder' },
      {
        message: { role: 'user', content: 'Hello' },
        parts: [],
      },
      projectRoot
    )

    // Turn 2: Assistant response
    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_001', partID: 'part_001' },
      { text: 'Hi there!' },
      projectRoot
    )

    // Turn 3: User follow-up
    await handleChatMessage(
      { sessionID: sessionId, agent: 'hiveminder' },
      {
        message: { role: 'user', content: 'How are you?' },
        parts: [],
      },
      projectRoot
    )

    // Turn 4: Assistant response
    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_002', partID: 'part_002' },
      { text: 'I am fine!' },
      projectRoot
    )

    // Read the consolidated session file
    const sessionPath = join(
      projectRoot,
      HIVEMIND_DIR,
      SESSIONS_DIR,
      `${sessionId}.json`
    )

    const content = JSON.parse(readFileSync(sessionPath, 'utf-8'))

    // Assert: turnNumber is sequential [1, 2, 3, 4]
    // BUG: chat-message-handler hardcodes turnNumber: 1 for every user message
    // Expected: [1, 2, 3, 4], Actual: [1, 2, 1, 4]
    expect(content.turns[0].turnNumber).toBe(1)
    expect(content.turns[1].turnNumber).toBe(2)
    expect(content.turns[2].turnNumber).toBe(3)
    expect(content.turns[3].turnNumber).toBe(4)

    // Assert: turnCount matches turns.length
    expect(content.counters.turnCount).toBe(4)
  })
})
