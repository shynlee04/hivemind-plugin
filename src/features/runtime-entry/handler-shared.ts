import type { resolveControlPlaneIntakeGate } from '../../control-plane/control-plane-intake.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'
import type { LoadedCommandAsset } from '../../hooks/runtime-bridge/instruction-loader.js'
import type { loadRuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'

export function hasAttachedSdkAuthority(
  snapshot: Awaited<ReturnType<typeof loadRuntimeBindingsSnapshot>>,
): boolean {
  return snapshot.runtimeAuthority === 'attached-sdk'
    && !!snapshot.serverBaseUrl
    && snapshot.hivemindHealthy
}

export function snapshotProfileValidated(input: CommandExecutionInput): boolean {
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

export function resolveEntityBindings(
  input: CommandExecutionInput,
): NonNullable<CommandExecutionResult['entityBindings']> {
  return {
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId ?? input.sessionId,
    taskIds: input.taskIds ?? [],
    subtaskIds: input.subtaskIds ?? [],
    delegationId: input.delegationId,
  }
}

export function resolveRuntimeIds(
  input: CommandExecutionInput,
  activeTrajectoryId?: string | null,
): { trajectoryId: string; workflowId: string } {
  return {
    trajectoryId: input.trajectoryId ?? activeTrajectoryId ?? `trj_${input.sessionId}`,
    workflowId: input.workflowId ?? input.sessionId,
  }
}

export function createQuestionGateResult(
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
