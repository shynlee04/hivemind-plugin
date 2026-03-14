export type RuntimeLoadStage = 'initial' | 'interdependent' | 'mid-session'

export interface RuntimeLoadInput {
  prompt: string
  sessionScope: 'main' | 'sub-session'
  hasWorkflow: boolean
  hasHandoff: boolean
}

export function resolveRuntimeLoadStage(input: RuntimeLoadInput): RuntimeLoadStage {
  if (!input.hasWorkflow || input.prompt.trim().length === 0) {
    return 'initial'
  }

  if (input.sessionScope === 'sub-session' || input.hasHandoff) {
    return 'interdependent'
  }

  return 'mid-session'
}
