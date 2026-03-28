/**
 * Consolidated Session Writer V3 Tests — TDD RED Phase
 *
 * Tests for the v3 session writer that produces a directory structure
 * with session.json per session using the v3 schema format (ADR-017).
 *
 * These tests MUST fail because initSessionV3 does not exist yet.
 * After implementation, these same tests should pass.
 *
 * @module event-tracker/consolidated-writer-v3.test
 */

import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile, rm, stat } from 'node:fs/promises'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

// ---------------------------------------------------------------------------
// Types for the consolidated session V3 format (ADR-017)
// ---------------------------------------------------------------------------

/** Activity counters for a SessionV3 record. */
interface SessionV3Counters {
  userMessageCount: number
  assistantOutputCount: number
  toolCallCount: number
  delegationCount: number
  compactionCount: number
}

/** A single entry in the session's auto-generated table of contents. */
interface TableOfContentsEntry {
  turnNumber: number
  timestamp: string
  type: 'user_message' | 'assistant_output' | 'delegation' | 'compaction' | 'error'
  summary: string
}

/**
 * Session V3 record schema (ADR-017).
 * The canonical persisted shape for session.json going forward.
 */
interface SessionV3 {
  _schema: 'session/v3'
  sessionId: string
  semanticSessionId: string
  parentSessionId: string | null
  lineage: 'hivefiver' | 'hiveminder'
  purposeClass:
    | 'discovery'
    | 'brainstorming'
    | 'research'
    | 'planning'
    | 'implementation'
    | 'gatekeeping'
    | 'tdd'
    | 'course-correction'
  agent: string
  startedAt: string
  endedAt: string | null
  turnCount: number
  status: 'active' | 'completed' | 'errored'
  summary: string
  keyFindings: string[]
  subsessionIds: string[]
  resumable: boolean
  counters: SessionV3Counters
  toc: TableOfContentsEntry[]
}

/**
 * Input for initializing a new consolidated session V3.
 */
interface InitSessionV3Input {
  lineage: 'hivefiver' | 'hiveminder'
  purposeClass:
    | 'discovery'
    | 'brainstorming'
    | 'research'
    | 'planning'
    | 'implementation'
    | 'gatekeeping'
    | 'tdd'
    | 'course-correction'
  agent: string
  parentSessionId?: string | null
}

// ---------------------------------------------------------------------------
// Dynamic import helper to load the not-yet-existent module
// ---------------------------------------------------------------------------

