import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  type IntakeRecordCore,
  type IntakeRecordLineage,
  type IntakeRecordWorkflow,
  type IntakeRecordProfile,
  type IntakeRecord,
  createIntakeRecord,
  validateIntakeRecord,
  serializeIntakeRecord,
  deserializeIntakeRecord,
  createOrphanedIntakeRecord,
} from '../src/shared/intake-record.js'

describe('IntakeRecord canonicalization', () => {
  describe('IntakeRecordCore', () => {
    it('requires version and source', () => {
      const core: IntakeRecordCore = {
        version: 'v1',
        source: 'control-plane',
        timestamp: '2026-03-16T00:00:00Z',
      }
      assert.equal(core.version, 'v1')
      assert.equal(core.source, 'control-plane')
      assert.ok(core.timestamp !== undefined)
    })
  })

  describe('IntakeRecordLineage', () => {
    it('contains session identity fields', () => {
      const lineage: IntakeRecordLineage = {
        sessionId: 'ses_123',
        sessionScope: 'main',
        parentSessionId: undefined,
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
      }
      assert.equal(lineage.sessionId, 'ses_123')
      assert.equal(lineage.sessionScope, 'main')
      assert.equal(lineage.parentSessionId, undefined)
    })

    it('supports sub-session with parentSessionId', () => {
      const lineage: IntakeRecordLineage = {
        sessionId: 'ses_child',
        sessionScope: 'sub-session',
        parentSessionId: 'ses_parent',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
      }
      assert.equal(lineage.sessionScope, 'sub-session')
      assert.equal(lineage.parentSessionId, 'ses_parent')
    })
  })

  describe('IntakeRecordWorkflow', () => {
    it('contains trajectory and workflow bindings', () => {
      const workflow: IntakeRecordWorkflow = {
        trajectoryId: 'trj_123',
        workflowId: 'wf_123',
        taskIds: ['task_1', 'task_2'],
        subtaskIds: [],
        checkpointId: undefined,
      }
      assert.equal(workflow.trajectoryId, 'trj_123')
      assert.equal(workflow.workflowId, 'wf_123')
      assert.deepEqual(workflow.taskIds, ['task_1', 'task_2'])
    })
  })

  describe('IntakeRecordProfile', () => {
    it('contains intake evidence fields', () => {
      const profile: IntakeRecordProfile = {
        intakeSource: 'question-tool',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'en',
        completedGroups: ['identity-language', 'expertise-style'],
        usedRecommendedPresetGroups: ['identity-language'],
      }
      assert.equal(profile.intakeSource, 'question-tool')
      assert.equal(profile.questionnaireId, 'bootstrap-profile-v1')
      assert.deepEqual(profile.completedGroups, ['identity-language', 'expertise-style'])
    })
  })

  describe('IntakeRecord (composed)', () => {
    it('composes core, lineage, workflow, profile via intersection', () => {
      const record: IntakeRecord = {
        version: 'v1',
        source: 'control-plane',
        timestamp: '2026-03-16T00:00:00Z',
        sessionId: 'ses_123',
        sessionScope: 'main',
        parentSessionId: undefined,
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_123',
        workflowId: 'wf_123',
        taskIds: ['task_1'],
        subtaskIds: [],
        checkpointId: undefined,
        intakeSource: 'question-tool',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'en',
        completedGroups: ['identity-language'],
        usedRecommendedPresetGroups: undefined,
      }
      assert.equal(record.version, 'v1')
      assert.equal(record.sessionId, 'ses_123')
      assert.equal(record.trajectoryId, 'trj_123')
      assert.equal(record.questionnaireId, 'bootstrap-profile-v1')
    })
  })

  describe('createIntakeRecord', () => {
    it('creates a complete intake record from input', () => {
      const record = createIntakeRecord({
        source: 'start-work',
        sessionId: 'ses_new',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_new',
        workflowId: 'wf_new',
        taskIds: [],
        subtaskIds: [],
        intakeSource: 'cli-flags',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'vi',
        completedGroups: ['identity-language', 'expertise-style', 'governance-automation'],
      })
      assert.equal(record.version, 'v1')
      assert.equal(record.source, 'start-work')
      assert.equal(record.sessionId, 'ses_new')
      assert.equal(record.activeLineage, 'hivefiver')
      assert.equal(record.trajectoryId, 'trj_new')
      assert.equal(record.displayLanguage, 'vi')
    })

    it('generates timestamp if not provided', () => {
      const before = new Date().toISOString()
      const record = createIntakeRecord({
        source: 'start-work',
        sessionId: 'ses_ts',
        sessionScope: 'main',
        activeLineage: 'hiveminder',
        activeAgent: 'hiveminder',
        trajectoryId: 'trj_ts',
        workflowId: 'wf_ts',
        taskIds: [],
        subtaskIds: [],
        intakeSource: 'runtime-tool',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'en',
        completedGroups: [],
      })
      const after = new Date().toISOString()
      assert.ok(record.timestamp >= before)
      assert.ok(record.timestamp <= after)
    })
  })

  describe('validateIntakeRecord', () => {
    it('validates complete intake record', () => {
      const record = createIntakeRecord({
        source: 'start-work',
        sessionId: 'ses_valid',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_valid',
        workflowId: 'wf_valid',
        taskIds: [],
        subtaskIds: [],
        intakeSource: 'question-tool',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'en',
        completedGroups: ['identity-language'],
      })
      const result = validateIntakeRecord(record)
      assert.equal(result.valid, true)
      assert.deepEqual(result.errors, [])
    })

    it('fails on missing sessionId', () => {
      const record = {
        version: 'v1' as const,
        source: 'start-work',
        timestamp: '2026-03-16T00:00:00Z',
        sessionScope: 'main',
        activeLineage: 'hivefiver' as const,
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_miss',
        workflowId: 'wf_miss',
        taskIds: [],
        subtaskIds: [],
        intakeSource: 'cli-flags' as const,
        questionnaireId: 'bootstrap-profile-v1' as const,
        displayLanguage: 'en',
        completedGroups: [],
      }
      const result = validateIntakeRecord(record as unknown as IntakeRecord)
      assert.equal(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('sessionId')))
    })

    it('fails on invalid sessionScope', () => {
      const record = {
        version: 'v1' as const,
        source: 'start-work',
        timestamp: '2026-03-16T00:00:00Z',
        sessionId: 'ses_invalid_scope',
        sessionScope: 'invalid-scope',
        activeLineage: 'hivefiver' as const,
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_miss',
        workflowId: 'wf_miss',
        taskIds: [],
        subtaskIds: [],
        intakeSource: 'cli-flags' as const,
        questionnaireId: 'bootstrap-profile-v1' as const,
        displayLanguage: 'en',
        completedGroups: [],
      }
      const result = validateIntakeRecord(record as unknown as IntakeRecord)
      assert.equal(result.valid, false)
      assert.ok(result.errors.some((e) => e.includes('sessionScope')))
    })
  })

  describe('serialization', () => {
    it('serializes to JSON and deserializes back', () => {
      const original = createIntakeRecord({
        source: 'control-plane',
        sessionId: 'ses_ser',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_ser',
        workflowId: 'wf_ser',
        taskIds: ['task_a', 'task_b'],
        subtaskIds: ['sub_1'],
        intakeSource: 'preset',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'vi',
        completedGroups: ['identity-language'],
        usedRecommendedPresetGroups: ['identity-language'],
        checkpointId: 'ckpt_123',
      })
      const json = serializeIntakeRecord(original)
      const parsed = JSON.parse(json)
      assert.equal(parsed.version, 'v1')
      assert.equal(parsed.sessionId, 'ses_ser')
      assert.deepEqual(parsed.taskIds, ['task_a', 'task_b'])

      const restored = deserializeIntakeRecord(json)
      assert.equal(restored.version, original.version)
      assert.equal(restored.sessionId, original.sessionId)
      assert.equal(restored.trajectoryId, original.trajectoryId)
      assert.deepEqual(restored.taskIds, original.taskIds)
      assert.deepEqual(restored.completedGroups, original.completedGroups)
    })

    it('handles undefined optional fields in serialization', () => {
      const original = createIntakeRecord({
        source: 'start-work',
        sessionId: 'ses_opt',
        sessionScope: 'main',
        activeLineage: 'hiveminder',
        activeAgent: 'hiveminder',
        trajectoryId: 'trj_opt',
        workflowId: 'wf_opt',
        taskIds: [],
        subtaskIds: [],
        intakeSource: 'cli-flags',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'en',
        completedGroups: [],
      })
      const json = serializeIntakeRecord(original)
      const restored = deserializeIntakeRecord(json)
      assert.equal(restored.parentSessionId, undefined)
      assert.equal(restored.usedRecommendedPresetGroups, undefined)
    })
  })

  describe('SWR-03: orphaned session fallback', () => {
    it('creates orphaned intake record when parent is missing', () => {
      const orphaned = createOrphanedIntakeRecord({
        sessionId: 'ses_orphan',
        sessionScope: 'sub-session',
        parentSessionId: 'ses_parent_missing',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_orphan',
        workflowId: 'wf_orphan',
      })
      assert.equal(orphaned.sessionId, 'ses_orphan')
      assert.equal(orphaned.sessionScope, 'sub-session')
      assert.equal(orphaned.parentSessionId, 'ses_parent_missing')
      assert.equal(orphaned.intakeSource, 'orphaned-session-fallback')
      assert.equal(orphaned.completedGroups.length, 0)
    })

    it('orphaned record is valid for validation', () => {
      const orphaned = createOrphanedIntakeRecord({
        sessionId: 'ses_orphan_valid',
        sessionScope: 'sub-session',
        parentSessionId: 'ses_parent_gone',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_orphan_valid',
        workflowId: 'wf_orphan_valid',
      })
      const result = validateIntakeRecord(orphaned)
      assert.equal(result.valid, true)
    })

    it('orphaned record is serializable', () => {
      const orphaned = createOrphanedIntakeRecord({
        sessionId: 'ses_orphan_ser',
        sessionScope: 'sub-session',
        parentSessionId: 'ses_parent_ser',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_orphan_ser',
        workflowId: 'wf_orphan_ser',
      })
      const json = serializeIntakeRecord(orphaned)
      const restored = deserializeIntakeRecord(json)
      assert.equal(restored.intakeSource, 'orphaned-session-fallback')
      assert.equal(restored.parentSessionId, 'ses_parent_ser')
    })
  })

  describe('PH-01: command resolution', () => {
    it('intake record feeds command binding', () => {
      const intake = createIntakeRecord({
        source: 'control-plane',
        sessionId: 'ses_cmd',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_cmd',
        workflowId: 'wf_cmd',
        taskIds: ['task_plan'],
        subtaskIds: [],
        intakeSource: 'question-tool',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'en',
        completedGroups: ['identity-language', 'expertise-style', 'governance-automation'],
      })
      // Simulate command binding derivation
      const derivedWorkflowId = intake.workflowId
      const derivedTaskIds = intake.taskIds
      assert.equal(derivedWorkflowId, 'wf_cmd')
      assert.deepEqual(derivedTaskIds, ['task_plan'])
    })
  })

  describe('SC-01: session persistence', () => {
    it('intake must be serializable for persistence', () => {
      const intake = createIntakeRecord({
        source: 'start-work',
        sessionId: 'ses_persist',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        activeAgent: 'hivefiver',
        trajectoryId: 'trj_persist',
        workflowId: 'wf_persist',
        taskIds: [],
        subtaskIds: [],
        intakeSource: 'preset',
        questionnaireId: 'bootstrap-profile-v1',
        displayLanguage: 'vi',
        completedGroups: ['identity-language'],
        usedRecommendedPresetGroups: ['identity-language'],
      })
      // Must not throw on JSON.stringify
      const json = JSON.stringify(intake)
      assert.ok(json.length > 0)
      // Must round-trip
      const restored = JSON.parse(json) as IntakeRecord
      assert.equal(restored.sessionId, intake.sessionId)
      assert.equal(restored.completedGroups.length, intake.completedGroups.length)
    })
  })
})
