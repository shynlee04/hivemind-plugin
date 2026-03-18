import { tool } from '@opencode-ai/plugin'

import { executeHivemindTrajectoryAction } from '../../features/trajectory/trajectory.js'
import { error, success } from '../../shared/tool-response.js'
import { renderToolResult as render } from '../../shared/tool-helpers.js'
import type { HivemindTrajectoryToolArgs } from './types.js'



export function createHivemindTrajectoryTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Canonical trajectory control surface for attach, traverse, checkpoint, event recording, and closeout. ' +
      'Use this when a session or agent must manipulate the runtime story across workflow and task state.',
    args: {
      action: tool.schema.enum(['inspect', 'traverse', 'attach', 'checkpoint', 'event', 'close']).describe('Trajectory control action to perform'),
      trajectoryId: tool.schema.string().optional().describe('Trajectory identifier to inspect or mutate'),
      workflowId: tool.schema.string().optional().describe('Workflow identifier associated with the trajectory operation'),
      sessionId: tool.schema.string().optional().describe('Session identifier to bind when attaching a trajectory'),
      lineage: tool.schema.enum(['hivefiver', 'hiveminder']).optional().describe('Lineage to bind during attach operations'),
      purposeClass: tool.schema
        .enum(['discovery', 'brainstorming', 'research', 'planning', 'implementation', 'gatekeeping', 'tdd', 'course-correction'])
        .optional()
        .describe('Purpose class to bind during attach operations'),
      taskIds: tool.schema.string().optional().describe('Comma-separated task identifiers attached to the trajectory'),
      subtaskIds: tool.schema.string().optional().describe('Comma-separated subtask identifiers attached to the trajectory'),
      summary: tool.schema.string().optional().describe('Summary text for event or close actions'),
      source: tool.schema.string().optional().describe('Checkpoint source label'),
      resumeTarget: tool.schema.string().optional().describe('Suggested command or target for resume flow'),
      kind: tool.schema.enum(['summary', 'handoff', 'evidence', 'transition', 'note']).optional().describe('Event kind to record on the trajectory'),
      evidenceRefs: tool.schema.string().optional().describe('Comma-separated evidence references for trajectory events'),
    },
    async execute(args: HivemindTrajectoryToolArgs, context) {
      const result = await executeHivemindTrajectoryAction(projectRoot, args, {
        sessionID: context.sessionID,
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
