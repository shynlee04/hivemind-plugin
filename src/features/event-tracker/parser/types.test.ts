/**
 * Parser Types Tests
 *
 * RED-phase tests for parser-specific type definitions.
 * Validates type shapes for ParsedTurn, ParsedSession, ParsedHeader,
 * ParsedDelegation, and TurnCounters.
 *
 * These tests import sentinel values and type constructors that must
 * exist in `./types.js`. They will FAIL until the module is implemented.
 *
 * @module event-tracker/parser/types.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'

// Runtime import — forces ERR_MODULE_NOT_FOUND if types.js doesn't exist.
// The module must export createEmptyHeader() as a runtime sentinel.
import { createEmptyHeader } from './types.js'

import type {
  ParsedHeader,
  ParsedTurn,
  ParsedDelegation,
  TurnCounters,
  ParsedSession,
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
// Interface: ParsedHeader — shape and required fields
// ---------------------------------------------------------------------------

test('ParsedHeader has correct shape with all fields', () => {
  const header: ParsedHeader = {
    title: 'Agent automation tools research',
    timestamp: '3/23/2026, 9:09:27 AM',
    sessionId: 'ses_2e78bb73effeKLvUjyj8t1Bx3V',
    created: '3/23/2026, 9:09:27 AM',
    updated: '3/23/2026, 9:10:34 AM',
  }

  const expectedKeys = [
    'created',
    'sessionId',
    'timestamp',
    'title',
    'updated',
  ]

  assertShapeKeys(header, expectedKeys, 'ParsedHeader')
  assert.equal(typeof header.title, 'string')
  assert.equal(typeof header.sessionId, 'string')
  assert.equal(typeof header.created, 'string')
  assert.equal(typeof header.updated, 'string')
})

test('ParsedHeader accepts N/A defaults for missing fields', () => {
  const header: ParsedHeader = {
    title: 'N/A',
    timestamp: 'N/A',
    sessionId: 'N/A',
    created: 'N/A',
    updated: 'N/A',
  }

  assert.equal(header.sessionId, 'N/A')
  assert.equal(header.created, 'N/A')
  assert.equal(header.updated, 'N/A')
})

// ---------------------------------------------------------------------------
// Interface: ParsedTurn — shape and required fields
// ---------------------------------------------------------------------------

test('ParsedTurn has correct shape with all fields', () => {
  const turn: ParsedTurn = {
    turnNumber: 1,
    userMessage: 'deep research and synthesis',
    assistantContent: 'Let me start by understanding the context',
    thinking: 'The user wants me to do deep research',
    agentName: 'Hiveminder',
    model: 'mimo-v2-pro-free',
    duration: 22500,
    isCompaction: false,
    delegationTargets: [],
  }

  const expectedKeys = [
    'agentName',
    'assistantContent',
    'delegationTargets',
    'duration',
    'isCompaction',
    'model',
    'thinking',
    'turnNumber',
    'userMessage',
  ]

  assertShapeKeys(turn, expectedKeys, 'ParsedTurn')
  assert.equal(typeof turn.turnNumber, 'number')
  assert.equal(typeof turn.isCompaction, 'boolean')
  assert.ok(Array.isArray(turn.delegationTargets))
})

test('ParsedTurn accepts null thinking and null duration', () => {
  const turn: ParsedTurn = {
    turnNumber: 2,
    userMessage: 'some prompt',
    assistantContent: 'some response',
    thinking: null,
    agentName: 'Hiveminder',
    model: 'mimo-v2-pro-free',
    duration: null,
    isCompaction: false,
    delegationTargets: [],
  }

  assert.equal(turn.thinking, null)
  assert.equal(turn.duration, null)
})

// ---------------------------------------------------------------------------
// Interface: ParsedDelegation — shape and required fields
// ---------------------------------------------------------------------------

test('ParsedDelegation has correct shape', () => {
  const delegation: ParsedDelegation = {
    delegatedTo: 'hivexplorer',
    description: 'Investigate codebase for test patterns',
    subagentType: 'hivexplorer',
    packetId: 'pkt-abc123',
  }

  const expectedKeys = [
    'delegatedTo',
    'description',
    'packetId',
    'subagentType',
  ]

  assertShapeKeys(delegation, expectedKeys, 'ParsedDelegation')
  assert.equal(typeof delegation.delegatedTo, 'string')
  assert.equal(typeof delegation.description, 'string')
  assert.equal(typeof delegation.subagentType, 'string')
})

test('ParsedDelegation accepts null packetId', () => {
  const delegation: ParsedDelegation = {
    delegatedTo: 'hiveq',
    description: 'Verify test coverage',
    subagentType: 'hiveq',
    packetId: null,
  }

  assert.equal(delegation.packetId, null)
})

// ---------------------------------------------------------------------------
// Interface: TurnCounters — shape and required fields
// ---------------------------------------------------------------------------

test('TurnCounters has correct shape with all zero values', () => {
  const counters: TurnCounters = {
    userMessageCount: 0,
    agentOutputCount: 0,
    delegationCount: 0,
  }

  const expectedKeys = [
    'agentOutputCount',
    'delegationCount',
    'userMessageCount',
  ]

  assertShapeKeys(counters, expectedKeys, 'TurnCounters')
  assert.equal(typeof counters.userMessageCount, 'number')
  assert.equal(typeof counters.agentOutputCount, 'number')
  assert.equal(typeof counters.delegationCount, 'number')
})

test('TurnCounters accepts non-zero values', () => {
  const counters: TurnCounters = {
    userMessageCount: 2,
    agentOutputCount: 3,
    delegationCount: 1,
  }

  assert.equal(counters.userMessageCount, 2)
  assert.equal(counters.agentOutputCount, 3)
  assert.equal(counters.delegationCount, 1)
})

// ---------------------------------------------------------------------------
// Interface: ParsedSession — shape and required fields
// ---------------------------------------------------------------------------

test('ParsedSession has correct shape with nested structures', () => {
  const session: ParsedSession = {
    header: {
      title: 'Test Session',
      timestamp: '2026-03-23T00:00:00.000Z',
      sessionId: 'ses-test',
      created: '2026-03-23T00:00:00.000Z',
      updated: '2026-03-23T00:00:00.000Z',
    },
    turns: [],
    counters: {
      userMessageCount: 0,
      agentOutputCount: 0,
      delegationCount: 0,
    },
    delegations: [],
  }

  const expectedKeys = [
    'counters',
    'delegations',
    'header',
    'turns',
  ]

  assertShapeKeys(session, expectedKeys, 'ParsedSession')
  assert.ok(Array.isArray(session.turns))
  assert.ok(Array.isArray(session.delegations))
  assert.equal(typeof session.header, 'object')
  assert.equal(typeof session.counters, 'object')
})

// ---------------------------------------------------------------------------
// Runtime sentinel: createEmptyHeader must return a ParsedHeader with N/A defaults
// ---------------------------------------------------------------------------

test('createEmptyHeader returns ParsedHeader with all N/A defaults', () => {
  const empty = createEmptyHeader()

  assert.equal(empty.title, 'N/A')
  assert.equal(empty.timestamp, 'N/A')
  assert.equal(empty.sessionId, 'N/A')
  assert.equal(empty.created, 'N/A')
  assert.equal(empty.updated, 'N/A')
})
