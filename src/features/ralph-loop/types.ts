import type { DispatchParams } from "../../coordination/delegation/coordinator.js"
import type { DelegationResult } from "../../coordination/delegation/types.js"

export type RalphLoopContextBuilder = (previousResult: DelegationResult, cycle: number, initialPrompt: string) => string

export interface RalphLoopOpts {
  agents: string[]
  contextBuilder?: RalphLoopContextBuilder
  initialPrompt: string
  maxCycles: number
  parentSessionId?: string
  queueKey?: string
}

export interface RalphLoopResult {
  agentResults: Record<string, DelegationResult[]>
  cycles: number
  results: DelegationResult[]
  status: "completed" | "failed"
}

export type RalphLoopCoordinator = {
  dispatch: (params: DispatchParams) => Promise<DelegationResult>
}
