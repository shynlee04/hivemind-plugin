import { randomUUID } from 'node:crypto'

import { tool, type ToolContext } from '@opencode-ai/plugin/tool'

import { classifyIntent } from '../engine/intent-classifier.js'
import { ContractStore } from '../engine/contract-store.js'
import {
  AgentWorkContractSchema,
  AnchorPointSchema,
  BriefingSchema,
  ChainActionsSchema,
  ResponseModeSchema,
  WorkflowFrameSchema,
  type AgentWorkContract,
} from '../schema/index.js'
import { error, success } from '../../../shared/tool-response.js'
import { renderToolResult } from '../../../shared/tool-helpers.js'

export const HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID = 'hivemind_agent_work_create_contract'

const createContractToolArgs = {
  action: tool.schema.enum(['create', 'update']).describe('Whether to create a new contract or update an existing contract.'),
  contractId: tool.schema.string().optional().describe('Contract identifier to create or update. Create generates one when omitted.'),
  sessionId: tool.schema.string().optional().describe('Owning session identifier for create operations. Defaults to the active tool session.'),
  rawIntent: tool.schema.string().optional().describe('Raw user intent text to classify into contract state.'),
  delegationExportSessionId: tool.schema.string().optional().describe('Optional delegation export session reference to persist on the contract.'),
  responseMode: tool.schema.enum(['broad-search-execute', 'interactive-qa', 'deep-research']).optional().describe('Optional response mode override. Update replaces the stored response mode.'),
  workflow: tool.schema.object({
    planningPath: tool.schema.string().optional(),
    phase: tool.schema.string().optional(),
    outlineRef: tool.schema.string().optional(),
    tasks: tool.schema.array(tool.schema.object({
      id: tool.schema.string(),
      title: tool.schema.string(),
      status: tool.schema.enum(['pending', 'active', 'delegated', 'verifying', 'complete']),
      parentTaskId: tool.schema.string().optional(),
      dependencyIds: tool.schema.array(tool.schema.string()).optional(),
      delegationMode: tool.schema.enum(['parallel', 'sequential', 'handoff']).optional(),
      delegationSessionId: tool.schema.string().optional(),
      evidenceRefs: tool.schema.array(tool.schema.string()).optional(),
    })),
  }).optional().describe('Full workflow frame to persist for the contract.'),
  chainActions: tool.schema.object({
    onTaskComplete: tool.schema.enum(['export-workflow', 'next-task', 'close']),
    onWorkflowEnd: tool.schema.enum(['export-contract', 'archive']),
    onDelegation: tool.schema.enum(['export-messages', 'handoff-packet']),
    onCompaction80: tool.schema.enum(['launch-context-agent', 'export-summary']),
  }).optional().describe('Full chain-action configuration to persist for the contract.'),
  briefing: tool.schema.object({
    summary: tool.schema.string(),
    workflowState: tool.schema.string(),
    followUp: tool.schema.array(tool.schema.string()),
  }).optional().describe('Optional validated briefing block for the contract.'),
  anchors: tool.schema.array(tool.schema.object({
    timestamp: tool.schema.string(),
    kind: tool.schema.enum(['workflow-shift', 'planning-shift', 'stage-shift', 'user-redirect']),
    description: tool.schema.string(),
    snapshotRef: tool.schema.string().optional(),
  })).optional().describe('Optional anchor list to persist on the contract.'),
} as const

const CreateContractToolArgsSchema = tool.schema.object(createContractToolArgs)

const DEFAULT_CHAIN_ACTIONS = {
  onTaskComplete: 'next-task',
  onWorkflowEnd: 'archive',
  onDelegation: 'handoff-packet',
  onCompaction80: 'launch-context-agent',
} as const

function resolveProjectRoot(projectRoot: string, context: ToolContext): string {
  return context.worktree && context.worktree.length > 0 ? context.worktree : projectRoot
}

function createMetadata(
  title: string,
  context: ToolContext,
  action: 'create' | 'update',
  contractId: string,
): { title: string; metadata: Record<string, unknown> } {
  return {
    title,
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
      action,
      contractId,
      sessionID: context.sessionID,
      agent: context.agent,
      directory: context.directory,
      worktree: context.worktree,
    },
  }
}

