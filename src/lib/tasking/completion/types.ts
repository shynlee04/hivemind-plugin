/**
 * Completion detection shared types.
 *
 * Leaf module — no imports from other harness modules.
 */

export type StartGateEvidence = {
  thinkingBlocks: number
  toolCalls: number
  assistantMessages: number
  passed: boolean
}

export type CompletionStatus = "pending" | "started" | "active" | "idle" | "completed" | "failed"

export type CompletionCheckResult = {
  status: CompletionStatus
  evidence: StartGateEvidence
  consecutiveIdlePolls: number
  idleDurationMs: number
}
