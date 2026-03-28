/**
 * Skill Injection Loader — Config-driven dynamic skill bundle resolution.
 *
 * RED phase tests: validates config loading, validation, deduplication, and fallback behavior.
 */

import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import {
  loadSkillInjectionConfig,
  validateSkillNames,
  resetCache,
  type SkillInjectionConfig,
} from './skill-injection-loader.js'

/** Create a temporary config directory for test isolation */
function createTestDir(baseDir: string): string {
  const testDir = join(baseDir, 'test-skill-loader')
  mkdirSync(join(testDir, 'config'), { recursive: true })
  mkdirSync(join(testDir, '.opencode', 'skills', 'tdd'), { recursive: true })
  mkdirSync(join(testDir, '.opencode', 'skills', 'clean-code'), { recursive: true })
  mkdirSync(join(testDir, '.opencode', 'skills', 'refactor'), { recursive: true })

  // Write minimal SKILL.md files for registry validation
  const frontmatter = '---\nname: test\ndescription: test skill\n---\n'
  writeFileSync(join(testDir, '.opencode', 'skills', 'tdd', 'SKILL.md'), frontmatter)
  writeFileSync(join(testDir, '.opencode', 'skills', 'clean-code', 'SKILL.md'), frontmatter)
  writeFileSync(join(testDir, '.opencode', 'skills', 'refactor', 'SKILL.md'), frontmatter)

  return testDir
}

function cleanupTestDir(testDir: string): void {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true })
  }
}

// ─── Config Loading ──────────────────────────────────────────────────────────

test('loadSkillInjectionConfig returns defaults when config file is missing', () => {
  resetCache()
  const testDir = createTestDir('.')

  try {
    const config = loadSkillInjectionConfig(testDir)
    // Should return a valid config with default structure
    assert.ok(config, 'config should be returned')
    assert.ok(config._meta, 'config should have _meta')
    assert.equal(config._meta.schema, 'skill-injection-config-v1')
    assert.ok(Array.isArray(config.shared_skills), 'shared_skills should be array')
    assert.ok(typeof config.agent_bundles === 'object', 'agent_bundles should be object')
    assert.ok(typeof config.purpose_conditional === 'object', 'purpose_conditional should be object')
    assert.ok(Array.isArray(config.subsession_additions), 'subsession_additions should be array')
    assert.ok(Array.isArray(config.excluded_skill_ids), 'excluded_skill_ids should be array')
  } finally {
    cleanupTestDir(testDir)
  }
})

