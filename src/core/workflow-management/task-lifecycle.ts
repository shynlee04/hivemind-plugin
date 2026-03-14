import * as fs from 'node:fs'
import * as path from 'node:path'

import { getHivemindPath } from '../../shared/paths.js'
import type { WorkflowRecord } from './workflow-types.js'

export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'invalidated' | 'verifying' | 'complete'

export interface TaskRecord {
  id: string
  workflowId: string
  title: string
  kind: 'task' | 'subtask'
  status: TaskStatus
  parentTaskId?: string
  dependencyIds: string[]
  verificationContractId?: string
  evidenceRefs: string[]
  updatedAt: string
}

export interface TaskLifecycleState {
  version: string
  tasks: TaskRecord[]
}

export interface ActivateWorkflowTaskInput {
  workflowId: string
  taskId: string
  title: string
  kind?: 'task' | 'subtask'
  parentTaskId?: string
  dependencyIds?: string[]
  forceNewActive?: boolean
}

export interface VerifyWorkflowTaskInput {
  workflowId: string
  taskId: string
  verificationContractId: string
}

export interface CompleteWorkflowTaskInput {
  workflowId: string
  taskId: string
  evidenceRefs?: string[]
}

export interface TaskLifecycleResult {
  activeTaskId?: string
  completedTaskId?: string
  invalidatedTaskIds: string[]
  workflowVerificationState: WorkflowRecord['verificationState']
}

function getTaskLedgerPaths(projectRoot: string): { stateTasksPath: string; graphTasksPath: string } {
  const hivemindPath = getHivemindPath(projectRoot)
  return {
    stateTasksPath: path.join(hivemindPath, 'state', 'tasks.json'),
    graphTasksPath: path.join(hivemindPath, 'graph', 'tasks.json'),
  }
}

function loadLifecycleState(filePath: string): TaskLifecycleState {
  if (!fs.existsSync(filePath)) {
    return { version: '1.0.0', tasks: [] }
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as TaskLifecycleState
    return {
      version: parsed.version ?? '1.0.0',
      tasks: parsed.tasks ?? [],
    }
  } catch {
    return { version: '1.0.0', tasks: [] }
  }
}

function saveLifecycleState(projectRoot: string, state: TaskLifecycleState): TaskLifecycleState {
  const { stateTasksPath, graphTasksPath } = getTaskLedgerPaths(projectRoot)
  fs.mkdirSync(path.dirname(stateTasksPath), { recursive: true })
  fs.mkdirSync(path.dirname(graphTasksPath), { recursive: true })
  const serialized = JSON.stringify(state, null, 2)
  fs.writeFileSync(stateTasksPath, serialized)
  fs.writeFileSync(graphTasksPath, serialized)
  return state
}

function computeWorkflowVerificationState(
  tasks: TaskRecord[],
  workflowId: string,
): WorkflowRecord['verificationState'] {
  const workflowTasks = tasks.filter((task) => task.workflowId === workflowId)
  if (workflowTasks.some((task) => task.status === 'verifying')) {
    return 'verifying'
  }

  if (workflowTasks.some((task) => task.status === 'complete' && !!task.verificationContractId)) {
    return 'validated'
  }

  return 'pending'
}

export function activateWorkflowTask(
  projectRoot: string,
  input: ActivateWorkflowTaskInput,
): TaskLifecycleResult {
  const { stateTasksPath } = getTaskLedgerPaths(projectRoot)
  const state = loadLifecycleState(stateTasksPath)
  const now = new Date().toISOString()
  const invalidatedTaskIds: string[] = []

  if (input.forceNewActive) {
    for (const task of state.tasks) {
      if (
        task.workflowId === input.workflowId
        && task.kind === (input.kind ?? 'task')
        && task.parentTaskId === input.parentTaskId
        && task.status === 'in_progress'
        && task.id !== input.taskId
      ) {
        task.status = 'invalidated'
        task.updatedAt = now
        invalidatedTaskIds.push(task.id)
      }
    }
  }

  const existing = state.tasks.find((task) => task.id === input.taskId)
  if (existing) {
    existing.title = input.title
    existing.kind = input.kind ?? existing.kind
    existing.parentTaskId = input.parentTaskId
    existing.status = 'in_progress'
    existing.updatedAt = now
    existing.dependencyIds = input.dependencyIds ?? existing.dependencyIds
  } else {
    state.tasks.push({
      id: input.taskId,
      workflowId: input.workflowId,
      title: input.title,
      kind: input.kind ?? 'task',
      status: 'in_progress',
      parentTaskId: input.parentTaskId,
      dependencyIds: input.dependencyIds ?? [],
      evidenceRefs: [],
      updatedAt: now,
    })
  }

  saveLifecycleState(projectRoot, state)

  return {
    activeTaskId: input.taskId,
    invalidatedTaskIds,
    workflowVerificationState: computeWorkflowVerificationState(state.tasks, input.workflowId),
  }
}

export function verifyWorkflowTask(
  projectRoot: string,
  input: VerifyWorkflowTaskInput,
): TaskLifecycleResult {
  const { stateTasksPath } = getTaskLedgerPaths(projectRoot)
  const state = loadLifecycleState(stateTasksPath)
  const task = state.tasks.find((item) => item.id === input.taskId)
  if (!task) {
    state.tasks.push({
      id: input.taskId,
      workflowId: input.workflowId,
      title: input.taskId,
      kind: 'task',
      status: 'verifying',
      dependencyIds: [],
      verificationContractId: input.verificationContractId,
      evidenceRefs: [],
      updatedAt: new Date().toISOString(),
    })
  } else {
    task.status = 'verifying'
    task.verificationContractId = input.verificationContractId
    task.updatedAt = new Date().toISOString()
  }

  saveLifecycleState(projectRoot, state)
  return {
    activeTaskId: input.taskId,
    invalidatedTaskIds: [],
    workflowVerificationState: computeWorkflowVerificationState(state.tasks, input.workflowId),
  }
}

export function completeWorkflowTask(
  projectRoot: string,
  input: CompleteWorkflowTaskInput,
): TaskLifecycleResult {
  const { stateTasksPath } = getTaskLedgerPaths(projectRoot)
  const state = loadLifecycleState(stateTasksPath)
  const task = state.tasks.find((item) => item.id === input.taskId)
  const now = new Date().toISOString()

  if (task) {
    task.status = 'complete'
    task.updatedAt = now
    task.evidenceRefs = [...new Set([...(task.evidenceRefs ?? []), ...(input.evidenceRefs ?? [])])]
  }

  saveLifecycleState(projectRoot, state)
  return {
    completedTaskId: input.taskId,
    invalidatedTaskIds: [],
    workflowVerificationState: computeWorkflowVerificationState(state.tasks, input.workflowId),
  }
}

export function readWorkflowTaskState(projectRoot: string): TaskLifecycleState {
  return loadLifecycleState(getTaskLedgerPaths(projectRoot).stateTasksPath)
}
