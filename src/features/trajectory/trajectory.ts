import {
  bootstrapTrajectoryLedger,
  closeTrajectory,
  createTrajectoryCheckpoint,
  inspectTrajectoryLedger,
  loadTrajectoryLedger,
  recordTrajectoryEvent,
} from '../../core/trajectory/index.js'
import { readWorkflowTaskState } from '../../core/workflow-management/index.js'
import { parseList } from '../../shared/tool-helpers.js'
import { trajectoryActionPressureContracts, type HivemindTrajectoryToolArgs } from '../../tools/trajectory/types.js'

export interface TrajectoryFeatureContext {
  sessionID: string
}

export type TrajectoryFeatureResult =
  | { kind: 'error'; message: string }
  | {
      kind: 'success'
      message: string
      data: Record<string, unknown>
      metadata?: {
        title: string
        metadata: Record<string, unknown>
      }
    }

export async function executeHivemindTrajectoryAction(
  projectRoot: string,
  args: HivemindTrajectoryToolArgs,
  context: TrajectoryFeatureContext,
): Promise<TrajectoryFeatureResult> {
  const pressureContract = trajectoryActionPressureContracts[args.action]
  const ledger = await loadTrajectoryLedger(projectRoot)
  const selectedTrajectoryId = args.trajectoryId ?? ledger.activeTrajectoryId ?? ledger.lastClosedTrajectoryId ?? undefined

  switch (args.action) {
    case 'inspect':
      return {
        kind: 'success',
        message: 'Inspected trajectory ledger',
        data: {
          inspection: inspectTrajectoryLedger(projectRoot),
          activeTrajectoryId: ledger.activeTrajectoryId,
          lastClosedTrajectoryId: ledger.lastClosedTrajectoryId,
          selectedTrajectory: ledger.trajectories.find((item) => item.id === selectedTrajectoryId),
          pressureContract,
        },
      }
    case 'traverse': {
      if (!selectedTrajectoryId) {
        return { kind: 'error', message: 'No trajectory is available to traverse' }
      }

      const trajectory = ledger.trajectories.find((item) => item.id === selectedTrajectoryId)
      if (!trajectory) {
        return { kind: 'error', message: `Trajectory ${selectedTrajectoryId} was not found` }
      }

      const taskResult = readWorkflowTaskState(projectRoot)
      if (!taskResult.ok) {
        return { kind: 'error', message: `Failed to load task state: ${taskResult.error.message}` }
      }

      const taskState = taskResult.value
      const tasks = taskState.tasks.filter((task: { id: string }) => trajectory.taskIds.includes(task.id))
      const subtasks = taskState.tasks.filter((task: { id: string }) => trajectory.subtaskIds.includes(task.id))

      return {
        kind: 'success',
        message: 'Traversed trajectory relations',
        data: {
          trajectory,
          workflows: trajectory.workflowIds,
          tasks,
          subtasks,
          checkpoints: ledger.checkpoints.filter((checkpoint) => checkpoint.trajectoryId === trajectory.id),
          pressureContract,
        },
      }
    }
    case 'attach': {
      if (!args.trajectoryId || !args.workflowId) {
        return { kind: 'error', message: 'trajectoryId and workflowId are required for attach' }
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

      return {
        kind: 'success',
        message: 'Attached session to trajectory authority',
        data: {
          activeTrajectoryId: nextLedger.activeTrajectoryId,
          trajectory: nextLedger.trajectories.find((item) => item.id === args.trajectoryId),
          pressureContract,
        },
        metadata: {
          title: `HiveMind trajectory ${args.trajectoryId}`,
          metadata: {
            action: 'attach',
            workflowId: args.workflowId,
            safetyLevel: pressureContract.safety.level,
          },
        },
      }
    }
    case 'checkpoint': {
      if (!selectedTrajectoryId || !args.workflowId) {
        return { kind: 'error', message: 'trajectoryId and workflowId are required for checkpoint' }
      }

      const checkpoint = await createTrajectoryCheckpoint(projectRoot, {
        trajectoryId: selectedTrajectoryId,
        workflowId: args.workflowId,
        taskIds: parseList(args.taskIds),
        subtaskIds: parseList(args.subtaskIds),
        source: args.source ?? 'tool:hivemind_trajectory',
        resumeTarget: args.resumeTarget ?? 'command:hm-harness',
      })
      return {
        kind: 'success',
        message: 'Created trajectory checkpoint',
        data: {
          checkpoint,
          pressureContract,
        },
      }
    }
    case 'event': {
      if (!selectedTrajectoryId || !args.summary) {
        return { kind: 'error', message: 'trajectoryId and summary are required for event' }
      }

      const nextLedger = await recordTrajectoryEvent(projectRoot, selectedTrajectoryId, {
        kind: args.kind ?? 'note',
        summary: args.summary,
        evidenceRefs: parseList(args.evidenceRefs),
      })
      return {
        kind: 'success',
        message: 'Recorded trajectory event',
        data: {
          trajectory: nextLedger.trajectories.find((item) => item.id === selectedTrajectoryId),
          pressureContract,
        },
      }
    }
    case 'close': {
      if (!selectedTrajectoryId || !args.summary) {
        return { kind: 'error', message: 'trajectoryId and summary are required for close' }
      }

      const nextLedger = await closeTrajectory(projectRoot, selectedTrajectoryId, {
        closingSummary: args.summary,
      })
      return {
        kind: 'success',
        message: 'Closed trajectory',
        data: {
          trajectory: nextLedger.trajectories.find((item) => item.id === selectedTrajectoryId),
          lastClosedTrajectoryId: nextLedger.lastClosedTrajectoryId,
          pressureContract,
        },
      }
    }
    default:
      return { kind: 'error', message: `Unsupported trajectory action: ${args.action}` }
  }
}
