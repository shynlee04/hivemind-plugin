import assert from 'node:assert/strict'
import test from 'node:test'

import type { SessionEventWriteInput } from '../writers/events-writer.js'
import type { EventEntry } from '../types.js'
import {
  mapEventEntriesToSessionEventInputs,
  mapEventEntryToSessionEventInput,
} from './writer-adapter.js'

function makeDelegationReturnedEvent(data: Record<string, unknown>): EventEntry {
  return {
    id: 'evt-delegation-returned-1',
    sessionId: 'ses_plan5_red',
    turnNumber: 5,
    type: 'delegation_returned',
    importance: 'high',
    timestamp: '2026-03-24T10:04:00.000Z',
    data,
  }
}

function makeUserEvent(userMessage: string): EventEntry {
  return {
    id: 'evt-user-message-1',
    sessionId: 'ses_plan5_red',
    turnNumber: 1,
    type: 'user_message',
    importance: 'low',
    timestamp: '2026-03-24T10:00:00.000Z',
    data: { userMessage },
  }
}

function makeAssistantEvent(agentName: string): EventEntry {
  return {
    id: 'evt-assistant-output-1',
    sessionId: 'ses_plan5_red',
    turnNumber: 1,
    type: 'assistant_output',
    importance: 'low',
    timestamp: '2026-03-24T10:00:01.000Z',
    data: { agentName, assistantContent: 'working...' },
  }
}

test('maps EventEntry to writer-compatible required shape', () => {
  const event = makeUserEvent('run RED phase')

  const mapped: SessionEventWriteInput = mapEventEntryToSessionEventInput(event)

  assert.equal(mapped.sessionId, 'ses_plan5_red')
  assert.equal(mapped.timestamp, '2026-03-24T10:00:00.000Z')
  assert.equal(mapped.type, 'user_message')
  assert.equal(mapped.actor, 'user')
})

test('maps actors by event type instead of defaulting to delegatedTo', () => {
  const userMapped = mapEventEntryToSessionEventInput(makeUserEvent('run RED phase'))
  const assistantMapped = mapEventEntryToSessionEventInput(makeAssistantEvent('Hiveminder'))
  const delegationMapped = mapEventEntryToSessionEventInput(
    makeDelegationReturnedEvent({
      packetId: 'pkt-complete',
      delegatedTo: 'hivexplorer',
      subagentType: 'hivexplorer',
      statusDetail: 'complete',
    }),
  )

  assert.equal(userMapped.actor, 'user')
  assert.equal(assistantMapped.actor, 'Hiveminder')
  assert.equal(delegationMapped.actor, 'hivexplorer')
})

test('delegation_returned mapping includes stable details labels with complete evidence', () => {
  const mapped = mapEventEntryToSessionEventInput(
    makeDelegationReturnedEvent({
      packetId: 'pkt-complete',
      delegatedTo: 'hivexplorer',
      subagentType: 'hivexplorer',
      statusDetail: 'complete',
      evidenceSnapshot: 'all checks green',
      blockedReason: 'N/A',
      completionMetadata: 'tests=5',
    }),
  )

  assert.match(mapped.details ?? '', /Status: complete/)
  assert.match(mapped.details ?? '', /Evidence: all checks green/)
  assert.match(mapped.details ?? '', /Blocked Reason: N\/A/)
  assert.match(mapped.details ?? '', /Completion: tests=5/)
})

test('delegation_returned mapping includes N/A fallback labels when evidence fields missing', () => {
  const mapped = mapEventEntryToSessionEventInput(
    makeDelegationReturnedEvent({
      packetId: 'pkt-partial-missing-evidence',
      delegatedTo: 'hivexplorer',
      subagentType: 'hivexplorer',
      statusDetail: 'partial',
    }),
  )

  assert.match(mapped.details ?? '', /Status: partial/)
  assert.match(mapped.details ?? '', /Evidence: N\/A/)
  assert.match(mapped.details ?? '', /Blocked Reason: N\/A/)
  assert.match(mapped.details ?? '', /Completion: N\/A/)
})

test('maps arrays one-to-one for writer pipeline ingestion', () => {
  const mapped = mapEventEntriesToSessionEventInputs([
    makeDelegationReturnedEvent({
      packetId: 'pkt-blocked',
      delegatedTo: 'hiveq',
      subagentType: 'hiveq',
      statusDetail: 'blocked',
      blockedReason: 'schema mismatch',
    }),
    makeDelegationReturnedEvent({
      packetId: 'pkt-complete',
      delegatedTo: 'hivexplorer',
      subagentType: 'hivexplorer',
      statusDetail: 'complete',
    }),
  ])

  assert.equal(mapped.length, 2)
  assert.equal(mapped[0].type, 'delegation_returned')
  assert.equal(mapped[1].type, 'delegation_returned')
})

test('non-delegation details fallback for unserializable data is deterministic', () => {
  const circular: Record<string, unknown> = {}
  circular.self = circular

  const mapped = mapEventEntryToSessionEventInput({
    id: 'evt-user-message-circular',
    sessionId: 'ses_plan5_red',
    turnNumber: 2,
    type: 'user_message',
    importance: 'low',
    timestamp: '2026-03-24T10:00:02.000Z',
    data: circular,
  })

  assert.equal(mapped.details, '[unserializable event data]')
})
