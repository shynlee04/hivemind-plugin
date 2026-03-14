import type { RuntimePressureId } from '../shared/pressure-contract.js'

export interface DelegationEvidenceItem {
  kind: 'command_output' | 'file_diff' | 'test_report' | 'trace' | 'citation'
  description: string
  required: boolean
}

export interface DelegationPacket {
  delegationId?: string
  sourceSessionId: string
  targetSessionId: string
  sourceAgent: string
  targetAgent: string
  trajectoryId?: string
  workflowId: string
  taskIds: string[]
  subtaskIds: string[]
  scope: string
  constraints: string[]
  memoryScope: string[]
  successMetrics: string[]
  evidenceContractId?: string
  requiredEvidence: DelegationEvidenceItem[]
  returnContract: string
  returnGate?: string
  resumeTarget?: string
  pressureContractId: RuntimePressureId
}

export function createDelegationPacket(input: {
  delegationId?: string
  sourceSessionId: string
  targetSessionId: string
  sourceAgent?: string
  targetAgent: string
  trajectoryId?: string
  workflowId: string
  taskIds?: string[]
  subtaskIds?: string[]
  scope: string
  constraints?: string[]
  memoryScope?: string[]
  successMetrics?: string[]
  evidenceContractId?: string
  requiredEvidence?: DelegationEvidenceItem[]
  returnContract?: string
  returnGate?: string
  resumeTarget?: string
  pressureContractId?: RuntimePressureId
}): DelegationPacket {
  return {
    delegationId: input.delegationId,
    sourceSessionId: input.sourceSessionId,
    targetSessionId: input.targetSessionId,
    sourceAgent: input.sourceAgent ?? 'orchestrator',
    targetAgent: input.targetAgent,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds: input.taskIds ?? [],
    subtaskIds: input.subtaskIds ?? [],
    scope: input.scope,
    constraints: input.constraints ?? [],
    memoryScope: input.memoryScope ?? [],
    successMetrics: input.successMetrics ?? [],
    evidenceContractId: input.evidenceContractId,
    requiredEvidence: input.requiredEvidence ?? [],
    returnContract: input.returnContract ?? 'Return evidence and the next recommended workflow routing.',
    returnGate: input.returnGate,
    resumeTarget: input.resumeTarget,
    pressureContractId: input.pressureContractId ?? 'delegated-handoff',
  }
}
