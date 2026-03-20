import {
  executeSlashCommandBundle,
  findSlashCommandBundle,
  discoverSlashCommandBundles,
} from '../../commands/slash-command/index.js'
import { ContractStore } from '../agent-work-contract/engine/contract-store.js'
import { createCompactionPreservationPacket } from '../agent-work-contract/hooks/index.js'
import { loadWorkflowContinuityTransactionForExecution } from '../runtime-entry/workflow-continuity.js'
import { buildRuntimeStatusSnapshot } from '../../sdk-supervisor/index.js'
import {
  buildRuntimeEntryDecision,
  DECLARED_CHAIN_ACTIONS,
  resolveRuntimeChainActionSupportMode,
  resolveRuntimeCommandCapabilityMode,
} from '../../shared/contracts/runtime-status.js'
import { loadRuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import { RUNTIME_HANDLER_COMMAND_IDS } from '../runtime-entry/runtime-command-handlers.js'
import type {
  HivemindRuntimeCommandArgs,
  HivemindRuntimeLatestSessionContractSummary,
  HivemindRuntimeStatusPayload,
} from '../../tools/runtime/types.js'

const runtimeEntryCommands = new Set(['hm-init', 'hm-doctor', 'hm-harness'])

function buildCapabilityMatrix() {
  const commands = Object.fromEntries(
    discoverSlashCommandBundles().map((bundle) => [
      bundle.id,
      {
        executionMode: resolveRuntimeCommandCapabilityMode({
          commandId: bundle.id,
          handlerCommandIds: RUNTIME_HANDLER_COMMAND_IDS,
          controlPlanePrimitiveId: bundle.controlPlanePrimitiveId,
        }),
        agent: bundle.agent,
        commandFile: bundle.commandFile,
        stateAuthority: bundle.stateAuthority,
      },
    ]),
  )
  const declared = Object.fromEntries(
    Object.entries(DECLARED_CHAIN_ACTIONS).map(([trigger, actions]) => [trigger, [...actions]]),
  )
  const support = Object.fromEntries(
    Object.values(DECLARED_CHAIN_ACTIONS)
      .flatMap((actions) => actions)
      .map((action) => [action, resolveRuntimeChainActionSupportMode(action)]),
  )

  return {
    commands,
    chainActions: {
      declared,
      support,
    },
  }
}

function withRuntimeEntryDecision<T extends { closeoutStatus?: 'open' | 'ready' | 'blocked' | 'qa-pending'; report: Record<string, unknown> }>(
  result: T,
  serverHealthy?: boolean,
): T & {
  closeoutStatus: 'open' | 'ready' | 'blocked' | 'qa-pending'
  nextCommand?: string
  recommendedCommands: string[]
} {
  const entryDecision = buildRuntimeEntryDecision({
    closeoutStatus: result.closeoutStatus,
    report: result.report,
    serverHealthy,
  })

  return {
    ...result,
    closeoutStatus: entryDecision.closeoutStatus,
    nextCommand: entryDecision.nextCommand,
    recommendedCommands: entryDecision.recommendedCommands,
  }
}

export interface RuntimeToolContext {
  sessionID: string
  agent: string
}

async function buildLatestSessionContractSummary(
  projectRoot: string,
  input: {
    sessionId: string
    workflowId?: string
    trajectoryId?: string
  },
): Promise<HivemindRuntimeLatestSessionContractSummary | null> {
  const store = new ContractStore(projectRoot)
  const continuity = await loadWorkflowContinuityTransactionForExecution(projectRoot, input)
  const continuityContract = continuity?.linkedContractId
    ? await store.get(continuity.linkedContractId)
    : null
  const latestContract = continuityContract ?? (await store.list(input.sessionId))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]

  if (!latestContract) {
    return null
  }

  const summary = createCompactionPreservationPacket(latestContract)

  return {
    contractId: latestContract.contractId,
    sessionId: latestContract.sessionId,
    updatedAt: latestContract.updatedAt,
    delegationExportSessionId: latestContract.delegationExportSessionId,
    continuityId: continuity?.continuityId,
    continuityKey: continuity?.continuityKey,
    continuityPhase: continuity?.phase,
    continuityCurrentSessionId: continuity?.currentSessionId,
    continuityPriorSessionId: continuity?.priorSessionId,
    continuityTurnOutputRefs: continuity?.turnOutputRefs,
    planningPath: latestContract.workflow.planningPath,
    responseMode: latestContract.responseMode,
    workflowPhase: summary.workflowPhase,
    activeTaskIds: summary.activeTaskIds,
    pendingTaskIds: summary.pendingTaskIds,
    briefingSummary: summary.briefingSummary,
    followUp: summary.followUp,
    recentAnchorDescriptions: summary.recentAnchorDescriptions,
    compactionAction: summary.compactionAction,
    delegationId: continuity?.delegationId,
    handoffRef: continuity?.handoffRef,
    continuityTargetSessionId: continuity?.targetSessionId,
    continuityResumeTarget: continuity?.resumeTarget,
    continuityDelegationStatus: continuity?.delegationStatus,
  } as HivemindRuntimeLatestSessionContractSummary
}

