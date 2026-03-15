import type {
  KernelLineage,
  PromptPacketState,
  SessionScope,
} from './prompt-packet-types.js'

export interface NormalizedPromptPacketState {
  sessionScope: SessionScope
  sessionClass: string
  preferredUserName: string | null
  lineage: KernelLineage
  sessionId: string
  parentSessionId: string | null
  trajectoryId: string
  workflowId: string
  taskIds: string[]
  subtaskIds: string[]
  checkpointId: string
  todoChainId: string
  branchFocus: string
  governanceMode: string
  automationLevel: string
  language: string
  artifactLanguage: string
  expertLevel: string
  outputStyle: string
  verificationContract: string
  returnContract: string
  guardrails: string[]
  facilitators: string[]
  mcpReadiness: string[]
  hivebrainDigest: string[]
}

function fallbackList(values: string[] | undefined): string[] {
  return values && values.length > 0 ? values : ['none']
}

function defaultSessionClass(scope: SessionScope, sessionClass?: string): string {
  if (sessionClass && sessionClass.trim().length > 0) {
    return sessionClass.trim()
  }
  return scope === 'sub-session' ? 'delegated-sub-session' : 'workflow-execution'
}

export function normalizePromptPacketState(
  state: PromptPacketState,
  scope: SessionScope,
): NormalizedPromptPacketState {
  return {
    sessionScope: scope,
    sessionClass: defaultSessionClass(scope, state.sessionClass),
    preferredUserName: state.preferredUserName?.trim() ? state.preferredUserName.trim() : null,
    lineage: state.lineage ?? 'hivefiver',
    sessionId: state.sessionId,
    parentSessionId: state.parentSessionId ?? null,
    trajectoryId: state.trajectoryId ?? 'unassigned',
    workflowId: state.workflowId ?? 'unassigned',
    taskIds: fallbackList(state.taskIds),
    subtaskIds: fallbackList(state.subtaskIds),
    checkpointId: state.checkpointId ?? 'unassigned',
    todoChainId: state.todoChainId ?? 'unassigned',
    branchFocus: state.branchFocus ?? 'delegated-scope-pending',
    governanceMode: state.governanceMode ?? 'assisted',
    automationLevel: state.automationLevel ?? 'guided',
    language: state.language ?? 'en',
    artifactLanguage: state.artifactLanguage ?? state.language ?? 'en',
    expertLevel: state.expertLevel ?? 'intermediate',
    outputStyle: state.outputStyle ?? 'explanatory',
    verificationContract: state.verificationContract ?? 'unassigned',
    returnContract: state.returnContract ?? 'deliver findings, evidence refs, and exact next steps',
    guardrails: fallbackList(state.guardrails),
    facilitators: fallbackList(state.facilitators),
    mcpReadiness: fallbackList(state.mcpReadiness),
    hivebrainDigest: fallbackList(state.hivebrainDigest),
  }
}
