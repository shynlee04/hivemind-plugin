import { recordTrajectoryEvent } from '../../core/trajectory/index.js'
import { loadCommandAsset } from '../../hooks/runtime-bridge/instruction-loader.js'
import { executeControlPlaneHandler } from '../../control-plane/index.js'
import { detectEntryKernelState } from '../../shared/entry-kernel-state.js'
import { assertSlashCommandAgentBindings } from '../../shared/opencode-agent-registry.js'
import { createRuntimeInvocation } from '../../shared/runtime-invocation.js'
import {
  createTurnOutputEnvelope,
  exportTurnOutputProjection,
} from '../../shared/turn-output.js'
import type {
  CommandExecutionInput,
  CommandExecutionPreview,
  CommandExecutionResult,
  SlashCommandBundle,
} from './command-types.js'
import { findSlashCommandBundle } from './command-discovery.js'

export async function previewSlashCommandBundle(
  bundle: SlashCommandBundle,
): Promise<CommandExecutionPreview> {
  assertSlashCommandAgentBindings([bundle])
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
  assertSlashCommandAgentBindings([bundle])
  const autoRecovered = await maybeAutoRecoverEntry(bundle, input)
  if (autoRecovered) {
    return autoRecovered
  }

  const asset = await loadCommandAsset(bundle.id)
  const handled = await executeControlPlaneHandler(bundle, asset, input)
  if (handled) {
    await recordCommandEvent(bundle, input, handled.executionMode)
    return finalizeCommandResult(bundle, input, handled)
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
  return finalizeCommandResult(bundle, input, result)
}

async function maybeAutoRecoverEntry(
  bundle: SlashCommandBundle,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult | null> {
  if (!input.projectRoot) {
    return null
  }

  if (['hm-init', 'hm-doctor', 'hm-settings', 'hm-harness'].includes(bundle.id)) {
    return null
  }

  const entryKernelState = await detectEntryKernelState(input.projectRoot, {
    workflowId: input.workflowId,
    taskIds: input.taskIds,
  })
  if (entryKernelState.state !== 'uninitialized' && entryKernelState.state !== 'repair-required') {
    return null
  }

  const recoveryBundle = findSlashCommandBundle(
    entryKernelState.state === 'uninitialized' ? 'hm-init' : 'hm-doctor',
  )
  if (!recoveryBundle) {
    return null
  }

  return executeSlashCommandBundle(recoveryBundle, {
    ...input,
    entryKernelAction: recoveryBundle.id === 'hm-init' ? 'auto-init' : 'auto-doctor',
    userMessage: input.userMessage ?? `auto-recover before ${bundle.id}`,
  })
}

async function finalizeCommandResult(
  bundle: SlashCommandBundle,
  input: CommandExecutionInput,
  result: CommandExecutionResult,
): Promise<CommandExecutionResult> {
  if (!input.projectRoot || result.executionMode === 'question-gate') {
    return result
  }

  const entryKernelState = await detectEntryKernelState(input.projectRoot, {
    workflowId: input.workflowId,
    taskIds: input.taskIds,
  })
  const qaState = result.closeoutStatus === 'qa-pending' ? 'pending' : entryKernelState.qaState
  const runtimeInvocation = createRuntimeInvocation({
    sessionId: input.sessionId,
    parentSessionId: input.parentSessionId,
    sessionScope: input.sessionScope,
    activeAgent: input.activeAgent,
    lineage: input.lineage,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
    gateState: result.closeoutStatus ?? entryKernelState.state,
    artifactRefs: result.artifactRefs,
    delegationId: input.delegationId,
    requestReason: input.userMessage ?? bundle.id,
  })
  const turnOutput = createTurnOutputEnvelope({
    runtimeInvocation,
    status: String(result.report.status ?? result.closeoutStatus ?? result.executionMode),
    qaState,
    pivot: typeof result.report.next_command === 'string' ? result.report.next_command : undefined,
    rationale: [`command:${bundle.id}`, `execution:${result.executionMode}`],
    workflowEffects: result.stateTransitions ?? [],
    artifactRefs: result.artifactRefs ?? [],
    toolEvidence: result.pressureContract.evidence.requiredArtifacts,
    followups: typeof result.report.next_command === 'string' ? [result.report.next_command] : [],
    resumeHints: result.entityBindings?.workflowId ? [`workflow:${result.entityBindings.workflowId}`] : [],
  })
  const turnOutputProjection = await exportTurnOutputProjection(input.projectRoot, turnOutput)

  return {
    ...result,
    artifactRefs: [
      ...(result.artifactRefs ?? []),
      ...(turnOutputProjection.yamlPath ? [turnOutputProjection.yamlPath] : []),
      ...(turnOutputProjection.markdownPath ? [turnOutputProjection.markdownPath] : []),
    ],
    runtimeInvocation,
    turnOutput,
    turnOutputProjection,
  }
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
