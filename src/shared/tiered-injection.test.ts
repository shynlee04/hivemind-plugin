/**
 * Tiered Injection — Two-tier skill injection tests (RED phase).
 *
 * Tests the resolveTieredSkills function for:
 * - Tier 1: Core init skills during project-initiation phase
 * - Tier 2: Task-conditional rules based on task classification
 * - Deduplication across all sources
 * - max_skills cap enforcement
 * - Backward compatibility
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import type { SkillInjectionConfig } from '../schema-kernel/skill-injection-records.js'

import {
  TIER1_CORE_INIT_SKILLS,
  TIER2_TASK_RULES,
  resolveTieredSkills,
} from './tiered-injection.js'

/** Minimal valid config for testing */
function makeConfig(overrides: Partial<SkillInjectionConfig> = {}): SkillInjectionConfig {
  return {
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [
      { name: 'shared-skill', description: 'A shared skill' },
    ],
    max_skills: null,
    agent_bundles: {
      hivemaker: [
        { name: 'agent-skill', description: 'Agent-specific skill' },
      ],
      hiveminder: [
        { name: 'orchestrator-skill', description: 'Orchestrator skill' },
      ],
    },
    purpose_conditional: {
      tdd: [{ name: 'purpose-tdd', description: 'Purpose TDD skill' }],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [
      { name: 'subsession-skill', description: 'Sub-session skill' },
    ],
    excluded_skill_ids: [],
    default_agent: 'hiveminder',
    ...overrides,
  }
}

// ─── Tier 1: Core Init Skills ────────────────────────────────────────────────

test('TIER1_CORE_INIT_SKILLS contains expected foundational skills', () => {
  assert.ok(TIER1_CORE_INIT_SKILLS.length >= 3, 'should have at least 3 core init skills')
  const names = TIER1_CORE_INIT_SKILLS.map(s => s.name)
  assert.ok(names.includes('use-hivemind'), 'should include use-hivemind')
  assert.ok(names.includes('use-hivemind-delegation'), 'should include use-hivemind-delegation')
  assert.ok(names.includes('hivemind-spec-driven'), 'should include hivemind-spec-driven')
})

test('TIER1_CORE_INIT_SKILLS entries have name and description', () => {
  for (const skill of TIER1_CORE_INIT_SKILLS) {
    assert.ok(skill.name.length > 0, 'skill name should not be empty')
    assert.ok(skill.description.length > 0, 'skill description should not be empty')
  }
})

// ─── Tier 2: Task-Conditional Rules ──────────────────────────────────────────

test('TIER2_TASK_RULES covers all TaskClassification values', () => {
  const expectedClassifications = [
    'research', 'implementation', 'debug', 'refactor',
    'codebase-scan', 'tdd', 'spec-driven', 'investigation',
  ]
  for (const tc of expectedClassifications) {
    assert.ok(
      TIER2_TASK_RULES.some(r => r.task_classification === tc),
      `should have a rule for task_classification: ${tc}`,
    )
  }
})

test('TIER2_TASK_RULES entries have mandatory_skills', () => {
  for (const rule of TIER2_TASK_RULES) {
    assert.ok(rule.mandatory_skills.length > 0, `rule ${rule.task_classification} should have mandatory skills`)
  }
})

// ─── resolveTieredSkills: Core Resolution ─────────────────────────────────────

test('resolveTieredSkills returns shared skills as baseline', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, undefined, config)
  const names = result.map(s => s.name)
  assert.ok(names.includes('shared-skill'), 'should include shared skills')
})

test('resolveTieredSkills adds agent bundle when agent matches', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, undefined, config)
  const names = result.map(s => s.name)
  assert.ok(names.includes('agent-skill'), 'should include hivemaker agent skill')
})

test('resolveTieredSkills falls back to default agent for unknown agent', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('unknown-agent', undefined, undefined, config)
  const names = result.map(s => s.name)
  // Default agent is hiveminder, which has 'orchestrator-skill'
  assert.ok(names.includes('orchestrator-skill'), 'should fall back to default agent bundle')
})

