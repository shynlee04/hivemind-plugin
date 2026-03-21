/**
 * Factory functions for creating IntakeRecord instances.
 */

import type {
  IntakeRecord,
  CreateIntakeRecordInput,
  CreateOrphanedIntakeRecordInput,
} from './intake-record.types.js'

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
