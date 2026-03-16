import type { KernelLineage, SessionScope } from '../context/prompt-packet/prompt-packet-types.js'
import type { PurposeClass } from '../hooks/start-work/start-work-types.js'
import type { TrajectoryRecoveryOutcome } from '../core/trajectory/index.js'
import type { RuntimePressureContract } from '../shared/pressure-contract.js'

export type RecoveryFailureClass =
  | 'missing-hivemind'
  | 'missing-planning-root'
  | 'missing-state-tasks'
  | 'missing-graph-tasks'
  | 'missing-trajectory-ledger'
  | 'corrupt-trajectory-ledger'
  | 'missing-task-link'
  | 'unknown-task-link'
  | 'active-trajectory-conflict'

export type RecoveryStatus = 'healthy' | 'recoverable' | 'blocked' | 'qa-pending'

export interface RecoveryAssessmentInput {
  sessionScope: SessionScope
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  lineage?: KernelLineage
  purposeClass?: PurposeClass
}

export interface RecoveryAssessment {
  status: RecoveryStatus
  failureClasses: RecoveryFailureClass[]
  recoveryOutcome: TrajectoryRecoveryOutcome
  reasons: string[]
  resumeTarget?: string
  checkpointId?: string
  evidenceRefs: string[]
  pressureContract: RuntimePressureContract
}

export interface RecoveryRepairResult extends RecoveryAssessment {
  repairActions: string[]
}

export interface CreateRecoveryCheckpointInput {
  trajectoryId: string
  workflowId: string
  taskIds?: string[]
  subtaskIds?: string[]
  source: string
  resumeTarget: string
}
