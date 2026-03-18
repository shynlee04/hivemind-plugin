import { tool } from '@opencode-ai/plugin'

import { executeHivemindTaskAction } from '../../features/workflow/task.js'
import { error, success } from '../../shared/tool-response.js'
import { renderToolResult as render } from '../../shared/tool-helpers.js'
import type { HivemindTaskToolArgs } from './types.js'



export function createHivemindTaskTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Canonical task and subtask authority for HiveMind workflows. ' +
      'Use this to create, inspect, activate, rotate, verify, and complete workflow-bound execution nodes.',
    args: {
      action: tool.schema.enum(['create', 'list', 'get', 'activate', 'rotate', 'verify', 'complete']).describe('Task authority action to perform'),
      workflowId: tool.schema.string().optional().describe('Workflow identifier that owns the task'),
      taskId: tool.schema.string().optional().describe('Task identifier to inspect or mutate'),
      title: tool.schema.string().optional().describe('Human-readable task title override'),
      kind: tool.schema.enum(['task', 'subtask']).optional().describe('Whether the node is a task or subtask'),
      parentTaskId: tool.schema.string().optional().describe('Parent task identifier for subtask creation or activation'),
      dependencyIds: tool.schema.string().optional().describe('Comma-separated task dependency identifiers'),
      verificationContractId: tool.schema.string().optional().describe('Verification contract identifier required for verify'),
      evidenceRefs: tool.schema.string().optional().describe('Comma-separated evidence references for completion'),
    },
    async execute(args: HivemindTaskToolArgs, context) {
      const result = executeHivemindTaskAction(projectRoot, args, {
        sessionID: context.sessionID,
      })

      if (result.kind === 'error') {
        return render(error(result.message, result.details))
      }

      if (result.metadata) {
        context.metadata(result.metadata)
      }

      return render(success(result.message, result.data))
    },
  })
}
