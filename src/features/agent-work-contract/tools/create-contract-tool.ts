/**
 * Agent-work contract creation tool.
 *
 * @module create-contract-tool
 *
 * This module provides the factory function for creating the agent-work
 * contract tool. It delegates to specialized modules for schema,
 * helpers, normalizers, and operations.
 */

import { tool } from '@opencode-ai/plugin/tool'

import { error, success } from '../../../shared/tool-response.js'
import { renderToolResult } from '../../../shared/tool-helpers.js'

import {
  type CreateContractToolArgs,
  HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
} from './create-contract-tool.schema.js'
import { createMetadata } from './create-contract-tool.helpers.js'
import {
  normalizeAnchors,
  normalizeBriefing,
  normalizeChainActions,
  normalizeResponseMode,
  normalizeWorkflow,
} from './create-contract-tool.normalizers.js'
import { createContract, updateContract } from './create-contract-tool.operations.js'

const s = tool.schema

const createContractToolArgs = {
  action: s.enum(['create', 'update']).describe('Whether to create a new contract or update an existing contract.'),
  contractId: s.string().optional().describe('Contract identifier to create or update. Create generates one when omitted.'),
  sessionId: s.string().optional().describe('Owning session identifier for create operations. Defaults to the active tool session.'),
  rawIntent: s.string().optional().describe('Raw user intent text to classify into contract state.'),
  delegationExportSessionId: s.string().optional().describe('Optional delegation export session reference to persist on the contract.'),
  responseMode: s.enum(['broad-search-execute', 'interactive-qa', 'deep-research']).optional().describe('Optional response mode override. Update replaces the stored response mode.'),
  workflow: s.object({
    planningPath: s.string().optional(),
    phase: s.string().optional(),
    outlineRef: s.string().optional(),
    tasks: s.array(s.object({
      id: s.string(),
      title: s.string(),
      status: s.enum(['pending', 'active', 'delegated', 'verifying', 'complete']),
      parentTaskId: s.string().optional(),
      dependencyIds: s.array(s.string()).optional(),
      delegationMode: s.enum(['parallel', 'sequential', 'handoff']).optional(),
      delegationSessionId: s.string().optional(),
      evidenceRefs: s.array(s.string()).optional(),
    })),
  }).optional().describe('Full workflow frame to persist for the contract.'),
  chainActions: s.object({
    onTaskComplete: s.enum(['export-workflow', 'next-task', 'close']),
    onWorkflowEnd: s.enum(['export-contract', 'archive']),
    onDelegation: s.enum(['export-messages', 'handoff-packet']),
    onCompaction80: s.enum(['launch-context-agent', 'export-summary']),
  }).optional().describe('Full chain-action configuration to persist for the contract.'),
  briefing: s.object({
    summary: s.string(),
    workflowState: s.string(),
    followUp: s.array(s.string()),
  }).optional().describe('Optional validated briefing block for the contract.'),
  anchors: s.array(s.object({
    timestamp: s.string(),
    kind: s.enum(['workflow-shift', 'planning-shift', 'stage-shift', 'user-redirect']),
    description: s.string(),
    snapshotRef: s.string().optional(),
  })).optional().describe('Optional anchor list to persist on the contract.'),
} as const

const createContractToolArgsSchema = tool.schema.object(createContractToolArgs)

/**
 * Creates the agent-work create/update contract tool.
 *
 * @param projectRoot - The project root directory
 * @returns The configured tool definition
 */
export function createAgentWorkCreateContractTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Create or update agent-work contract state using the feature contract store, schema validation, and intent engine.',
    args: createContractToolArgs,
    async execute(rawArgs, context) {
      try {
        const args = createContractToolArgsSchema.parse(rawArgs) as CreateContractToolArgs
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

// Re-export identifiers for external consumers
export {
  HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
}
