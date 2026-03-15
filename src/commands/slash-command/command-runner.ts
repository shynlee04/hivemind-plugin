import { recordTrajectoryEvent } from '../../core/trajectory/index.js'
import { loadCommandAsset } from '../../hooks/runtime-bridge/instruction-loader.js'
import { executeControlPlaneHandler } from '../../control-plane/index.js'
import type {
  CommandExecutionInput,
  CommandExecutionPreview,
  CommandExecutionResult,
  SlashCommandBundle,
} from './command-types.js'

export async function previewSlashCommandBundle(
  bundle: SlashCommandBundle,
): Promise<CommandExecutionPreview> {
  const asset = await loadCommandAsset(bundle.id)

  return {
    commandId: bundle.id,
    title: bundle.title,
    commandFile: bundle.commandFile,
    frontmatter: asset.frontmatter,
    body: asset.body,
    contract: asset.contract,
    workflowChain: bundle.workflowChain,
    toolGrantIds: bundle.toolGrantIds,
    structuredOutput: bundle.structuredOutput,
    continuationMode: bundle.continuationMode,
    pressureContract: bundle.pressureContract,
  }
}

export async function executeSlashCommandBundle(
  bundle: SlashCommandBundle,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const asset = await loadCommandAsset(bundle.id)
  const handled = await executeControlPlaneHandler(bundle, asset, input)
  if (handled) {
    await recordCommandEvent(bundle, input, handled.executionMode)
    return handled
  }

  const result: CommandExecutionResult = {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'preview',
    contract: asset.contract,
    report: {
      triggeringSessionId: input.sessionId,
      commandFile: bundle.commandFile,
      workflowChain: bundle.workflowChain,
      toolGrantIds: bundle.toolGrantIds,
      continuationMode: bundle.continuationMode,
      arguments: input.arguments ?? '',
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
    },
    entityBindings: {
      trajectoryId: input.trajectoryId,
      workflowId: input.workflowId,
      taskIds: input.taskIds ?? [],
      subtaskIds: input.subtaskIds ?? [],
      delegationId: input.delegationId,
    },
    artifactRefs: asset.contract.artifactProjections.map((projection) => `projection:${projection}`),
    closeoutStatus: asset.contract.closeoutGate === 'required' ? 'blocked' : 'open',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }

  await recordCommandEvent(bundle, input, result.executionMode)
  return result
}

async function recordCommandEvent(
  bundle: SlashCommandBundle,
  input: CommandExecutionInput,
  executionMode: CommandExecutionResult['executionMode'],
): Promise<void> {
  if (!input.projectRoot || !input.trajectoryId) {
    return
  }

  await recordTrajectoryEvent(input.projectRoot, input.trajectoryId, {
    kind: 'transition',
    summary: `command:${bundle.id}:${executionMode}`,
    evidenceRefs: input.taskIds ?? [],
  })
}
