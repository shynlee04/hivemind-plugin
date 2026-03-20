import assert from 'node:assert/strict'
import test from 'node:test'

import type { CompactionPreservationPacket } from '../features/agent-work-contract/schema/contract.js'
import type { RuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import type { StartWorkDecision } from '../features/session-entry/start-work-types.js'
import {
  createHivemindContextPacket,
  HIVEMIND_AGENT_WORK_CONTEXT_KEYS,
  HIVEMIND_BASE_CONTEXT_KEYS,
  HIVEMIND_CONTEXT_FIELD_ORDER,
  renderHivemindContext,
} from './context-renderer.js'

function createSnapshot(overrides: Partial<RuntimeBindingsSnapshot> = {}): RuntimeBindingsSnapshot {
  return {
    attachmentMode: 'local-worktree',
    defaultLineage: 'hivefiver',
    defaultPurposeClass: 'planning',
    runtimeAuthority: 'attached-sdk',
    runtimeInstanceId: 'rt_123',
    serverBaseUrl: 'http://localhost:4096',
    preferredUserName: 'Taylor',
    governanceMode: 'assisted',
    automationLevel: 'guarded',
    language: 'en',
    artifactLanguage: 'en',
    outputStyle: 'concise',
    expertLevel: 'advanced',
    branchFocus: 'runtime-context-detox',
    guardrails: ['workflow-first'],
    facilitators: ['hm-init'],
    mcpReadiness: ['context7'],
    hivebrainDigest: ['runtime-authority'],
    verificationContract: 'prove-with-tests',
    returnContract: 'brief',
    entryState: 'ready',
    qaState: 'passed',
    releaseState: 'released',
    hasRuntimeAttachment: true,
    hasHivemind: true,
    hivemindHealthy: true,
    hasWorkflow: true,
    profileComplete: true,
    missingProfileFields: [],
    interactiveBootstrapRequired: false,
    bootstrapProfile: {
      preferredUserName: 'Taylor',
      chatLanguage: 'en',
      artifactLanguage: 'en',
      expertiseLevel: 'advanced',
      governanceMode: 'assisted',
      automationLevel: 'guarded',
      outputStyle: 'concise',
    },
    trajectoryId: 'traj_123',
    workflowId: 'wf_123',
    taskIds: ['task-1', 'task-2'],
    subtaskIds: [],
    checkpointId: 'cp_123',
    ...overrides,
  }
}

function createStartWork(
  overrides: Partial<Pick<StartWorkDecision, 'lineage' | 'purposeClass' | 'riskLevel' | 'requiredCommandId' | 'recommendedCommandId'>> = {},
): Pick<StartWorkDecision, 'lineage' | 'purposeClass' | 'riskLevel' | 'requiredCommandId' | 'recommendedCommandId'> {
  return {
    lineage: 'hivefiver',
    purposeClass: 'planning',
    riskLevel: 'none',
    requiredCommandId: undefined,
    recommendedCommandId: 'hm-plan',
    ...overrides,
  }
}

function createAgentWorkPacket(overrides: Partial<CompactionPreservationPacket> = {}): CompactionPreservationPacket {
  return {
    contractId: 'contract-123',
    sessionId: 'ses_123',
    delegationExportSessionId: 'delegation-789',
    purposeClass: 'project-driven',
    responseMode: 'broad-search-execute',
    workflowPhase: 'implementation',
    activeTaskIds: ['task-active'],
    pendingTaskIds: ['task-pending'],
    briefingSummary: 'Continue renderer-only work.',
    followUp: ['extend inline compaction hook', 'avoid plugin wiring in task 4'],
    recentAnchorDescriptions: ['Locked corrected Plan 03 scope.'],
    compactionAction: 'export-summary',
    ...overrides,
  }
}

test('ContextRenderer - key order exports - keep base and additive fields disjoint and stable', () => {
  assert.deepEqual(HIVEMIND_CONTEXT_FIELD_ORDER, [
    ...HIVEMIND_BASE_CONTEXT_KEYS,
    ...HIVEMIND_AGENT_WORK_CONTEXT_KEYS,
  ])

  const uniqueKeys = new Set(HIVEMIND_CONTEXT_FIELD_ORDER)
  assert.equal(uniqueKeys.size, HIVEMIND_CONTEXT_FIELD_ORDER.length)
})

test('ContextRenderer - createHivemindContextPacket - omits additive fields when no agentWorkPacket is provided', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'ses_123',
    snapshot: createSnapshot(),
    startWork: createStartWork(),
  })

  assert.deepEqual(packet, {
    session_id: 'ses_123',
    lineage: 'hivefiver',
    trajectory: 'traj_123',
    workflow: 'wf_123',
    task_ids: ['task-1', 'task-2'],
    entry_state: 'ready',
    purpose: 'planning',
    risk: 'none',
    route_command: 'hm-plan',
    governance_mode: 'assisted',
    language: 'en',
  })
})

