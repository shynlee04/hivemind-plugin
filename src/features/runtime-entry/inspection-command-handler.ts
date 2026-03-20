import { loadTrajectoryLedger } from '../../core/index.js'
import { inspectWorkflowAuthority } from '../../core/workflow-management/index.js'
import { loadRuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'

import { resolveEntityBindings, resolveRuntimeIds } from './handler-shared.js'
import type { LoadedCommandAsset } from './instruction-loader.js'
import { loadWorkflowContinuityTransactionForExecution } from './workflow-continuity.js'

type InspectionCommandId = 'hm-research' | 'hm-verify' | 'hm-tdd' | 'hm-course-correct'

interface InspectionProfile {
  statusLabel: string
  stateTransition: string
  buildFocus: (input: {
    snapshot: Awaited<ReturnType<typeof loadRuntimeBindingsSnapshot>>
    workflowHealthy: boolean
    activeTaskIds: string[]
    hasContinuity: boolean
  }) => Record<string, unknown>
  resolveNextCommand: (input: {
    snapshot: Awaited<ReturnType<typeof loadRuntimeBindingsSnapshot>>
    workflowHealthy: boolean
  }) => string | undefined
}

const inspectionProfiles: Record<InspectionCommandId, InspectionProfile> = {
  'hm-research': {
    statusLabel: 'research-readiness',
    stateTransition: 'research-inspection-executed',
    buildFocus: ({ snapshot, workflowHealthy, activeTaskIds, hasContinuity }) => ({
      research_scope: {
        workflowReady: workflowHealthy,
        hasContinuity,
        activeTaskIds,
        artifactLanguage: snapshot.artifactLanguage,
      },
    }),
    resolveNextCommand: ({ snapshot, workflowHealthy }) => {
      if (!workflowHealthy) {
        return snapshot.entryState === 'uninitialized' ? 'hm-init' : 'hm-doctor'
      }

      return 'hm-plan'
    },
  },
  'hm-verify': {
    statusLabel: 'verification-readiness',
    stateTransition: 'verification-inspection-executed',
    buildFocus: ({ snapshot, workflowHealthy, activeTaskIds, hasContinuity }) => ({
      verification_scope: {
        workflowReady: workflowHealthy,
        qaState: snapshot.qaState,
        hasContinuity,
        activeTaskIds,
      },
    }),
    resolveNextCommand: ({ snapshot, workflowHealthy }) => {
      if (!workflowHealthy) {
        return snapshot.entryState === 'uninitialized' ? 'hm-init' : 'hm-doctor'
      }

      return snapshot.qaState === 'pending' ? 'hm-harness' : undefined
    },
  },
  'hm-tdd': {
    statusLabel: 'tdd-readiness',
    stateTransition: 'tdd-inspection-executed',
    buildFocus: ({ snapshot, workflowHealthy, activeTaskIds, hasContinuity }) => ({
      tdd_scope: {
        workflowReady: workflowHealthy,
        hasContinuity,
        activeTaskIds,
        governanceMode: snapshot.governanceMode,
      },
    }),
    resolveNextCommand: ({ snapshot, workflowHealthy }) => {
      if (!workflowHealthy) {
        return snapshot.entryState === 'uninitialized' ? 'hm-init' : 'hm-doctor'
      }

      return 'hm-implement'
    },
  },
  'hm-course-correct': {
    statusLabel: 'course-correction-readiness',
    stateTransition: 'course-correction-inspection-executed',
    buildFocus: ({ snapshot, workflowHealthy, activeTaskIds, hasContinuity }) => ({
      recovery_scope: {
        workflowReady: workflowHealthy,
        hasContinuity,
        activeTaskIds,
        entryState: snapshot.entryState,
        releaseState: snapshot.releaseState,
      },
    }),
    resolveNextCommand: ({ snapshot, workflowHealthy }) => {
      if (!workflowHealthy || snapshot.entryState === 'repair-required') {
        return snapshot.entryState === 'uninitialized' ? 'hm-init' : 'hm-doctor'
      }

      return undefined
    },
  },
}

async function runInspectionCommandHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const snapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)
  const trajectoryLedger = await loadTrajectoryLedger(input.projectRoot)
  const ids = resolveRuntimeIds(input, trajectoryLedger.activeTrajectoryId)
  const authority = inspectWorkflowAuthority(input.projectRoot, {
    workflowId: ids.workflowId,
    taskIds: input.taskIds ?? [],
    sessionScope: input.sessionScope,
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })
  const continuity = await loadWorkflowContinuityTransactionForExecution(input.projectRoot, {
    workflowId: ids.workflowId,
    trajectoryId: ids.trajectoryId,
    sessionId: input.sessionId,
  })
  const activeTaskIds = snapshot.taskIds.length > 0
    ? snapshot.taskIds
    : input.taskIds ?? []
  const profile = inspectionProfiles[bundle.id as InspectionCommandId]
  const nextCommand = profile.resolveNextCommand({
    snapshot,
    workflowHealthy: authority.healthy,
  })

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      status: authority.healthy ? 'ready' : 'blocked',
      inspectionMode: 'state-report',
      command_focus: profile.statusLabel,
      runtime_authority: {
        attachmentMode: snapshot.attachmentMode,
        runtimeAuthority: snapshot.runtimeAuthority,
        runtimeInstanceId: snapshot.runtimeInstanceId,
        serverBaseUrl: snapshot.serverBaseUrl,
        entryState: snapshot.entryState,
        qaState: snapshot.qaState,
        releaseState: snapshot.releaseState,
      },
      workflow_authority: {
        healthy: authority.healthy,
        issues: authority.issues,
        evidenceRefs: authority.evidenceRefs,
      },
      continuity: continuity
        ? {
            continuityId: continuity.continuityId,
            continuityKey: continuity.continuityKey,
            phase: continuity.phase,
            currentSessionId: continuity.currentSessionId,
            priorSessionId: continuity.priorSessionId,
            linkedContractId: continuity.linkedContractId,
            delegationId: continuity.delegationId,
            targetSessionId: continuity.targetSessionId,
            resumeTarget: continuity.resumeTarget,
          }
        : null,
      next_command: nextCommand,
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
      ...profile.buildFocus({
        snapshot,
        workflowHealthy: authority.healthy,
        activeTaskIds,
        hasContinuity: continuity !== null,
      }),
    },
    entityBindings: {
      ...resolveEntityBindings(input),
      trajectoryId: ids.trajectoryId,
      workflowId: ids.workflowId,
    },
    stateTransitions: [profile.stateTransition],
    artifactRefs: authority.evidenceRefs,
    closeoutStatus: authority.healthy ? 'ready' : 'blocked',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}

export function runResearchHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  return runInspectionCommandHandler(bundle, asset, input)
}

export function runVerifyHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  return runInspectionCommandHandler(bundle, asset, input)
}

export function runTddHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  return runInspectionCommandHandler(bundle, asset, input)
}

export function runCourseCorrectHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  return runInspectionCommandHandler(bundle, asset, input)
}
