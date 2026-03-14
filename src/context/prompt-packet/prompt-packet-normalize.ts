import type {
  KernelLineage,
  PromptPacketState,
  SessionScope,
} from './prompt-packet-types.js'

export interface NormalizedPromptPacketState {
  sessionScope: SessionScope
  sessionClass: string
  lineage: KernelLineage
  sessionId: string
  parentSessionId: string | null
  workflowId: string
  todoChainId: string
  branchFocus: string
  governanceMode: string
  automationLevel: string
  language: string
  artifactLanguage: string
  expertLevel: string
  outputStyle: string
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
    lineage: state.lineage ?? 'hivefiver',
    sessionId: state.sessionId,
    parentSessionId: state.parentSessionId ?? null,
    workflowId: state.workflowId ?? 'unassigned',
    todoChainId: state.todoChainId ?? 'unassigned',
    branchFocus: state.branchFocus ?? 'delegated-scope-pending',
    governanceMode: state.governanceMode ?? 'assisted',
    automationLevel: state.automationLevel ?? 'guided',
    language: state.language ?? 'en',
    artifactLanguage: state.artifactLanguage ?? state.language ?? 'en',
    expertLevel: state.expertLevel ?? 'intermediate',
    outputStyle: state.outputStyle ?? 'explanatory',
    guardrails: fallbackList(state.guardrails),
    facilitators: fallbackList(state.facilitators),
    mcpReadiness: fallbackList(state.mcpReadiness),
    hivebrainDigest: fallbackList(state.hivebrainDigest),
  }
}
