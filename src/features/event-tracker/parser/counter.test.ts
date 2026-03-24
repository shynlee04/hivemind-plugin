/**
 * Counter Tests
 *
 * RED-phase tests for independent turn counters.
 * Tests countTurns() which computes userMessageCount, agentOutputCount,
 * and delegationCount from an array of ParsedTurn objects.
 *
 * Will FAIL until `./counter.js` exports `countTurns`.
 *
 * @module event-tracker/parser/counter.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { countTurns } from './counter.js'
import type { ParsedTurn } from './types.js'

// ---------------------------------------------------------------------------
// Helper: build a minimal ParsedTurn
// ---------------------------------------------------------------------------

function makeTurn(overrides: Partial<ParsedTurn> = {}): ParsedTurn {
  return {
    turnNumber: 0,
    userMessage: '',
    assistantContent: '',
    thinking: null,
    agentName: 'general',
    model: 'model',
    duration: null,
    isCompaction: false,
    delegationTargets: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Test: Empty turns array → all counts = 0
// ---------------------------------------------------------------------------

test('countTurns returns all zeros for empty array', () => {
  const counters = countTurns([])

  assert.equal(counters.userMessageCount, 0)
  assert.equal(counters.agentOutputCount, 0)
  assert.equal(counters.delegationCount, 0)
})

// ---------------------------------------------------------------------------
// Test: 3 turns (2 user+agent, 1 compaction) → userCount=2, agentCount=2
// ---------------------------------------------------------------------------

test('countTurns counts user messages and agent outputs correctly', () => {
  const turns: ParsedTurn[] = [
    makeTurn({
      turnNumber: 1,
      userMessage: 'first question',
      assistantContent: 'first answer',
    }),
    makeTurn({
      turnNumber: 2,
      userMessage: 'second question',
      assistantContent: 'second answer',
    }),
    makeTurn({
      turnNumber: 3,
      userMessage: '',
      assistantContent: 'compacted summary',
      isCompaction: true,
    }),
  ]

  const counters = countTurns(turns)

  assert.equal(counters.userMessageCount, 2)
  assert.equal(counters.agentOutputCount, 2)
  assert.equal(counters.delegationCount, 0)
})

// ---------------------------------------------------------------------------
// Test: Turn with 2 delegation targets → delegationCount=2
// ---------------------------------------------------------------------------

test('countTurns sums delegation targets across all turns', () => {
  const turns: ParsedTurn[] = [
    makeTurn({
      turnNumber: 1,
      userMessage: 'delegate two things',
      assistantContent: 'dispatching',
      delegationTargets: [
        {
          delegatedTo: 'hivexplorer',
          description: 'scan',
          subagentType: 'hivexplorer',
          packetId: 'pkt-1',
        },
        {
          delegatedTo: 'hiveq',
          description: 'verify',
          subagentType: 'hiveq',
          packetId: 'pkt-2',
        },
      ],
    }),
  ]

  const counters = countTurns(turns)
  assert.equal(counters.delegationCount, 2)
})

// ---------------------------------------------------------------------------
// Test: Turn with empty userMessage → not counted as user message
// ---------------------------------------------------------------------------

test('countTurns does not count turns with empty userMessage', () => {
  const turns: ParsedTurn[] = [
    makeTurn({
      turnNumber: 1,
      userMessage: '',
      assistantContent: 'some output',
    }),
    makeTurn({
      turnNumber: 2,
      userMessage: '   ',
      assistantContent: 'some output',
    }),
  ]

  const counters = countTurns(turns)
  assert.equal(counters.userMessageCount, 0)
  assert.equal(counters.agentOutputCount, 2)
})

// ---------------------------------------------------------------------------
// Test: Compaction turn → not counted as agent output
// ---------------------------------------------------------------------------

test('countTurns excludes compaction turns from agent output count', () => {
  const turns: ParsedTurn[] = [
    makeTurn({
      turnNumber: 1,
      userMessage: 'hello',
      assistantContent: 'response',
      isCompaction: false,
    }),
    makeTurn({
      turnNumber: 2,
      userMessage: '',
      assistantContent: 'compacted',
      isCompaction: true,
    }),
  ]

  const counters = countTurns(turns)
  assert.equal(counters.userMessageCount, 1)
  assert.equal(counters.agentOutputCount, 1)
})
