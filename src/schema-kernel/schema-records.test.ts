/**
 * Schema Kernel — Config, Agent, and Skill Injection Record Tests
 *
 * RED phase: validates each schema parses valid input and rejects invalid input.
 * Imports from 3 new files that do not yet exist (will fail on module resolution).
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import {
  UserExpertLevel,
  GovernanceLevel,
  OperationMode,
  UserPreferences,
} from './config-records.js'

import {
  SkillEntry,
  AgentTemplate,
  AgentBundle,
  PurposeClass,
  TaskClassification,
  PhaseClassification,
} from './agent-records.js'

import {
  SkillInjectionRule,
  SkillInjectionConfig,
  SkillValidationResult,
} from './skill-injection-records.js'

// ─── config-records ─────────────────────────────────────────────────────────

test('UserExpertLevel accepts valid enum values', () => {
  for (const val of ['beginner', 'intermediate', 'advanced', 'expert']) {
    const parsed = UserExpertLevel.parse(val)
    assert.equal(parsed, val)
  }
})

test('UserExpertLevel rejects invalid values', () => {
  assert.throws(() => UserExpertLevel.parse('guru'), /invalid/i)
})

test('GovernanceLevel accepts valid enum values', () => {
  for (const val of ['permissive', 'standard', 'strict', 'paranoid']) {
    const parsed = GovernanceLevel.parse(val)
    assert.equal(parsed, val)
  }
})

test('GovernanceLevel rejects invalid values', () => {
  assert.throws(() => GovernanceLevel.parse('chaos'), /invalid/i)
})

test('OperationMode accepts valid enum values', () => {
  for (const val of ['iterative-interactive', 'research-first', 'yolo']) {
    const parsed = OperationMode.parse(val)
    assert.equal(parsed, val)
  }
})

test('OperationMode rejects invalid values', () => {
  assert.throws(() => OperationMode.parse('auto'), /invalid/i)
})

test('UserPreferences parses valid input with defaults', () => {
  const parsed = UserPreferences.parse({})
  assert.equal(parsed.communication_language, 'en')
  assert.equal(parsed.document_language, 'en')
  assert.equal(parsed.expert_level, 'intermediate')
  assert.equal(parsed.governance_level, 'standard')
  assert.equal(parsed.operation_mode, 'iterative-interactive')
})

test('UserPreferences parses full explicit input', () => {
  const parsed = UserPreferences.parse({
    communication_language: 'ja',
    document_language: 'ja',
    expert_level: 'expert',
    governance_level: 'paranoid',
    operation_mode: 'yolo',
  })
  assert.equal(parsed.communication_language, 'ja')
  assert.equal(parsed.expert_level, 'expert')
  assert.equal(parsed.governance_level, 'paranoid')
  assert.equal(parsed.operation_mode, 'yolo')
})

test('UserPreferences rejects invalid expert_level', () => {
  assert.throws(
    () => UserPreferences.parse({ expert_level: 'wizard' }),
    /invalid/i,
  )
})

// ─── agent-records ──────────────────────────────────────────────────────────

test('SkillEntry parses valid input', () => {
  const parsed = SkillEntry.parse({ name: 'tdd', description: 'Test-driven development' })
  assert.equal(parsed.name, 'tdd')
  assert.equal(parsed.description, 'Test-driven development')
})

test('SkillEntry rejects empty name', () => {
  assert.throws(() => SkillEntry.parse({ name: '', description: 'x' }))
})

test('SkillEntry rejects empty description', () => {
  assert.throws(() => SkillEntry.parse({ name: 'a', description: '' }))
})

test('SkillEntry rejects missing fields', () => {
  assert.throws(() => SkillEntry.parse({ name: 'a' }), /invalid/i)
  assert.throws(() => SkillEntry.parse({ description: 'b' }), /invalid/i)
})

test('AgentTemplate parses valid input with defaults', () => {
  const parsed = AgentTemplate.parse({
    name: 'hivemaker',
    description: 'Builder agent',
  })
  assert.equal(parsed.name, 'hivemaker')
  assert.equal(parsed.mode, 'all')
  assert.equal(parsed.model, undefined)
})

test('AgentTemplate parses full input', () => {
  const parsed = AgentTemplate.parse({
    name: 'test-agent',
    description: 'Test',
    mode: 'primary',
    model: 'gpt-4',
    permission: { fileAccess: true },
    tools: { read: true, write: false },
  })
  assert.equal(parsed.mode, 'primary')
  assert.equal(parsed.model, 'gpt-4')
})

test('AgentTemplate rejects invalid mode', () => {
  assert.throws(
    () => AgentTemplate.parse({ name: 'x', description: 'y', mode: 'invalid' }),
    /invalid/i,
  )
})

test('AgentBundle parses valid input', () => {
  const parsed = AgentBundle.parse({
    agent_id: 'hivemaker',
    skills: [
      { name: 'tdd', description: 'TDD enforcement' },
      { name: 'clean-code', description: 'Clean code principles' },
    ],
  })
  assert.equal(parsed.agent_id, 'hivemaker')
  assert.equal(parsed.skills.length, 2)
})

test('AgentBundle rejects more than 3 skills', () => {
  assert.throws(
    () =>
      AgentBundle.parse({
        agent_id: 'x',
        skills: [
          { name: 'a', description: 'a' },
          { name: 'b', description: 'b' },
          { name: 'c', description: 'c' },
          { name: 'd', description: 'd' },
        ],
      }),
  )
})

test('PurposeClass accepts valid values', () => {
  const valid = ['tdd', 'research', 'planning', 'implementation', 'course-correction', 'gatekeeping']
  for (const val of valid) {
    const parsed = PurposeClass.parse(val)
    assert.equal(parsed, val)
  }
})

test('PurposeClass rejects invalid values', () => {
  assert.throws(() => PurposeClass.parse('debugging'), /invalid/i)
})

test('TaskClassification accepts valid values', () => {
  const valid = ['research', 'implementation', 'debug', 'refactor', 'codebase-scan', 'tdd', 'spec-driven', 'investigation']
  for (const val of valid) {
    const parsed = TaskClassification.parse(val)
    assert.equal(parsed, val)
  }
})

test('TaskClassification rejects invalid values', () => {
  assert.throws(() => TaskClassification.parse('deploy'), /invalid/i)
})

test('PhaseClassification accepts valid values', () => {
  for (const val of ['project-initiation', 'planning-execution']) {
    const parsed = PhaseClassification.parse(val)
    assert.equal(parsed, val)
  }
})

test('PhaseClassification rejects invalid values', () => {
  assert.throws(() => PhaseClassification.parse('execution'), /invalid/i)
})

// ─── skill-injection-records ────────────────────────────────────────────────

test('SkillInjectionRule parses valid input', () => {
  const parsed = SkillInjectionRule.parse({
    agent_id: 'hivemaker',
    phase: 'project-initiation',
    task_classification: 'implementation',
    mandatory_skills: [{ name: 'tdd', description: 'TDD' }],
    high_likelihood_skills: [{ name: 'clean-code', description: 'Clean code' }],
  })
  assert.equal(parsed.agent_id, 'hivemaker')
  assert.equal(parsed.mandatory_skills.length, 1)
  assert.equal(parsed.high_likelihood_skills.length, 1)
})

test('SkillInjectionRule requires at least one mandatory skill', () => {
  assert.throws(
    () =>
      SkillInjectionRule.parse({
        agent_id: 'x',
        mandatory_skills: [],
      }),
  )
})

test('SkillInjectionRule allows optional phase and task_classification', () => {
  const parsed = SkillInjectionRule.parse({
    agent_id: 'x',
    mandatory_skills: [{ name: 'a', description: 'b' }],
  })
  assert.equal(parsed.phase, undefined)
  assert.equal(parsed.task_classification, undefined)
})

test('SkillInjectionConfig parses valid full config', () => {
  const parsed = SkillInjectionConfig.parse({
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [{ name: 'clean-code', description: 'Clean code' }],
    max_skills: 3,
    agent_bundles: {
      hivemaker: [{ name: 'tdd', description: 'TDD' }],
    },
    purpose_conditional: {
      tdd: [{ name: 'tdd-workflow', description: 'TDD workflow' }],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [{ name: 'context-integrity', description: 'Context check' }],
    excluded_skill_ids: [],
  })
  assert.equal(parsed._meta.schema, 'skill-injection-config-v1')
  assert.equal(parsed.max_skills, 3)
  assert.equal(parsed.shared_skills.length, 1)
})

test('SkillInjectionConfig rejects max_skills < 1', () => {
  const base = {
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [],
    max_skills: 0,
    agent_bundles: {},
    purpose_conditional: {},
    subsession_additions: [],
  }
  assert.throws(() => SkillInjectionConfig.parse(base), /invalid/i)
})

test('SkillInjectionConfig accepts null max_skills (no cap)', () => {
  const parsed = SkillInjectionConfig.parse({
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [],
    max_skills: null,
    agent_bundles: {},
    purpose_conditional: {
      tdd: [],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [],
  })
  assert.equal(parsed.max_skills, null)
})

test('SkillInjectionConfig defaults max_skills to null', () => {
  const parsed = SkillInjectionConfig.parse({
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [],
    agent_bundles: {},
    purpose_conditional: {
      tdd: [],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [],
  })
  assert.equal(parsed.max_skills, null)
})

test('SkillInjectionConfig defaults excluded_skill_ids to empty array', () => {
  const parsed = SkillInjectionConfig.parse({
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [],
    max_skills: 1,
    agent_bundles: {},
    purpose_conditional: {
      tdd: [],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [],
  })
  assert.deepEqual(parsed.excluded_skill_ids, [])
})

test('SkillValidationResult parses valid input', () => {
  const parsed = SkillValidationResult.parse({
    valid: true,
    missing_skills: [],
    warnings: [],
  })
  assert.equal(parsed.valid, true)
  assert.deepEqual(parsed.missing_skills, [])
})

test('SkillValidationResult parses failure state', () => {
  const parsed = SkillValidationResult.parse({
    valid: false,
    missing_skills: ['tdd', 'clean-code'],
    warnings: ['Skill "tdd" not found in registry'],
  })
  assert.equal(parsed.valid, false)
  assert.equal(parsed.missing_skills.length, 2)
  assert.equal(parsed.warnings.length, 1)
})
