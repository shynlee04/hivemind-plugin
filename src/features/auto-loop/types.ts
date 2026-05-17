import type { DispatchParams } from "../../coordination/delegation/coordinator.js"
import type { DelegationResult } from "../../coordination/delegation/types.js"

export type AutoLoopContextBuilder = (previousResult: DelegationResult, iteration: number, initialPrompt: string) => string

export interface AutoLoopOpts {
  agent: string
  contextBuilder?: AutoLoopContextBuilder
  initialPrompt: string
  maxIterations: number
  parentSessionId?: string
  queueKey?: string
  stopCondition?: (result: DelegationResult) => boolean
}

export interface AutoLoopResult {
  iterations: number
  results: DelegationResult[]
  status: "completed" | "failed"
}

export type AutoLoopCoordinator = {
  dispatch: (params: DispatchParams) => Promise<DelegationResult>
}
