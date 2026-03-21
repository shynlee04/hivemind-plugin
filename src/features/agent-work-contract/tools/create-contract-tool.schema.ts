/**
 * Schema definitions and constants for the create-contract tool.
 *
 * @module create-contract-tool/schema
 */

import { tool } from '@opencode-ai/plugin/tool'

/**
 * Tool identifier for the create-contract tool.
 */
export const HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID = 'hivemind_agent_work_create_contract'

/**
 * Default chain action configuration for new contracts.
 */
export const DEFAULT_CHAIN_ACTIONS = {
  onTaskComplete: 'next-task',
  onWorkflowEnd: 'archive',
  onDelegation: 'handoff-packet',
  onCompaction80: 'launch-context-agent',
} as const

/**
 * Tool argument schema definition for the create-contract tool.
 */
export const createContractToolArgs = {
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

/**
 * Parsed Zod schema for tool arguments validation.
 */
export const CreateContractToolArgsSchema = tool.schema.object(createContractToolArgs)

/**
 * Raw tool args type (before parsing).
 */
export type CreateContractToolArgs = typeof CreateContractToolArgsSchema
