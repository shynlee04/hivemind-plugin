import {
  activateWorkflowTask,
  bootstrapTrajectoryLedger,
  bootstrapWorkflowAuthority,
  loadTrajectoryLedger,
} from '../core/index.js'
import { syncRuntimeSurface } from '../cli/runtime-assets.js'
import { createPlanningGovernanceProjection } from '../governance/index.js'
import { assessRecoveryState, createRecoveryCheckpoint, repairRecoveryState } from '../recovery/index.js'
import { markEntryKernelQaPending, markEntryKernelReady } from '../shared/entry-kernel-state.js'
import {
  loadRuntimeBindingsSnapshot,
  saveBootstrapRuntimeAttachmentSettings,
  saveRuntimeAttachmentSettings,
} from '../shared/runtime-attachment.js'
import type { CommandExecutionInput, CommandExecutionResult, SlashCommandBundle } from '../commands/slash-command/command-types.js'
import type { LoadedCommandAsset } from '../hooks/runtime-bridge/instruction-loader.js'
import { findControlPlanePrimitive } from './control-plane-registry.js'
import { resolveControlPlaneIntakeGate } from './control-plane-intake.js'

function snapshotProfileValidated(input: CommandExecutionInput): boolean {
  return !!(
    input.preferredUserName
    || input.language
    || input.artifactLanguage
    || input.governanceMode
    || input.automationLevel
    || input.expertLevel
    || input.outputStyle
    || input.intakeEvidence
    || input.presetId
  )
}

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

function createQuestionGateResult(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
  intakeGate: NonNullable<ReturnType<typeof resolveControlPlaneIntakeGate>['gate']>,
): CommandExecutionResult {
  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'question-gate',
    contract: asset.contract,
    report: {
      status: 'intake-required',
      next_command: bundle.id,
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
      intake: intakeGate,
    },
    entityBindings: resolveEntityBindings(input),
    closeoutStatus: 'blocked',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}

async function runInit(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const primitive = findControlPlanePrimitive('hm-init')
  const snapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)
  const autoRecovery = input.entryKernelAction === 'auto-init'
  const intakeResolution = primitive
    ? resolveControlPlaneIntakeGate(primitive, input, snapshot)
    : { gate: null, profileInput: {} }
  if (intakeResolution.gate && !autoRecovery) {
    return createQuestionGateResult(bundle, asset, input, intakeResolution.gate)
  }

  const ids = resolveRuntimeIds(input)
  const profileSettings = await saveBootstrapRuntimeAttachmentSettings(input.projectRoot, {
    preferredUserName: intakeResolution.profileInput.preferredUserName,
    defaultLineage: input.lineage,
    defaultPurposeClass: input.purposeClass,
    governanceMode: intakeResolution.profileInput.governanceMode,
    automationLevel: intakeResolution.profileInput.automationLevel,
    language: intakeResolution.profileInput.language,
    artifactLanguage: intakeResolution.profileInput.artifactLanguage,
    outputStyle: intakeResolution.profileInput.outputStyle,
    expertLevel: intakeResolution.profileInput.expertLevel,
  })
  await markEntryKernelQaPending(input.projectRoot, {
    reason: autoRecovery ? 'auto-init-complete-awaiting-qa' : 'init-complete-awaiting-qa',
    recoveryAction: autoRecovery ? 'hm-init' : undefined,
    profileValidated: !autoRecovery && snapshotProfileValidated(input),
  })
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
  const runtimeSurfaceSync = await syncRuntimeSurface(input.projectRoot)

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      status: 'qa-pending',
      entry_state: 'qa-pending',
      qa_state: 'pending',
      created_state: status.exists,
      trajectory_state: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      runtime_surfaces: {
        pluginFile: runtimeSurfaceSync.pluginFile,
        mirroredCommandCount: runtimeSurfaceSync.mirroredCommandFiles.length,
        mirroredAgentCount: runtimeSurfaceSync.mirroredAgentFiles.length,
      },
      missing_prerequisites: status.issues.map((issue) => issue.code),
      next_command: 'hm-harness',
      auto_recovery: autoRecovery ? {
        action: 'hm-init',
        qaState: 'qa-pending',
      } : undefined,
      profile: {
        preferredUserName: profileSettings.preferredUserName ?? null,
        chatLanguage: profileSettings.language,
        artifactLanguage: profileSettings.artifactLanguage,
        expertiseLevel: profileSettings.expertLevel,
        governanceMode: profileSettings.governanceMode,
        automationLevel: profileSettings.automationLevel,
        outputStyle: profileSettings.outputStyle,
      },
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
      intake: input.intakeEvidence
        ? {
            questionnaireId: input.intakeEvidence.questionnaireId,
            completedGroups: input.intakeEvidence.completedGroups,
            usedRecommendedPresetGroups: input.intakeEvidence.usedRecommendedPresetGroups ?? [],
            displayLanguage: input.intakeEvidence.displayLanguage,
          }
        : undefined,
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
      'runtime-surface-synced',
      'entry-kernel-qa-pending',
    ],
    artifactRefs: [projection.filePath, runtimeSurfaceSync.pluginFile],
    closeoutStatus: 'qa-pending',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}

