import type { RuntimePressureContract } from '../../shared/pressure-contract.js'
import { getRuntimePressureContract } from '../../shared/pressure-contract.js'

export type HivemindHandoffAction =
  | 'create'
  | 'read'
  | 'list'
  | 'update'
  | 'validate'
  | 'close'

/**
 * Identity fields for a handoff operation.
 * @remarks Used to establish who is handing off to whom across sessions.
 */
interface HandoffIdentity {
  /** Handoff identifier to read, update, validate, or close */
  id?: string
  /** Source session identifier for the handoff packet */
  sourceSessionId?: string
  /** Target delegated session identifier */
  targetSessionId?: string
  /** Agent creating or owning the source side of the handoff */
  sourceAgent?: string
  /** Agent expected to execute the delegated work */
  targetAgent?: string
}

/**
 * Workflow and task context bound to the handoff.
 * @remarks Associates the handoff with specific trajectory, workflow, and task structures.
 */
interface HandoffWorkflowContext {
  /** Trajectory identifier bound to the handoff */
  trajectoryId?: string
  /** Workflow identifier bound to the handoff */
  workflowId?: string
  /** Comma-separated task identifiers carried by the handoff */
  taskIds?: string
  /** Comma-separated subtask identifiers carried by the handoff */
  subtaskIds?: string
}

/**
 * Scope and constraints for delegated work.
 * @remarks Defines what work is in scope and any hard constraints.
 */
interface HandoffScope {
  /** Delegated work scope summary */
  scope?: string
  /** Comma-separated hard constraints for the delegate */
  constraints?: string
  /** Comma-separated memory or context scopes to preserve */
  memoryScope?: string
}

/**
 * Success criteria for the handoff.
 * @remarks Defines what must be demonstrated for the handoff to be considered successful.
 */
interface HandoffSuccessCriteria {
  /** Comma-separated success metrics for completion */
  successMetrics?: string
  /** JSON array of required evidence records */
  requiredEvidence?: string
}

/**
 * Record content for handoff summary, evidence, and contracts.
 * @remarks Carries the substantive content of the handoff.
 */
interface HandoffRecord {
  /** Human-readable handoff summary or closeout summary */
  summary?: string
  /** Comma-separated next steps for the delegated session */
  nextSteps?: string
  /** JSON array of evidence records to attach */
  evidence?: string
  /** Expected return contract for the delegated agent */
  returnContract?: string
  /** Evidence contract identifier tied to the handoff */
  evidenceContractId?: string
  /** Return gate that must be satisfied before closure */
  returnGate?: string
}

/**
 * Resume configuration for the handoff.
 * @remarks Indicates how the delegated work can be resumed if interrupted.
 */
interface HandoffResume {
  /** Suggested command or surface to resume from */
  resumeTarget?: string
}

/**
 * Tool arguments for Hivemind handoff operations.
 * @remarks Decomposed into focused interfaces to maintain ≤10 field limit per interface.
 * All fields remain accessible via intersection type composition.
 */
export type HivemindHandoffToolArgs = {
  /** Delegation handoff action to perform */
  action: HivemindHandoffAction
} & HandoffIdentity &
  HandoffWorkflowContext &
  HandoffScope &
  HandoffSuccessCriteria &
  HandoffRecord &
  HandoffResume

export const handoffActionPressureContracts: Record<HivemindHandoffAction, RuntimePressureContract> = {
  create: getRuntimePressureContract('delegated-handoff'),
  read: getRuntimePressureContract('steady-state'),
  list: getRuntimePressureContract('steady-state'),
  update: getRuntimePressureContract('handoff-validation'),
  validate: getRuntimePressureContract('handoff-validation'),
  close: getRuntimePressureContract('handoff-validation'),
}
