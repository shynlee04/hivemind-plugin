/**
 * Config workflow state machine types.
 * Extracted from types.ts to maintain the 500 LOC module limit.
 *
 * @module config-workflow/workflow-types
 */

// ---------------------------------------------------------------------------
// Config workflow state machine types (Phase 16.5 fix)
// ---------------------------------------------------------------------------

export const WORKFLOW_TURNS = [
  "discovery",
  "investigate",
  "collect",
  "proposal",
  "validate",
  "compile",
  "test",
  "save",
] as const

export type WorkflowTurn = (typeof WORKFLOW_TURNS)[number]

export type WorkflowTurnStatus = "pending" | "in_progress" | "complete" | "skipped"

export type WorkflowTurnRecord = {
  status: WorkflowTurnStatus
  output: Record<string, unknown> | null
  completedAt?: number
}

export type ConfigWorkflowState = {
  id: string
  type: "agent-config" | "command-config" | "skill-config" | "batch-config"
  currentTurn: number
  turns: Record<number, WorkflowTurnRecord>
  targetPrimitives: Array<{ type: "agent" | "command" | "skill"; name: string }>
  scope: "project" | "global"
  mode: "create" | "modify" | "batch-modify"
  startedAt: number
  updatedAt: number
}

export type WorkflowResumeResult = {
  workflowId: string
  currentTurn: number
  currentTurnName: WorkflowTurn
  completedTurns: number
  totalTurns: number
  lastOutput: Record<string, unknown> | null
  canContinue: boolean
}
