import { tool } from '@opencode-ai/plugin'

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
import { error, success } from '../../shared/tool-response.js'
import { parseList, renderToolResult as render } from '../../shared/tool-helpers.js'
import { taskActionPressureContracts, type HivemindTaskToolArgs } from './types.js'



export function createHivemindTaskTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      'Canonical task and subtask authority for HiveMind workflows. ' +
      'Use this to create, inspect, activate, rotate, verify, and complete workflow-bound execution nodes.',
    args: {
      action: tool.schema.enum(['create', 'list', 'get', 'activate', 'rotate', 'verify', 'complete']),
      workflowId: tool.schema.string().optional(),
      taskId: tool.schema.string().optional(),
      title: tool.schema.string().optional(),
      kind: tool.schema.enum(['task', 'subtask']).optional(),
      parentTaskId: tool.schema.string().optional(),
      dependencyIds: tool.schema.string().optional(),
      verificationContractId: tool.schema.string().optional(),
      evidenceRefs: tool.schema.string().optional(),
    },
    async execute(args: HivemindTaskToolArgs, context) {
      const pressureContract = taskActionPressureContracts[args.action]

      if (args.action === 'list') {
        const tasks = listWorkflowTasks(projectRoot, args.workflowId)
        return render(success('Listed canonical workflow tasks', {
          workflowId: args.workflowId,
          tasks,
          pressureContract,
        }))
      }

      if (args.action === 'get') {
        if (!args.taskId) {
          return render(error('taskId is required for get'))
        }

        const task = readWorkflowTask(projectRoot, args.taskId)
        if (!task) {
          return render(error(`Task ${args.taskId} was not found`))
        }

        return render(success('Loaded canonical workflow task', {
          task,
          pressureContract,
        }))
      }

      if (!args.workflowId) {
        return render(error('workflowId is required for task mutation actions'))
      }

      if (!args.taskId) {
        return render(error('taskId is required for task mutation actions'))
      }

      const authority = inspectWorkflowAuthority(projectRoot, {
        workflowId: args.workflowId,
        taskIds: [args.taskId],
      })

      if (!authority.healthy && args.action !== 'create') {
        return render(error('Workflow authority is not healthy enough for task mutation', authority))
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
          context.metadata({
            title: `HiveMind task ${args.taskId}`,
            metadata: {
              action: 'create',
              workflowId: args.workflowId,
              safetyLevel: pressureContract.safety.level,
            },
          })
          return render(success('Created canonical workflow task', {
            result,
            task: readWorkflowTask(projectRoot, args.taskId),
            pressureContract,
          }))
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
          return render(success('Activated canonical workflow task', {
            result,
            task: readWorkflowTask(projectRoot, args.taskId),
            pressureContract,
          }))
        }
        case 'verify': {
          if (!args.verificationContractId) {
            return render(error('verificationContractId is required for verify'))
          }

          const result = verifyWorkflowTask(projectRoot, {
            workflowId: args.workflowId,
            taskId: args.taskId,
            verificationContractId: args.verificationContractId,
          })
          return render(success('Marked workflow task as verifying', {
            result,
            task: readWorkflowTask(projectRoot, args.taskId),
            pressureContract,
          }))
        }
        case 'complete': {
          const result = completeWorkflowTask(projectRoot, {
            workflowId: args.workflowId,
            taskId: args.taskId,
            evidenceRefs,
          })
          return render(success('Completed canonical workflow task', {
            result,
            task: readWorkflowTask(projectRoot, args.taskId),
            pressureContract,
          }))
        }
        default:
          return render(error(`Unsupported task action: ${args.action}`))
      }
    },
  })
}
