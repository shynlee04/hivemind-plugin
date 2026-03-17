import {
  runtimeStatusSchema,
  type RuntimeStatus,
} from '../../../../src/shared/contracts/runtime-status.js'

export interface LoadRuntimeStatusInput {
  projectRoot?: string
  sessionId?: string
  agentId?: string
}

export function parseRuntimeStatus(input: unknown): RuntimeStatus {
  return runtimeStatusSchema.parse(input)
}

export async function loadRuntimeStatus(input: LoadRuntimeStatusInput = {}): Promise<RuntimeStatus> {
  const projectRoot = input.projectRoot ?? process.cwd()
  const sessionId = input.sessionId ?? 'opentui-runtime-status'
  const agentId = input.agentId ?? 'opentui'
  const [{ buildRuntimeStatusSnapshot }, { loadRuntimeBindingsSnapshot }] = await Promise.all([
    import('../../../../src/sdk-supervisor/runtime-status.js'),
    import('../../../../src/shared/runtime-attachment.js'),
  ])
  const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
  const statusSnapshot = await buildRuntimeStatusSnapshot({
    projectRoot,
    sessionId,
    agentId,
    snapshot,
  })

  return parseRuntimeStatus({
    runtimeAuthority: statusSnapshot.runtimeAuthority,
    runtimeInstanceId: statusSnapshot.runtimeInstanceId,
    serverBaseUrl: statusSnapshot.serverBaseUrl,
    entryState: snapshot.entryState,
    interactiveBootstrapRequired: snapshot.interactiveBootstrapRequired,
    recommendedNext: snapshot.entryState === 'uninitialized'
      ? 'hm-init'
      : snapshot.entryState === 'repair-required'
        ? 'hm-doctor'
        : snapshot.qaState === 'pending'
          ? 'hm-harness'
          : 'none',
    qaState: snapshot.qaState,
    releaseState: snapshot.releaseState,
    supervisorStatus: statusSnapshot.supervisor.health.overallStatus,
    trajectoryId: snapshot.trajectoryId,
    workflowId: snapshot.workflowId,
    taskIds: snapshot.taskIds,
    subtaskIds: snapshot.subtaskIds,
    checkpointId: snapshot.checkpointId,
  })
}
