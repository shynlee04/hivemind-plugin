import type {
  ArtifactFreshnessRegistryRecord,
  EntryKernelStateRecord,
  RuntimeInvocationRecord,
  SessionRegistryRecord,
  WorkflowExecutionGraphRecord,
  WorkflowGuardStateRecord,
  WorkflowWaveStateRecord,
} from '../schema-kernel/index.js'
import {
  createArtifactFreshnessRegistryRecord,
  createEntryKernelStateRecord,
  createRuntimeInvocationRecord,
  createSessionRegistryRecord,
} from '../schema-kernel/index.js'
import type { RuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import {
  createSupervisorStatusReport,
  type SupervisorStatusReport,
} from './health.js'
import type { RuntimeStatus } from '../shared/contracts/runtime-status.js'

export interface RuntimeKernelStatusSnapshot {
  entry: EntryKernelStateRecord
  runtimeInvocation: RuntimeInvocationRecord
  sessionRegistry: SessionRegistryRecord
  workflowGraph: WorkflowExecutionGraphRecord | null
  workflowWave: WorkflowWaveStateRecord | null
  workflowGuard: WorkflowGuardStateRecord | null
  freshnessRegistry: ArtifactFreshnessRegistryRecord
}

export interface BuildRuntimeStatusSnapshotInput {
  projectRoot: string
  sessionId: string
  agentId?: string
  snapshot: RuntimeBindingsSnapshot
  recordedAt?: string
}

export interface RuntimeStatusSnapshot extends RuntimeStatus {
  runtimeState: {
    sessionID: string
    attachmentMode: RuntimeBindingsSnapshot['attachmentMode']
    runtimeAuthority: RuntimeBindingsSnapshot['runtimeAuthority']
    runtimeInstanceId?: string
    serverBaseUrl?: string
    hasRuntimeAttachment: boolean
    hasHivemind: boolean
    hivemindHealthy: boolean
    hasWorkflow: boolean
    profileComplete: boolean
    missingProfileFields: string[]
    bootstrapProfile: RuntimeBindingsSnapshot['bootstrapProfile']
  }
  kernelState: RuntimeKernelStatusSnapshot
  supervisorState: SupervisorStatusReport
  kernel: RuntimeKernelStatusSnapshot
  supervisor: SupervisorStatusReport
}

function getRecommendedNext(snapshot: RuntimeBindingsSnapshot): string {
  if (snapshot.entryState === 'uninitialized') {
    return 'hm-init'
  }

  if (snapshot.entryState === 'repair-required') {
    return 'hm-doctor'
  }

  if (snapshot.qaState === 'pending') {
    return 'hm-harness'
  }

  return 'none'
}

/**
 * Build the Phase 1 runtime-status projection from schema-kernel contracts
 * plus supervisor health/reporting state.
 *
 * @param input - Current runtime snapshot and caller identity.
 * @returns Validated status snapshot for runtime reporting surfaces.
 */
export async function buildRuntimeStatusSnapshot(
  input: BuildRuntimeStatusSnapshotInput,
): Promise<RuntimeStatusSnapshot> {
  const recordedAt = input.recordedAt ?? new Date().toISOString()
  const { snapshot } = input

  const kernel = {
    entry: createEntryKernelStateRecord({
      state: snapshot.entryState,
      qaState: snapshot.qaState,
      releaseState: snapshot.releaseState,
      reason: snapshot.hasRuntimeAttachment
        ? 'runtime-attachment-status'
        : 'runtime-attachment-missing',
      profileValidated: snapshot.profileComplete,
      lastUpdatedAt: recordedAt,
    }),
    runtimeInvocation: createRuntimeInvocationRecord({
      invocationId: `runtime_status:${input.sessionId}`,
      sessionId: input.sessionId,
      sessionScope: 'main',
      entryState: snapshot.entryState,
      qaState: snapshot.qaState,
      releaseState: snapshot.releaseState,
      gateState: snapshot.interactiveBootstrapRequired ? 'bootstrap-required' : 'inspection-ready',
      requestReason: 'runtime-status-inspection',
      agentId: input.agentId,
      lineage: snapshot.defaultLineage,
      trajectoryId: snapshot.trajectoryId,
      workflowId: snapshot.workflowId,
      taskIds: snapshot.taskIds,
      subtaskIds: snapshot.subtaskIds,
      sotRefs: ['src/schema-kernel/lifecycle-records.ts', 'src/sdk-supervisor/health.ts'],
    }),
    sessionRegistry: createSessionRegistryRecord({
      sessionId: input.sessionId,
      scope: 'main',
      leaseId: `lease:${input.sessionId}`,
      status: snapshot.hasWorkflow ? 'active' : 'waiting',
      workflowIds: snapshot.workflowId ? [snapshot.workflowId] : [],
      writableSurfaces: ['src/schema-kernel', 'src/sdk-supervisor', 'src/tools/runtime'],
      updatedAt: recordedAt,
    }),
    workflowGraph: null,
    workflowWave: null,
    workflowGuard: null,
    freshnessRegistry: createArtifactFreshnessRegistryRecord({
      artifactRef: 'MASTER.active.md',
      status: snapshot.interactiveBootstrapRequired ? 'warn' : 'fresh',
      checkedAt: recordedAt,
      inputs: [
        `entry-state:${snapshot.entryState}`,
        `runtime-attachment:${snapshot.hasRuntimeAttachment ? 'present' : 'missing'}`,
      ],
    }),
  } satisfies RuntimeKernelStatusSnapshot

  const supervisor = createSupervisorStatusReport({
    instanceId: snapshot.runtimeInstanceId ?? `sup:${input.sessionId}`,
    startedAt: recordedAt,
    lastHeartbeatAt: recordedAt,
    status: snapshot.runtimeAuthority !== 'none' && snapshot.hivemindHealthy ? 'healthy' : 'degraded',
    runtimeAuthority: snapshot.runtimeAuthority,
    runtimeInstanceId: snapshot.runtimeInstanceId,
    serverBaseUrl: snapshot.serverBaseUrl,
  })

  return {
    runtimeAuthority: snapshot.runtimeAuthority,
    runtimeInstanceId: snapshot.runtimeInstanceId,
    serverBaseUrl: snapshot.serverBaseUrl,
    entryState: {
      state: snapshot.entryState,
      interactiveBootstrapRequired: snapshot.interactiveBootstrapRequired,
      recommendedNext: getRecommendedNext(snapshot),
    },
    qaState: {
      state: snapshot.qaState,
      releaseState: snapshot.releaseState,
    },
    lineageSessionState: {
      lineage: snapshot.defaultLineage,
      purposeClass: snapshot.defaultPurposeClass,
      trajectoryId: snapshot.trajectoryId,
      workflowId: snapshot.workflowId,
      taskIds: snapshot.taskIds,
      subtaskIds: snapshot.subtaskIds,
      checkpointId: snapshot.checkpointId,
    },
    runtimeState: {
      sessionID: input.sessionId,
      attachmentMode: snapshot.attachmentMode,
      runtimeAuthority: snapshot.runtimeAuthority,
      runtimeInstanceId: snapshot.runtimeInstanceId,
      serverBaseUrl: snapshot.serverBaseUrl,
      hasRuntimeAttachment: snapshot.hasRuntimeAttachment,
      hasHivemind: snapshot.hasHivemind,
      hivemindHealthy: snapshot.hivemindHealthy,
      hasWorkflow: snapshot.hasWorkflow,
      profileComplete: snapshot.profileComplete,
      missingProfileFields: snapshot.missingProfileFields,
      bootstrapProfile: snapshot.bootstrapProfile,
    },
    kernelState: kernel,
    supervisorState: supervisor,
    kernel,
    supervisor,
  }
}
