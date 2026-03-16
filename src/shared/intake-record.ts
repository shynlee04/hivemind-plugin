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

// ============================================================================
// Factory Functions
// ============================================================================

/** Creates a timestamp in ISO 8601 format */
function createTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Creates a canonical IntakeRecord from input.
 */
export function createIntakeRecord(input: CreateIntakeRecordInput): IntakeRecord {
  return {
    version: 'v1',
    source: input.source,
    timestamp: input.timestamp ?? createTimestamp(),
    sessionId: input.sessionId,
    sessionScope: input.sessionScope,
    parentSessionId: input.parentSessionId,
    activeLineage: input.activeLineage,
    activeAgent: input.activeAgent,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds: input.taskIds,
    subtaskIds: input.subtaskIds,
    checkpointId: input.checkpointId,
    intakeSource: input.intakeSource,
    questionnaireId: input.questionnaireId,
    displayLanguage: input.displayLanguage,
    completedGroups: input.completedGroups,
    usedRecommendedPresetGroups: input.usedRecommendedPresetGroups,
  }
}

/**
 * Creates an orphaned intake record for SWR-03 scenario.
 *
 * Used when a sub-session starts but its parent session is not available
 * (e.g., runtime restart, corrupted state recovery).
 */
export function createOrphanedIntakeRecord(input: CreateOrphanedIntakeRecordInput): IntakeRecord {
  return createIntakeRecord({
    source: 'orphaned-session-fallback',
    sessionId: input.sessionId,
    sessionScope: input.sessionScope,
    parentSessionId: input.parentSessionId,
    activeLineage: input.activeLineage,
    activeAgent: input.activeAgent,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds: [],
    subtaskIds: [],
    intakeSource: 'orphaned-session-fallback',
    questionnaireId: 'bootstrap-profile-v1',
    displayLanguage: 'en',
    completedGroups: [],
  })
}

// ============================================================================
// Validation
// ============================================================================

const VALID_SESSION_SCOPES: SessionScope[] = ['main', 'sub-session']
const VALID_KERNEL_LINEAGES: KernelLineage[] = ['hivefiver', 'hiveminder']
const VALID_INTAKE_SOURCES: IntakeRecordProfile['intakeSource'][] = [
  'question-tool',
  'cli-flags',
  'runtime-tool',
  'preset',
  'orphaned-session-fallback',
]
const VALID_QUESTIONNAIRE_IDS: ControlPlaneQuestionnaireId[] = [
  'bootstrap-profile-v1',
  'settings-profile-v1',
]
const VALID_PROFILE_GROUPS: ControlPlaneProfileGroupId[] = [
  'identity-language',
  'expertise-style',
  'governance-automation',
]

/**
 * Validates an IntakeRecord for completeness and correctness.
 */
export function validateIntakeRecord(record: unknown): IntakeRecordValidationResult {
  const errors: string[] = []

  if (!record || typeof record !== 'object') {
    return { valid: false, errors: ['record must be an object'] }
  }

  const r = record as Record<string, unknown>

  // Core validation
  if (r.version !== 'v1') {
    errors.push('version must be "v1"')
  }

  if (typeof r.timestamp !== 'string' || r.timestamp.length === 0) {
    errors.push('timestamp must be a non-empty string')
  }

  // Lineage validation
  if (typeof r.sessionId !== 'string' || r.sessionId.length === 0) {
    errors.push('sessionId must be a non-empty string')
  }

  if (!VALID_SESSION_SCOPES.includes(r.sessionScope as SessionScope)) {
    errors.push(`sessionScope must be one of: ${VALID_SESSION_SCOPES.join(', ')}`)
  }

  if (r.parentSessionId !== undefined && typeof r.parentSessionId !== 'string') {
    errors.push('parentSessionId must be a string if provided')
  }

  if (!VALID_KERNEL_LINEAGES.includes(r.activeLineage as KernelLineage)) {
    errors.push(`activeLineage must be one of: ${VALID_KERNEL_LINEAGES.join(', ')}`)
  }

  if (typeof r.activeAgent !== 'string' || r.activeAgent.length === 0) {
    errors.push('activeAgent must be a non-empty string')
  }

  // Workflow validation
  if (typeof r.trajectoryId !== 'string' || r.trajectoryId.length === 0) {
    errors.push('trajectoryId must be a non-empty string')
  }

  if (typeof r.workflowId !== 'string' || r.workflowId.length === 0) {
    errors.push('workflowId must be a non-empty string')
  }

  if (!Array.isArray(r.taskIds)) {
    errors.push('taskIds must be an array')
  }

  if (!Array.isArray(r.subtaskIds)) {
    errors.push('subtaskIds must be an array')
  }

  // Profile validation
  if (!VALID_INTAKE_SOURCES.includes(r.intakeSource as IntakeRecordProfile['intakeSource'])) {
    errors.push(`intakeSource must be one of: ${VALID_INTAKE_SOURCES.join(', ')}`)
  }

  if (!VALID_QUESTIONNAIRE_IDS.includes(r.questionnaireId as ControlPlaneQuestionnaireId)) {
    errors.push(`questionnaireId must be one of: ${VALID_QUESTIONNAIRE_IDS.join(', ')}`)
  }

  if (typeof r.displayLanguage !== 'string' || r.displayLanguage.length === 0) {
    errors.push('displayLanguage must be a non-empty string')
  }

  if (!Array.isArray(r.completedGroups)) {
    errors.push('completedGroups must be an array')
  } else {
    for (const group of r.completedGroups) {
      if (!VALID_PROFILE_GROUPS.includes(group as ControlPlaneProfileGroupId)) {
        errors.push(`completedGroups contains invalid group: ${group}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Serialization
// ============================================================================

/**
 * Serializes an IntakeRecord to JSON string.
 *
 * Safe for persistence (SC-01 scenario).
 */
export function serializeIntakeRecord(record: IntakeRecord): string {
  return JSON.stringify(record)
}

/**
 * Deserializes an IntakeRecord from JSON string.
 *
 * Validates the record and returns it if valid.
 * Returns null if validation fails.
 */
export function deserializeIntakeRecord(json: string): IntakeRecord {
  const parsed = JSON.parse(json) as unknown
  const result = validateIntakeRecord(parsed)
  if (!result.valid) {
    throw new Error(`Invalid IntakeRecord: ${result.errors.join('; ')}`)
  }
  return parsed as IntakeRecord
}
