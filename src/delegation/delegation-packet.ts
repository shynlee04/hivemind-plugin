export interface DelegationEvidenceItem {
  kind: 'command_output' | 'file_diff' | 'test_report' | 'trace' | 'citation'
  description: string
  required: boolean
}

export interface DelegationPacket {
  sourceSessionId: string
  targetSessionId: string
  targetAgent: string
  workflowId: string
  scope: string
  constraints: string[]
  successMetrics: string[]
  requiredEvidence: DelegationEvidenceItem[]
}

export function createDelegationPacket(input: {
  sourceSessionId: string
  targetSessionId: string
  targetAgent: string
  workflowId: string
  scope: string
  constraints?: string[]
  successMetrics?: string[]
  requiredEvidence?: DelegationEvidenceItem[]
}): DelegationPacket {
  return {
    sourceSessionId: input.sourceSessionId,
    targetSessionId: input.targetSessionId,
    targetAgent: input.targetAgent,
    workflowId: input.workflowId,
    scope: input.scope,
    constraints: input.constraints ?? [],
    successMetrics: input.successMetrics ?? [],
    requiredEvidence: input.requiredEvidence ?? [],
  }
}
