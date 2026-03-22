import type { KernelLineage, SessionScope } from '../../context/prompt-packet/index.js'
import { loadTrajectoryLedger } from '../../core/index.js'
import { createPlanningGovernanceProjection } from '../../governance/index.js'
import type { PurposeClass } from '../../features/session-entry/start-work-types.js'
import { createRecoveryCheckpoint, repairRecoveryState } from '../../recovery/index.js'
import { syncRuntimeSurface } from '../../cli/runtime-assets.js'
import { markEntryKernelQaPending } from '../../shared/entry-kernel-state.js'
import { loadRuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import { buildRuntimeEntryDecision } from '../../shared/contracts/runtime-status.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../../commands/slash-command/index.js'

import {
  resolveEntityBindings,
  resolveRuntimeIds,
  snapshotProfileValidated,
} from './handler-shared.js'
import type { LoadedCommandAsset } from './instruction-loader.js'

export interface DoctorOptions {
  sessionId: string
  sessionScope?: SessionScope
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  lineage?: KernelLineage
  purposeClass?: PurposeClass
}

export interface DoctorCommandResult extends Awaited<ReturnType<typeof executeSlashCommandBundle>> {
  closeoutStatus: 'open' | 'ready' | 'blocked' | 'qa-pending'
  nextCommand?: string
  recommendedCommands: string[]
}

export async function runDoctorCommand(directory: string, options: DoctorOptions): Promise<DoctorCommandResult> {
  const bundle = findSlashCommandBundle('hm-doctor')
  if (!bundle) {
    throw new Error('Missing hm-doctor command bundle.')
  }

  const commandResult = await executeSlashCommandBundle(bundle, {
    projectRoot: directory,
    sessionId: options.sessionId,
    sessionScope: options.sessionScope ?? 'main',
    trajectoryId: options.trajectoryId,
    workflowId: options.workflowId,
    taskIds: options.taskIds,
    subtaskIds: options.subtaskIds,
    lineage: options.lineage,
    purposeClass: options.purposeClass ?? 'course-correction',
    userMessage: 'repair runtime entry surfaces and recovery spine',
  })

  const entryDecision = buildRuntimeEntryDecision({
    closeoutStatus: commandResult.closeoutStatus,
    report: commandResult.report,
  })

  return {
    ...commandResult,
    closeoutStatus: entryDecision.closeoutStatus,
    nextCommand: entryDecision.nextCommand,
    recommendedCommands: entryDecision.recommendedCommands,
  }
}

export async function runDoctorHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const snapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)
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
  const runtimeSurfaceSync = repaired.status === 'healthy'
    ? await syncRuntimeSurface(input.projectRoot)
    : null
  if (repaired.status === 'healthy') {
    await markEntryKernelQaPending(input.projectRoot, {
      reason: 'doctor-complete-awaiting-qa',
      recoveryAction: 'hm-doctor',
      profileValidated: snapshot.profileComplete || snapshotProfileValidated(input),
    })
  }

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      status: repaired.status === 'healthy' ? 'qa-pending' : 'blocked',
      entry_state: repaired.status === 'healthy' ? 'qa-pending' : 'blocked',
      qa_state: repaired.status === 'healthy' ? 'pending' : 'failed',
      health_status: repaired.status,
      blockers: repaired.failureClasses,
      repair_actions: repaired.repairActions,
      active_trajectory: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      runtime_surface_sync: runtimeSurfaceSync
        ? {
            plugin_file: runtimeSurfaceSync.pluginFile,
          }
        : undefined,
      next_command: repaired.status === 'healthy' ? 'hm-harness' : 'hm-doctor',
      auto_recovery: input.entryKernelAction === 'auto-doctor'
        ? {
            action: 'hm-doctor',
            qaState: 'qa-pending',
          }
        : undefined,
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: [
      ...repaired.repairActions,
      'recovery-checkpoint-created',
      'planning-projection-created',
      ...(runtimeSurfaceSync ? ['runtime-surface-synced'] : []),
      ...(repaired.status === 'healthy' ? ['entry-kernel-qa-pending'] : []),
    ],
    artifactRefs: [
      projection.filePath,
      ...(runtimeSurfaceSync ? [runtimeSurfaceSync.pluginFile] : []),
    ],
    closeoutStatus: repaired.status === 'healthy' ? 'qa-pending' : 'blocked',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}
