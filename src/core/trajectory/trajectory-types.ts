import type { KernelLineage, SessionScope } from '../../context/prompt-packet/prompt-packet-types.js'
import type { PurposeClass } from '../../hooks/start-work/start-work-types.js'
import type { RuntimePressureContract } from '../../shared/pressure-contract.js'

export type TrajectoryStatus = 'active' | 'closed'
export type TrajectoryRecoveryOutcome = 'bootstrap' | 'repair' | 'rebind' | 'resume' | 'none'
export type TrajectoryAssessmentAction =
  | 'attach-active'
  | 'resume-closed'
  | 'create-new'
  | 'defer-pending'
  | 'refuse-conflict'

export interface TrajectoryEvent {
  kind: 'summary' | 'handoff' | 'evidence' | 'transition' | 'note'
  summary: string
  evidenceRefs?: string[]
  createdAt?: string
}

export interface TrajectoryRecord {
  id: string
  lineage: KernelLineage
  purposeClass: PurposeClass
  workflowIds: string[]
  sessionIds: string[]
  taskIds: string[]
  subtaskIds: string[]
  delegationIds: string[]
  eventSummaries: string[]
  evidenceRefs: string[]
  planningRefs: string[]
  graphNodeBindings: string[]
  rerouteNotes: string[]
  checkpointIds: string[]
  nextAllowedTransitions: string[]
  branchNotes: string[]
  events: TrajectoryEvent[]
  status: TrajectoryStatus
  createdAt: string
  updatedAt: string
  closedAt?: string
  closingSummary?: string
}

export interface TrajectoryCheckpoint {
  id: string
  trajectoryId: string
  workflowId: string
  taskIds: string[]
  subtaskIds: string[]
  source: string
  resumeTarget: string
  createdAt: string
}

export interface TrajectoryRecoveryLogEntry {
  id: string
  outcome: TrajectoryRecoveryOutcome
  failureClasses: string[]
  summary: string
  checkpointId?: string
  createdAt: string
}

export interface TrajectoryLedger {
  version: string
  activeTrajectoryId: string | null
  lastClosedTrajectoryId: string | null
  trajectories: TrajectoryRecord[]
  checkpoints: TrajectoryCheckpoint[]
  recoveryLog: TrajectoryRecoveryLogEntry[]
}

export interface BootstrapTrajectoryInput {
  trajectoryId: string
  workflowId: string
  sessionId: string
  lineage: KernelLineage
  purposeClass: PurposeClass
  taskIds?: string[]
  subtaskIds?: string[]
  delegationIds?: string[]
  planningRefs?: string[]
  graphNodeBindings?: string[]
}

export interface CloseTrajectoryInput {
  closingSummary: string
}

export interface CreateTrajectoryCheckpointInput {
  trajectoryId: string
  workflowId: string
  taskIds?: string[]
  subtaskIds?: string[]
  source: string
  resumeTarget: string
}

export interface RecordTrajectoryRecoveryInput {
  outcome: TrajectoryRecoveryOutcome
  failureClasses: string[]
  summary: string
  checkpointId?: string
}

export interface TrajectoryLedgerInspection {
  exists: boolean
  healthy: boolean
  filePath: string
  issues: string[]
}

export interface AssessTrajectoryEntryInput {
  userMessage: string
  lineage: KernelLineage
  purposeClass: PurposeClass
  sessionScope: SessionScope
  workflowId?: string
  taskIds?: string[]
}

export interface TrajectoryAssessment {
  action: TrajectoryAssessmentAction
  activeTrajectoryId?: string
  lastClosedTrajectoryId?: string
  matchedWorkflowId?: string
  checkpointId?: string
  resumeTarget?: string
  reasons: string[]
  evidenceRefs: string[]
  pressureContract: RuntimePressureContract
}
