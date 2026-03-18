import {
  activateWorkflowTask,
  bootstrapWorkflowAuthority,
  completeWorkflowTask,
  createWorkflowTask,
  inspectWorkflowAuthority,
  listWorkflowTasks,
  readWorkflowTask,
  verifyWorkflowTask,
} from '../../core/workflow-management/index.js'
import { parseList } from '../../shared/tool-helpers.js'
import { taskActionPressureContracts, type HivemindTaskToolArgs } from '../../tools/task/types.js'

export interface TaskFeatureContext {
  sessionID: string
}

export type TaskFeatureResult =
  | { kind: 'error'; message: string; details?: Record<string, unknown> }
  | {
      kind: 'success'
      message: string
      data: Record<string, unknown>
      metadata?: {
        title: string
        metadata: Record<string, unknown>
      }
    }

export function executeHivemindTaskAction(
  projectRoot: string,
  args: HivemindTaskToolArgs,
  _context: TaskFeatureContext,
): TaskFeatureResult {
  const pressureContract = taskActionPressureContracts[args.action]

  if (args.action === 'list') {
    return {
      kind: 'success',
      message: 'Listed canonical workflow tasks',
      data: {
        workflowId: args.workflowId,
        tasks: listWorkflowTasks(projectRoot, args.workflowId),
        pressureContract,
      },
    }
  }

  if (args.action === 'get') {
    if (!args.taskId) {
      return { kind: 'error', message: 'taskId is required for get' }
    }

    const task = readWorkflowTask(projectRoot, args.taskId)
    if (!task) {
      return { kind: 'error', message: `Task ${args.taskId} was not found` }
    }

    return {
      kind: 'success',
      message: 'Loaded canonical workflow task',
      data: {
        task,
        pressureContract,
      },
    }
  }

  if (!args.workflowId) {
    return { kind: 'error', message: 'workflowId is required for task mutation actions' }
  }

  if (!args.taskId) {
    return { kind: 'error', message: 'taskId is required for task mutation actions' }
  }

  const authority = inspectWorkflowAuthority(projectRoot, {
    workflowId: args.workflowId,
    taskIds: [args.taskId],
  })

  if (!authority.healthy && args.action !== 'create') {
    return {
      kind: 'error',
      message: 'Workflow authority is not healthy enough for task mutation',
      details: authority as unknown as Record<string, unknown>,
    }
  }

  const title = args.title ?? args.taskId
  const dependencyIds = parseList(args.dependencyIds)
  const evidenceRefs = parseList(args.evidenceRefs)

  switch (args.action) {
    case 'create': {
      if (!authority.healthy) {
        bootstrapWorkflowAuthority(projectRoot, {
          workflowId: args.workflowId,
          taskIds: [args.taskId],
          sessionScope: 'main',
        })
      }
      const result = createWorkflowTask(projectRoot, {
        workflowId: args.workflowId,
        taskId: args.taskId,
        title,
        kind: args.kind,
        parentTaskId: args.parentTaskId,
        dependencyIds,
        verificationContractId: args.verificationContractId,
      })
      return {
        kind: 'success',
        message: 'Created canonical workflow task',
        data: {
          result,
          task: readWorkflowTask(projectRoot, args.taskId),
          pressureContract,
        },
        metadata: {
          title: `HiveMind task ${args.taskId}`,
          metadata: {
            action: 'create',
            workflowId: args.workflowId,
            safetyLevel: pressureContract.safety.level,
          },
        },
      }
    }
    case 'activate':
    case 'rotate': {
      const result = activateWorkflowTask(projectRoot, {
        workflowId: args.workflowId,
        taskId: args.taskId,
        title,
        kind: args.kind,
        parentTaskId: args.parentTaskId,
        dependencyIds,
        forceNewActive: args.action === 'rotate',
      })
      return {
        kind: 'success',
        message: 'Activated canonical workflow task',
        data: {
          result,
          task: readWorkflowTask(projectRoot, args.taskId),
          pressureContract,
        },
      }
    }
    case 'verify': {
      if (!args.verificationContractId) {
        return { kind: 'error', message: 'verificationContractId is required for verify' }
      }

      const result = verifyWorkflowTask(projectRoot, {
        workflowId: args.workflowId,
        taskId: args.taskId,
        verificationContractId: args.verificationContractId,
      })
      return {
        kind: 'success',
        message: 'Marked workflow task as verifying',
        data: {
          result,
          task: readWorkflowTask(projectRoot, args.taskId),
          pressureContract,
        },
      }
    }
    case 'complete': {
      const result = completeWorkflowTask(projectRoot, {
        workflowId: args.workflowId,
        taskId: args.taskId,
        evidenceRefs,
      })
      return {
        kind: 'success',
        message: 'Completed canonical workflow task',
        data: {
          result,
          task: readWorkflowTask(projectRoot, args.taskId),
          pressureContract,
        },
      }
    }
    default:
      return { kind: 'error', message: `Unsupported task action: ${args.action}` }
  }
}
