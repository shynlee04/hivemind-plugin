import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildDelegationReturnedEvidencePayload,
  normalizeDelegationCoreFields,
} from './delegation-returned-evidence.js'

test('normalizeDelegationCoreFields applies consistent fallback semantics', () => {
  const normalized = normalizeDelegationCoreFields({
    packetId: null,
    delegatedTo: ' ',
    subagentType: '\t',
    description: '',
  })

  assert.deepEqual(normalized, {
    packetId: 'N/A',
    delegatedTo: 'N/A',
    subagentType: 'N/A',
    description: 'N/A',
  })
})

test('delegation_returned partial includes provided evidence fields', () => {
  const payload = buildDelegationReturnedEvidencePayload({
    packetId: 'pkt-partial-with-evidence',
    delegatedTo: 'hiveq',
    subagentType: 'hiveq',
    description: 'verify test quality',
    evidence: {
      statusDetail: 'partial',
      evidenceSnapshot: '3 of 5 checks completed',
      blockedReason: 'missing adapter implementation',
      completionMetadata: 'remaining=2',
    },
  })

  assert.equal(payload.statusDetail, 'partial')
  assert.equal(payload.evidenceSnapshot, '3 of 5 checks completed')
  assert.equal(payload.blockedReason, 'missing adapter implementation')
  assert.equal(payload.completionMetadata, 'remaining=2')
})

test('delegation_returned partial falls back to N/A when evidence absent', () => {
  const payload = buildDelegationReturnedEvidencePayload({
    packetId: 'pkt-partial-no-evidence',
    delegatedTo: 'hiveq',
    subagentType: 'hiveq',
    description: 'verify test quality',
    evidence: {
      statusDetail: 'partial',
    },
  })

  assert.equal(payload.statusDetail, 'partial')
  assert.equal(payload.evidenceSnapshot, 'N/A')
  assert.equal(payload.blockedReason, 'N/A')
  assert.equal(payload.completionMetadata, 'N/A')
})

test('delegation_returned blocked falls back to N/A when evidence key is missing', () => {
  const payload = buildDelegationReturnedEvidencePayload({
    packetId: null,
    delegatedTo: 'hivexplorer',
    subagentType: 'hivexplorer',
    description: 'inspect parser shape',
  })

  assert.equal(payload.packetId, 'N/A')
  assert.equal(payload.statusDetail, 'N/A')
  assert.equal(payload.evidenceSnapshot, 'N/A')
  assert.equal(payload.blockedReason, 'N/A')
  assert.equal(payload.completionMetadata, 'N/A')
})

test('delegation_returned blocked preserves blocked reason when present', () => {
  const payload = buildDelegationReturnedEvidencePayload({
    packetId: 'pkt-blocked',
    delegatedTo: 'hivexplorer',
    subagentType: 'hivexplorer',
    description: 'inspect parser shape',
    evidence: {
      statusDetail: 'blocked',
      blockedReason: 'test runner unavailable',
    },
  })

  assert.equal(payload.statusDetail, 'blocked')
  assert.equal(payload.blockedReason, 'test runner unavailable')
  assert.equal(payload.evidenceSnapshot, 'N/A')
  assert.equal(payload.completionMetadata, 'N/A')
})

test('delegation_returned complete preserves completion metadata when present', () => {
  const payload = buildDelegationReturnedEvidencePayload({
    packetId: 'pkt-complete',
    delegatedTo: 'hivexplorer',
    subagentType: 'hivexplorer',
    description: 'inspect parser shape',
    evidence: {
      statusDetail: 'complete',
      completionMetadata: 'duration=1200ms;assertions=14',
    },
  })

  assert.equal(payload.statusDetail, 'complete')
  assert.equal(payload.completionMetadata, 'duration=1200ms;assertions=14')
  assert.equal(payload.evidenceSnapshot, 'N/A')
  assert.equal(payload.blockedReason, 'N/A')
})