async function runDoctor(
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
      runtime_surfaces: runtimeSurfaceSync
        ? {
            pluginFile: runtimeSurfaceSync.pluginFile,
            mirroredCommandCount: runtimeSurfaceSync.mirroredCommandFiles.length,
            mirroredAgentCount: runtimeSurfaceSync.mirroredAgentFiles.length,
          }
        : undefined,
      next_command: repaired.status === 'healthy' ? 'hm-harness' : 'hm-doctor',
      auto_recovery: input.entryKernelAction === 'auto-doctor' ? {
        action: 'hm-doctor',
        qaState: 'qa-pending',
      } : undefined,
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
  if (assessment.status === 'healthy') {
    await markEntryKernelReady(input.projectRoot, 'harness-qa-passed')
  }

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      status: assessment.status === 'healthy' ? 'ready' : 'blocked',
      entry_state: assessment.status === 'healthy' ? 'ready' : 'blocked',
      qa_state: assessment.status === 'healthy' ? 'passed' : 'failed',
      readiness: assessment.status === 'healthy',
      integration_gaps: assessment.failureClasses,
      approved_workflow_chain: assessment.status === 'healthy' ? bundle.workflowChain : [],
      active_trajectory: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      next_command: assessment.status === 'healthy'
        ? undefined
        : assessment.failureClasses.includes('missing-hivemind')
          ? 'hm-init'
          : 'hm-doctor',
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: assessment.status === 'healthy'
      ? ['recovery-spine-ready', 'recovery-checkpoint-created', 'planning-projection-created', 'entry-kernel-ready']
      : ['recovery-spine-blocked', 'recovery-checkpoint-created', 'planning-projection-created'],
    artifactRefs: [projection.filePath],
    closeoutStatus: assessment.status === 'healthy' ? 'ready' : 'blocked',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}

async function runSettings(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const primitive = findControlPlanePrimitive('hm-settings')
  const snapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)
  const intakeResolution = primitive
    ? resolveControlPlaneIntakeGate(primitive, input, snapshot)
    : { gate: null, profileInput: {} }
  if (intakeResolution.gate) {
    return createQuestionGateResult(bundle, asset, input, intakeResolution.gate)
  }

  const updatedSettings = await saveRuntimeAttachmentSettings(input.projectRoot, {
    preferredUserName: intakeResolution.profileInput.preferredUserName,
    language: intakeResolution.profileInput.language,
    artifactLanguage: intakeResolution.profileInput.artifactLanguage,
    expertLevel: intakeResolution.profileInput.expertLevel,
    governanceMode: intakeResolution.profileInput.governanceMode,
    automationLevel: intakeResolution.profileInput.automationLevel,
    outputStyle: intakeResolution.profileInput.outputStyle,
  })
  const changedFields = [
    updatedSettings.preferredUserName !== snapshot.preferredUserName ? 'preferredUserName' : null,
    updatedSettings.language !== snapshot.language ? 'chatLanguage' : null,
    updatedSettings.artifactLanguage !== snapshot.artifactLanguage ? 'artifactLanguage' : null,
    updatedSettings.expertLevel !== snapshot.expertLevel ? 'expertiseLevel' : null,
    updatedSettings.outputStyle !== snapshot.outputStyle ? 'outputStyle' : null,
    updatedSettings.governanceMode !== snapshot.governanceMode ? 'governanceMode' : null,
    updatedSettings.automationLevel !== snapshot.automationLevel ? 'automationLevel' : null,
  ].filter((field): field is string => field !== null)

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      updated_settings: {
        preferredUserName: updatedSettings.preferredUserName ?? null,
        chatLanguage: updatedSettings.language,
        artifactLanguage: updatedSettings.artifactLanguage,
        expertiseLevel: updatedSettings.expertLevel,
        governanceMode: updatedSettings.governanceMode,
        automationLevel: updatedSettings.automationLevel,
        outputStyle: updatedSettings.outputStyle,
      },
      changed_fields: changedFields,
      impact_summary: changedFields.map((field) => `updated:${field}`),
      follow_up_needed: changedFields.includes('chatLanguage') || changedFields.includes('artifactLanguage')
        ? ['refresh-session-guidance']
        : [],
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
      intake: input.intakeEvidence
        ? {
            questionnaireId: input.intakeEvidence.questionnaireId,
            completedGroups: input.intakeEvidence.completedGroups,
            usedRecommendedPresetGroups: input.intakeEvidence.usedRecommendedPresetGroups ?? [],
            displayLanguage: input.intakeEvidence.displayLanguage,
          }
        : undefined,
    },
    entityBindings: resolveEntityBindings(input),
    stateTransitions: changedFields.map((field) => `runtime-setting-updated:${field}`),
    closeoutStatus: 'ready',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}

const controlPlaneHandlers: Record<string, typeof runInit> = {
  'hm-init': runInit,
  'hm-doctor': runDoctor,
  'hm-harness': runHarness,
  'hm-settings': runSettings,
}

export async function executeControlPlaneHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult | null> {
  const handler = controlPlaneHandlers[bundle.id]
  if (!handler) {
    return null
  }

  return handler(bundle, asset, input)
}
