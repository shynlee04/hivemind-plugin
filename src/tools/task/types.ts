import type { RuntimePressureContract } from '../../shared/pressure-contract.js'
import { getRuntimePressureContract } from '../../shared/pressure-contract.js'

export type HivemindTaskAction =
  | 'create'
  | 'list'
  | 'get'
  | 'activate'
  | 'rotate'
  | 'verify'
  | 'complete'

export interface HivemindTaskToolArgs {
  action: HivemindTaskAction
  workflowId?: string
  taskId?: string
  title?: string
  kind?: 'task' | 'subtask'
  parentTaskId?: string
  dependencyIds?: string
  verificationContractId?: string
  evidenceRefs?: string
}

export const taskActionPressureContracts: Record<HivemindTaskAction, RuntimePressureContract> = {
  create: getRuntimePressureContract('task-mutation'),
  list: getRuntimePressureContract('steady-state'),
  get: getRuntimePressureContract('steady-state'),
  activate: getRuntimePressureContract('task-mutation'),
  rotate: getRuntimePressureContract('task-mutation'),
  verify: getRuntimePressureContract('task-mutation'),
  complete: getRuntimePressureContract('task-mutation'),
}