async function loadConsolidatedWriterV3() {
  return import('./consolidated-writer.js')
}

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeInitInput(overrides: Partial<InitSessionV3Input> = {}): InitSessionV3Input {
  return {
    lineage: 'hiveminder',
    purposeClass: 'implementation',
    agent: 'hitea',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// RED PHASE TESTS
// Tests MUST fail because initSessionV3 does not exist yet.
// ---------------------------------------------------------------------------

// ============================================================================
// Test 1: initSessionV3 creates directory structure
// ============================================================================

test('initSessionV3 creates directory structure with session.json inside', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-init-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const semanticSessionId = await initSessionV3(tmpDir, makeInitInput())

    // Verify directory {semanticSessionId}/ is created under sessionsDir
    const sessionDir = join(tmpDir, semanticSessionId)
    const dirStats = await stat(sessionDir)
    assert.ok(dirStats.isDirectory(), `directory ${semanticSessionId}/ should exist`)

    // Verify session.json exists inside that directory
    const sessionJsonPath = join(sessionDir, 'session.json')
    const fileStats = await stat(sessionJsonPath)
    assert.ok(fileStats.isFile(), 'session.json should exist inside directory')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSessionV3 creates session.json with _schema session/v3', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-schema-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const semanticSessionId = await initSessionV3(tmpDir, makeInitInput())

    // Read session.json
    const sessionJsonPath = join(tmpDir, semanticSessionId, 'session.json')
    const content = JSON.parse(await readFile(sessionJsonPath, 'utf8')) as SessionV3

    // Verify _schema field
    assert.equal(content._schema, 'session/v3', 'should have _schema field set to session/v3')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// Test 2: initSessionV3 populates all SessionV3 fields
// ============================================================================

test('initSessionV3 populates all required SessionV3 fields', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-fields-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const semanticSessionId = await initSessionV3(tmpDir, {
      lineage: 'hivefiver',
      purposeClass: 'research',
      agent: 'hivexplorer',
    })

    // Read session.json
    const sessionJsonPath = join(tmpDir, semanticSessionId, 'session.json')
    const content = JSON.parse(await readFile(sessionJsonPath, 'utf8')) as SessionV3

    // Verify identity fields
    assert.ok(content.sessionId, 'sessionId should be present')
    assert.equal(content.semanticSessionId, semanticSessionId, 'semanticSessionId should match')
    assert.equal(content.lineage, 'hivefiver', 'lineage should match input')
    assert.equal(content.purposeClass, 'research', 'purposeClass should match input')
    assert.equal(content.agent, 'hivexplorer', 'agent should match input')

    // Verify startedAt is ISO timestamp
    assert.ok(content.startedAt, 'startedAt should be present')
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(content.startedAt), 'startedAt should be ISO timestamp')

    // Verify status is active
    assert.equal(content.status, 'active', 'initial status should be active')

    // Verify turnCount is 0
    assert.equal(content.turnCount, 0, 'turnCount should be 0')

    // Verify summary is empty
    assert.equal(content.summary, '', 'summary should start empty')

    // Verify keyFindings is empty array
    assert.deepEqual(content.keyFindings, [], 'keyFindings should start empty')

    // Verify subsessionIds is empty array
    assert.deepEqual(content.subsessionIds, [], 'subsessionIds should start empty')

    // Verify resumable is false
    assert.equal(content.resumable, false, 'resumable should be false')

    // Verify endedAt is null
    assert.equal(content.endedAt, null, 'endedAt should be null')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSessionV3 populates all 5 counter fields at 0', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-counters-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const semanticSessionId = await initSessionV3(tmpDir, makeInitInput())

    // Read session.json
    const sessionJsonPath = join(tmpDir, semanticSessionId, 'session.json')
    const content = JSON.parse(await readFile(sessionJsonPath, 'utf8')) as SessionV3

    // Verify counters object exists
    assert.ok(typeof content.counters === 'object', 'counters should be an object')

    // Verify all 5 counter fields are 0
    assert.equal(content.counters.userMessageCount, 0, 'userMessageCount should be 0')
    assert.equal(content.counters.assistantOutputCount, 0, 'assistantOutputCount should be 0')
    assert.equal(content.counters.toolCallCount, 0, 'toolCallCount should be 0')
    assert.equal(content.counters.delegationCount, 0, 'delegationCount should be 0')
    assert.equal(content.counters.compactionCount, 0, 'compactionCount should be 0')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSessionV3 populates toc as empty array', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-toc-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const semanticSessionId = await initSessionV3(tmpDir, makeInitInput())

    // Read session.json
    const sessionJsonPath = join(tmpDir, semanticSessionId, 'session.json')
    const content = JSON.parse(await readFile(sessionJsonPath, 'utf8')) as SessionV3

    // Verify toc is empty array
    assert.ok(Array.isArray(content.toc), 'toc should be an array')
    assert.equal(content.toc.length, 0, 'toc should start empty')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// Test 3: initSessionV3 handles parentSessionId
// ============================================================================

test('initSessionV3 stores parentSessionId when provided', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-parent-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    // First create a parent session
    const parentSemanticId = await initSessionV3(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'planning',
      agent: 'hiveminder',
    })

    // Create child session with parentSessionId
    const childSemanticId = await initSessionV3(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'implementation',
      agent: 'hitea',
      parentSessionId: parentSemanticId,
    })

    // Read child session.json (subsessions are under parentDir/subsessions/)
    const childSessionJsonPath = join(tmpDir, parentSemanticId, 'subsessions', childSemanticId, 'session.json')
    const childContent = JSON.parse(await readFile(childSessionJsonPath, 'utf8')) as SessionV3

    // Verify parentSessionId is stored
    assert.equal(childContent.parentSessionId, parentSemanticId, 'parentSessionId should match parent semantic ID')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSessionV3 stores null parentSessionId when not provided', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-no-parent-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const semanticSessionId = await initSessionV3(tmpDir, makeInitInput())

    // Read session.json
    const sessionJsonPath = join(tmpDir, semanticSessionId, 'session.json')
    const content = JSON.parse(await readFile(sessionJsonPath, 'utf8')) as SessionV3

    // Verify parentSessionId defaults to null
    assert.equal(content.parentSessionId, null, 'parentSessionId should default to null')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// Test 4: initSessionV3 creates subsession directory when parentSessionId is set
// ============================================================================

test('initSessionV3 creates subsession under parentDir/subsessions/ when parentSessionId is set', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-subdir-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    // Create parent session first
    const parentSemanticId = await initSessionV3(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'planning',
      agent: 'hiveminder',
    })

    // Create child session with parentSessionId
    const childSemanticId = await initSessionV3(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'tdd',
      agent: 'hitea',
      parentSessionId: parentSemanticId,
    })

    // Verify child is created under {parentDir}/subsessions/{childSemanticId}/
    const expectedPath = join(tmpDir, parentSemanticId, 'subsessions', childSemanticId, 'session.json')
    assert.ok(existsSync(expectedPath), `child session should be at ${expectedPath}`)

    // Verify we can read the child session.json
    const childContent = JSON.parse(await readFile(expectedPath, 'utf8')) as SessionV3
    assert.equal(childContent.semanticSessionId, childSemanticId, 'child semanticSessionId should match')
    assert.equal(childContent.parentSessionId, parentSemanticId, 'child should reference parent')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSessionV3 returns semanticSessionId for root sessions', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-return-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const semanticSessionId = await initSessionV3(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'gatekeeping',
      agent: 'hivemaker',
    })

    // Verify returned ID follows expected format: ses_<ISO-date>_<purpose>_<agent>
    assert.ok(
      /^ses_\d{4}-\d{2}-\d{2}T\d{6}_gatekeeping_hivemaker$/.test(semanticSessionId),
      `semanticSessionId should match format ses_<ISO-date>_<purpose>_<agent>, got: ${semanticSessionId}`
    )
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// Edge Cases
// ============================================================================

