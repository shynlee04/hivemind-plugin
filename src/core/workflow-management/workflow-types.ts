export interface WorkflowRecord {
  id: string
  intent: string
  stage: 'initial' | 'interdependent' | 'mid-session'
  scope: 'main' | 'sub-session'
  lineage: 'hivefiver' | 'hiveminder'
}

export interface HandoffRecord {
  sourceSessionId: string
  targetSessionId?: string
  summary: string
  requiredNextSteps: string[]
}

export interface WorkflowDecision {
  workflowId: string
  shouldDelegate: boolean
  loadStrategy: 'light' | 'bounded' | 'full'
}
