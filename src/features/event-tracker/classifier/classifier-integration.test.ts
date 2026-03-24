import assert from 'node:assert/strict'
import test from 'node:test'

import type { ParsedTurn } from '../parser/types.js'
import { classifyTurnEvents } from './event-classifier.js'
import { mapEventEntriesToSessionEventInputs } from './writer-adapter.js'

test('classifier output can be mapped to writer-compatible inputs for delegation_returned', () => {
  const turn: ParsedTurn = {
    turnNumber: 6,
    userMessage: 'run red-phase tests for plan 5',
    assistantContent: 'delegated to hiveq for verification',
    thinking: null,
    agentName: 'Hiveminder',
    model: 'openai/gpt-5.3-codex',
    duration: 900,
    isCompaction: false,
    delegationTargets: [
      {
        delegatedTo: 'hiveq',
        description: 'verify red tests',
        subagentType: 'hiveq',
        packetId: 'pkt-integration-1',
      },
    ],
  }

  const events = classifyTurnEvents({
    sessionId: 'ses_plan5_red',
    timestamp: '2026-03-24T10:06:00.000Z',
    turn,
    delegationReturnedEvidenceByPacketId: {
      'pkt-integration-1': {
        statusDetail: 'partial',
        evidenceSnapshot: 'waiting on adapter implementation',
      },
    },
  })

  const writerInputs = mapEventEntriesToSessionEventInputs(events)
  const delegationInput = writerInputs.find(
    (entry: { type: string }) => entry.type === 'delegation_returned',
  )

  assert.ok(delegationInput, 'expected delegation_returned mapped writer input')
  assert.equal(delegationInput?.sessionId, 'ses_plan5_red')
  assert.equal(delegationInput?.timestamp, '2026-03-24T10:06:00.000Z')
  assert.equal(delegationInput?.type, 'delegation_returned')
  assert.match(delegationInput?.details ?? '', /Status: partial/)
  assert.match(delegationInput?.details ?? '', /Evidence: waiting on adapter implementation/)
})
