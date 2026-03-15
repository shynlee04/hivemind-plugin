export type SessionScope = 'main' | 'sub-session'
export type KernelLineage = 'hivefiver' | 'hiveminder'

/** Session identity and entity references */
export interface PromptSessionCore {
  sessionId: string
  parentSessionId?: string
  sessionClass?: string
  lineage?: KernelLineage
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
}

/** User profile preferences */
export interface PromptProfilePrefs {
  preferredUserName?: string
  language?: string
  artifactLanguage?: string
  expertLevel?: string
  outputStyle?: string
  branchFocus?: string
}

/** Workflow and governance context */
export interface PromptWorkflowContext {
  checkpointId?: string
  todoChainId?: string
  governanceMode?: string
  automationLevel?: string
  verificationContract?: string
  returnContract?: string
}

/** Extension arrays — guardrails, digests, readiness */
export interface PromptExtensions {
  guardrails?: string[]
  facilitators?: string[]
  mcpReadiness?: string[]
  hivebrainDigest?: string[]
}

/** Full prompt packet state — composed via intersection for backward compatibility */
export type PromptPacketState = PromptSessionCore
  & PromptProfilePrefs
  & PromptWorkflowContext
  & PromptExtensions

export interface CompiledPromptPacket {
  sessionScope: SessionScope
  systemPacket: string
  messagePacket: string
}
