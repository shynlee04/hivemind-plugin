/**
 * Compaction preservation helper tests.
 *
 * Validates schema-first packet derivation for session compaction.
 *
 * @module agent-work-contract/hooks/compaction-preservation.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import * as compactionPreservation from './compaction-preservation.js'

function createContract(overrides: Record<string, unknown> = {}) {
  return {
    contractId: 'contract-123',
    sessionId: 'session-456',
    delegationExportSessionId: 'delegation-789',
    createdAt: '2026-03-20T10:00:00.000Z',
    updatedAt: '2026-03-20T10:10:00.000Z',
    userIntent: {
      raw: 'Implement compaction preservation helper',
      confidence: 0.98,
      purposeClass: 'project-driven',
      requiresPlan: true,
      requiresGovernance: true,
    },
    responseMode: 'broad-search-execute',
    workflow: {
      phase: 'implementation',
      tasks: [
        {
          id: 'task-active',
          title: 'Implement helper',
          status: 'active',
        },
        {
          id: 'task-pending',
          title: 'Wire plugin later',
          status: 'pending',
        },
        {
          id: 'task-complete',
          title: 'Write spec',
          status: 'complete',
        },
      ],
    },
    chainActions: {
      onTaskComplete: 'next-task',
      onWorkflowEnd: 'archive',
      onDelegation: 'handoff-packet',
      onCompaction80: 'export-summary',
    },
    briefing: {
      summary: 'Continue helper-only integration work.',
      workflowState: 'implementation',
      followUp: ['extend inline compaction hook', 'keep schema-first parsing'],
    },
    anchors: [
      {
        timestamp: '2026-03-20T10:01:00.000Z',
        kind: 'planning-shift',
        description: 'Locked corrected Plan 03 scope.',
      },
      {
        timestamp: '2026-03-20T10:05:00.000Z',
        kind: 'stage-shift',
        description: 'Moved from tests to implementation.',
      },
    ],
    ...overrides,
  }
}

test('CompactionPreservation - createCompactionPreservationPacket - derives compaction-safe packet', () => {
  const packet = compactionPreservation.createCompactionPreservationPacket(createContract())

  assert.deepEqual(packet, {
    contractId: 'contract-123',
    sessionId: 'session-456',
    delegationExportSessionId: 'delegation-789',
    purposeClass: 'project-driven',
    responseMode: 'broad-search-execute',
    workflowPhase: 'implementation',
    activeTaskIds: ['task-active'],
    pendingTaskIds: ['task-pending'],
    briefingSummary: 'Continue helper-only integration work.',
    followUp: ['extend inline compaction hook', 'keep schema-first parsing'],
    recentAnchorDescriptions: [
      'Locked corrected Plan 03 scope.',
      'Moved from tests to implementation.',
    ],
    compactionAction: 'export-summary',
  })
})

test('CompactionPreservation - renderCompactionPreservationContext - renders stable context block', () => {
  const packet = compactionPreservation.createCompactionPreservationPacket(createContract())

  assert.equal(
    compactionPreservation.renderCompactionPreservationContext(packet),
    [
      '<agent-work-contract-compaction version="v1">',
      'contract_id="contract-123"',
      'session_id="session-456"',
      'delegation_export_session_id="delegation-789"',
      'purpose_class="project-driven"',
      'response_mode="broad-search-execute"',
      'workflow_phase="implementation"',
      'active_task_ids=["task-active"]',
      'pending_task_ids=["task-pending"]',
      'briefing_summary="Continue helper-only integration work."',
      'follow_up=["extend inline compaction hook","keep schema-first parsing"]',
      'recent_anchors=["Locked corrected Plan 03 scope.","Moved from tests to implementation."]',
      'compaction_action="export-summary"',
      '</agent-work-contract-compaction>',
    ].join('\n'),
  )
})

test('CompactionPreservation - renderCompactionPreservationContext - escapes commas and newlines with JSON encoding', () => {
  const packet = compactionPreservation.createCompactionPreservationPacket(createContract({
    briefing: {
      summary: 'Line one, still same field.\nLine two.',
      workflowState: 'implementation',
      followUp: ['first,step', 'second\nstep'],
    },
    anchors: [
      {
        timestamp: '2026-03-20T10:01:00.000Z',
        kind: 'planning-shift',
        description: 'anchor,one',
      },
    ],
  }))

  assert.equal(
    compactionPreservation.renderCompactionPreservationContext(packet),
    [
      '<agent-work-contract-compaction version="v1">',
      'contract_id="contract-123"',
      'session_id="session-456"',
      'delegation_export_session_id="delegation-789"',
      'purpose_class="project-driven"',
      'response_mode="broad-search-execute"',
      'workflow_phase="implementation"',
      'active_task_ids=["task-active"]',
      'pending_task_ids=["task-pending"]',
      String.raw`briefing_summary="Line one, still same field.\nLine two."`,
      String.raw`follow_up=["first,step","second\nstep"]`,
      'recent_anchors=["anchor,one"]',
      'compaction_action="export-summary"',
      '</agent-work-contract-compaction>',
    ].join('\n'),
  )
})

test('CompactionPreservation - createCompactionPreservationPacket - falls back for missing briefing and workflow phase', () => {
  const packet = compactionPreservation.createCompactionPreservationPacket(createContract({
    workflow: {
      tasks: [],
    },
    briefing: undefined,
    anchors: undefined,
  }))

  assert.deepEqual(packet, {
    contractId: 'contract-123',
    sessionId: 'session-456',
    delegationExportSessionId: 'delegation-789',
    purposeClass: 'project-driven',
    responseMode: 'broad-search-execute',
    workflowPhase: 'none',
    activeTaskIds: [],
    pendingTaskIds: [],
    briefingSummary: 'none',
    followUp: [],
    recentAnchorDescriptions: [],
    compactionAction: 'export-summary',
  })
})

test('CompactionPreservation - renderCompactionPreservationContext - renders minimal fallback branches explicitly', () => {
  const packet = compactionPreservation.createCompactionPreservationPacket(createContract({
    workflow: {
      tasks: [],
    },
    briefing: undefined,
    anchors: undefined,
  }))

  assert.equal(
    compactionPreservation.renderCompactionPreservationContext(packet),
    [
      '<agent-work-contract-compaction version="v1">',
      'contract_id="contract-123"',
      'session_id="session-456"',
      'delegation_export_session_id="delegation-789"',
      'purpose_class="project-driven"',
      'response_mode="broad-search-execute"',
      'workflow_phase="none"',
      'active_task_ids=[]',
      'pending_task_ids=[]',
      'briefing_summary="none"',
      'follow_up=[]',
      'recent_anchors=[]',
      'compaction_action="export-summary"',
      '</agent-work-contract-compaction>',
    ].join('\n'),
  )
})

test('CompactionPreservation - createCompactionPreservationPacket - truncates anchors to the last three descriptions', () => {
  const packet = compactionPreservation.createCompactionPreservationPacket(createContract({
    anchors: [
      {
        timestamp: '2026-03-20T10:00:00.000Z',
        kind: 'planning-shift',
        description: 'anchor-1',
      },
      {
        timestamp: '2026-03-20T10:01:00.000Z',
        kind: 'stage-shift',
        description: 'anchor-2',
      },
      {
        timestamp: '2026-03-20T10:02:00.000Z',
        kind: 'workflow-shift',
        description: 'anchor-3',
      },
      {
        timestamp: '2026-03-20T10:03:00.000Z',
        kind: 'user-redirect',
        description: 'anchor-4',
      },
    ],
  }))

  assert.deepEqual(packet.recentAnchorDescriptions, ['anchor-2', 'anchor-3', 'anchor-4'])
})

test('CompactionPreservation - createCompactionPreservationPacket - rejects partial contract payloads', () => {
  assert.throws(() => {
    compactionPreservation.createCompactionPreservationPacket({
      contractId: 'contract-123',
      sessionId: 'session-456',
    })
  })
})

test('CompactionPreservation - renderCompactionPreservationContext - rejects invalid partial packet payloads', () => {
  assert.throws(() => {
    compactionPreservation.renderCompactionPreservationContext({
      contractId: 'contract-123',
      sessionId: 'session-456',
    })
  })
})

test('CompactionPreservation - module surface - stays helper-only', () => {
  assert.equal('default' in compactionPreservation, false)
  assert.equal('createEventHandler' in compactionPreservation, false)
})
