import { join } from 'node:path'

import type {
  CommandExecutionInput,
  CommandExecutionResult,
} from '../../../commands/slash-command/command-types.js'
import type { TurnExportProjectionV1 } from '../../runtime-entry/turn-output.js'
import { loadWorkflowContinuityTransactionForExecution } from '../../runtime-entry/workflow-continuity.js'
import { classifyIntent } from './intent-classifier.js'
import { ContractStore } from './contract-store.js'
import {
  AgentWorkContractSchema,
  ChainActionsSchema,
  type AgentWorkContract,
  type AnchorPoint,
} from '../schema/index.js'

const LINKED_COMMAND_PHASES = {
  'hm-plan': 'planning',
  'hm-implement': 'implementation',
} as const

const DEFAULT_CHAIN_ACTIONS = {
  onTaskComplete: 'next-task',
  onWorkflowEnd: 'archive',
  onDelegation: 'handoff-packet',
  onCompaction80: 'launch-context-agent',
} as const

type LinkedCommandId = keyof typeof LINKED_COMMAND_PHASES

export interface CommandSessionContractLinkage {
  contract: AgentWorkContract
  contractFilePath: string
}

function sanitizeSessionId(sessionId: string): string {
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'session'
}

function buildSessionContractId(sessionId: string): string {
  return `awc-session-${sanitizeSessionId(sessionId)}`
}

function getProjectionPaths(projection: TurnExportProjectionV1): string[] {
  return [projection.markdownPath, projection.yamlPath].filter((value): value is string => Boolean(value))
}

function resolvePlanningPath(
  commandId: LinkedCommandId,
  existing: AgentWorkContract | null,
  projection: TurnExportProjectionV1,
): string {
  const projectionPaths = getProjectionPaths(projection)
  if (commandId === 'hm-implement' && existing?.workflow.planningPath) {
    return existing.workflow.planningPath
  }

  return projection.markdownPath
    ?? projection.yamlPath
    ?? existing?.workflow.planningPath
    ?? projectionPaths[0]
    ?? `projection:${commandId}`
}

function resolveOutlineRef(
  planningPath: string,
  existing: AgentWorkContract | null,
  projection: TurnExportProjectionV1,
): string | undefined {
  const alternateProjection = getProjectionPaths(projection).find((candidate) => candidate !== planningPath)
  return alternateProjection ?? existing?.workflow.outlineRef
}

function createCommandAnchor(
  commandId: LinkedCommandId,
  phase: string,
  projection: TurnExportProjectionV1,
): AnchorPoint {
  const snapshotRef = projection.markdownPath ?? projection.yamlPath
  return {
    timestamp: new Date().toISOString(),
    kind: commandId === 'hm-plan' ? 'planning-shift' : 'stage-shift',
    description: `Linked ${commandId} command output to ${phase} session contract state.`,
    snapshotRef,
  }
}

function resolveRawIntent(input: CommandExecutionInput, result: CommandExecutionResult, commandId: LinkedCommandId): string {
  const candidates = [
    input.userMessage,
    input.arguments,
    typeof result.report.status === 'string' ? result.report.status : undefined,
    `execute ${commandId}`,
  ]

  return candidates.find((value): value is string => typeof value === 'string' && value.length > 0)
    ?? `execute ${commandId}`
}

async function loadLatestSessionContract(
  store: ContractStore,
  sessionId: string,
): Promise<AgentWorkContract | null> {
  const contracts = await store.list(sessionId)
  return contracts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null
}

async function loadExistingLinkedContract(
  store: ContractStore,
  projectRoot: string,
  executionInput: CommandExecutionInput,
): Promise<AgentWorkContract | null> {
  const continuity = await loadWorkflowContinuityTransactionForExecution(projectRoot, executionInput)
  if (continuity?.linkedContractId) {
    const linkedContract = await store.get(continuity.linkedContractId)
    if (linkedContract) {
      return linkedContract
    }
  }

  return loadLatestSessionContract(store, executionInput.sessionId)
}

export function shouldLinkCommandSessionContract(commandId: string): commandId is LinkedCommandId {
  return commandId in LINKED_COMMAND_PHASES
}

export async function upsertCommandSessionContract(input: {
  commandId: LinkedCommandId
  projectRoot: string
  executionInput: CommandExecutionInput
  result: CommandExecutionResult
  turnOutputProjection: TurnExportProjectionV1
}): Promise<CommandSessionContractLinkage> {
  const store = new ContractStore(input.projectRoot)
  const existing = await loadExistingLinkedContract(store, input.projectRoot, input.executionInput)
  const phase = LINKED_COMMAND_PHASES[input.commandId]
  const planningPath = resolvePlanningPath(input.commandId, existing, input.turnOutputProjection)
  const outlineRef = resolveOutlineRef(planningPath, existing, input.turnOutputProjection)
  const anchor = createCommandAnchor(input.commandId, phase, input.turnOutputProjection)

  if (existing) {
    const nextWorkflow = AgentWorkContractSchema.shape.workflow.parse({
      ...existing.workflow,
      planningPath,
      phase,
      outlineRef,
      tasks: existing.workflow.tasks,
    })

    await store.update(existing.contractId, {
      workflow: nextWorkflow,
      anchors: [...(existing.anchors ?? []), anchor],
    })

    const contract = AgentWorkContractSchema.parse(await store.get(existing.contractId))
    return {
      contract,
      contractFilePath: join(input.projectRoot, '.hivemind', 'agent-work-contract', `${existing.contractId}.json`),
    }
  }

  const classification = await classifyIntent(resolveRawIntent(
    input.executionInput,
    input.result,
    input.commandId,
  ))
  const now = new Date().toISOString()
  const contractId = buildSessionContractId(input.executionInput.sessionId)
  const contract = AgentWorkContractSchema.parse({
    contractId,
    sessionId: input.executionInput.sessionId,
    createdAt: now,
    updatedAt: now,
    userIntent: classification.intent,
    responseMode: classification.suggestedResponseMode,
    workflow: {
      planningPath,
      phase,
      outlineRef,
      tasks: [],
    },
    chainActions: ChainActionsSchema.parse(DEFAULT_CHAIN_ACTIONS),
    anchors: [anchor],
  })

  try {
    await store.create(contract)
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('already exists')) {
      throw error
    }

    return upsertCommandSessionContract(input)
  }

  return {
    contract,
    contractFilePath: join(input.projectRoot, '.hivemind', 'agent-work-contract', `${contractId}.json`),
  }
}
