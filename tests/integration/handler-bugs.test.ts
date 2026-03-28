/**
 * TDD RED Tests: Three Session Journal Handler Bugs
 *
 * These tests prove three bugs in the factory handler functions that cause
 * ENOENT errors or broken SDK→semantic session lookup at runtime.
 *
 * Bug 1: createEventHandler calls addEvent without initSession first
 * Bug 2: createCompactionJournalHandler calls addEvent without initSession first
 * Bug 3: createTextCompleteHandler calls initSession without sdkSessionId,
 *         so findSessionBySdkId cannot locate the session by raw SDK ID
 *
 * All three tests use real file system, no mocks.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync, existsSync, mkdirSync, rmSync, readdirSync, lstatSync } from 'fs'
import { join } from 'path'

const HIVEMIND_DIR = '.hivemind'
const SESSIONS_DIR = 'sessions'
const TEST_DIR = join(process.cwd(), '.test-handler-bugs')

beforeEach(() => {
  mkdirSync(join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR), { recursive: true })
})

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true })
})

// ============================================================================
// Bug 1: createEventHandler — session.idle causes ENOENT
// ============================================================================
describe('createEventHandler (Bug 1: missing initSession)', () => {
  it('creates session file on first idle event (no ENOENT)', async () => {
    const { createEventHandler } = await import('../../src/hooks/event-handler.js')
    const sessionsDir = join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR)

    // Create the handler — this registers the event hook
    const handler = createEventHandler(TEST_DIR)

    // Fire a session.idle event with a raw SDK session ID
    // This is what OpenCode sends at runtime
    const rawSdkId = 'ses_test_idle_001'

    // The handler should NOT throw ENOENT — it must create the session first
    await handler({
      event: {
        type: 'session.idle',
        properties: { sessionID: rawSdkId },
      } as any,
    })

    // Assert: at least one session file was created in the sessions directory
    const files = readdirSync(sessionsDir).filter((f) => f.endsWith('.json'))
    expect(
      files.length,
      `Expected at least one session .json file in ${sessionsDir}, found: ${JSON.stringify(files)}`,
    ).toBeGreaterThan(0)

    // Assert: a session file contains the session_idle event
    let foundIdleEvent = false
    for (const file of files) {
      const content = JSON.parse(readFileSync(join(sessionsDir, file), 'utf-8'))
      if (Array.isArray(content.events)) {
        const idleEvent = content.events.find(
          (e: any) => e.type === 'session_idle',
        )
        if (idleEvent) {
          foundIdleEvent = true
          expect(idleEvent.data.sessionId).toBe(rawSdkId)
          break
        }
      }
    }
    expect(
      foundIdleEvent,
      'Expected a session_idle event in one of the session files',
    ).toBe(true)
  })
})

// ============================================================================
// Bug 2: createCompactionJournalHandler — compaction causes ENOENT
// ============================================================================
describe('createCompactionJournalHandler (Bug 2: missing initSession)', () => {
  it('creates session file on first compaction event (no ENOENT)', async () => {
    const { createCompactionJournalHandler } = await import(
      '../../src/hooks/compaction-handler.js'
    )
    const sessionsDir = join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR)

    // Create the handler
    const handler = createCompactionJournalHandler({ directory: TEST_DIR })

    // Fire a compaction event with a raw SDK session ID
    const rawSdkId = 'ses_test_compaction_001'

    // This should NOT throw ENOENT — it must create the session first
    await handler(
      { sessionID: rawSdkId },
      {
        context: new Array(5).fill('prior message context'),
        prompt: 'Compact this conversation',
      },
    )

    // Assert: at least one session file was created
    const files = readdirSync(sessionsDir).filter((f) => f.endsWith('.json'))
    expect(
      files.length,
      `Expected at least one session .json file in ${sessionsDir}, found: ${JSON.stringify(files)}`,
    ).toBeGreaterThan(0)

    // Assert: a session file contains the compaction event
    let foundCompactionEvent = false
    let foundCounterIncrement = false
    for (const file of files) {
      const content = JSON.parse(readFileSync(join(sessionsDir, file), 'utf-8'))
      if (Array.isArray(content.events)) {
        const compactionEvent = content.events.find(
          (e: any) => e.type === 'compaction',
        )
        if (compactionEvent) {
          foundCompactionEvent = true
          expect(compactionEvent.data.contextLength).toBe(5)
        }
      }
      if (content.counters?.compactionCount > 0) {
        foundCounterIncrement = true
      }
      if (foundCompactionEvent && foundCounterIncrement) break
    }
    expect(
      foundCompactionEvent,
      'Expected a compaction event in one of the session files',
    ).toBe(true)
    expect(
      foundCounterIncrement,
      'Expected compactionCount to be incremented',
    ).toBe(true)
  })
})

// ============================================================================
// Bug 3: createTextCompleteHandler — missing sdkSessionId in initSession
// ============================================================================
describe('createTextCompleteHandler (Bug 3: no sdkSessionId → no symlink)', () => {
  it('findSessionBySdkId locates session by raw SDK ID after first text.complete', async () => {
    const { createTextCompleteHandler } = await import(
      '../../src/hooks/text-complete-handler.js'
    )
    const { findSessionBySdkId } = await import(
      '../../src/features/event-tracker/consolidated-writer.js'
    )
    const sessionsDir = join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR)

    // Create the handler
    const handler = createTextCompleteHandler({ directory: TEST_DIR })

    // Fire a text.complete event with a raw SDK session ID
    const rawSdkId = 'ses_test_textcomplete_001'

    await handler(
      { sessionID: rawSdkId, messageID: 'msg_001', partID: 'part_001' },
      { text: 'Hello from assistant' },
    )

    // Assert: findSessionBySdkId should locate the session by raw SDK ID
    const semanticId = await findSessionBySdkId(sessionsDir, rawSdkId)
    expect(
      semanticId,
      `findSessionBySdkId should return the semantic session ID for SDK ID "${rawSdkId}"`,
    ).not.toBeNull()

    // Assert: a symlink or file exists that maps raw SDK ID → semantic filename
    if (semanticId) {
      // Either a symlink from rawSdkId.json → semanticId.json exists
      // OR the semantic filename itself contains the SDK ID for lookup
      const symlinkPath = join(sessionsDir, `${rawSdkId}.json`)
      const semanticPath = join(sessionsDir, `${semanticId}.json`)

      // One of these must be true: symlink exists OR sdk ID is embedded in filename
      const symlinkExists = existsSync(symlinkPath)
      const sdkIdInFilename = semanticId.includes(rawSdkId)

      expect(
        symlinkExists || sdkIdInFilename,
        `Expected either symlink at ${symlinkPath} or SDK ID embedded in semantic filename "${semanticId}"`,
      ).toBe(true)
    }
  })

  it('compaction-handler can find session created by text-complete-handler via SDK ID', async () => {
    // This tests the cross-handler lookup: text.complete creates a session,
    // then compaction should be able to find it by SDK ID
    const { createTextCompleteHandler } = await import(
      '../../src/hooks/text-complete-handler.js'
    )
    const { createCompactionJournalHandler } = await import(
      '../../src/hooks/compaction-handler.js'
    )
    const { findSessionBySdkId } = await import(
      '../../src/features/event-tracker/consolidated-writer.js'
    )
    const sessionsDir = join(TEST_DIR, HIVEMIND_DIR, SESSIONS_DIR)

    const rawSdkId = 'ses_test_cross_handler_001'

    // Step 1: text.complete creates a session
    const textHandler = createTextCompleteHandler({ directory: TEST_DIR })
    await textHandler(
      { sessionID: rawSdkId, messageID: 'msg_001', partID: 'part_001' },
      { text: 'First message' },
    )

    // Step 2: Verify the session can be found by SDK ID before compaction
    const foundBeforeCompaction = await findSessionBySdkId(sessionsDir, rawSdkId)
    expect(
      foundBeforeCompaction,
      `Session created by text-complete should be findable by SDK ID "${rawSdkId}"`,
    ).not.toBeNull()

    // Step 3: compaction fires — it should find the existing session, not create a duplicate
    const compactionHandler = createCompactionJournalHandler({ directory: TEST_DIR })
    await compactionHandler(
      { sessionID: rawSdkId },
      {
        context: new Array(3).fill('context'),
        prompt: 'Compact',
      },
    )

    // Assert: after both handlers, exactly one session file (plus symlink) should exist
    const jsonFiles = readdirSync(sessionsDir).filter((f) => {
      if (!f.endsWith('.json')) return false
      const stat = lstatSync(join(sessionsDir, f))
      return !stat.isSymbolicLink()
    })

    expect(
      jsonFiles.length,
      `Expected exactly 1 real session file after both handlers, found ${jsonFiles.length}: ${JSON.stringify(jsonFiles)}`,
    ).toBe(1)

    // Assert: that single file has BOTH the turn AND the compaction event
    const sessionContent = JSON.parse(
      readFileSync(join(sessionsDir, jsonFiles[0]), 'utf-8'),
    )
    expect(sessionContent.turns.length).toBeGreaterThanOrEqual(1)
    expect(sessionContent.events.some((e: any) => e.type === 'compaction')).toBe(true)
  })
})
