/**
 * Skill Registry Path Scanning — RED Phase Tests
 *
 * These tests prove that `discoverSkills()` (via `createOpencodeSkillRegistry`)
 * scans the WRONG path and misses all skills.
 *
 * Current behavior: scans `{root}/skills/` which contains no SKILL.md files.
 * Expected behavior: scan `.opencode/skills/` (OpenCode official path).
 *
 * ALL TESTS MUST FAIL until opencode-skill-registry.ts is fixed.
 */

import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'

import { createOpencodeSkillRegistry } from './opencode-skill-registry.js'

// Use the actual project root — this is the real filesystem
const projectRoot = join(import.meta.dirname, '..', '..')

// ─── Test 1: discoverSkills finds skills in .opencode/skills/ ─────────────

test('discoverSkills finds at least 10 skills from .opencode/skills/ (FAILS: scans wrong path)', () => {
  const registry = createOpencodeSkillRegistry(projectRoot)

  // .opencode/skills/ contains 15 SKILL.md files
  // Current code scans {root}/skills/ which has 0 SKILL.md files
  assert.ok(
    registry.length >= 10,
    `Expected >= 10 skills from .opencode/skills/, got ${registry.length}. ` +
      'Registry scans {root}/skills/ instead of {root}/.opencode/skills/',
  )
})

// ─── Test 2: discoverSkills finds known skill by ID ───────────────────────

test('discoverSkills finds use-hivemind-delegation (FAILS: scans wrong path)', () => {
  const registry = createOpencodeSkillRegistry(projectRoot)
  const ids = registry.map((entry) => entry.id)

  assert.ok(
    ids.includes('use-hivemind-delegation'),
    `Expected 'use-hivemind-delegation' in registry, got [${ids.join(', ')}]. ` +
      'Registry scans {root}/skills/ instead of {root}/.opencode/skills/',
  )
})

// ─── Test 3: discoverSkills does not include underscore-prefixed ──────────

test('discoverSkills excludes underscore-prefixed directories (should PASS now)', () => {
  const registry = createOpencodeSkillRegistry(projectRoot)
  const ids = registry.map((entry) => entry.id)

  // _deprecated_hive is in skills/ but should be excluded
  // This test PASSES even now because _deprecated_hive doesn't have SKILL.md
  // at the right nesting level anyway
  const hasDeprecated = ids.some((id) => id.startsWith('_'))
  assert.equal(
    hasDeprecated,
    false,
    `Underscore-prefixed skill found in registry: [${ids.filter((id) => id.startsWith('_')).join(', ')}]`,
  )
})

// ─── Test 4: discovered skills match injection config names ───────────────

test('discovered skills match injection config skill names that exist on disk', () => {
  // These are skill IDs from the default skill-injection config that have
  // SKILL.md files in .opencode/skills/ and MUST be discoverable.
  const configReferencedIds = [
    'use-hivemind-delegation',
    'hivemind-atomic-commit',
    'hivemind-codemap',
    'hivemind-system-debug',
  ]

  const registry = createOpencodeSkillRegistry(projectRoot)
  const registryIds = new Set(registry.map((entry) => entry.id))

  const missing = configReferencedIds.filter((id) => !registryIds.has(id))

  assert.equal(
    missing.length,
    0,
    `${missing.length} config-referenced skills missing from registry: [${missing.join(', ')}]. ` +
      'Registry scans {root}/skills/ instead of {root}/.opencode/skills/',
  )
})

// ─── Test 5: registry entry has valid frontmatter ─────────────────────────

test('registry entries have valid frontmatter with name and description (FAILS: no entries)', () => {
  const registry = createOpencodeSkillRegistry(projectRoot)

  // If registry is empty, this proves the scan path is wrong
  // If registry has entries, each must have valid frontmatter
  assert.ok(registry.length > 0, 'Registry is empty — scan path is wrong')

  for (const entry of registry) {
    assert.ok(entry.frontmatter.name, `Skill ${entry.id} missing frontmatter.name`)
    assert.ok(entry.frontmatter.description, `Skill ${entry.id} missing frontmatter.description`)
    assert.ok(entry.runtimeMarkdown, `Skill ${entry.id} missing runtimeMarkdown`)
    assert.ok(entry.body.length > 0, `Skill ${entry.id} has empty body`)
  }
})

// ─── Test 6: registry entry source paths are under valid skills directories ─

test('registry entry source paths are under .opencode/skills/ or global config skills/', () => {
  const registry = createOpencodeSkillRegistry(projectRoot)

  // If registry is empty, the scan path is wrong
  assert.ok(registry.length > 0, 'Registry is empty — scan path is wrong')

  for (const entry of registry) {
    const inLocal = entry.sourcePath.includes('.opencode/skills')
    const inGlobal = entry.sourcePath.includes('.config/opencode/skills')
    assert.ok(
      inLocal || inGlobal,
      `Skill ${entry.id} sourcePath "${entry.sourcePath}" is not under .opencode/skills/ or .config/opencode/skills/`,
    )
  }
})
