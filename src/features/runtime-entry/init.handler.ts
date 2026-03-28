import {
  activateWorkflowTask,
  bootstrapTrajectoryLedger,
  bootstrapWorkflowAuthority,
} from '../../core/index.js'
import { createPlanningGovernanceProjection } from '../../governance/index.js'
import {
  resolveControlPlaneIntakeGate,
} from '../../control-plane/control-plane-intake.js'
import { findControlPlanePrimitive } from '../../control-plane/control-plane-registry.js'
import { createManagedRuntime } from '../../control-plane/sdk-runtime.js'
import { createRecoveryCheckpoint } from '../../recovery/index.js'
import { markEntryKernelQaPending } from '../../shared/entry-kernel-state.js'
import {
  loadRuntimeBindingsSnapshot,
  saveBootstrapRuntimeAttachmentSettings,
  saveRuntimeAttachmentSettings,
} from '../../shared/runtime-attachment.js'


import type { CommandExecutionInput, CommandExecutionResult, SlashCommandBundle } from '../../commands/slash-command/command-types.js'
import type { LoadedCommandAsset } from './instruction-loader.js'
import {
  createQuestionGateResult,
  hasAttachedSdkAuthority,
  resolveEntityBindings,
  resolveRuntimeIds,
  snapshotProfileValidated,
} from './handler-shared.js'
import { buildInitReport } from './init.helpers.js'

/**
 * Run the init handler for hm-init command execution.
 *
 * This handler is responsible for bootstrapping a new HiveMind runtime session.
 * It coordinates with multiple subsystems:
 * - Control plane for intake gates and primitives
 * - Core for workflow and trajectory management
 * - Recovery for checkpoint creation
 * - Governance for planning projections
 * - Runtime surface sync for OpenCode integration
 *
 * COUPLING NOTE: This function has deep coupling to 15+ modules due to the
 * nature of initialization - it must coordinate workflow authority, trajectory
 * ledger, recovery checkpoints, planning projections, and runtime surface sync.
 * Splitting this function would require abstracting all these dependencies,
 * which would add more complexity than it removes. The handler is kept as a
 * single unit to preserve atomicity of the initialization transaction.
 *
 * @param bundle - The slash command bundle
 * @param asset - The loaded command asset
 * @param input - The command execution input
 * @returns Promise resolving to command execution result
 */
export async function runInitHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const primitive = findControlPlanePrimitive('hm-init')
  const snapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)

  // Handle case where SDK is already attached and authoritative
  if (hasAttachedSdkAuthority(snapshot)) {
    const closeoutStatus = snapshot.qaState === 'pending' ? 'qa-pending' : 'ready'
    const report = buildInitReport({
      closeoutStatus,
      report: {
        status: closeoutStatus,
        entry_state: snapshot.entryState,
        qa_state: snapshot.qaState,
        routeDisposition: 'attach',
        next_command: 'hm-harness',
        guidance:
          'Attached OpenCode runtime is already authoritative; bootstrap was redirected to attach continuation.',
        runtimeAuthority: {
          runtimeAuthority: snapshot.runtimeAuthority,
          runtimeInstanceId: snapshot.runtimeInstanceId,
          serverBaseUrl: snapshot.serverBaseUrl,
        },
        safetyLevel: bundle.pressureContract.safety.level,
        failureBehavior: bundle.pressureContract.failureBehavior,
        expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
      },
    })

    return {
      commandId: bundle.id,
      title: bundle.title,
      agent: bundle.agent,
      executionMode: 'handler',
      contract: asset.contract,
      report,
      entityBindings: resolveEntityBindings(input),
      stateTransitions: ['attach-active-bootstrap-refused'],
      closeoutStatus,
      verificationContractId: asset.contract.verificationContract,
      pressureContract: bundle.pressureContract,
    }
  }

  // Check for auto-recovery mode
  const autoRecovery = input.entryKernelAction === 'auto-init'
  const intakeResolution = primitive
    ? resolveControlPlaneIntakeGate(primitive, input, snapshot)
    : { gate: null, profileInput: {} }

  // Return question gate result if intake is required
  if (intakeResolution.gate && !autoRecovery) {
    return createQuestionGateResult(bundle, asset, input, intakeResolution.gate)
  }

  // Resolve runtime IDs for trajectory and workflow
  const ids = resolveRuntimeIds(input)

  // Create managed runtime via SDK
  const managedRuntime = await createManagedRuntime({
    sessionId: input.sessionId,
    serverOptions: {
      port: 0,
    },
  })

  // Save bootstrap profile settings
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

  // Save runtime attachment settings with managed SDK authority
  await saveRuntimeAttachmentSettings(input.projectRoot, {
    runtimeAuthority: 'managed-sdk',
    runtimeInstanceId: managedRuntime.runtimeInstanceId,
    serverBaseUrl: managedRuntime.serverBaseUrl,
  })

  // Mark entry kernel as QA pending
  await markEntryKernelQaPending(input.projectRoot, {
    reason: autoRecovery ? 'auto-init-complete-awaiting-qa' : 'init-complete-awaiting-qa',
    recoveryAction: autoRecovery ? 'hm-init' : undefined,
    profileValidated: !autoRecovery && snapshotProfileValidated(input),
  })

  // Bootstrap workflow authority
  const status = bootstrapWorkflowAuthority(input.projectRoot, {
    workflowId: ids.workflowId,
    taskIds: input.taskIds ?? [],
    sessionScope: input.sessionScope,
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })

  // Activate first task if taskIds provided
  if ((input.taskIds?.length ?? 0) > 0) {
    activateWorkflowTask(input.projectRoot, {
      workflowId: ids.workflowId,
      taskId: input.taskIds![0]!,
      title: input.taskIds![0]!,
    })
  }

  // Bootstrap trajectory ledger
  const trajectoryLedger = await bootstrapTrajectoryLedger(input.projectRoot, {
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    sessionId: input.sessionId,
    lineage: input.lineage ?? 'hiveminder',
    purposeClass: input.purposeClass ?? 'planning',
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
  })

  // Create recovery checkpoint
  const checkpoint = await createRecoveryCheckpoint(input.projectRoot, {
    trajectoryId: ids.trajectoryId,
    workflowId: ids.workflowId,
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
    source: `command:${bundle.id}`,
    resumeTarget: 'command:hm-harness',
  })

  // Create planning governance projection
  const projection = await createPlanningGovernanceProjection(input.projectRoot, ids)

  const closeoutStatus = 'qa-pending'
  const report = buildInitReport({
    closeoutStatus,
    report: {
      status: 'qa-pending',
      entry_state: 'qa-pending',
      qa_state: 'pending',
      created_state: status.exists,
      trajectory_state: trajectoryLedger.activeTrajectoryId,
      checkpoint_id: checkpoint.id,
      planning_projection: projection.filePath,
      runtimeAuthority: {
        runtimeAuthority: 'managed-sdk',
        runtimeInstanceId: managedRuntime.runtimeInstanceId,
        serverBaseUrl: managedRuntime.serverBaseUrl,
      },
      missing_prerequisites: status.issues.map((issue) => issue.code),
      next_command: 'hm-harness',
      auto_recovery: autoRecovery
        ? {
            action: 'hm-init',
            qaState: 'qa-pending',
          }
        : undefined,
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
  })

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report,
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
      'entry-kernel-qa-pending',
    ],
    artifactRefs: [
      projection.filePath,
    ],
    closeoutStatus,
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}
