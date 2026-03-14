import {
  activateWorkflowTask,
  bootstrapTrajectoryLedger,
  bootstrapWorkflowAuthority,
  loadTrajectoryLedger,
} from '../../core/index.js'
import { createPlanningGovernanceProjection } from '../../governance/index.js'
import { assessRecoveryState, createRecoveryCheckpoint, repairRecoveryState } from '../../recovery/index.js'
import type { CommandExecutionInput, CommandExecutionResult, SlashCommandBundle } from './command-types.js'
import type { LoadedCommandAsset } from '../runtime/instruction-loader.js'

function resolveEntityBindings(input: CommandExecutionInput): NonNullable<CommandExecutionResult['entityBindings']> {
  return {
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId ?? input.sessionId,
    taskIds: input.taskIds ?? [],
    subtaskIds: input.subtaskIds ?? [],
    delegationId: input.delegationId,
  }
}

function resolveRuntimeIds(
  input: CommandExecutionInput,
  activeTrajectoryId?: string | null,
): { trajectoryId: string; workflowId: string } {
  return {
    trajectoryId: input.trajectoryId ?? activeTrajectoryId ?? `trj_${input.sessionId}`,
    workflowId: input.workflowId ?? input.sessionId,
  }
}

async function runInit(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const ids = resolveRuntimeIds(input)
  const status = bootstrapWorkflowAuthority(input.projectRoot, {
    workflowId: ids.workflowId,
    taskIds: input.taskIds ?? [],
    sessionScope: input.sessionScope,
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })
  if ((input.taskIds?.length ?? 0) > 0) {
    activateWorkflowTask(input.projectRoot, {
      workflowId: ids.workflowId,
      taskId: input.taskIds![0]!,
      title: input.taskIds![0]!,
    })
  }
  const trajectoryLedger = await bootstrapTrajectoryLedger(input.projectRoot, {
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    sessionId: input.sessionId,
    lineage: input.lineage ?? 'hiveminder',
    purposeClass: input.purposeClass ?? 'planning',
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
  })
  const checkpoint = await createRecoveryCheckpoint(input.projectRoot, {
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
    source: `command:${bundle.id}`,
    resumeTarget: 'command:hm-harness',
  })
  const projection = await createPlanningGovernanceProjection(input.projectRoot, ids)

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      status: status.healthy ? 'initialized' : 'degraded',
      created_state: status.exists,
      trajectory_state: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      missing_prerequisites: status.issues.map((issue) => issue.code),
      next_command: input.purposeClass ? `hm-${input.purposeClass === 'planning' ? 'plan' : 'harness'}` : 'hm-harness',
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: [
      'workflow-authority-bootstrapped',
      'trajectory-bootstrapped',
      'recovery-checkpoint-created',
      'planning-projection-created',
    ],
    artifactRefs: [projection.filePath],
    closeoutStatus: status.healthy ? 'ready' : 'blocked',
    verificationContractId: asset.contract.verificationContract,
  }
}

async function runDoctor(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const trajectoryLedger = await loadTrajectoryLedger(input.projectRoot)
  const ids = resolveRuntimeIds(input, trajectoryLedger.activeTrajectoryId)
  const repaired = await repairRecoveryState(input.projectRoot, {
    sessionScope: input.sessionScope,
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds ?? [],
    lineage: input.lineage,
    purposeClass: input.purposeClass,
  })
  const checkpoint = await createRecoveryCheckpoint(input.projectRoot, {
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
    source: `command:${bundle.id}`,
    resumeTarget: repaired.status === 'healthy' ? 'command:hm-harness' : 'command:hm-doctor',
  })
  const projection = await createPlanningGovernanceProjection(input.projectRoot, ids)

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      health_status: repaired.status,
      blockers: repaired.failureClasses,
      repair_actions: repaired.repairActions,
      active_trajectory: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      next_command: repaired.status === 'healthy' ? 'hm-harness' : 'hm-doctor',
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: [...repaired.repairActions, 'recovery-checkpoint-created', 'planning-projection-created'],
    artifactRefs: [projection.filePath],
    closeoutStatus: repaired.status === 'healthy' ? 'ready' : 'blocked',
    verificationContractId: asset.contract.verificationContract,
  }
}

async function runHarness(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const trajectoryLedger = await loadTrajectoryLedger(input.projectRoot)
  const ids = resolveRuntimeIds(input, trajectoryLedger.activeTrajectoryId)
  const assessment = await assessRecoveryState(input.projectRoot, {
    sessionScope: input.sessionScope,
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds ?? [],
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })
  const checkpoint = await createRecoveryCheckpoint(input.projectRoot, {
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
    source: `command:${bundle.id}`,
    resumeTarget: assessment.status === 'healthy' ? 'command:hm-plan' : 'command:hm-doctor',
  })
  const projection = await createPlanningGovernanceProjection(input.projectRoot, ids)

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      readiness: assessment.status === 'healthy',
      integration_gaps: assessment.failureClasses,
      approved_workflow_chain: assessment.status === 'healthy' ? bundle.workflowChain : [],
      active_trajectory: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      next_command: assessment.status === 'healthy' ? undefined : assessment.failureClasses.includes('missing-hivemind') ? 'hm-init' : 'hm-doctor',
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: assessment.status === 'healthy'
      ? ['recovery-spine-ready', 'recovery-checkpoint-created', 'planning-projection-created']
      : ['recovery-spine-blocked', 'recovery-checkpoint-created', 'planning-projection-created'],
    artifactRefs: [projection.filePath],
    closeoutStatus: assessment.status === 'healthy' ? 'ready' : 'blocked',
    verificationContractId: asset.contract.verificationContract,
  }
}

const recoveryHandlers: Record<string, typeof runInit> = {
  'hm-init': runInit,
  'hm-doctor': runDoctor,
  'hm-harness': runHarness,
}

export async function executeRecoveryHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult | null> {
  const handler = recoveryHandlers[bundle.id]
  if (!handler) {
    return null
  }

  return handler(bundle, asset, input)
}