test('resolveTieredSkills adds Tier 1 core init skills during project-initiation', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', 'project-initiation', undefined, config)
  const names = result.map(s => s.name)
  for (const tier1 of TIER1_CORE_INIT_SKILLS) {
    assert.ok(names.includes(tier1.name), `should include Tier 1 skill: ${tier1.name}`)
  }
})

test('resolveTieredSkills does NOT add Tier 1 during planning-execution', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', 'planning-execution', undefined, config)
  const names = result.map(s => s.name)
  // Tier 1 should NOT be present unless deduplicated from other sources
  const tier1Names = TIER1_CORE_INIT_SKILLS.map(s => s.name)
  const tier1FromShared = config.shared_skills.filter(s => tier1Names.includes(s.name)).length
  const tier1Count = names.filter(n => tier1Names.includes(n)).length
  // Only those from shared_skills should be present, not the extra Tier 1 additions
  assert.equal(tier1Count, tier1FromShared, 'no extra Tier 1 skills added outside project-initiation')
})

test('resolveTieredSkills adds Tier 2 mandatory skills when taskClassification provided', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, 'tdd', config)
  const names = result.map(s => s.name)
  // The tdd rule should add use-hivemind-tdd
  assert.ok(names.includes('use-hivemind-tdd'), 'should include Tier 2 tdd mandatory skill')
})

test('resolveTieredSkills adds Tier 2 high-likelihood skills when taskClassification provided', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, 'tdd', config)
  const names = result.map(s => s.name)
  // The tdd rule should have high_likelihood_skills too
  const tddRule = TIER2_TASK_RULES.find(r => r.task_classification === 'tdd')
  assert.ok(tddRule, 'tdd rule should exist')
  for (const skill of tddRule.high_likelihood_skills) {
    assert.ok(names.includes(skill.name), `should include high-likelihood skill: ${skill.name}`)
  }
})

test('resolveTieredSkills adds Tier 2 for debug task classification', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivehealer', undefined, 'debug', config)
  const names = result.map(s => s.name)
  assert.ok(names.includes('hivemind-system-debug'), 'should include debug mandatory skill')
})

test('resolveTieredSkills adds Tier 2 for research task classification', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivexplorer', undefined, 'research', config)
  const names = result.map(s => s.name)
  assert.ok(names.includes('use-hivemind-research'), 'should include research mandatory skill')
})

test('resolveTieredSkills does NOT add Tier 2 when taskClassification is undefined', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, undefined, config)
  const names = result.map(s => s.name)
  // Should not include task-conditional skills from TIER2_TASK_RULES
  assert.ok(!names.includes('use-hivemind-tdd'), 'should not include tdd Tier 2 skill without task classification')
})

test('resolveTieredSkills adds purpose-conditional skills', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, undefined, config, { purposeClass: 'tdd' })
  const names = result.map(s => s.name)
  assert.ok(names.includes('purpose-tdd'), 'should include purpose-conditional skill')
})

test('resolveTieredSkills adds subsession skills when sessionState is sub-session', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, undefined, config, { sessionState: 'sub-session' })
  const names = result.map(s => s.name)
  assert.ok(names.includes('subsession-skill'), 'should include subsession skill')
})

test('resolveTieredSkills does NOT add subsession skills for main session', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, undefined, config, { sessionState: 'main' })
  const names = result.map(s => s.name)
  assert.ok(!names.includes('subsession-skill'), 'should not include subsession skill for main session')
})

// ─── Deduplication ────────────────────────────────────────────────────────────

test('resolveTieredSkills deduplicates by skill name', () => {
  // shared_skills includes 'use-hivemind-delegation', which is also in TIER1_CORE_INIT_SKILLS
  const config = makeConfig({
    shared_skills: [
      { name: 'use-hivemind-delegation', description: 'Shared delegation skill' },
    ],
  })
  const result = resolveTieredSkills('hivemaker', 'project-initiation', undefined, config)
  const delegationCount = result.filter(s => s.name === 'use-hivemind-delegation').length
  assert.equal(delegationCount, 1, 'should deduplicate use-hivemind-delegation')
})

