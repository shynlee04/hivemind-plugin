import { randomUUID } from 'node:crypto'

import type { KernelLineage, SessionScope } from '../../context/prompt-packet/index.js'
import {
  activateWorkflowTask,
  bootstrapTrajectoryLedger,
  bootstrapWorkflowAuthority,
} from '../../core/index.js'
import { createPlanningGovernanceProjection } from '../../governance/index.js'
import {
  buildNonInteractiveIntakeError,
  resolveControlPlaneIntakeGate,
} from '../../control-plane/control-plane-intake.js'
import type { ControlPlaneRecommendedPresetId } from '../../control-plane/control-plane-types.js'
import { findControlPlanePrimitive } from '../../control-plane/control-plane-registry.js'
import { createManagedRuntime } from '../../control-plane/sdk-runtime.js'
import { syncRuntimeSurface } from '../../cli/runtime-assets.js'
import type { PurposeClass } from '../../features/session-entry/start-work-types.js'
import { createRecoveryCheckpoint } from '../../recovery/index.js'
import { markEntryKernelQaPending } from '../../shared/entry-kernel-state.js'
import type { RuntimeAttachmentSettings } from '../../shared/runtime-attachment.js'
import {
  loadRuntimeBindingsSnapshot,
  saveBootstrapRuntimeAttachmentSettings,
  saveRuntimeAttachmentSettings,
} from '../../shared/runtime-attachment.js'
import {
  attachRuntimeIdentityAndReadiness,
  buildRuntimeEntryDecision,
  type ReadinessSignal,
  type RuntimeIdentity,
} from '../../shared/contracts/runtime-status.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'
import { executeSlashCommandBundle, findSlashCommandBundle } from '../../commands/slash-command/index.js'

import {
  createQuestionGateResult,
  hasAttachedSdkAuthority,
  resolveEntityBindings,
  resolveRuntimeIds,
  snapshotProfileValidated,
} from './handler-shared.js'
import type { LoadedCommandAsset } from './instruction-loader.js'

export interface InitOptions extends Partial<RuntimeAttachmentSettings> {
  presetId?: ControlPlaneRecommendedPresetId
  sessionId?: string
  sessionScope?: SessionScope
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  lineage?: KernelLineage
  purposeClass?: PurposeClass
  silent?: boolean
}

export interface InitProjectResult {
  sessionId: string
  trajectoryId: string
  workflowId: string
  closeoutStatus: 'open' | 'ready' | 'blocked' | 'qa-pending'
  nextCommand?: string
  recommendedCommands: string[]
  runtime_identity: RuntimeIdentity
  readiness_signal: ReadinessSignal
  commandResult: Awaited<ReturnType<typeof executeSlashCommandBundle>>
}

function buildInitReport(input: {
  closeoutStatus: 'open' | 'ready' | 'blocked' | 'qa-pending'
  report: Record<string, unknown>
}): Record<string, unknown> & {
  runtime_identity: RuntimeIdentity
  readiness_signal: ReadinessSignal
} {
  return attachRuntimeIdentityAndReadiness({
    closeoutStatus: input.closeoutStatus,
    report: input.report,
  })
}

function createRuntimeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 12)}`
}

export async function initProject(directory: string, options: InitOptions = {}): Promise<InitProjectResult> {
  const sessionId = options.sessionId ?? createRuntimeId('ses')
  const workflowId = options.workflowId ?? createRuntimeId('wf')
  const trajectoryId = options.trajectoryId ?? createRuntimeId('trj')
  const lineage = options.lineage ?? options.defaultLineage ?? 'hivefiver'
  const purposeClass = options.purposeClass ?? options.defaultPurposeClass ?? 'planning'
  const primitive = findControlPlanePrimitive('hm-init')
  if (!primitive) {
    throw new Error('Missing hm-init control-plane primitive.')
  }
  const intakeResolution = resolveControlPlaneIntakeGate(primitive, {
    projectRoot: directory,
    sessionId,
    sessionScope: options.sessionScope ?? 'main',
    presetId: options.presetId,
    preferredUserName: options.preferredUserName,
    language: options.language,
    artifactLanguage: options.artifactLanguage,
    governanceMode: options.governanceMode,
    automationLevel: options.automationLevel,
    expertLevel: options.expertLevel,
    outputStyle: options.outputStyle,
    userMessage: 'initialize hivemind runtime entry surfaces',
  })
  if (intakeResolution.gate) {
    throw new Error(buildNonInteractiveIntakeError(primitive, intakeResolution.gate))
  }

  const bundle = findSlashCommandBundle('hm-init')
  if (!bundle) {
    throw new Error('Missing hm-init command bundle.')
  }

  const commandResult = await executeSlashCommandBundle(bundle, {
    projectRoot: directory,
    sessionId,
    sessionScope: options.sessionScope ?? 'main',
    presetId: options.presetId,
    intakeEvidence: {
      source: options.presetId ? 'preset' : 'cli-flags',
      questionnaireId: 'bootstrap-profile-v1',
      displayLanguage: options.language ?? 'en',
      completedGroups: ['identity-language', 'expertise-style', 'governance-automation'],
      usedRecommendedPresetGroups: options.presetId ? ['identity-language', 'expertise-style', 'governance-automation'] : [],
    },
    lineage,
    purposeClass,
    trajectoryId,
    workflowId,
    taskIds: options.taskIds,
    subtaskIds: options.subtaskIds,
    preferredUserName: options.preferredUserName,
    language: options.language,
    artifactLanguage: options.artifactLanguage,
    governanceMode: options.governanceMode,
    automationLevel: options.automationLevel,
    expertLevel: options.expertLevel,
    outputStyle: options.outputStyle,
    userMessage: 'initialize hivemind runtime entry surfaces',
  })
  const entryDecision = buildRuntimeEntryDecision({
    closeoutStatus: commandResult.closeoutStatus,
    report: commandResult.report,
  })
  const report = buildInitReport({
    closeoutStatus: entryDecision.closeoutStatus,
    report: commandResult.report,
  })

  return {
    sessionId,
    trajectoryId,
    workflowId,
    closeoutStatus: entryDecision.closeoutStatus,
    nextCommand: entryDecision.nextCommand,
    recommendedCommands: entryDecision.recommendedCommands,
    runtime_identity: report.runtime_identity,
    readiness_signal: report.readiness_signal,
    commandResult: {
      ...commandResult,
      report,
    },
  }
}

export async function runInitHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const primitive = findControlPlanePrimitive('hm-init')
  const snapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)
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
        guidance: 'Attached OpenCode runtime is already authoritative; bootstrap was redirected to attach continuation.',
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

  const autoRecovery = input.entryKernelAction === 'auto-init'
  const intakeResolution = primitive
    ? resolveControlPlaneIntakeGate(primitive, input, snapshot)
    : { gate: null, profileInput: {} }
  if (intakeResolution.gate && !autoRecovery) {
    return createQuestionGateResult(bundle, asset, input, intakeResolution.gate)
  }

  const ids = resolveRuntimeIds(input)
  const managedRuntime = await createManagedRuntime({
    sessionId: input.sessionId,
    serverOptions: {
      port: 0,
    },
  })
  const runtimeSurfaceSync = await syncRuntimeSurface(input.projectRoot)
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
  await saveRuntimeAttachmentSettings(input.projectRoot, {
    runtimeAuthority: 'managed-sdk',
    runtimeInstanceId: managedRuntime.runtimeInstanceId,
    serverBaseUrl: managedRuntime.serverBaseUrl,
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
      runtime_surface_sync: {
        plugin_file: runtimeSurfaceSync.pluginFile,
        mirrored_command_files: runtimeSurfaceSync.mirroredCommandFiles,
        mirrored_agent_files: runtimeSurfaceSync.mirroredAgentFiles,
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
      'runtime-surface-synced',
      'entry-kernel-qa-pending',
    ],
    artifactRefs: [
      projection.filePath,
      runtimeSurfaceSync.pluginFile,
      ...runtimeSurfaceSync.mirroredCommandFiles,
      ...runtimeSurfaceSync.mirroredAgentFiles,
    ],
    closeoutStatus,
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}
