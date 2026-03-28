/**
 * Skill Injection Init — TDD RED phase tests.
 *
 * Proves that `initSkillInjection()` is defined but NEVER called from
 * `opencode-plugin.ts`, making the injection system dormant.
 *
 * These tests MUST fail against current code. They drive the fix.
 *
 * @module plugin/skill-injection-init.test
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import {
  initSkillInjection,
  resolveSkillBundle,
} from './skill-exposure-map.js'

const PROJECT_ROOT = join(import.meta.dirname, '..', '..')

// ---------------------------------------------------------------------------
// Test 1: opencode-plugin.ts imports initSkillInjection
// ---------------------------------------------------------------------------

test('opencode-plugin.ts imports initSkillInjection from skill-exposure-map', () => {
  const pluginPath = join(import.meta.dirname, 'opencode-plugin.ts')
  const source = readFileSync(pluginPath, 'utf-8')

  // The plugin MUST import initSkillInjection so it can call it at startup.
  // Currently it only imports resolveDefaultAgent — this assertion will FAIL.
  assert.ok(
    source.includes('initSkillInjection'),
    'opencode-plugin.ts must import initSkillInjection from skill-exposure-map.js. ' +
      'Currently only resolveDefaultAgent is imported — the injection system is dormant.',
  )
})

// ---------------------------------------------------------------------------
// Test 2: resolveSkillBundle returns empty when init was never called
// ---------------------------------------------------------------------------

test('resolveSkillBundle returns [] when initSkillInjection was never called (cachedConfig is null)', () => {
  // Force cachedConfig to null by importing fresh module state.
  // Because initSkillInjection was never called by the plugin, cachedConfig
  // stays null and resolveSkillBundle falls through to the empty-return guard.
  const result = resolveSkillBundle('hiveminder', 'tdd', undefined)

  // This WILL pass (returns []) — but it documents the bug: the system is dormant.
  assert.deepEqual(result, [], 'Without init, resolveSkillBundle returns empty array (injection dormant)')
})

// ---------------------------------------------------------------------------
// Test 3: after calling initSkillInjection, resolveSkillBundle works
// ---------------------------------------------------------------------------

test('after initSkillInjection, resolveSkillBundle returns non-empty for known agent + purpose', () => {
  // Call init — this is what the plugin should do but doesn't.
  initSkillInjection(PROJECT_ROOT)

  const result = resolveSkillBundle('hiveminder', 'tdd', undefined)

  // The hiveminder agent bundle has 3 skills + purpose_conditional.tdd adds 2 more
  // (with shared_skills = 1). Total should be >= 3.
  // This will PASS if init is called — proving the function works, but is never called.
  assert.ok(
    result.length > 0,
    `resolveSkillBundle('hiveminder', 'tdd') should return skills after init. Got ${result.length}`,
  )

  // Verify specific skills from the hiveminder agent bundle
  const skillNames = result.map(s => s.name)
  assert.ok(
    skillNames.includes('hivemind-gatekeeping-delegation'),
    'hiveminder bundle should include hivemind-gatekeeping-delegation',
  )
})

// ---------------------------------------------------------------------------
// Test 4: resolveSkillBundle returns purpose-conditional skills after init
// ---------------------------------------------------------------------------

test('after initSkillInjection, purpose_conditional skills are injected for tdd purpose', () => {
  initSkillInjection(PROJECT_ROOT)

  const result = resolveSkillBundle('hivemaker', 'tdd', undefined)
  const skillNames = result.map(s => s.name)

  // tdd purpose conditional should inject tdd-delegation and test-driven-development
  assert.ok(
    skillNames.includes('tdd-delegation'),
    'tdd purpose should inject tdd-delegation skill',
  )
  assert.ok(
    skillNames.includes('test-driven-development'),
    'tdd purpose should inject test-driven-development skill',
  )
})

// ---------------------------------------------------------------------------
// Test 5: resolveSkillBundle returns empty for unknown agent after init
// ---------------------------------------------------------------------------

test('after initSkillInjection, unknown agent gets shared skills only (or empty if no shared match)', () => {
  initSkillInjection(PROJECT_ROOT)

  const result = resolveSkillBundle('nonexistent-agent', undefined, undefined)

  // Unknown agent: should get shared_skills at minimum (use-hivemind-delegation)
  // but purpose_conditional and agent_bundles won't match
  const skillNames = result.map(s => s.name)
  assert.ok(
    skillNames.includes('use-hivemind-delegation'),
    'All agents should receive shared_skills regardless of agent identity',
  )
})
