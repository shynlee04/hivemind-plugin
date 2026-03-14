export interface WorkflowRecord {
  id: string
  intent: string
  stage: 'initial' | 'interdependent' | 'mid-session'
  scope: 'main' | 'sub-session'
  lineage: 'hivefiver' | 'hiveminder'
  purpose?: string
  orientation?: string
  topology?: 'linear' | 'dependent' | 'interdependent'
  dependencyState?: 'clear' | 'dependent-blocked' | 'interdependent'
  status?:
    | 'proposed'
    | 'active'
    | 'dependent-blocked'
    | 'interdependent'
    | 'handoff-pending'
    | 'verification-pending'
    | 'validated'
    | 'archived'
  planningRefs?: string[]
  taskIds?: string[]
  sessionIds?: string[]
  delegationIds?: string[]
  verificationState?: 'pending' | 'verifying' | 'validated'
}

export interface HandoffRecord {
  sourceSessionId: string
  targetSessionId?: string
  summary: string
  requiredNextSteps: string[]
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  evidenceRefs?: string[]
  returnContract?: string
}

export interface WorkflowDecision {
  workflowId: string
  shouldDelegate: boolean
  loadStrategy: 'light' | 'bounded' | 'full'
  workflowStatus?: WorkflowRecord['status']
  taskIds?: string[]
}

export type WorkflowTraversalOutcome = 'bootstrap' | 'repair' | 'route' | 'refuse'
