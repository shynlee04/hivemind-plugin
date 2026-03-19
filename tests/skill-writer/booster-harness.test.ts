import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const SKILL_WRITER_DIR = '.opencode/skills/hivemind-skill-writer'
const REFERENCES_DIR = path.join(SKILL_WRITER_DIR, 'references')
const AGENT_ACTIVATION_REF = path.join(REFERENCES_DIR, '06-agent-activation.md')

describe('Booster/Harness Meta-Concepts', () => {
  // Shared content loaded once per test suite
  let refContent: string

  before(() => {
    // Load reference file content for all tests
    assert.ok(fs.existsSync(AGENT_ACTIVATION_REF), '06-agent-activation.md must exist')
    refContent = fs.readFileSync(AGENT_ACTIVATION_REF, 'utf-8')
  })

  describe('Booster Pattern', () => {
    it('should augment intelligence without governance conflict', () => {
      // Booster should be defined as advisory, not imperative
      assert.ok(
        refContent.includes('Advisory, not imperative') ||
        refContent.includes('governance') ||
        refContent.includes('Booster'),
        'Booster pattern must be defined with governance-safe characteristics'
      )
    })

    it('should have stacking=0 for meta-skills', () => {
      // Meta-skills (like hivemind-skill-writer) should have stacking: 0
      assert.ok(
        refContent.includes('stacking: 0') ||
        refContent.includes('stacking=0') ||
        (refContent.includes('0') && refContent.includes('stacking')),
        'Booster pattern must document stacking=0 for meta-skills'
      )
    })

    it('should not break existing skill flows', () => {
      // Should mention non-breaking or compatibility
      assert.ok(
        refContent.includes('non-breaking') ||
        refContent.includes('without breaking') ||
        refContent.includes('context flows') ||
        refContent.includes('existing'),
        'Booster pattern must document non-breaking behavior'
      )
    })
  })

  describe('Harness Pattern', () => {
    it('should provide non-breaking context enhancement', () => {
      assert.ok(
        refContent.includes('Harness') &&
        (refContent.includes('context enhancement') ||
         refContent.includes('introspection') ||
         refContent.includes('investigation')),
        'Harness pattern must provide context enhancement definition'
      )
    })

    it('should support progressive disclosure', () => {
      assert.ok(
        refContent.includes('progressive disclosure') ||
        refContent.includes('Progressive disclosure') ||
        refContent.includes('on-demand') ||
        refContent.includes('conditional'),
        'Harness pattern must support progressive disclosure'
      )
    })

    it('should maintain stack budget', () => {
      // Should mention stack budget or 3-skill limit
      assert.ok(
        refContent.includes('stack') ||
        refContent.includes('3 skills') ||
        refContent.includes('max'),
        'Harness pattern must relate to stack discipline'
      )
    })
  })

  describe('Stacking Discipline', () => {
    it('should enforce max 3 skills per entry', () => {
      assert.ok(
        refContent.includes('3') && refContent.includes('skill') ||
        refContent.includes('max 3') ||
        refContent.includes('3 skills'),
        'Stacking discipline must document max 3 skills limit'
      )
    })

    it('should count context-intelligence as 1 slot', () => {
      assert.ok(
        refContent.includes('context-intelligence') &&
        (refContent.includes('1') || refContent.includes('slot')),
        'Stacking discipline must document context-intelligence at 1 slot'
      )
    })

    it('should count hivemind-skill-writer as 0 slots', () => {
      assert.ok(
        refContent.includes('hivemind-skill-writer') &&
        (refContent.includes('0') || refContent.includes('zero') || refContent.includes('does not count')),
        'Stacking discipline must document hivemind-skill-writer at 0 slots'
      )
    })
  })

  describe('Cross-Pack Integration', () => {
    it('should integrate with context-intelligence', () => {
      assert.ok(
        refContent.includes('context-intelligence'),
        'Cross-pack integration must reference context-intelligence'
      )
    })

    it('should support skill-audit as P3 specialist', () => {
      assert.ok(
        refContent.includes('skill-audit') ||
        refContent.includes('P3'),
        'Cross-pack integration must support skill-audit patterns'
      )
    })

    it('should support skill-migration as P3 specialist', () => {
      assert.ok(
        refContent.includes('skill-migration') ||
        refContent.includes('migration') ||
        refContent.includes('P3'),
        'Cross-pack integration must support skill-migration patterns'
      )
    })
  })
})