test('initSessionV3 handles all purposeClass values', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-purpose-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    const purposeClasses: InitSessionV3Input['purposeClass'][] = [
      'discovery',
      'brainstorming',
      'research',
      'planning',
      'implementation',
      'gatekeeping',
      'tdd',
      'course-correction',
    ]

    for (const purposeClass of purposeClasses) {
      const semanticSessionId = await initSessionV3(tmpDir, {
        lineage: 'hiveminder',
        purposeClass,
        agent: 'test-agent',
      })

      // Verify directory exists
      const sessionDir = join(tmpDir, semanticSessionId)
      assert.ok(existsSync(sessionDir), `directory for ${purposeClass} should exist`)

      // Verify session.json exists
      const sessionJsonPath = join(sessionDir, 'session.json')
      assert.ok(existsSync(sessionJsonPath), `session.json for ${purposeClass} should exist`)

      // Read and verify purposeClass
      const content = JSON.parse(await readFile(sessionJsonPath, 'utf8')) as SessionV3
      assert.equal(content.purposeClass, purposeClass, `purposeClass should be ${purposeClass}`)

      // Cleanup this session directory for the next iteration
      await rm(sessionDir, { recursive: true, force: true })
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSessionV3 handles both lineage values', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'writer-v3-lineage-'))

  try {
    const { initSessionV3 } = await loadConsolidatedWriterV3()

    for (const lineage of ['hivefiver', 'hiveminder'] as const) {
      const semanticSessionId = await initSessionV3(tmpDir, {
        lineage,
        purposeClass: 'implementation',
        agent: 'test-agent',
      })

      const sessionJsonPath = join(tmpDir, semanticSessionId, 'session.json')
      const content = JSON.parse(await readFile(sessionJsonPath, 'utf8')) as SessionV3

      assert.equal(content.lineage, lineage, `lineage should be ${lineage}`)
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})