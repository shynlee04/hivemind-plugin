export interface DelegationEvidenceItem {
  kind: 'command_output' | 'file_diff' | 'test_report' | 'trace' | 'citation'
  description: string
  required: boolean
}

export interface DelegationPacket {
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
  requiredEvidence: DelegationEvidenceItem[]
  returnContract: string
}

export function createDelegationPacket(input: {
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
  requiredEvidence?: DelegationEvidenceItem[]
  returnContract?: string
}): DelegationPacket {
  return {
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
    requiredEvidence: input.requiredEvidence ?? [],
    returnContract: input.returnContract ?? 'Return evidence and the next recommended workflow routing.',
  }
}
