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
import { loadTrajectoryLedger } from '../core/trajectory/index.js'
import type { RuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'
import {
  createSupervisorStatusReport,
  type SupervisorStatusReport,
} from './health.js'
import type {
  RuntimeRecentEvent,
} from '../shared/contracts/runtime-events.js'
import type {
  RuntimeStatus,
  RuntimeWorkflowGateState,
  RuntimeWorkflowSummary,
} from '../shared/contracts/runtime-status.js'

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

function getWorkflowGateState(snapshot: RuntimeBindingsSnapshot): RuntimeWorkflowGateState {
  if (!snapshot.workflowId) {
    return 'idle'
  }

  if (snapshot.entryState === 'uninitialized') {
    return 'bootstrap-required'
  }

  if (snapshot.entryState === 'repair-required' || snapshot.releaseState === 'blocked') {
    return 'blocked'
  }

  if (snapshot.qaState === 'pending') {
    return 'qa-pending'
  }

  return 'ready'
}

function buildWorkflowSummary(snapshot: RuntimeBindingsSnapshot): RuntimeWorkflowSummary | null {
  if (!snapshot.workflowId) {
    return null
  }

  return {
    workflowId: snapshot.workflowId,
    gateState: getWorkflowGateState(snapshot),
    currentTaskIds: snapshot.taskIds,
    currentSubtaskIds: snapshot.subtaskIds,
  }
}

function createRuntimeEventSnapshot(
  snapshot: RuntimeBindingsSnapshot,
  recordedAt: string,
): RuntimeRecentEvent | null {
  if (snapshot.runtimeAuthority === 'none') {
    return null
  }

  return {
    eventKind: 'runtime',
    source: 'runtime-attachment',
    recordedAt,
    summary: `Runtime authority ${snapshot.runtimeAuthority} attached${snapshot.runtimeInstanceId ? ` as ${snapshot.runtimeInstanceId}` : ''}.`,
  }
}

function createWorkflowEventSnapshot(
  snapshot: RuntimeBindingsSnapshot,
  recordedAt: string,
): RuntimeRecentEvent | null {
  if (!snapshot.workflowId) {
    return null
  }

  return {
    eventKind: 'workflow',
    source: 'workflow-authority',
    recordedAt,
    summary: `Workflow ${snapshot.workflowId} is ${getWorkflowGateState(snapshot)} with ${snapshot.taskIds.length} active task link(s).`,
  }
}

async function buildRecentEvents(input: {
  projectRoot: string
  snapshot: RuntimeBindingsSnapshot
  recordedAt: string
}): Promise<RuntimeRecentEvent[]> {
  const ledger = await loadTrajectoryLedger(input.projectRoot)
  const activeTrajectory = input.snapshot.trajectoryId
    ? ledger.trajectories.find((trajectory: (typeof ledger.trajectories)[number]) => trajectory.id === input.snapshot.trajectoryId)
    : undefined
  const trajectoryEvents = (activeTrajectory?.events ?? [])
    .slice(-3)
    .reverse()
    .map((event: { kind: string; createdAt?: string; summary: string }) => ({
      eventKind: event.kind,
      source: 'trajectory-ledger',
      recordedAt: event.createdAt ?? input.recordedAt,
      summary: event.summary,
    })) satisfies RuntimeRecentEvent[]
  const supplementalEvents = [
    createWorkflowEventSnapshot(input.snapshot, input.recordedAt),
    createRuntimeEventSnapshot(input.snapshot, input.recordedAt),
  ].filter((event): event is RuntimeRecentEvent => event !== null)

  return [...trajectoryEvents, ...supplementalEvents].slice(0, 5)
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
  const workflowSummary = buildWorkflowSummary(snapshot)
  const recentEvents = await buildRecentEvents({
    projectRoot: input.projectRoot,
    snapshot,
    recordedAt,
  })

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
    workflowSummary,
    recentEvents,
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
