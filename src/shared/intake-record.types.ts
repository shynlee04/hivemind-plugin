/**
 * IntakeRecord — Canonical intake record across control-plane/runtime boundaries.
 *
 * This type is the single authoritative definition for session/trajectory/workflow
 * lineage fields that control-plane-handler and runtime surfaces (start-work, trajectory)
 * can share.
 *
 * Design principles:
 * - Serializable: All fields are JSON-primitive types
 * - Versioned: Schema version for forward compatibility
 * - Decomposed: Interfaces under 10 fields, composed via intersection
 * - Orphan-safe: Supports SWR-03 scenario for detached sub-sessions
 */

import type { KernelLineage, SessionScope } from '../context/prompt-packet/prompt-packet-types.js'
import type {
  ControlPlaneQuestionnaireId,
  ControlPlaneProfileGroupId,
} from '../control-plane/index.js'

// ============================================================================
// Decomposed Interfaces (Interface Decomposition Principle)
// ============================================================================

/** Core identity — versioning and source tracking */
export interface IntakeRecordCore {
  /** Schema version for forward compatibility */
  version: 'v1'
  /** Where this intake record was created */
  source: 'control-plane' | 'start-work' | 'runtime-tool' | 'orphaned-session-fallback'
  /** ISO 8601 timestamp when record was created */
  timestamp: string
}

/** Session lineage — identity and hierarchy */
export interface IntakeRecordLineage {
  /** Session identifier */
  sessionId: string
  /** Session scope (main or sub-session) */
  sessionScope: SessionScope
  /** Parent session for sub-sessions (SWR-03: may point to missing parent) */
  parentSessionId?: string
  /** Active agent lineage */
  activeLineage: KernelLineage
  /** Currently active agent name */
  activeAgent: string
}

/** Workflow and trajectory bindings */
export interface IntakeRecordWorkflow {
  /** Active trajectory identifier */
  trajectoryId: string
  /** Active workflow identifier */
  workflowId: string
  /** Active task identifiers */
  taskIds: string[]
  /** Active subtask identifiers */
  subtaskIds: string[]
  /** Last checkpoint identifier */
  checkpointId?: string
}

/** Profile intake evidence */
export interface IntakeRecordProfile {
  /** Source of intake collection */
  intakeSource: 'question-tool' | 'cli-flags' | 'runtime-tool' | 'preset' | 'orphaned-session-fallback'
  /** Questionnaire used for intake */
  questionnaireId: ControlPlaneQuestionnaireId
  /** Display language for user-facing content */
  displayLanguage: string
  /** Completed profile groups */
  completedGroups: ControlPlaneProfileGroupId[]
  /** Groups used from recommended preset (optional) */
  usedRecommendedPresetGroups?: ControlPlaneProfileGroupId[]
}

// ============================================================================
// Composed Type (via Intersection)
// ============================================================================

/**
 * Canonical IntakeRecord — shared across control-plane and runtime surfaces.
 *
 * Composed via intersection of decomposed interfaces for backward compatibility
 * and type safety.
 */
export type IntakeRecord = IntakeRecordCore
  & IntakeRecordLineage
  & IntakeRecordWorkflow
  & IntakeRecordProfile

// ============================================================================
// Factory Input Types
// ============================================================================

export interface CreateIntakeRecordInput {
  source: IntakeRecordCore['source']
  timestamp?: string
  sessionId: string
  sessionScope: SessionScope
  parentSessionId?: string
  activeLineage: KernelLineage
  activeAgent: string
  trajectoryId: string
  workflowId: string
  taskIds: string[]
  subtaskIds: string[]
  checkpointId?: string
  intakeSource: IntakeRecordProfile['intakeSource']
  questionnaireId: ControlPlaneQuestionnaireId
  displayLanguage: string
  completedGroups: ControlPlaneProfileGroupId[]
  usedRecommendedPresetGroups?: ControlPlaneProfileGroupId[]
}

export interface CreateOrphanedIntakeRecordInput {
  sessionId: string
  sessionScope: SessionScope
  parentSessionId: string
  activeLineage: KernelLineage
  activeAgent: string
  trajectoryId: string
  workflowId: string
}

// ============================================================================
// Validation Result
// ============================================================================

export interface IntakeRecordValidationResult {
  valid: boolean
  errors: string[]
}
