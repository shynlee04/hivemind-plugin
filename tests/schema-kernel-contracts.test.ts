import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createRuntimeInvocation } from '../src/shared/runtime-invocation.js'
import { createTurnOutputEnvelope } from '../src/shared/turn-output.js'
import {
  artifactFreshnessRegistrySchema,
  deadlockCheckpointSchema,
  delegationReceiptSchema,
  entryKernelStateSchema,
  recoveryReplayEnvelopeSchema,
  runtimeInvocationSchema,
  sessionRegistrySchema,
  supervisorInstanceRegistrySchema,
  turnOutputEnvelopeSchema,
  workflowExecutionGraphSchema,
  workflowGuardStateSchema,
  workflowWaveStateSchema,
} from '../src/schema-kernel/index.js'

describe('schema kernel contracts', () => {
  it('parses the live entry/runtime/turn records through schema-kernel authority', async () => {
    const invocation = createRuntimeInvocation({
      sessionId: 'ses_schema_kernel',
      sessionScope: 'main',
      activeAgent: 'hivefiver',
      lineage: 'hivefiver',
      workflowId: 'wf_schema_kernel',
      taskIds: ['task_schema'],
      subtaskIds: ['subtask_schema'],
      entryState: 'qa-pending',
      qaState: 'pending',
      releaseState: 'blocked',
      gateState: 'qa-pending',
      requestReason: 'continue phase one',
    })

    const turnOutput = createTurnOutputEnvelope({
      runtimeInvocation: invocation,
      status: 'qa-pending',
      qaState: 'pending',
      rationale: ['schema-kernel validation'],
    })

    const entryState = {
      version: 'v1',
      state: 'qa-pending',
      qaState: 'pending',
      releaseState: 'blocked',
      lifecycle: {
        layer: 'entry-kernel',
        phase: 'session-entry',
        state: 'qa-pending',
      },
      reason: 'awaiting-qa',
      profileValidated: true,
      lastUpdatedAt: new Date().toISOString(),
    }

    assert.equal(entryKernelStateSchema.parse(entryState).state, 'qa-pending')
    assert.equal(runtimeInvocationSchema.parse(invocation).workflowId, 'wf_schema_kernel')
    assert.equal(turnOutputEnvelopeSchema.parse(turnOutput).invocationId, invocation.invocationId)
  })

  it('validates the additive supervisor, workflow, and evidence contract family', () => {
    const supervisorRegistry = supervisorInstanceRegistrySchema.parse({
      version: 'v1',
      instances: [
        {
          instanceId: 'sup_local',
          status: 'healthy',
          runtimeAuthority: 'managed-sdk',
          startedAt: '2026-03-17T00:00:00.000Z',
          lastHeartbeatAt: '2026-03-17T00:00:05.000Z',
          transport: 'same-local-env',
        },
      ],
    })

    const sessionRegistry = sessionRegistrySchema.parse({
      version: 'v1',
      sessions: [
        {
          sessionId: 'ses_main',
          scope: 'main',
          leaseId: 'lease_main',
          status: 'active',
          workflowIds: ['wf_phase_1'],
          writableSurfaces: ['src/schema-kernel'],
          updatedAt: '2026-03-17T00:00:06.000Z',
        },
      ],
    })

    const workflowGraph = workflowExecutionGraphSchema.parse({
      version: 'v1',
      workflowId: 'wf_phase_1',
      edges: [
        {
          from: 'task_schema',
          to: 'task_supervisor',
          kind: 'blocks',
        },
      ],
    })

    const waveState = workflowWaveStateSchema.parse({
      version: 'v1',
      workflowId: 'wf_phase_1',
      waveId: 'wave_1',
      status: 'pending',
      taskIds: ['task_schema'],
      parallelizable: false,
    })

    const guardState = workflowGuardStateSchema.parse({
      version: 'v1',
      workflowId: 'wf_phase_1',
      guardLevel: 'strict',
      dependencyStatus: 'blocked',
      freshnessStatus: 'fresh',
      writableSurfaceStatus: 'exclusive',
    })

    const receipt = delegationReceiptSchema.parse({
      version: 'v1',
      receiptId: 'receipt_child_1',
      delegationId: 'del_child_1',
      parentSessionId: 'ses_main',
      childSessionId: 'ses_child',
      verificationVerdict: 'pending',
      dependencyStatus: 'blocked',
      freshnessStatus: 'fresh',
      recordedAt: '2026-03-17T00:00:07.000Z',
    })

    const freshness = artifactFreshnessRegistrySchema.parse({
      version: 'v1',
      artifacts: [
        {
          artifactRef: 'task_plan.active.md',
          status: 'warn',
          checkedAt: '2026-03-17T00:00:08.000Z',
          inputs: ['git:dirty', 'file:changed'],
        },
      ],
    })

    const deadlock = deadlockCheckpointSchema.parse({
      version: 'v1',
      checkpointId: 'deadlock_1',
      sessionId: 'ses_main',
      workflowId: 'wf_phase_1',
      signal: 'timeout',
      recordedAt: '2026-03-17T00:00:09.000Z',
      recoveryHint: 'rerun-harness',
    })

    const replay = recoveryReplayEnvelopeSchema.parse({
      version: 'v1',
      replayId: 'replay_1',
      sourceCheckpointId: 'deadlock_1',
      sessionIds: ['ses_main'],
      workflowIds: ['wf_phase_1'],
      status: 'pending',
      recordedAt: '2026-03-17T00:00:10.000Z',
    })

    assert.equal(supervisorRegistry.instances[0]?.transport, 'same-local-env')
    assert.equal(sessionRegistry.sessions[0]?.leaseId, 'lease_main')
    assert.equal(workflowGraph.edges[0]?.kind, 'blocks')
    assert.equal(waveState.parallelizable, false)
    assert.equal(guardState.dependencyStatus, 'blocked')
    assert.equal(receipt.verificationVerdict, 'pending')
    assert.equal(freshness.artifacts[0]?.status, 'warn')
    assert.equal(deadlock.signal, 'timeout')
    assert.equal(replay.status, 'pending')
  })

  it('rejects invalid freshness and supervisor transport values', () => {
    const invalidFreshness = artifactFreshnessRegistrySchema.safeParse({
      version: 'v1',
      artifacts: [
        {
          artifactRef: 'task_plan.active.md',
          status: 'stale',
          checkedAt: '2026-03-17T00:00:08.000Z',
          inputs: [],
        },
      ],
    })

    const invalidSupervisor = supervisorInstanceRegistrySchema.safeParse({
      version: 'v1',
      instances: [
        {
          instanceId: 'sup_local',
          status: 'healthy',
          runtimeAuthority: 'managed-sdk',
          startedAt: '2026-03-17T00:00:00.000Z',
          lastHeartbeatAt: '2026-03-17T00:00:05.000Z',
          transport: 'remote',
        },
      ],
    })

    assert.equal(invalidFreshness.success, false)
    assert.equal(invalidSupervisor.success, false)
  })
})