test('resolveTieredSkills deduplicates across all tiers', () => {
  // Same skill in agent bundle and Tier 2
  const config = makeConfig({
    agent_bundles: {
      hivemaker: [
        { name: 'use-hivemind-tdd', description: 'Agent TDD skill' },
      ],
    },
  })
  const result = resolveTieredSkills('hivemaker', undefined, 'tdd', config)
  const tddCount = result.filter(s => s.name === 'use-hivemind-tdd').length
  assert.equal(tddCount, 1, 'should deduplicate across agent bundle and Tier 2')
})

// ─── max_skills Cap ──────────────────────────────────────────────────────────

test('resolveTieredSkills respects max_skills cap', () => {
  const config = makeConfig({ max_skills: 3 })
  const result = resolveTieredSkills('hivemaker', 'project-initiation', 'tdd', config, { sessionState: 'sub-session' })
  assert.ok(result.length <= 3, `result should be capped at max_skills (got ${result.length})`)
})

test('resolveTieredSkills with null max_skills has no cap', () => {
  const config = makeConfig({ max_skills: null })
  const result = resolveTieredSkills('hivemaker', 'project-initiation', 'tdd', config, { sessionState: 'sub-session' })
  // Should include many skills without cap
  assert.ok(result.length > 5, 'should have more than 5 skills with no cap')
})

// ─── Resolution Order ────────────────────────────────────────────────────────

test('resolveTieredSkills order: shared → tier1 → agent → tier2 → purpose → subsession', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', 'project-initiation', 'tdd', config, { sessionState: 'sub-session' })
  const names = result.map(s => s.name)

  // Shared should come first
  const sharedIdx = names.indexOf('shared-skill')
  const agentIdx = names.indexOf('agent-skill')
  assert.ok(sharedIdx < agentIdx, 'shared should come before agent skills')

  // Agent should come before subsession
  const subsessionIdx = names.indexOf('subsession-skill')
  assert.ok(agentIdx < subsessionIdx, 'agent should come before subsession')
})

// ─── Backward Compatibility ──────────────────────────────────────────────────

test('resolveTieredSkills works without options (backward compat)', () => {
  const config = makeConfig()
  // Call without 5th argument (no options)
  const result = resolveTieredSkills('hivemaker', undefined, 'tdd', config)
  assert.ok(result.length > 0, 'should return skills without options parameter')
})

test('resolveTieredSkills works without taskClassification (backward compat)', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', undefined, undefined, config)
  const names = result.map(s => s.name)
  assert.ok(names.includes('shared-skill'), 'should work without taskClassification')
})

// ─── Combined Tier 1 + Tier 2 ────────────────────────────────────────────────

test('resolveTieredSkills combines Tier 1 + Tier 2 when both apply', () => {
  const config = makeConfig()
  const result = resolveTieredSkills('hivemaker', 'project-initiation', 'tdd', config)
  const names = result.map(s => s.name)

  // Tier 1 skills present
  for (const t1 of TIER1_CORE_INIT_SKILLS) {
    assert.ok(names.includes(t1.name), `should include Tier 1: ${t1.name}`)
  }

  // Tier 2 tdd skills present
  assert.ok(names.includes('use-hivemind-tdd'), 'should include Tier 2 tdd skill')
})

// ─── Edge Cases ──────────────────────────────────────────────────────────────

test('resolveTieredSkills handles empty config gracefully', () => {
  const config = makeConfig({
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
  const result = resolveTieredSkills(undefined, undefined, undefined, config)
  assert.ok(Array.isArray(result), 'should return array even with empty config')
})

test('resolveTieredSkills handles undefined agentId with project-initiation', () => {
  const config = makeConfig()
  const result = resolveTieredSkills(undefined, 'project-initiation', undefined, config)
  const names = result.map(s => s.name)
  // Should fall back to default agent AND include Tier 1
  assert.ok(names.includes('orchestrator-skill'), 'should use default agent for undefined agentId')
  assert.ok(names.includes('use-hivemind'), 'should include Tier 1 for project-initiation')
})
