import { tool } from '@opencode-ai/plugin/tool'

import { executeHivemindHandoffAction } from '../../features/handoff/index.js'
import { error, success } from '../../shared/tool-response.js'
import { renderToolResult as render } from '../../shared/tool-helpers.js'
import type { HivemindHandoffToolArgs } from './types.js'

export function createHivemindHandoffTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Delegation and handoff artifact surface for bounded sub-session work. ' +
      'Use this to create, inspect, validate, and close resumable handoffs with evidence requirements.',
    args: {
      action: tool.schema.enum(['create', 'read', 'list', 'update', 'validate', 'close']).describe('Delegation handoff action to perform'),
      id: tool.schema.string().optional().describe('Handoff identifier to read, update, validate, or close'),
      sourceSessionId: tool.schema.string().optional().describe('Source session identifier for the handoff packet'),
      targetSessionId: tool.schema.string().optional().describe('Target delegated session identifier'),
      sourceAgent: tool.schema.string().optional().describe('Agent creating or owning the source side of the handoff'),
      targetAgent: tool.schema.string().optional().describe('Agent expected to execute the delegated work'),
      trajectoryId: tool.schema.string().optional().describe('Trajectory identifier bound to the handoff'),
      workflowId: tool.schema.string().optional().describe('Workflow identifier bound to the handoff'),
      taskIds: tool.schema.string().optional().describe('Comma-separated task identifiers carried by the handoff'),
      subtaskIds: tool.schema.string().optional().describe('Comma-separated subtask identifiers carried by the handoff'),
      scope: tool.schema.string().optional().describe('Delegated work scope summary'),
      constraints: tool.schema.string().optional().describe('Comma-separated hard constraints for the delegate'),
      memoryScope: tool.schema.string().optional().describe('Comma-separated memory or context scopes to preserve'),
      successMetrics: tool.schema.string().optional().describe('Comma-separated success metrics for completion'),
      requiredEvidence: tool.schema.string().optional().describe('JSON array of required evidence records'),
      summary: tool.schema.string().optional().describe('Human-readable handoff summary or closeout summary'),
      nextSteps: tool.schema.string().optional().describe('Comma-separated next steps for the delegated session'),
      evidence: tool.schema.string().optional().describe('JSON array of evidence records to attach'),
      returnContract: tool.schema.string().optional().describe('Expected return contract for the delegated agent'),
      evidenceContractId: tool.schema.string().optional().describe('Evidence contract identifier tied to the handoff'),
      returnGate: tool.schema.string().optional().describe('Return gate that must be satisfied before closure'),
      resumeTarget: tool.schema.string().optional().describe('Suggested command or surface to resume from'),
    },
    async execute(args: HivemindHandoffToolArgs, context) {
      const result = await executeHivemindHandoffAction(projectRoot, args, {
        sessionID: context.sessionID,
        agent: context.agent,
      })

      if (result.kind === 'error') {
        return render(error(result.message))
      }

      if (result.metadata) {
        context.metadata(result.metadata)
      }

      return render(success(result.message, result.data))
    },
  })
}
