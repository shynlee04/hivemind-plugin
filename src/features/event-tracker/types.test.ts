/**
 * Event Tracker Types Tests
 *
 * RED-phase tests for the session journal type definitions.
 * Validates union literal types, interface shapes, and field existence.
 * These tests MUST fail until src/features/event-tracker/types.ts exists
 * and exports the required sentinel constants.
 *
 * Design note: Pure `import type` is erased at runtime. To create a real
 * RED gate we also import sentinel values that the types module must export.
 * The source file must export:
 *   - EVENT_TYPES: readonly EventType[]
 *   - IMPORTANCE_VALUES: readonly Importance[]
 *   - LINEAGE_VALUES: readonly Lineage[]
 *   - PURPOSE_CLASS_VALUES: readonly PurposeClass[]
 *   - TURN_TYPE_VALUES: readonly TurnType[]
 *   - DELEGATION_MODE_VALUES: readonly DelegationMode[]
 *   - DELEGATION_STATUS_VALUES: readonly DelegationStatus[]
 *
 * @module event-tracker/types.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EVENT_TYPES,
  IMPORTANCE_VALUES,
  LINEAGE_VALUES,
  PURPOSE_CLASS_VALUES,
  TURN_TYPE_VALUES,
  DELEGATION_MODE_VALUES,
  DELEGATION_STATUS_VALUES,
} from './types.js'
import type {
  EventType,
  Importance,
  Lineage,
  PurposeClass,
  TurnType,
  DelegationMode,
  DelegationStatus,
  SessionMeta,
  TurnMeta,
  ToolInvocation,
  EventEntry,
  TurnEntry,
  DelegationRecord,
} from './types.js'

// ---------------------------------------------------------------------------
// Helper: verify an object has exactly the expected keys (no extras)
// ---------------------------------------------------------------------------

function assertShapeKeys(obj: object, expectedKeys: string[], label: string): void {
  const actualKeys = Object.keys(obj as Record<string, unknown>).sort()
  const sorted = [...expectedKeys].sort()
  assert.deepStrictEqual(actualKeys, sorted, `${label} keys mismatch`)
}

// ---------------------------------------------------------------------------
// Union literal types — sentinel value enumeration
// ---------------------------------------------------------------------------

test('EVENT_TYPES has exactly 10 members', () => {
  assert.equal(EVENT_TYPES.length, 10)
})

test('EVENT_TYPES contains all expected values', () => {
  const expected = [
    'user_message',
    'assistant_output',
    'tool_invocation',
    'delegation_created',
    'delegation_returned',
    'compaction',
    'session_start',
    'session_end',
    'injection',
    'error',
  ]
  for (const v of expected) {
    assert.ok(EVENT_TYPES.includes(v as EventType), `EVENT_TYPES missing "${v}"`)
  }
})

test('EVENT_TYPES has no duplicates', () => {
  const unique = new Set(EVENT_TYPES)
  assert.equal(unique.size, EVENT_TYPES.length, 'EVENT_TYPES contains duplicates')
})

test('IMPORTANCE_VALUES has exactly 3 members', () => {
  assert.equal(IMPORTANCE_VALUES.length, 3)
})

test('IMPORTANCE_VALUES contains all expected values', () => {
  const expected: Importance[] = ['high', 'medium', 'low']
  for (const v of expected) {
    assert.ok(IMPORTANCE_VALUES.includes(v), `IMPORTANCE_VALUES missing "${v}"`)
  }
})

test('LINEAGE_VALUES has exactly 2 members', () => {
  assert.equal(LINEAGE_VALUES.length, 2)
})

test('LINEAGE_VALUES contains all expected values', () => {
  const expected: Lineage[] = ['hivefiver', 'hiveminder']
  for (const v of expected) {
    assert.ok(LINEAGE_VALUES.includes(v), `LINEAGE_VALUES missing "${v}"`)
  }
})

test('PURPOSE_CLASS_VALUES has exactly 8 members', () => {
  assert.equal(PURPOSE_CLASS_VALUES.length, 8)
})

test('PURPOSE_CLASS_VALUES contains all expected values', () => {
  const expected: PurposeClass[] = [
    'discovery',
    'brainstorming',
    'research',
    'planning',
    'implementation',
    'gatekeeping',
    'tdd',
    'course-correction',
  ]
  for (const v of expected) {
    assert.ok(PURPOSE_CLASS_VALUES.includes(v), `PURPOSE_CLASS_VALUES missing "${v}"`)
  }
})

test('TURN_TYPE_VALUES has exactly 4 members', () => {
  assert.equal(TURN_TYPE_VALUES.length, 4)
})

test('TURN_TYPE_VALUES contains all expected values', () => {
  const expected: TurnType[] = ['root', 'delegation', 'handoff', 'correction']
  for (const v of expected) {
    assert.ok(TURN_TYPE_VALUES.includes(v), `TURN_TYPE_VALUES missing "${v}"`)
  }
})

test('DELEGATION_MODE_VALUES has exactly 3 members', () => {
  assert.equal(DELEGATION_MODE_VALUES.length, 3)
})

test('DELEGATION_MODE_VALUES contains all expected values', () => {
  const expected: DelegationMode[] = ['sequential', 'parallel', 'handoff']
  for (const v of expected) {
    assert.ok(DELEGATION_MODE_VALUES.includes(v), `DELEGATION_MODE_VALUES missing "${v}"`)
  }
})

test('DELEGATION_STATUS_VALUES has exactly 5 members', () => {
  assert.equal(DELEGATION_STATUS_VALUES.length, 5)
})

test('DELEGATION_STATUS_VALUES contains all expected values', () => {
  const expected: DelegationStatus[] = [
    'pending',
    'active',
    'completed',
    'failed',
    'timed-out',
  ]
  for (const v of expected) {
    assert.ok(DELEGATION_STATUS_VALUES.includes(v), `DELEGATION_STATUS_VALUES missing "${v}"`)
  }
})

// ---------------------------------------------------------------------------
// Interface: SessionMeta — shape and required fields
// ---------------------------------------------------------------------------

test('SessionMeta has correct shape', () => {
  const meta: SessionMeta = {
    sessionId: 'sess-001',
    lineage: 'hiveminder',
    purposeClass: 'implementation',
    agent: 'general',
    created: '2026-03-23T00:00:00.000Z',
    updated: '2026-03-23T01:00:00.000Z',
    parentSessionId: 'N/A',
    childSessionIds: [],
    status: 'active',
    userMessageCount: 5,
    agentOutputCount: 4,
    delegationCount: 1,
  }

  const expectedKeys = [
    'sessionId',
    'lineage',
    'purposeClass',
    'agent',
    'created',
    'updated',
    'parentSessionId',
    'childSessionIds',
    'status',
    'userMessageCount',
    'agentOutputCount',
    'delegationCount',
  ]

  assertShapeKeys(meta, expectedKeys, 'SessionMeta')
  assert.equal(typeof meta.sessionId, 'string')
  assert.equal(typeof meta.userMessageCount, 'number')
  assert.ok(Array.isArray(meta.childSessionIds))
})

test('SessionMeta parentSessionId accepts N/A fallback', () => {
  const meta: SessionMeta = {
    sessionId: 'sess-002',
    lineage: 'hivefiver',
    purposeClass: 'discovery',
    agent: 'explore',
    created: '2026-03-23T00:00:00.000Z',
    updated: '2026-03-23T00:00:00.000Z',
    parentSessionId: 'N/A',
    childSessionIds: [],
    status: 'completed',
    userMessageCount: 0,
    agentOutputCount: 0,
    delegationCount: 0,
  }

  assert.equal(meta.parentSessionId, 'N/A')
})

test('SessionMeta accepts zero counts and empty children', () => {
  const meta: SessionMeta = {
    sessionId: 'sess-empty',
    lineage: 'hivefiver',
    purposeClass: 'discovery',
    agent: 'explore',
    created: '2026-03-23T00:00:00.000Z',
    updated: '2026-03-23T00:00:00.000Z',
    parentSessionId: 'N/A',
    childSessionIds: [],
    status: 'completed',
    userMessageCount: 0,
    agentOutputCount: 0,
    delegationCount: 0,
  }

  assert.equal(meta.userMessageCount, 0)
  assert.equal(meta.agentOutputCount, 0)
  assert.equal(meta.delegationCount, 0)
  assert.deepEqual(meta.childSessionIds, [])
})

// ---------------------------------------------------------------------------
// Interface: TurnMeta — shape and required fields
// ---------------------------------------------------------------------------

test('TurnMeta has correct shape', () => {
  const turn: TurnMeta = {
    turnNumber: 1,
    turnType: 'root',
    turnDepth: 0,
    siblingCount: 0,
    timestamp: '2026-03-23T00:00:00.000Z',
    agent: 'general',
    model: 'opencode/mimo-v2-pro-free',
    duration: 1200,
  }

  const expectedKeys = [
    'turnNumber',
    'turnType',
    'turnDepth',
    'siblingCount',
    'timestamp',
    'agent',
    'model',
    'duration',
  ]

  assertShapeKeys(turn, expectedKeys, 'TurnMeta')
  assert.equal(typeof turn.turnNumber, 'number')
  assert.equal(typeof turn.duration, 'number')
})

test('TurnMeta accepts zero duration and depth', () => {
  const turn: TurnMeta = {
    turnNumber: 0,
    turnType: 'root',
    turnDepth: 0,
    siblingCount: 0,
    timestamp: '2026-03-23T00:00:00.000Z',
    agent: 'general',
    model: 'opencode/mimo-v2-pro-free',
    duration: 0,
  }

  assert.equal(turn.duration, 0)
  assert.equal(turn.turnDepth, 0)
})

// ---------------------------------------------------------------------------
// Interface: ToolInvocation — shape and required fields
// ---------------------------------------------------------------------------

test('ToolInvocation has correct shape', () => {
  const invocation: ToolInvocation = {
    toolName: 'hivemind_runtime_status',
    input: '{"action": "status"}',
    outputSummary: 'Runtime OK',
    timestamp: '2026-03-23T00:00:00.000Z',
  }

  const expectedKeys = [
    'toolName',
    'input',
    'outputSummary',
    'timestamp',
  ]

  assertShapeKeys(invocation, expectedKeys, 'ToolInvocation')
  assert.equal(typeof invocation.toolName, 'string')
  assert.equal(typeof invocation.input, 'string')
  assert.equal(typeof invocation.outputSummary, 'string')
  assert.equal(typeof invocation.timestamp, 'string')
})

test('ToolInvocation accepts empty outputSummary', () => {
  const invocation: ToolInvocation = {
    toolName: 'hivemind_doc',
    input: '{"action": "read", "path": "ROADMAP.md"}',
    outputSummary: '',
    timestamp: '2026-03-23T00:00:00.000Z',
  }

  assert.equal(invocation.outputSummary, '')
})

// ---------------------------------------------------------------------------
// Interface: EventEntry — shape and required fields
// ---------------------------------------------------------------------------

test('EventEntry has correct shape', () => {
  const entry: EventEntry = {
    id: 'evt-001',
    sessionId: 'sess-001',
    turnNumber: 3,
    type: 'user_message',
    importance: 'high',
    timestamp: '2026-03-23T00:00:00.000Z',
    data: { text: 'hello' },
  }

  const expectedKeys = [
    'id',
    'sessionId',
    'turnNumber',
    'type',
    'importance',
    'timestamp',
    'data',
  ]

  assertShapeKeys(entry, expectedKeys, 'EventEntry')
  assert.equal(typeof entry.id, 'string')
  assert.equal(typeof entry.turnNumber, 'number')
  assert.equal(typeof entry.data, 'object')
})

test('EventEntry type field accepts every EventType value', () => {
  for (const eventType of EVENT_TYPES) {
    const entry: EventEntry = {
      id: `evt-${eventType}`,
      sessionId: 'sess-001',
      turnNumber: 0,
      type: eventType,
      importance: 'medium',
      timestamp: '2026-03-23T00:00:00.000Z',
      data: {},
    }
    assert.equal(entry.type, eventType)
  }
})

test('EventEntry importance field accepts every Importance value', () => {
  for (const importance of IMPORTANCE_VALUES) {
    const entry: EventEntry = {
      id: `evt-${importance}`,
      sessionId: 'sess-001',
      turnNumber: 0,
      type: 'error',
      importance,
      timestamp: '2026-03-23T00:00:00.000Z',
      data: {},
    }
    assert.equal(entry.importance, importance)
  }
})

test('EventEntry data field accepts arbitrary object payload', () => {
  const entry: EventEntry = {
    id: 'evt-arbitrary',
    sessionId: 'sess-001',
    turnNumber: 0,
    type: 'injection',
    importance: 'low',
    timestamp: '2026-03-23T00:00:00.000Z',
    data: {
      source: 'system',
      payload: { key: 'value', nested: { deep: true } },
      tags: ['auto', 'context'],
    },
  }

  const payload = entry.data as Record<string, unknown>
  // nested is at payload.payload.nested — access BEFORE source narrowing
  const nested = (payload.payload as Record<string, unknown>).nested as Record<string, unknown>
  assert.equal(nested.deep, true)
  assert.equal(payload.source, 'system')
  assert.ok(Array.isArray(payload.tags))
})

// ---------------------------------------------------------------------------
// Interface: TurnEntry — shape and required fields
// ---------------------------------------------------------------------------

test('TurnEntry has correct shape', () => {
  const turn: TurnEntry = {
    meta: {
      turnNumber: 1,
      turnType: 'root',
      turnDepth: 0,
      siblingCount: 0,
      timestamp: '2026-03-23T00:00:00.000Z',
      agent: 'general',
      model: 'opencode/mimo-v2-pro-free',
      duration: 500,
    },
    userMessage: 'What is the status?',
    assistantContent: 'Everything is operational.',
    thinking: 'Checking runtime status...',
    toolInvocations: [
      {
        toolName: 'hivemind_runtime_status',
        input: '{"action": "status"}',
        outputSummary: 'OK',
        timestamp: '2026-03-23T00:00:01.000Z',
      },
    ],
    events: [
      {
        id: 'evt-001',
        sessionId: 'sess-001',
        turnNumber: 1,
        type: 'tool_invocation',
        importance: 'low',
        timestamp: '2026-03-23T00:00:01.000Z',
        data: { toolName: 'hivemind_runtime_status' },
      },
    ],
  }

  const expectedKeys = [
    'meta',
    'userMessage',
    'assistantContent',
    'thinking',
    'toolInvocations',
    'events',
  ]

  assertShapeKeys(turn, expectedKeys, 'TurnEntry')
  assert.ok(Array.isArray(turn.toolInvocations))
  assert.ok(Array.isArray(turn.events))
  assert.equal(typeof turn.userMessage, 'string')
  assert.equal(typeof turn.assistantContent, 'string')
  assert.equal(typeof turn.thinking, 'string')
})

test('TurnEntry accepts empty arrays and empty strings', () => {
  const turn: TurnEntry = {
    meta: {
      turnNumber: 0,
      turnType: 'root',
      turnDepth: 0,
      siblingCount: 0,
      timestamp: '2026-03-23T00:00:00.000Z',
      agent: 'general',
      model: 'opencode/mimo-v2-pro-free',
      duration: 0,
    },
    userMessage: '',
    assistantContent: '',
    thinking: '',
    toolInvocations: [],
    events: [],
  }

  assert.equal(turn.thinking, '')
  assert.equal(turn.userMessage, '')
  assert.equal(turn.assistantContent, '')
  assert.equal(turn.toolInvocations.length, 0)
  assert.equal(turn.events.length, 0)
})

// ---------------------------------------------------------------------------
// Interface: DelegationRecord — shape and required fields
// ---------------------------------------------------------------------------

test('DelegationRecord has correct shape', () => {
  const record: DelegationRecord = {
    packetId: 'pkt-001',
    taskId: 'task-001',
    parentSessionId: 'sess-parent',
    subSessionId: 'sess-child',
    delegatedTo: 'hivexplorer',
    description: 'Investigate codebase for test patterns',
    subagentType: 'hivexplorer',
    delegationMode: 'sequential',
    status: 'active',
    createdAt: '2026-03-23T00:00:00.000Z',
    returnedAt: 'N/A',
    duration: 0,
    artifacts: [],
  }

  const expectedKeys = [
    'packetId',
    'taskId',
    'parentSessionId',
    'subSessionId',
    'delegatedTo',
    'description',
    'subagentType',
    'delegationMode',
    'status',
    'createdAt',
    'returnedAt',
    'duration',
    'artifacts',
  ]

  assertShapeKeys(record, expectedKeys, 'DelegationRecord')
  assert.equal(typeof record.packetId, 'string')
  assert.equal(typeof record.duration, 'number')
  assert.ok(Array.isArray(record.artifacts))
})

test('DelegationRecord status field accepts every DelegationStatus value', () => {
  for (const status of DELEGATION_STATUS_VALUES) {
    const record: DelegationRecord = {
      packetId: `pkt-${status}`,
      taskId: 'task-001',
      parentSessionId: 'sess-parent',
      subSessionId: 'sess-child',
      delegatedTo: 'hivexplorer',
      description: 'test',
      subagentType: 'hivexplorer',
      delegationMode: 'sequential',
      status,
      createdAt: '2026-03-23T00:00:00.000Z',
      returnedAt: 'N/A',
      duration: 0,
      artifacts: [],
    }
    assert.equal(record.status, status)
  }
})

test('DelegationRecord delegationMode field accepts every DelegationMode value', () => {
  for (const delegationMode of DELEGATION_MODE_VALUES) {
    const record: DelegationRecord = {
      packetId: `pkt-${delegationMode}`,
      taskId: 'task-001',
      parentSessionId: 'sess-parent',
      subSessionId: 'sess-child',
      delegatedTo: 'hivexplorer',
      description: 'test',
      subagentType: 'hivexplorer',
      delegationMode,
      status: 'pending',
      createdAt: '2026-03-23T00:00:00.000Z',
      returnedAt: 'N/A',
      duration: 0,
      artifacts: [],
    }
    assert.equal(record.delegationMode, delegationMode)
  }
})

test('DelegationRecord accepts N/A returnedAt for pending delegation', () => {
  const record: DelegationRecord = {
    packetId: 'pkt-pending',
    taskId: 'task-001',
    parentSessionId: 'sess-parent',
    subSessionId: '',
    delegatedTo: 'hiveq',
    description: 'Verify test coverage',
    subagentType: 'hiveq',
    delegationMode: 'parallel',
    status: 'pending',
    createdAt: '2026-03-23T00:00:00.000Z',
    returnedAt: 'N/A',
    duration: 0,
    artifacts: [],
  }

  assert.equal(record.returnedAt, 'N/A')
  assert.equal(record.subSessionId, '')
  assert.equal(record.duration, 0)
  assert.deepEqual(record.artifacts, [])
})

test('DelegationRecord accepts non-empty artifacts array', () => {
  const record: DelegationRecord = {
    packetId: 'pkt-with-artifacts',
    taskId: 'task-001',
    parentSessionId: 'sess-parent',
    subSessionId: 'sess-child',
    delegatedTo: 'hivexplorer',
    description: 'Full investigation',
    subagentType: 'hivexplorer',
    delegationMode: 'handoff',
    status: 'completed',
    createdAt: '2026-03-23T00:00:00.000Z',
    returnedAt: '2026-03-23T00:05:00.000Z',
    duration: 300000,
    artifacts: ['findings.md', 'evidence.json'],
  }

  assert.equal(record.artifacts.length, 2)
  assert.equal(record.artifacts[0], 'findings.md')
  assert.equal(record.duration, 300000)
  assert.notEqual(record.returnedAt, 'N/A')
})
