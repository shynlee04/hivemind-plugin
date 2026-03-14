export type SessionScope = 'main' | 'sub-session'
export type KernelLineage = 'hivefiver' | 'hiveminder'

export interface PromptPacketState {
  sessionId: string
  parentSessionId?: string
  sessionClass?: string
  lineage?: KernelLineage
  workflowId?: string
  todoChainId?: string
  branchFocus?: string
  governanceMode?: string
  automationLevel?: string
  language?: string
  artifactLanguage?: string
  expertLevel?: string
  outputStyle?: string
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