test('ContextRenderer - createHivemindContextPacket - appends validated agent-work fields', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'ses_123',
    snapshot: createSnapshot(),
    startWork: createStartWork(),
    agentWorkPacket: createAgentWorkPacket(),
  })

  assert.equal(packet.contract_id, 'contract-123')
  assert.equal(packet.delegation_export_session_id, 'delegation-789')
  assert.equal(packet.response_mode, 'broad-search-execute')
  assert.equal(packet.workflow_phase, 'implementation')
  assert.deepEqual(packet.active_task_ids, ['task-active'])
  assert.deepEqual(packet.pending_task_ids, ['task-pending'])
  assert.equal(packet.briefing_summary, 'Continue renderer-only work.')
  assert.deepEqual(packet.follow_up, ['extend inline compaction hook', 'avoid plugin wiring in task 4'])
  assert.deepEqual(packet.recent_anchors, ['Locked corrected Plan 03 scope.'])
  assert.equal(packet.compaction_action, 'export-summary')
  assert.equal('purpose_class' in packet, false)
})

test('ContextRenderer - createHivemindContextPacket - rejects malformed agent-work packet payloads', () => {
  assert.throws(() => {
    createHivemindContextPacket({
      sessionId: 'ses_123',
      snapshot: createSnapshot(),
      startWork: createStartWork(),
      agentWorkPacket: {
        contractId: 'contract-123',
      },
    })
  })
})

test('ContextRenderer - createHivemindContextPacket - keeps additive fallback values explicit', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'ses_123',
    snapshot: createSnapshot(),
    startWork: createStartWork(),
    agentWorkPacket: createAgentWorkPacket({
      delegationExportSessionId: undefined,
      activeTaskIds: [],
      pendingTaskIds: [],
      followUp: [],
      recentAnchorDescriptions: [],
    }),
  })

  assert.equal(packet.delegation_export_session_id, 'none')
  assert.deepEqual(packet.active_task_ids, [])
  assert.deepEqual(packet.pending_task_ids, [])
  assert.deepEqual(packet.follow_up, [])
  assert.deepEqual(packet.recent_anchors, [])
})

test('ContextRenderer - renderHivemindContext - uses one JSON-safe serialization rule for all fields', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'ses=123\nnext',
    snapshot: createSnapshot({
      trajectoryId: 'traj=123',
      workflowId: 'wf\n123',
      taskIds: ['task,1', 'task\n2'],
      entryState: 'ready',
      governanceMode: 'assist=ed',
      language: 'en\nUS',
    }),
    startWork: createStartWork({
      purposeClass: 'implementation',
      riskLevel: 'gated',
      recommendedCommandId: 'hm-plan=next\nstep',
    }),
    agentWorkPacket: createAgentWorkPacket({
      delegationExportSessionId: undefined,
      responseMode: 'interactive-qa',
      workflowPhase: 'phase,1\n2',
      briefingSummary: 'Line one, still same field.\nLine two.',
      followUp: ['first,step', 'second\nstep'],
      recentAnchorDescriptions: ['anchor=one'],
      compactionAction: 'launch-context-agent',
    }),
  })

  assert.equal(
    renderHivemindContext(packet),
    [
      '<hivemind context_version="v1">',
      String.raw`session_id="ses=123\nnext"`,
      'lineage="hivefiver"',
      'trajectory="traj=123"',
      String.raw`workflow="wf\n123"`,
      String.raw`task_ids=["task,1","task\n2"]`,
      'entry_state="ready"',
      'purpose="implementation"',
      'risk="gated"',
      String.raw`route_command="hm-plan=next\nstep"`,
      'governance_mode="assist=ed"',
      String.raw`language="en\nUS"`,
      'contract_id="contract-123"',
      'delegation_export_session_id="none"',
      'response_mode="interactive-qa"',
      String.raw`workflow_phase="phase,1\n2"`,
      'active_task_ids=["task-active"]',
      'pending_task_ids=["task-pending"]',
      String.raw`briefing_summary="Line one, still same field.\nLine two."`,
      String.raw`follow_up=["first,step","second\nstep"]`,
      'recent_anchors=["anchor=one"]',
      'compaction_action="launch-context-agent"',
      '</hivemind>',
    ].join('\n'),
  )
})

test('ContextRenderer - renderHivemindContext - renders fallback additive values explicitly', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'ses_123',
    snapshot: createSnapshot(),
    startWork: createStartWork(),
    agentWorkPacket: createAgentWorkPacket({
      delegationExportSessionId: undefined,
      activeTaskIds: [],
      pendingTaskIds: [],
      followUp: [],
      recentAnchorDescriptions: [],
    }),
  })

  assert.match(renderHivemindContext(packet), /delegation_export_session_id="none"/)
  assert.match(renderHivemindContext(packet), /active_task_ids=\[\]/)
  assert.match(renderHivemindContext(packet), /pending_task_ids=\[\]/)
  assert.match(renderHivemindContext(packet), /follow_up=\[\]/)
  assert.match(renderHivemindContext(packet), /recent_anchors=\[\]/)
})
