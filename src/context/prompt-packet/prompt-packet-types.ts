export type SessionScope = 'main' | 'sub-session'
export type KernelLineage = 'hivefiver' | 'hiveminder'

export interface PromptPacketState {
  sessionId: string
  parentSessionId?: string
  sessionClass?: string
  preferredUserName?: string
  lineage?: KernelLineage
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  checkpointId?: string
  todoChainId?: string
  branchFocus?: string
  governanceMode?: string
  automationLevel?: string
  language?: string
  artifactLanguage?: string
  expertLevel?: string
  outputStyle?: string
  verificationContract?: string
  returnContract?: string
  guardrails?: string[]
  facilitators?: string[]
  mcpReadiness?: string[]
  hivebrainDigest?: string[]
}

export interface CompiledPromptPacket {
  sessionScope: SessionScope
  systemPacket: string
  messagePacket: string
}
