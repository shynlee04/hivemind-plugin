import type { HandoffRecord, WorkflowRecord } from './workflow-types.js'

export interface WorkflowContinuity {
  workflowId: string
  sourceSessionId: string | null
  continuitySummary: string
  nextSteps: string[]
}

export function createWorkflowContinuity(
  workflow: WorkflowRecord,
  handoff?: HandoffRecord,
): WorkflowContinuity {
  return {
    workflowId: workflow.id,
    sourceSessionId: handoff?.sourceSessionId ?? null,
    continuitySummary: handoff?.summary ?? workflow.intent,
    nextSteps: handoff?.requiredNextSteps ?? [],
  }
}
