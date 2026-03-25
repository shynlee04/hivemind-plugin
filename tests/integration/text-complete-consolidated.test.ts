/**
 * TDD Test 1: Text Complete Handler Integration with Consolidated Writer
 *
 * TRACER BULLET: Proves the path works end-to-end
 * - Hook fires
 * - Consolidated writer called
 * - File created on disk
 * - JSON has correct schema
 *
 * This test exercises the PUBLIC INTERFACE:
 * - What users can see: file on disk with correct JSON structure
 * - No mocks: real file system, real JSON
 * - Bit-size: ONE behavior per test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync, rmSync, mkdirSync } from 'fs'
import { join } from 'path'

// Real constants from project
const HIVEMIND_DIR = '.hivemind'
const SESSIONS_DIR = 'sessions'
const TEST_DIR = join(process.cwd(), '.test-session-journal')

describe('Text Complete Handler → Consolidated Writer', () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true })
    mkdirSync(join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR), { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  // TEST 2: Turn contains assistantContent when hook fires with text
  it('turn contains assistantContent when hook fires with text', async () => {
    const sessionId = 'ses_test_002'
    const projectRoot = TEST_DIR

    const { handleTextComplete } = await import(
      '../../src/hooks/text-complete-handler.js'
    )

    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_001', partID: 'part_001' },
      { text: 'Hello from assistant' },
      projectRoot
    )

    const sessionPath = join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, `${sessionId}.json`)
    const content = JSON.parse(readFileSync(sessionPath, 'utf-8'))

    // Assert: turn has assistantContent
    expect(content.turns).toHaveLength(1)
    expect(content.turns[0].assistantContent).toBe('Hello from assistant')
  })

  // TEST 3: Counter increments on multiple hook calls for same session
  it('increments assistantOutputCount on multiple hook calls', async () => {
    const sessionId = 'ses_test_counter'
    const projectRoot = TEST_DIR

    const { handleTextComplete } = await import(
      '../../src/hooks/text-complete-handler.js'
    )

    // First call
    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_001', partID: 'part_001' },
      { text: 'Hello 1' },
      projectRoot
    )

    // Second call with SAME session
    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_002', partID: 'part_002' },
      { text: 'Hello 2' },
      projectRoot
    )

    const sessionPath = join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, `${sessionId}.json`)
    const content = JSON.parse(readFileSync(sessionPath, 'utf-8'))

    // Assert: counter is 2
    expect(content.counters.assistantOutputCount).toBe(2)
    expect(content.turns).toHaveLength(2)
  })

  // TRACER BULLET: One test proving the path works
  it('creates consolidated session file when hook fires', async () => {
    // Arrange: Real SDK session ID
    const sessionId = 'ses_test_001'
    const projectRoot = TEST_DIR

    // Act: Import the hook handler
    // This will fail until we add the public API — THIS IS TDD RED
    const { handleTextComplete } = await import(
      '../../src/hooks/text-complete-handler.js'
    )

    // Real SDK hook input
    await handleTextComplete(
      {
        sessionID: sessionId,
        messageID: 'msg_001',
        partID: 'part_001'
      },
      {
        // Real SDK output type
        text: 'Hello from assistant'
      },
      projectRoot
    )

    // Assert: What users can see — file exists with correct structure
    const sessionPath = join(
      projectRoot,
      HIVEMIND_DIR,
      SESSIONS_DIR,
      `${sessionId}.json`
    )

    // Check 1: File exists
    expect(existsSync(sessionPath)).toBe(true)

    // Check 2: File has correct JSON structure
    const content = JSON.parse(readFileSync(sessionPath, 'utf-8'))
    expect(content._schema).toBe('session/v2')
    expect(content.sessionId).toBe(sessionId)
    expect(content.status).toBe('active')
  })
})
