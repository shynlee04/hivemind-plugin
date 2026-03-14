import {
  createWorkflowContinuity,
  type HandoffRecord,
  type WorkflowRecord,
} from '../../core/workflow-management/index.js'

export function buildWorkflowIntegrationState(
  workflow: WorkflowRecord,
  handoff?: HandoffRecord,
): { summary: string; nextSteps: string[] } {
  const continuity = createWorkflowContinuity(workflow, handoff)

  return {
    summary: continuity.continuitySummary,
    nextSteps: continuity.nextSteps,
  }
}
