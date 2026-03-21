/**
 * Validation logic for IntakeRecord.
 */

import type { SessionScope, KernelLineage } from '../context/prompt-packet/prompt-packet-types.js'
import type { ControlPlaneQuestionnaireId, ControlPlaneProfileGroupId } from '../control-plane/index.js'
import type { IntakeRecordValidationResult, IntakeRecordProfile } from './intake-record.types.js'

// ============================================================================
// Validation Constants
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

// ============================================================================
// Validation Function
// ============================================================================

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
