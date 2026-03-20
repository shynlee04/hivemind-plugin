import { tool, type ToolContext } from '@opencode-ai/plugin/tool'

import { ContractStore } from '../engine/contract-store.js'
import { createCompactionPreservationPacket } from '../hooks/compaction-preservation.js'
import { AgentWorkContractSchema } from '../schema/index.js'
import { error, success } from '../../../shared/tool-response.js'
import { renderToolResult } from '../../../shared/tool-helpers.js'

export const HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID = 'hivemind_agent_work_export_contract'

function resolveProjectRoot(projectRoot: string, context: ToolContext): string {
  return context.worktree && context.worktree.length > 0 ? context.worktree : projectRoot
}

function createMetadata(title: string, context: ToolContext, contractId: string, format: string) {
  return {
    title,
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
      contractId,
      format,
      sessionID: context.sessionID,
      agent: context.agent,
      directory: context.directory,
      worktree: context.worktree,
    },
  }
}

export function createAgentWorkExportContractTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Export a validated agent-work contract or compaction-safe summary payload without duplicating trajectory or handoff tool behavior.',
    args: {
      contractId: tool.schema.string().min(1).describe('Contract identifier to export.'),
      format: tool.schema.enum(['contract', 'summary']).describe('Whether to export the full validated contract or the compaction-safe summary packet.'),
    },
    async execute(args, context) {
      try {
        const store = new ContractStore(resolveProjectRoot(projectRoot, context))
        const contract = await store.get(args.contractId)

        if (!contract) {
          return renderToolResult(error(`Contract ${args.contractId} not found`))
        }

        const payload = args.format === 'contract'
          ? AgentWorkContractSchema.parse(contract)
          : createCompactionPreservationPacket(contract)

        context.metadata(createMetadata('Agent-work contract exported', context, args.contractId, args.format))
        return renderToolResult(success('Exported agent-work contract payload', {
          contractId: args.contractId,
          format: args.format,
          payload,
        }))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : 'Unknown export-contract tool failure'
        return renderToolResult(error(message))
      }
    },
  })
}