test('loadSkillInjectionConfig loads config when file exists', () => {
  resetCache()
  const testDir = createTestDir('.')

  const configJson = {
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [
      { name: 'use-hivemind-delegation', description: 'Delegation enforcement' },
    ],
    max_skills: null,
    agent_bundles: {
      hivemaker: [
        { name: 'tdd', description: 'TDD enforcement' },
        { name: 'clean-code', description: 'Clean code principles' },
      ],
    },
    purpose_conditional: {
      tdd: [{ name: 'tdd', description: 'TDD' }],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [],
    excluded_skill_ids: [],
  }

  writeFileSync(join(testDir, 'config', 'skill-injection.json'), JSON.stringify(configJson))

  try {
    const config = loadSkillInjectionConfig(testDir)
    assert.equal(config._meta.schema, 'skill-injection-config-v1')
    assert.equal(config.shared_skills[0].name, 'use-hivemind-delegation')
    assert.equal(config.agent_bundles.hivemaker.length, 2)
    assert.equal(config.max_skills, null)
  } finally {
    cleanupTestDir(testDir)
  }
})

test('loadSkillInjectionConfig caches result on subsequent calls', () => {
  resetCache()
  const testDir = createTestDir('.')

  try {
    const config1 = loadSkillInjectionConfig(testDir)
    const config2 = loadSkillInjectionConfig(testDir)
    // Same reference (cached)
    assert.strictEqual(config1, config2, 'should return cached config on second call')
  } finally {
    cleanupTestDir(testDir)
  }
})

// ─── Validation ──────────────────────────────────────────────────────────────

test('validateSkillNames reports missing skills as warnings', () => {
  resetCache()
  const testDir = createTestDir('.')

  const config: SkillInjectionConfig = {
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [{ name: 'nonexistent-skill', description: 'Missing skill' }],
    max_skills: null,
    agent_bundles: {
      hivemaker: [
        { name: 'tdd', description: 'TDD' },
        { name: 'also-nonexistent', description: 'Also missing' },
      ],
    },
    purpose_conditional: {
      tdd: [{ name: 'clean-code', description: 'Clean code' }],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [{ name: 'refactor', description: 'Refactor' }],
    excluded_skill_ids: [],
    default_agent: 'hiveminder',
  }

  try {
    const result = validateSkillNames(config, testDir)
    // Should report warnings for missing skills but NOT fail validation
    assert.equal(result.valid, true, 'validation should pass (warnings only)')
    assert.ok(result.warnings.length > 0, 'should have warnings for missing skills')
    assert.ok(
      result.warnings.some(w => w.includes('nonexistent-skill')),
      'should warn about nonexistent-skill',
    )
    assert.ok(
      result.warnings.some(w => w.includes('also-nonexistent')),
      'should warn about also-nonexistent',
    )
  } finally {
    cleanupTestDir(testDir)
  }
})

test('validateSkillNames passes with all skills present', () => {
  resetCache()
  const testDir = createTestDir('.')

  const config: SkillInjectionConfig = {
    _meta: {
      version: '1.0.0',
      updated_at: '2026-03-25T10:00:00.000Z',
      updated_by: 'hivefiver',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [{ name: 'tdd', description: 'TDD' }],
    max_skills: null,
    agent_bundles: {
      hivemaker: [{ name: 'clean-code', description: 'Clean code' }],
    },
    purpose_conditional: {
      tdd: [{ name: 'refactor', description: 'Refactor' }],
      research: [],
      planning: [],
      implementation: [],
      'course-correction': [],
      gatekeeping: [],
    },
    subsession_additions: [],
    excluded_skill_ids: [],
    default_agent: 'hiveminder',
  }

  try {
    const result = validateSkillNames(config, testDir)
    assert.equal(result.valid, true)
    assert.equal(result.missing_skills.length, 0, 'no missing skills')
    assert.equal(result.warnings.length, 0, 'no warnings')
  } finally {
    cleanupTestDir(testDir)
  }
})

// ─── Default Config Structure ────────────────────────────────────────────────

test('default config has all expected agent bundles and purpose conditionals', () => {
  resetCache()
  const testDir = createTestDir('.')

  try {
    const config = loadSkillInjectionConfig(testDir)

    // All 9 agents should have bundles
    const expectedAgents = ['hiveminder', 'hivefiver', 'hiveq', 'hivemaker', 'hiveplanner', 'hivexplorer', 'hiverd', 'hivehealer', 'hitea']
    for (const agent of expectedAgents) {
      assert.ok(config.agent_bundles[agent], `agent_bundles should include ${agent}`)
      assert.ok(config.agent_bundles[agent].length > 0, `${agent} should have at least one skill`)
    }

    // All purpose classes should be present
    const expectedPurposes = ['tdd', 'research', 'planning', 'implementation', 'course-correction', 'gatekeeping']
    for (const purpose of expectedPurposes) {
      assert.ok(purpose in config.purpose_conditional, `purpose_conditional should include ${purpose}`)
    }

    // Shared skills should exist
    assert.ok(config.shared_skills.length > 0, 'shared_skills should not be empty')

    // Subsession additions should exist
    assert.ok(config.subsession_additions.length > 0, 'subsession_additions should not be empty')

    // Schema marker should be correct
    assert.equal(config._meta.schema, 'skill-injection-config-v1')
  } finally {
    cleanupTestDir(testDir)
  }
})

// ─── max_skills field ────────────────────────────────────────────────────────

test('max_skills can be null (no cap)', () => {
  resetCache()
  const testDir = createTestDir('.')

  const configJson = {
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
    excluded_skill_ids: [],
  }

  writeFileSync(join(testDir, 'config', 'skill-injection.json'), JSON.stringify(configJson))

  try {
    const config = loadSkillInjectionConfig(testDir)
    assert.equal(config.max_skills, null, 'max_skills should be null')
  } finally {
    cleanupTestDir(testDir)
  }
})
