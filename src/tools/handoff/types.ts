import type { RuntimePressureContract } from '../../shared/pressure-contract.js'
import { getRuntimePressureContract } from '../../shared/pressure-contract.js'

export type HivemindHandoffAction =
  | 'create'
  | 'read'
  | 'list'
  | 'update'
  | 'validate'
  | 'close'

export interface HivemindHandoffToolArgs {
  action: HivemindHandoffAction
  id?: string
  sourceSessionId?: string
  targetSessionId?: string
  sourceAgent?: string
  targetAgent?: string
  trajectoryId?: string
  workflowId?: string
  taskIds?: string
  subtaskIds?: string
  scope?: string
  constraints?: string
  memoryScope?: string
  successMetrics?: string
  requiredEvidence?: string
  summary?: string
  nextSteps?: string
  evidence?: string
  returnContract?: string
  evidenceContractId?: string
  returnGate?: string
  resumeTarget?: string
}

export const handoffActionPressureContracts: Record<HivemindHandoffAction, RuntimePressureContract> = {
  create: getRuntimePressureContract('delegated-handoff'),
  read: getRuntimePressureContract('steady-state'),
  list: getRuntimePressureContract('steady-state'),
  update: getRuntimePressureContract('handoff-validation'),
  validate: getRuntimePressureContract('handoff-validation'),
  close: getRuntimePressureContract('handoff-validation'),
}
