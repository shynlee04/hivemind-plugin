import assert from 'node:assert/strict'
import test from 'node:test'

import type { ParsedDelegation, ParsedTurn } from '../parser/types.js'
import type { EventEntry } from '../types.js'
import {
  classifyTurnEvents,
  type DelegationReturnedEvidence,
  type ClassifierInput,
} from './event-classifier.js'

function makeDelegation(packetId: string | null): ParsedDelegation {
  return {
    delegatedTo: 'hivexplorer',
    description: 'Inspect event tracker contracts',
    subagentType: 'hivexplorer',
    packetId,
  }
}

function makeTurn(packetId: string | null): ParsedTurn {
  return {
    turnNumber: 7,
    userMessage: 'run plan 5 red',
    assistantContent: 'delegated to hivexplorer',
    thinking: null,
    agentName: 'Hiveminder',
    model: 'openai/gpt-5.3-codex',
    duration: 1400,
    isCompaction: false,
    delegationTargets: [makeDelegation(packetId)],
  }
}

function makeInput(packetId: string | null, evidence?: DelegationReturnedEvidence): ClassifierInput {
  return {
    sessionId: 'ses_plan5_red',
    timestamp: '2026-03-24T10:00:00.000Z',
    turn: makeTurn(packetId),
    delegationReturnedEvidenceByPacketId:
      packetId && evidence ? { [packetId]: evidence } : {},
  }
}

function findDelegationReturned(events: EventEntry[]): EventEntry {
  const found = events.find((event) => event.type === 'delegation_returned')
  assert.ok(found, 'expected delegation_returned event entry to exist')
  return found
}

test('classifyTurnEvents includes delegation_returned payload with complete evidence', () => {
  const events = classifyTurnEvents(
    makeInput('pkt-complete', {
      statusDetail: 'complete',
      evidenceSnapshot: 'verified all assertions',
      blockedReason: 'N/A',
      completionMetadata: 'tests=5;passed=5',
    }),
  )
  const delegationReturned = findDelegationReturned(events)
  const data = delegationReturned.data as Record<string, unknown>

  assert.equal(data.packetId, 'pkt-complete')
  assert.equal(data.delegatedTo, 'hivexplorer')
  assert.equal(data.subagentType, 'hivexplorer')
  assert.equal(data.statusDetail, 'complete')
  assert.equal(data.evidenceSnapshot, 'verified all assertions')
  assert.equal(data.blockedReason, 'N/A')
  assert.equal(data.completionMetadata, 'tests=5;passed=5')
})

test('classifyTurnEvents normalizes delegation_created fallback fields', () => {
  const turn = makeTurn('pkt-normalize-created')
  turn.delegationTargets = [
    {
      delegatedTo: '   ',
      description: '',
      subagentType: ' ',
      packetId: null,
    },
  ]

  const events = classifyTurnEvents({
    sessionId: 'ses_plan5_red',
    timestamp: '2026-03-24T10:00:00.000Z',
    turn,
    delegationReturnedEvidenceByPacketId: {},
  })

  const created = events.find((event: EventEntry) => event.type === 'delegation_created')
  assert.ok(created)
  assert.deepEqual(created.data, {
    packetId: 'N/A',
    delegatedTo: 'N/A',
    subagentType: 'N/A',
    description: 'N/A',
  })
})

test('classifyTurnEvents keeps whitespace normalization parity between created and returned', () => {
  const turn = makeTurn('pkt-whitespace')
  turn.delegationTargets = [
    {
      delegatedTo: '   ',
      description: ' ',
      subagentType: '\t',
      packetId: 'pkt-whitespace',
    },
  ]

  const events = classifyTurnEvents({
    sessionId: 'ses_plan5_red',
    timestamp: '2026-03-24T10:00:00.000Z',
    turn,
    delegationReturnedEvidenceByPacketId: {
      'pkt-whitespace': {
        statusDetail: 'partial',
      },
    },
  })

  const created = events.find((event: EventEntry) => event.type === 'delegation_created')
  const returned = events.find((event: EventEntry) => event.type === 'delegation_returned')

  assert.ok(created)
  assert.ok(returned)
  assert.equal(created.data.delegatedTo, 'N/A')
  assert.equal(returned.data.delegatedTo, 'N/A')
  assert.equal(created.data.subagentType, 'N/A')
  assert.equal(returned.data.subagentType, 'N/A')
  assert.equal(created.data.description, 'N/A')
  assert.equal(returned.data.description, 'N/A')
})

test('classifyTurnEvents applies N/A fallback for missing complete evidence fields', () => {
  const events = classifyTurnEvents(
    makeInput('pkt-complete-fallback', {
      statusDetail: 'complete',
    }),
  )
  const data = findDelegationReturned(events).data as Record<string, unknown>

  assert.equal(data.statusDetail, 'complete')
  assert.equal(data.evidenceSnapshot, 'N/A')
  assert.equal(data.blockedReason, 'N/A')
  assert.equal(data.completionMetadata, 'N/A')
})

test('classifyTurnEvents does not emit delegation_returned when return evidence is missing', () => {
  const events = classifyTurnEvents(makeInput('pkt-no-evidence'))
  const delegationReturned = events.find(
    (event: EventEntry) => event.type === 'delegation_returned',
  )

  assert.equal(delegationReturned, undefined)
})

test('classifyTurnEvents handles null packetId by normalizing created and skipping returned', () => {
  const events = classifyTurnEvents(makeInput(null))
  const created = events.find((event: EventEntry) => event.type === 'delegation_created')
  const delegationReturned = events.find(
    (event: EventEntry) => event.type === 'delegation_returned',
  )

  assert.ok(created)
  assert.equal(created.data.packetId, 'N/A')
  assert.equal(delegationReturned, undefined)
})

test('classifyTurnEvents preserves multi-delegation ordering and deterministic IDs', () => {
  const turn = makeTurn('pkt-first')
  turn.delegationTargets = [
    makeDelegation('pkt-first'),
    makeDelegation('pkt-second'),
  ]

  const events = classifyTurnEvents({
    sessionId: 'ses_plan5_red',
    timestamp: '2026-03-24T10:00:00.000Z',
    turn,
    delegationReturnedEvidenceByPacketId: {
      'pkt-first': { statusDetail: 'complete' },
      'pkt-second': { statusDetail: 'partial' },
    },
  })

  const delegationEvents = events.filter(
    (event: EventEntry) =>
      event.type === 'delegation_created' || event.type === 'delegation_returned',
  )

  assert.deepEqual(
    delegationEvents.map((event: EventEntry) => event.type),
    [
      'delegation_created',
      'delegation_returned',
      'delegation_created',
      'delegation_returned',
    ],
  )
  assert.deepEqual(
    delegationEvents.map((event: EventEntry) => event.data.packetId),
    ['pkt-first', 'pkt-first', 'pkt-second', 'pkt-second'],
  )
  assert.equal(
    new Set(delegationEvents.map((event: EventEntry) => event.id)).size,
    delegationEvents.length,
  )
})
