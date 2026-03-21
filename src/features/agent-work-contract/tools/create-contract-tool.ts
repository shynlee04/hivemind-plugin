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
  createContractToolArgs,
  CreateContractToolArgsSchema,
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

// Re-export identifiers for external consumers
export {
  HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
}
