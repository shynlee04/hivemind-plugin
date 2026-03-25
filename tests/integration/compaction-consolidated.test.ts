/**
 * TDD Test: Compaction Handler → Events Array
 *
 * RED PHASE: This test defines the expected behavior for compaction event logging.
 * When the compaction hook fires, the session JSON file should contain a compaction
 * event in the events array.
 *
 * What users can see:
 * - Session file exists at .hivemind/sessions/{sessionId}.json
 * - events array contains an entry with type: 'compaction'
 *
 * Real file system, no mocks.
 */

import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { test, beforeEach, afterEach } from 'node:test'

const HIVEMIND_DIR = '.hivemind'
const SESSIONS_DIR = 'sessions'
const TEST_DIR = join(process.cwd(), '.test-compaction-journal')

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true })
  mkdirSync(join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR), { recursive: true })
})

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

test('logs compaction event to events array', async () => {
  const sessionId = 'ses_test_compaction'
  const projectRoot = TEST_DIR

  // Import the compaction handler — this will fail if handleCompaction does not exist
  const { handleCompaction } = await import(
    '../../src/hooks/compaction-handler.js'
  )

  // Call with real SDK input shape
  await handleCompaction(
    { sessionID: sessionId },
    {
      context: new Array(5).fill('prior message context'),
      prompt: 'Compact this conversation',
    },
    projectRoot,
  )

  // Read the consolidated session file
  const sessionPath = join(
    projectRoot,
    HIVEMIND_DIR,
    SESSIONS_DIR,
    `${sessionId}.json`,
  )

  assert.ok(existsSync(sessionPath), `Session file should exist at ${sessionPath}`)

  const content = JSON.parse(readFileSync(sessionPath, 'utf-8'))

  // Assert: events array contains a compaction event
  assert.ok(Array.isArray(content.events), 'events should be an array')
  assert.equal(content.events.length, 1, 'events array should have exactly 1 entry')
  assert.equal(content.events[0].type, 'compaction', 'event type should be compaction')
})