export async function buildHivemindRuntimeStatus(
  projectRoot: string,
  context: RuntimeToolContext,
): Promise<{
  payload: HivemindRuntimeStatusPayload
  metadata: {
    title: string
    metadata: Record<string, unknown>
  }
}> {
  const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
  const statusSnapshot = await buildRuntimeStatusSnapshot({
    projectRoot,
    sessionId: context.sessionID,
    agentId: context.agent,
    snapshot,
  })
  const latestSessionContract = await buildLatestSessionContractSummary(
    projectRoot,
    {
      sessionId: context.sessionID,
      workflowId: snapshot.workflowId,
      trajectoryId: snapshot.trajectoryId,
    },
  )
  const capabilityMatrix = buildCapabilityMatrix()
  const availableCommands = discoverSlashCommandBundles().map((bundle) => bundle.id)
  const payload: HivemindRuntimeStatusPayload = {
    ...statusSnapshot,
    workflowSummary: statusSnapshot.workflowSummary,
    recentEvents: statusSnapshot.recentEvents,
    capabilityMatrix,
    latestSessionContract,
    workflowGateState: {
      availableCommands,
      commandCapabilities: Object.fromEntries(
        Object.entries(capabilityMatrix.commands).map(([commandId, capability]) => [commandId, capability.executionMode]),
      ),
    },
  }

  return {
    payload,
    metadata: {
      title: 'HiveMind runtime status',
      metadata: {
        runtimeAuthority: snapshot.runtimeAuthority,
        runtimeInstanceId: snapshot.runtimeInstanceId,
        trajectoryId: snapshot.trajectoryId,
        workflowId: snapshot.workflowId,
        supervisorStatus: statusSnapshot.supervisor.health.overallStatus,
      },
    },
  }
}

export async function executeHivemindRuntimeCommand(
  projectRoot: string,
  args: HivemindRuntimeCommandArgs,
  context: RuntimeToolContext,
): Promise<{
  payload: Record<string, unknown>
  metadata: {
    title: string
    metadata: Record<string, unknown>
  }
}> {
  const snapshot = await loadRuntimeBindingsSnapshot(projectRoot)
  if (
    args.command === 'hm-init'
    && snapshot.runtimeAuthority === 'attached-sdk'
    && !!snapshot.serverBaseUrl
    && snapshot.hivemindHealthy
  ) {
    const redirectedResult = withRuntimeEntryDecision({
      commandId: args.command,
      closeoutStatus: snapshot.qaState === 'pending' ? 'qa-pending' : 'ready',
      report: {
        status: snapshot.qaState === 'pending' ? 'qa-pending' : 'ready',
        routeDisposition: 'attach',
        next_command: 'hm-harness',
        guidance: 'Attached OpenCode runtime already healthy; skipped competing hm-init bootstrap.',
        runtimeAuthority: {
          runtimeAuthority: snapshot.runtimeAuthority,
          runtimeInstanceId: snapshot.runtimeInstanceId,
          serverBaseUrl: snapshot.serverBaseUrl,
        },
      },
      stateTransitions: ['attach-active-bootstrap-refused'],
    }, snapshot.hivemindHealthy)

    return {
      payload: redirectedResult as Record<string, unknown>,
      metadata: {
        title: `HiveMind command ${args.command}`,
        metadata: {
          command: args.command,
          closeoutStatus: redirectedResult.closeoutStatus,
          routeDisposition: 'attach',
        },
      },
    }
  }

  const bundle = findSlashCommandBundle(args.command)
  if (!bundle) {
    throw new Error(`Unknown HiveMind command: ${args.command}`)
  }

  const result = await executeSlashCommandBundle(bundle, {
    projectRoot,
    sessionId: context.sessionID,
    sessionScope: 'main',
    presetId: args.presetId,
    intakeEvidence: args.intakeEvidence,
    requestedSettingsGroups: args.requestedSettingsGroups,
    preferredUserName: args.preferredUserName,
    language: args.language,
    artifactLanguage: args.artifactLanguage,
    governanceMode: args.governanceMode,
    automationLevel: args.automationLevel,
    expertLevel: args.expertLevel,
    outputStyle: args.outputStyle,
    trajectoryId: snapshot.trajectoryId,
    workflowId: snapshot.workflowId,
    taskIds: snapshot.taskIds,
    subtaskIds: snapshot.subtaskIds,
    lineage: snapshot.defaultLineage,
    purposeClass: snapshot.defaultPurposeClass,
    arguments: args.arguments,
    userMessage: args.userMessage ?? `execute ${args.command}`,
    activeAgent: context.agent,
  })
  const output = runtimeEntryCommands.has(args.command)
    ? withRuntimeEntryDecision(result, snapshot.hivemindHealthy)
    : result

  return {
    payload: output as unknown as Record<string, unknown>,
    metadata: {
      title: `HiveMind command ${args.command}`,
      metadata: {
        command: args.command,
        closeoutStatus: output.closeoutStatus,
      },
    },
  }
}
