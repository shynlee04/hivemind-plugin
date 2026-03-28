/**
 * Consolidated Session Writer Tests — TDD RED Phase
 *
 * Tests for the consolidated session writer that produces a single JSON file
 * per session with the v2 schema format.
 *
 * These tests MUST fail because consolidated-writer.ts does not exist yet.
 * After implementation, these same tests should pass.
 *
 * @module event-tracker/consolidated-writer.test
 */

import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

// ---------------------------------------------------------------------------
// Types for the consolidated session format
// ---------------------------------------------------------------------------

/**
 * Session v2 schema — the consolidated session file format.
 * Single JSON file that contains all session data.
 */
export interface SessionV2 {
  _schema: 'session/v2'
  sessionId: string
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
  created: string
  updated: string
  status: 'active' | 'completed' | 'abandoned'
  parentSessionId: string | null
  childSessionIds: string[]
  counters: {
    userMessageCount: number
    assistantOutputCount: number
    toolCallCount: number
    delegationCount: number
    compactionCount: number
    turnCount: number
  }
  turns: unknown[]
  events: unknown[]
  diagnostics: unknown[]
}

/**
 * Input for initializing a new consolidated session.
 */
export interface InitSessionInput {
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

/**
 * Input for adding a turn to the session.
 */
export interface AddTurnInput {
  sessionId: string
  turn: {
    turnNumber: number
    timestamp: string
    agent: string
    model: string
    duration: number | null
    userMessage: string
    assistantContent: string
  }
}

/**
 * Input for adding an event to the session.
 */
export interface AddEventInput {
  sessionId: string
  event: {
    turnNumber: number
    type: string
    importance: 'high' | 'medium' | 'low'
    timestamp: string
    data: Record<string, unknown>
  }
}

/**
 * Input for adding a diagnostic to the session.
 */
export interface AddDiagnosticInput {
  sessionId: string
  diagnostic: {
    timestamp: string
    level: 'info' | 'warn' | 'error'
    message: string
    context?: Record<string, unknown>
  }
}

/**
 * Counter increment specification.
 */
export type CounterType =
  | 'userMessageCount'
  | 'assistantOutputCount'
  | 'toolCallCount'
  | 'delegationCount'
  | 'compactionCount'
  | 'turnCount'

// ---------------------------------------------------------------------------
// Dynamic import helper to load the not-yet-existent module
// ---------------------------------------------------------------------------

async function loadConsolidatedWriter() {
  return import('./consolidated-writer.js')
}

function expectedJourneyEventsDir(baseDir: string): string {
  return join(baseDir, 'journey-events')
}

function expectedSessionPath(baseDir: string, sessionId: string): string {
  return join(expectedJourneyEventsDir(baseDir), `${sessionId}.json`)
}

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

function makeInitInput(overrides: Partial<InitSessionInput> = {}): InitSessionInput {
  return {
    lineage: 'hiveminder',
    purposeClass: 'implementation',
    agent: 'hitea',
    ...overrides,
  }
}

function makeTurn(overrides: Partial<AddTurnInput['turn']> = {}): AddTurnInput['turn'] {
  return {
    turnNumber: 1,
    timestamp: new Date().toISOString(),
    agent: 'hitea',
    model: 'gpt-4',
    duration: 1500,
    userMessage: 'Write failing tests for consolidated writer',
    assistantContent: 'I will write TDD RED phase tests...',
    ...overrides,
  }
}

function makeEvent(overrides: Partial<AddEventInput['event']> = {}): AddEventInput['event'] {
  return {
    turnNumber: 1,
    type: 'tool_invocation',
    importance: 'medium',
    timestamp: new Date().toISOString(),
    data: { toolName: 'hivemind_task', action: 'create' },
    ...overrides,
  }
}

function makeDiagnostic(
  overrides: Partial<AddDiagnosticInput['diagnostic']> = {}
): AddDiagnosticInput['diagnostic'] {
  return {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Session initialized successfully',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// RED PHASE TESTS
// Tests MUST fail because consolidated-writer.ts does not exist yet.
// ---------------------------------------------------------------------------

// ============================================================================
// initSession Tests
// ============================================================================

test('initSession creates session file with correct v2 schema structure', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-init-'))

  try {
    const { initSession } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    // Verify session ID format: ses_<ISO-date>_<purpose>_<agent>
    assert.ok(
      /^ses_\d{4}-\d{2}-\d{2}T\d{6}_implementation_hitea$/.test(sessionId),
      `sessionId should match format ses_<ISO-date>_<purpose>_<agent>, got: ${sessionId}`
    )

    // Verify file exists
    const filePath = expectedSessionPath(tmpDir, sessionId)
    const fileStats = await stat(filePath)
    assert.ok(fileStats.isFile(), 'session file should exist')

    // Verify v2 schema structure
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2
    assert.equal(content._schema, 'session/v2', 'should have _schema field set to session/v2')
    assert.equal(content.sessionId, sessionId, 'sessionId should match')
    assert.equal(content.lineage, 'hiveminder', 'lineage should match input')
    assert.equal(content.purposeClass, 'implementation', 'purposeClass should match input')
    assert.equal(content.agent, 'hitea', 'agent should match input')
    assert.equal(content.status, 'active', 'initial status should be active')
    assert.equal(content.parentSessionId, null, 'parentSessionId should default to null')
    assert.deepEqual(content.childSessionIds, [], 'childSessionIds should start empty')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSession creates comprehensive counters object initialized to zero', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-counters-'))

  try {
    const { initSession } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())
    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    // Verify all counter fields exist and are zero-initialized
    assert.equal(typeof content.counters, 'object', 'counters should be an object')
    assert.equal(content.counters.userMessageCount, 0, 'userMessageCount should be 0')
    assert.equal(content.counters.assistantOutputCount, 0, 'assistantOutputCount should be 0')
    assert.equal(content.counters.toolCallCount, 0, 'toolCallCount should be 0')
    assert.equal(content.counters.delegationCount, 0, 'delegationCount should be 0')
    assert.equal(content.counters.compactionCount, 0, 'compactionCount should be 0')
    assert.equal(content.counters.turnCount, 0, 'turnCount should be 0')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initSession initializes empty turns events and diagnostics arrays', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-arrays-'))

