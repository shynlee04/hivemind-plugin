import assert from 'node:assert/strict'
import test from 'node:test'

import type { RuntimeBindingsSnapshot } from '../src/features/runtime-entry/attachment.js'
import type { StartWorkDecision } from '../src/hooks/start-work/start-work-types.js'
import { getRuntimePressureContract } from '../src/shared/pressure-contract.js'
import {
  createHivemindContextPacket,
  renderHivemindContext,
} from '../src/plugin/context-renderer.js'
import { createTurnSnapshotLoader } from '../src/plugin/runtime-snapshot.js'

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

function createDecision(overrides: Partial<StartWorkDecision> = {}): StartWorkDecision {
  return {
    sessionId: 'ses_123',
    sessionScope: 'main',
    sessionState: 'fresh',
    lineage: 'hivefiver',
    purposeClass: 'planning',
    confidence: 0.9,
    reasons: ['planning-keyword'],
    readiness: [],
    traversalOutcome: 'route',
    commandAgent: 'planner',
    continuityAlerts: [],
    workflowAuthority: undefined,
    trajectoryAssessment: undefined,
    routeDisposition: 'create',
    nextTransition: 'command:hm-plan',
    requiredControlPlaneId: undefined,
    recommendedControlPlaneId: undefined,
    requiredCommandId: undefined,
    recommendedCommandId: 'hm-plan',
    programmaticInitiationRequired: false,
    autoRoute: true,
    riskLevel: 'none',
    opencodeKnowledge: [],
    pressureSignals: ['steady-state'],
    pressureContract: getRuntimePressureContract('steady-state'),
    ...overrides,
  }
}

test('createTurnSnapshotLoader caches one snapshot per turn and resets explicitly', async () => {
  let calls = 0
  const snapshot = createSnapshot()
  const loader = createTurnSnapshotLoader('/tmp/hivemind', async () => {
    calls += 1
    return snapshot
  })

  const first = await loader.getSnapshot()
  const second = await loader.getSnapshot()

  assert.equal(calls, 1)
  assert.equal(first, snapshot)
  assert.equal(second, snapshot)

  loader.resetTurnSnapshot()

  const third = await loader.getSnapshot()
  assert.equal(calls, 2)
  assert.equal(third, snapshot)
})

test('renderHivemindContext emits the authoritative packet in stable field order', () => {
  const packet = renderHivemindContext({
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

  assert.equal(
    packet,
    [
      '<hivemind context_version="v1">',
      'session_id=ses_123',
      'lineage=hivefiver',
      'trajectory=traj_123',
      'workflow=wf_123',
      'task_ids=task-1,task-2',
      'entry_state=ready',
      'purpose=planning',
      'risk=none',
      'route_command=hm-plan',
      'governance_mode=assisted',
      'language=en',
      '</hivemind>',
    ].join('\n'),
  )
})

test('createHivemindContextPacket maps snapshot and routing decision into the unified fields', () => {
  const packet = createHivemindContextPacket({
    sessionId: 'ses_123',
    snapshot: createSnapshot({ entryState: 'repair-required', governanceMode: 'strict', language: 'fr' }),
    startWork: createDecision({ purposeClass: 'implementation', riskLevel: 'gated', requiredCommandId: 'hm-implement' }),
  })

  assert.deepEqual(packet, {
    session_id: 'ses_123',
    lineage: 'hivefiver',
    trajectory: 'traj_123',
    workflow: 'wf_123',
    task_ids: ['task-1', 'task-2'],
    entry_state: 'repair-required',
    purpose: 'implementation',
    risk: 'gated',
    route_command: 'hm-implement',
    governance_mode: 'strict',
    language: 'fr',
  })
})