async function askToEditContract(
  context: ToolContext,
  action: 'create' | 'update',
  contractId: string,
): Promise<void> {
  await context.ask({
    permission: 'edit',
    patterns: [`.hivemind/agent-work-contract/${contractId}.json`],
    always: ['*'],
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
      action,
      contractId,
      sessionID: context.sessionID,
      agent: context.agent,
      directory: context.directory,
      worktree: context.worktree,
    },
  })
}

function buildCreateContractId(sessionID: string): string {
  const sanitizedSessionId = sessionID.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48) || 'session'
  return `awc-${sanitizedSessionId}-${Date.now()}-${randomUUID()}`
}

function normalizeResponseMode(value: string | undefined): AgentWorkContract['responseMode'] | undefined {
  return value === undefined ? undefined : ResponseModeSchema.parse(value)
}

function normalizeWorkflow(value: unknown): AgentWorkContract['workflow'] | undefined {
  return value === undefined ? undefined : WorkflowFrameSchema.parse(value)
}

function normalizeChainActions(value: unknown): AgentWorkContract['chainActions'] | undefined {
  return value === undefined ? undefined : ChainActionsSchema.parse(value)
}

function normalizeBriefing(value: unknown): AgentWorkContract['briefing'] | undefined {
  return value === undefined ? undefined : BriefingSchema.parse(value)
}

function normalizeAnchors(value: unknown): AgentWorkContract['anchors'] | undefined {
  return value === undefined
    ? undefined
    : tool.schema.array(tool.schema.unknown()).parse(value).map((item) => AnchorPointSchema.parse(item))
}

async function createContract(
  projectRoot: string,
  args: {
    contractId?: string
    sessionId?: string
    rawIntent: string
    delegationExportSessionId?: string
    responseMode?: AgentWorkContract['responseMode']
    workflow?: AgentWorkContract['workflow']
    chainActions?: AgentWorkContract['chainActions']
    briefing?: AgentWorkContract['briefing']
    anchors?: AgentWorkContract['anchors']
  },
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

async function updateContract(
  projectRoot: string,
  args: {
    contractId: string
    rawIntent?: string
    delegationExportSessionId?: string
    responseMode?: AgentWorkContract['responseMode']
    workflow?: AgentWorkContract['workflow']
    chainActions?: AgentWorkContract['chainActions']
    briefing?: AgentWorkContract['briefing']
    anchors?: AgentWorkContract['anchors']
  },
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

export function createAgentWorkCreateContractTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Create or update agent-work contract state using the feature contract store, schema validation, and intent engine.',
    args: createContractToolArgs,
    async execute(rawArgs, context) {
      try {
        const args = CreateContractToolArgsSchema.parse(rawArgs)
        const responseMode = normalizeResponseMode(args.responseMode)
        const workflow = normalizeWorkflow(args.workflow)
        const chainActions = normalizeChainActions(args.chainActions)
        const briefing = normalizeBriefing(args.briefing)
        const anchors = normalizeAnchors(args.anchors)

        if (args.action === 'create') {
          if (!args.rawIntent) {
            return renderToolResult(error('rawIntent is required for create action'))
          }

          const contract = await createContract(projectRoot, {
            contractId: args.contractId,
            sessionId: args.sessionId,
            rawIntent: args.rawIntent,
            delegationExportSessionId: args.delegationExportSessionId,
            responseMode,
            workflow,
            chainActions,
            briefing,
            anchors,
          }, context)
          context.metadata(createMetadata('Agent-work contract created', context, 'create', contract.contractId))
          return renderToolResult(success('Created agent-work contract', { contract }))
        }

        if (!args.contractId) {
          return renderToolResult(error('contractId is required for update action'))
        }

        if (
          !args.rawIntent
          && args.delegationExportSessionId === undefined
          && !args.responseMode
          && !args.workflow
          && !args.chainActions
          && !args.briefing
          && !args.anchors
        ) {
          return renderToolResult(error('At least one update field is required for update action'))
        }

        const contract = await updateContract(projectRoot, {
          contractId: args.contractId,
          rawIntent: args.rawIntent,
          delegationExportSessionId: args.delegationExportSessionId,
          responseMode,
          workflow,
          chainActions,
          briefing,
          anchors,
        }, context)

        context.metadata(createMetadata('Agent-work contract updated', context, 'update', contract.contractId))
        return renderToolResult(success('Updated agent-work contract', { contract }))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Unknown create-contract tool failure'
        return renderToolResult(error(message))
      }
    },
  })
}