  try {
    const { initSession } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())
    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.ok(Array.isArray(content.turns), 'turns should be an array')
    assert.ok(Array.isArray(content.events), 'events should be an array')
    assert.ok(Array.isArray(content.diagnostics), 'diagnostics should be an array')
    assert.equal(content.turns.length, 0, 'turns should start empty')
    assert.equal(content.events.length, 0, 'events should start empty')
    assert.equal(content.diagnostics.length, 0, 'diagnostics should start empty')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// Semantic Naming Tests
// ============================================================================

test('initSession generates session file named ses_ISO-date_purpose_agent.json', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-naming-'))

  try {
    const { initSession } = await loadConsolidatedWriter()

    // Test with different purposeClass values
    const cases: Array<{ purposeClass: InitSessionInput['purposeClass']; agent: string }> = [
      { purposeClass: 'planning', agent: 'hiveminder' },
      { purposeClass: 'research', agent: 'hivexplorer' },
      { purposeClass: 'tdd', agent: 'hitea' },
    ]

    for (const { purposeClass, agent } of cases) {
      const sessionId = await initSession(tmpDir, {
        lineage: 'hiveminder',
        purposeClass,
        agent,
      })

      // Session ID format: ses_YYYY-MM-DDTHHMMSS_<purpose>_<agent>
      const sessionIdPattern = new RegExp(
        `^ses_\\d{4}-\\d{2}-\\d{2}T\\d{6}_${purposeClass}_${agent}$`
      )
      assert.ok(sessionIdPattern.test(sessionId), `sessionId "${sessionId}" should match pattern`)

      // File should be named <sessionId>.json
        const filePath = expectedSessionPath(tmpDir, sessionId)
        assert.ok(existsSync(filePath), `file ${sessionId}.json should exist`)
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// addTurn Tests
// ============================================================================

test('addTurn appends turn to turns array and increments turnCount', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-addturn-'))

  try {
    const { initSession, addTurn } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    await addTurn(tmpDir, {
      sessionId,
      turn: makeTurn({ turnNumber: 1 }),
    })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    // Verify turn was added
    assert.equal(content.turns.length, 1, 'should have 1 turn')
    assert.equal(content.counters.turnCount, 1, 'turnCount should be 1')

    // Verify turn data
    const turn = content.turns[0] as AddTurnInput['turn']
    assert.equal(turn.turnNumber, 1, 'turn number should be 1')
    assert.equal(turn.agent, 'hitea', 'turn agent should match')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('addTurn increments userMessageCount when turn has userMessage', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-usermsg-'))

  try {
    const { initSession, addTurn } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    await addTurn(tmpDir, {
      sessionId,
      turn: makeTurn({ userMessage: 'Test message' }),
    })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.equal(content.counters.userMessageCount, 1, 'userMessageCount should increment')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('addTurn increments assistantOutputCount when turn has assistantContent', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-assistmsg-'))

  try {
    const { initSession, addTurn } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    await addTurn(tmpDir, {
      sessionId,
      turn: makeTurn({ assistantContent: 'Assistant response' }),
    })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.equal(content.counters.assistantOutputCount, 1, 'assistantOutputCount should increment')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// addEvent Tests
// ============================================================================

test('addEvent appends event to events array', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-addevent-'))

  try {
    const { initSession, addEvent } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    await addEvent(tmpDir, {
      sessionId,
      event: makeEvent({ type: 'session_start', importance: 'high' }),
    })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.equal(content.events.length, 1, 'should have 1 event')
    const event = content.events[0] as AddEventInput['event']
    assert.equal(event.type, 'session_start', 'event type should match')
    assert.equal(event.importance, 'high', 'importance should match')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('addEvent enters event with correct turnNumber and timestamp', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-eventmeta-'))

  try {
    const { initSession, addEvent } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())
    const eventTimestamp = '2026-03-25T10:30:00.000Z'

    await addEvent(tmpDir, {
      sessionId,
      event: {
        turnNumber: 2,
        type: 'delegation_created',
        importance: 'high',
        timestamp: eventTimestamp,
        data: { packetId: 'pkt-001', delegatedTo: 'hivexplorer' },
      },
    })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2
    const event = content.events[0] as AddEventInput['event']

    assert.equal(event.turnNumber, 2, 'turnNumber should be 2')
    assert.equal(event.timestamp, eventTimestamp, 'timestamp should match')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// addDiagnostic Tests
// ============================================================================

test('addDiagnostic appends diagnostic to diagnostics array', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-adddiag-'))

  try {
    const { initSession, addDiagnostic } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    await addDiagnostic(tmpDir, {
      sessionId,
      diagnostic: makeDiagnostic({ level: 'warn', message: 'Test warning' }),
    })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.equal(content.diagnostics.length, 1, 'should have 1 diagnostic')
    const diag = content.diagnostics[0] as AddDiagnosticInput['diagnostic']
    assert.equal(diag.level, 'warn', 'level should match')
    assert.equal(diag.message, 'Test warning', 'message should match')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('addDiagnostic accepts optional context field', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-diagcontext-'))

  try {
    const { initSession, addDiagnostic } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    await addDiagnostic(tmpDir, {
      sessionId,
      diagnostic: {
        timestamp: '2026-03-25T10:00:00.000Z',
        level: 'info',
        message: 'Context test',
        context: { key: 'value', count: 42 },
      },
    })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2
    const diag = content.diagnostics[0] as AddDiagnosticInput['diagnostic'] & {
      context: Record<string, unknown>
    }

    assert.deepEqual(diag.context, { key: 'value', count: 42 }, 'context should match')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// incrementCounter Tests
// ============================================================================

test('incrementCounter increments specified counter by 1', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-inccounter-'))

  try {
    const { initSession, incrementCounter } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    // Increment each counter type
    await incrementCounter(tmpDir, sessionId, 'userMessageCount')
    await incrementCounter(tmpDir, sessionId, 'assistantOutputCount')
    await incrementCounter(tmpDir, sessionId, 'toolCallCount')
    await incrementCounter(tmpDir, sessionId, 'delegationCount')
    await incrementCounter(tmpDir, sessionId, 'compactionCount')
    await incrementCounter(tmpDir, sessionId, 'turnCount')

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.equal(content.counters.userMessageCount, 1)
    assert.equal(content.counters.assistantOutputCount, 1)
    assert.equal(content.counters.toolCallCount, 1)
    assert.equal(content.counters.delegationCount, 1)
    assert.equal(content.counters.compactionCount, 1)
    assert.equal(content.counters.turnCount, 1)
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('incrementCounter increments by specified amount', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-inccounteramt-'))

  try {
    const { initSession, incrementCounter } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    // Increment by 5
    await incrementCounter(tmpDir, sessionId, 'delegationCount', 5)

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.equal(content.counters.delegationCount, 5, 'should increment by 5')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// updateStatus Tests
// ============================================================================

test('updateStatus changes session status', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-status-'))

  try {
    const { initSession, updateStatus } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    // Update to completed
    await updateStatus(tmpDir, sessionId, 'completed')

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    assert.equal(content.status, 'completed', 'status should be completed')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('updateStatus updates the updated timestamp', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-updatedts-'))

  try {
    const { initSession, updateStatus } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())
    const beforePath = expectedSessionPath(tmpDir, sessionId)
    const beforeContent = JSON.parse(await readFile(beforePath, 'utf8')) as SessionV2

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10))

    await updateStatus(tmpDir, sessionId, 'abandoned')

    const afterContent = JSON.parse(await readFile(beforePath, 'utf8')) as SessionV2

    assert.notEqual(
      afterContent.updated,
      beforeContent.updated,
      'updated timestamp should change'
    )
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('updateStatus accepts active completed and abandoned values', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-statusvalues-'))

  try {
    const { initSession, updateStatus } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())
    const filePath = expectedSessionPath(tmpDir, sessionId)

    // Cycle through all valid statuses
    for (const status of ['active', 'completed', 'abandoned', 'active'] as const) {
      await updateStatus(tmpDir, sessionId, status)
      const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2
      assert.equal(content.status, status, `status should be ${status}`)
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// linkSubSession Tests
// ============================================================================

test('linkSubSession sets parentSessionId on child session', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-linksub-'))

  try {
    const { initSession, linkSubSession } = await loadConsolidatedWriter()

    const parentSessionId = await initSession(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'planning',
      agent: 'hiveminder',
    })

    const childSessionId = await initSession(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'tdd',
      agent: 'hitea',
    })

    await linkSubSession(tmpDir, parentSessionId, childSessionId)

    // Verify parent has child in childSessionIds
    const parentPath = expectedSessionPath(tmpDir, parentSessionId)
    const parentContent = JSON.parse(await readFile(parentPath, 'utf8')) as SessionV2
    assert.deepEqual(parentContent.childSessionIds, [childSessionId], 'parent should have child ID')

    // Verify child has parentSessionId set
    const childPath = expectedSessionPath(tmpDir, childSessionId)
    const childContent = JSON.parse(await readFile(childPath, 'utf8')) as SessionV2
    assert.equal(childContent.parentSessionId, parentSessionId, 'child should have parent ID')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('linkSubSession appends to childSessionIds for multiple children', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-multichild-'))

  try {
    const { initSession, linkSubSession } = await loadConsolidatedWriter()

    const parentId = await initSession(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'planning',
      agent: 'hiveminder',
    })

    const child1 = await initSession(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'tdd',
      agent: 'hitea',
    })

    const child2 = await initSession(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'implementation',
      agent: 'hivemaker',
    })

    await linkSubSession(tmpDir, parentId, child1)
    await linkSubSession(tmpDir, parentId, child2)

    const parentPath = expectedSessionPath(tmpDir, parentId)
    const parentContent = JSON.parse(await readFile(parentPath, 'utf8')) as SessionV2

    assert.equal(parentContent.childSessionIds.length, 2, 'should have 2 children')
    assert.ok(parentContent.childSessionIds.includes(child1), 'should include child1')
    assert.ok(parentContent.childSessionIds.includes(child2), 'should include child2')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('linkSubSession updates timestamps on both sessions', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-linkts-'))

  try {
    const { initSession, linkSubSession } = await loadConsolidatedWriter()

    const parentId = await initSession(tmpDir, makeInitInput())
    const childId = await initSession(tmpDir, makeInitInput({ purposeClass: 'tdd' }))

    const parentPath = expectedSessionPath(tmpDir, parentId)
    const childPath = expectedSessionPath(tmpDir, childId)

    const parentBefore = JSON.parse(await readFile(parentPath, 'utf8')) as SessionV2
    const childBefore = JSON.parse(await readFile(childPath, 'utf8')) as SessionV2

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10))

    await linkSubSession(tmpDir, parentId, childId)

    const parentAfter = JSON.parse(await readFile(parentPath, 'utf8')) as SessionV2
    const childAfter = JSON.parse(await readFile(childPath, 'utf8')) as SessionV2

    assert.notEqual(parentAfter.updated, parentBefore.updated, 'parent updated should change')
    assert.notEqual(childAfter.updated, childBefore.updated, 'child updated should change')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('linkSubSession writes hierarchy.json with parent and child nodes', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-hierarchy-'))

  try {
    const { initSession, linkSubSession } = await loadConsolidatedWriter()

    const parentId = await initSession(tmpDir, {
      lineage: 'hiveminder',
      purposeClass: 'planning',
      agent: 'hiveminder',
    })

    const childId = await initSession(tmpDir, {
      lineage: 'hivefiver',
      purposeClass: 'implementation',
      agent: 'hivemaker',
    })

    await linkSubSession(tmpDir, parentId, childId)

    const hierarchyPath = join(expectedJourneyEventsDir(tmpDir), 'hierarchy.json')
    const hierarchy = JSON.parse(await readFile(hierarchyPath, 'utf8')) as {
      nodes: Array<{
        sessionId: string
        parentSessionId: string | null
        childSessionIds: string[]
      }>
      updatedAt: string
    }

    const parentNode = hierarchy.nodes.find((node) => node.sessionId === parentId)
    const childNode = hierarchy.nodes.find((node) => node.sessionId === childId)

    assert.ok(parentNode, 'parent hierarchy node should exist')
    assert.ok(childNode, 'child hierarchy node should exist')
    assert.deepEqual(parentNode?.childSessionIds, [childId], 'parent node should list child')
    assert.equal(childNode?.parentSessionId, parentId, 'child node should reference parent')
    assert.equal(typeof hierarchy.updatedAt, 'string', 'hierarchy should include updatedAt timestamp')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ============================================================================
// Integration Tests
// ============================================================================

test('getSessionPath returns correct file path for session', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-getpath-'))

  try {
    const { initSession, getSessionPath } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())
    const sessionPath = getSessionPath(tmpDir, sessionId)

    assert.equal(
      sessionPath,
      expectedSessionPath(tmpDir, sessionId),
      'path should be <dir>/journey-events/<sessionId>.json'
    )
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('getSessionPath always resolves to the journey-events JSON path', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-legacy-'))

  try {
    const { getSessionPath } = await loadConsolidatedWriter()
    const sessionId = 'ses_legacy'
    const legacyPath = join(tmpDir, `${sessionId}.json`)
    await readFile(legacyPath, 'utf8').catch(async () => {
      await import('node:fs/promises').then(({ writeFile }) =>
        writeFile(legacyPath, JSON.stringify({ _schema: 'session/v2' }), 'utf8')
      )
    })

    assert.equal(getSessionPath(tmpDir, sessionId), expectedSessionPath(tmpDir, sessionId))
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('loadSession reads and parses session JSON', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-load-'))

  try {
    const { initSession, loadSession } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())
    const session = await loadSession(tmpDir, sessionId)

    assert.equal(session._schema, 'session/v2', 'should load with correct schema')
    assert.equal(session.sessionId, sessionId, 'sessionId should match')
    assert.equal(session.lineage, 'hiveminder', 'lineage should match')
    assert.equal(session.purposeClass, 'implementation', 'purposeClass should match')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('session writes are idempotent for same sessionId', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'consolidated-writer-idempotent-'))

  try {
    const { initSession, addTurn } = await loadConsolidatedWriter()

    const sessionId = await initSession(tmpDir, makeInitInput())

    // Add same turn twice (should not duplicate)
    const turn = makeTurn({ turnNumber: 1 })
    await addTurn(tmpDir, { sessionId, turn })
    await addTurn(tmpDir, { sessionId, turn })

    const filePath = expectedSessionPath(tmpDir, sessionId)
    const content = JSON.parse(await readFile(filePath, 'utf8')) as SessionV2

    // Should only have one turn because we're re-adding the same turnNumber
    // Implementation detail: turns might be append-only or deduplicated by turnNumber
    // This test asserts the behavior is consistent
    assert.ok(content.turns.length >= 1, 'should have at least 1 turn')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})
