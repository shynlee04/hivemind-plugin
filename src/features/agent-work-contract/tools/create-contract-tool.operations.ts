/**
 * Contract operation functions for the create-contract tool.
 *
 * @module create-contract-tool/operations
 */

import type { ToolContext } from '@opencode-ai/plugin/tool'

import { AgentWorkContractSchema, ChainActionsSchema, WorkflowFrameSchema, type AgentWorkContract } from '../schema/index.js'
import { classifyIntent } from '../engine/intent-classifier.js'
import { ContractStore } from '../engine/contract-store.js'

import {
  DEFAULT_CHAIN_ACTIONS,
} from './create-contract-tool.schema.js'
import {
  askToEditContract,
  buildCreateContractId,
  resolveProjectRoot,
} from './create-contract-tool.helpers.js'

/**
 * Create contract operation arguments.
 */
interface CreateContractArgs {
  contractId?: string
  sessionId?: string
  rawIntent: string
  delegationExportSessionId?: string
  responseMode?: AgentWorkContract['responseMode']
  workflow?: AgentWorkContract['workflow']
  chainActions?: AgentWorkContract['chainActions']
  briefing?: AgentWorkContract['briefing']
  anchors?: AgentWorkContract['anchors']
}

/**
 * Update contract operation arguments.
 */
interface UpdateContractArgs {
  contractId: string
  rawIntent?: string
  delegationExportSessionId?: string
  responseMode?: AgentWorkContract['responseMode']
  workflow?: AgentWorkContract['workflow']
  chainActions?: AgentWorkContract['chainActions']
  briefing?: AgentWorkContract['briefing']
  anchors?: AgentWorkContract['anchors']
}

/**
 * Creates a new agent-work contract.
 *
 * @param projectRoot - The project root directory
 * @param args - Create operation arguments
 * @param context - The tool execution context
 * @returns The created and persisted contract
 * @throws Error if contract is not persisted successfully
 */
export async function createContract(
  projectRoot: string,
  args: CreateContractArgs,
  context: ToolContext,
): Promise<AgentWorkContract> {
  const resolvedProjectRoot = resolveProjectRoot(projectRoot, context)
  const store = new ContractStore(resolvedProjectRoot)
  const contractId = args.contractId ?? buildCreateContractId(context.sessionID)
  const classification = await classifyIntent(args.rawIntent)
  const now = new Date().toISOString()
  const contract = AgentWorkContractSchema.parse({
    contractId,
    sessionId: args.sessionId ?? context.sessionID,
    delegationExportSessionId: args.delegationExportSessionId,
    createdAt: now,
    updatedAt: now,
    userIntent: classification.intent,
    responseMode: args.responseMode ?? classification.suggestedResponseMode,
    workflow: args.workflow ?? WorkflowFrameSchema.parse({ tasks: [] }),
    chainActions: args.chainActions ?? ChainActionsSchema.parse(DEFAULT_CHAIN_ACTIONS),
    briefing: args.briefing,
    anchors: args.anchors,
  })

  await askToEditContract(context, 'create', contractId)
  await store.create(contract)

  const persisted = await store.get(contractId)
  if (!persisted) {
    throw new Error(`Contract ${contractId} was not persisted`)
  }

  return AgentWorkContractSchema.parse(persisted)
}

/**
 * Updates an existing agent-work contract.
 *
 * @param projectRoot - The project root directory
 * @param args - Update operation arguments
 * @param context - The tool execution context
 * @returns The updated and persisted contract
 * @throws Error if contract is not found after update
 */
export async function updateContract(
  projectRoot: string,
  args: UpdateContractArgs,
  context: ToolContext,
): Promise<AgentWorkContract> {
  const resolvedProjectRoot = resolveProjectRoot(projectRoot, context)
  const store = new ContractStore(resolvedProjectRoot)
  const updates: Partial<AgentWorkContract> = {}

  if (args.rawIntent) {
    const classification = await classifyIntent(args.rawIntent)
    updates.userIntent = classification.intent
    updates.responseMode = args.responseMode ?? classification.suggestedResponseMode
  } else if (args.responseMode) {
    updates.responseMode = args.responseMode
  }

  if (args.delegationExportSessionId !== undefined) {
    updates.delegationExportSessionId = args.delegationExportSessionId
  }

  if (args.workflow) {
    updates.workflow = args.workflow
  }

  if (args.chainActions) {
    updates.chainActions = args.chainActions
  }

  if (args.briefing) {
    updates.briefing = args.briefing
  }

  if (args.anchors) {
    updates.anchors = args.anchors
  }

  await askToEditContract(context, 'update', args.contractId)
  await store.update(args.contractId, updates)

  const persisted = await store.get(args.contractId)
  if (!persisted) {
    throw new Error(`Contract ${args.contractId} was not found after update`)
  }

  return AgentWorkContractSchema.parse(persisted)
}
