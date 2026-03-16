import { tool } from '@opencode-ai/plugin'

import {
  bootstrapTrajectoryLedger,
  closeTrajectory,
  createTrajectoryCheckpoint,
  inspectTrajectoryLedger,
  loadTrajectoryLedger,
  recordTrajectoryEvent,
} from '../../core/trajectory/index.js'
import { readWorkflowTaskState } from '../../core/workflow-management/index.js'
import { error, success } from '../../shared/tool-response.js'
import { parseList, renderToolResult as render } from '../../shared/tool-helpers.js'
import { trajectoryActionPressureContracts, type HivemindTrajectoryToolArgs } from './types.js'



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
      const pressureContract = trajectoryActionPressureContracts[args.action]
      const ledger = await loadTrajectoryLedger(projectRoot)
      const selectedTrajectoryId = args.trajectoryId ?? ledger.activeTrajectoryId ?? ledger.lastClosedTrajectoryId ?? undefined

      switch (args.action) {
        case 'inspect': {
          return render(success('Inspected trajectory ledger', {
            inspection: inspectTrajectoryLedger(projectRoot),
            activeTrajectoryId: ledger.activeTrajectoryId,
            lastClosedTrajectoryId: ledger.lastClosedTrajectoryId,
            selectedTrajectory: ledger.trajectories.find((item) => item.id === selectedTrajectoryId),
            pressureContract,
          }))
        }
        case 'traverse': {
          if (!selectedTrajectoryId) {
            return render(error('No trajectory is available to traverse'))
          }

          const trajectory = ledger.trajectories.find((item) => item.id === selectedTrajectoryId)
          if (!trajectory) {
            return render(error(`Trajectory ${selectedTrajectoryId} was not found`))
          }

          const taskState = readWorkflowTaskState(projectRoot)
          const tasks = taskState.tasks.filter((task) => trajectory.taskIds.includes(task.id))
          const subtasks = taskState.tasks.filter((task) => trajectory.subtaskIds.includes(task.id))

          return render(success('Traversed trajectory relations', {
            trajectory,
            workflows: trajectory.workflowIds,
            tasks,
            subtasks,
            checkpoints: ledger.checkpoints.filter((checkpoint) => checkpoint.trajectoryId === trajectory.id),
            pressureContract,
          }))
        }
        case 'attach': {
          if (!args.trajectoryId || !args.workflowId) {
            return render(error('trajectoryId and workflowId are required for attach'))
          }

          const nextLedger = await bootstrapTrajectoryLedger(projectRoot, {
            trajectoryId: args.trajectoryId,
            workflowId: args.workflowId,
            sessionId: args.sessionId ?? context.sessionID,
            lineage: args.lineage ?? 'hivefiver',
            purposeClass: args.purposeClass ?? 'implementation',
            taskIds: parseList(args.taskIds),
            subtaskIds: parseList(args.subtaskIds),
          })
          context.metadata({
            title: `HiveMind trajectory ${args.trajectoryId}`,
            metadata: {
              action: 'attach',
              workflowId: args.workflowId,
              safetyLevel: pressureContract.safety.level,
            },
          })
          return render(success('Attached session to trajectory authority', {
            activeTrajectoryId: nextLedger.activeTrajectoryId,
            trajectory: nextLedger.trajectories.find((item) => item.id === args.trajectoryId),
            pressureContract,
          }))
        }
        case 'checkpoint': {
          if (!selectedTrajectoryId || !args.workflowId) {
            return render(error('trajectoryId and workflowId are required for checkpoint'))
          }

          const checkpoint = await createTrajectoryCheckpoint(projectRoot, {
            trajectoryId: selectedTrajectoryId,
            workflowId: args.workflowId,
            taskIds: parseList(args.taskIds),
            subtaskIds: parseList(args.subtaskIds),
            source: args.source ?? 'tool:hivemind_trajectory',
            resumeTarget: args.resumeTarget ?? 'command:hm-harness',
          })
          return render(success('Created trajectory checkpoint', {
            checkpoint,
            pressureContract,
          }))
        }
        case 'event': {
          if (!selectedTrajectoryId || !args.summary) {
            return render(error('trajectoryId and summary are required for event'))
          }

          const nextLedger = await recordTrajectoryEvent(projectRoot, selectedTrajectoryId, {
            kind: args.kind ?? 'note',
            summary: args.summary,
            evidenceRefs: parseList(args.evidenceRefs),
          })
          return render(success('Recorded trajectory event', {
            trajectory: nextLedger.trajectories.find((item) => item.id === selectedTrajectoryId),
            pressureContract,
          }))
        }
        case 'close': {
          if (!selectedTrajectoryId || !args.summary) {
            return render(error('trajectoryId and summary are required for close'))
          }

          const nextLedger = await closeTrajectory(projectRoot, selectedTrajectoryId, {
            closingSummary: args.summary,
          })
          return render(success('Closed trajectory', {
            trajectory: nextLedger.trajectories.find((item) => item.id === selectedTrajectoryId),
            lastClosedTrajectoryId: nextLedger.lastClosedTrajectoryId,
            pressureContract,
          }))
        }
        default:
          return render(error(`Unsupported trajectory action: ${args.action}`))
      }
    },
  })
}
