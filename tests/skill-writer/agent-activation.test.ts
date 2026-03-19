import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const SKILL_WRITER_DIR = '.opencode/skills/hivemind-skill-writer'
const SKILL_MD = path.join(SKILL_WRITER_DIR, 'SKILL.md')
const REFERENCES_DIR = path.join(SKILL_WRITER_DIR, 'references')
const AGENT_ACTIVATION_REF = path.join(REFERENCES_DIR, '06-agent-activation.md')

describe('Agent Activation Patterns', () => {
  let skillMdContent: string
  let refContent: string

  before(() => {
    // Load SKILL.md content
    assert.ok(fs.existsSync(SKILL_MD), 'SKILL.md must exist')
    skillMdContent = fs.readFileSync(SKILL_MD, 'utf-8')

    // Load reference file content
    assert.ok(fs.existsSync(AGENT_ACTIVATION_REF), '06-agent-activation.md must exist')
    refContent = fs.readFileSync(AGENT_ACTIVATION_REF, 'utf-8')
  })

  describe('SKILL.md Integration', () => {
    it('should reference agent-activation.md in References section', () => {
      assert.ok(
        skillMdContent.includes('references/06-agent-activation.md'),
        'SKILL.md must reference 06-agent-activation.md in References section'
      )
    })

    it('should have routing logic with stack budget check', () => {
      // Routing logic should include task-based routing
      assert.ok(
        skillMdContent.includes('IF task') ||
        skillMdContent.includes('IF task'),
        'SKILL.md must have routing logic'
      )
      // Stack budget should be checked
      assert.ok(
        skillMdContent.includes('stack') &&
        skillMdContent.includes('3'),
        'SKILL.md must document stack budget (max 3 skills)'
      )
    })

    it('should have complete NO-LOAD rules', () => {
      assert.ok(
        skillMdContent.includes('DO NOT activate') ||
        skillMdContent.includes('NO-LOAD'),
        'SKILL.md must have NO-LOAD rules section'
      )
      // Check for key NO-LOAD conditions
      assert.ok(
        skillMdContent.includes('context') || skillMdContent.includes('Context'),
        'NO-LOAD rules must cover context depth'
      )
      assert.ok(
        skillMdContent.includes('trust') || skillMdContent.includes('Trust'),
        'NO-LOAD rules must cover trust threshold'
      )
      assert.ok(
        skillMdContent.includes('degraded') || skillMdContent.includes('recovery'),
        'NO-LOAD rules must cover session state'
      )
    })

    it('should have integration_with field set in frontmatter', () => {
      assert.ok(
        skillMdContent.includes('integrates_with'),
        'SKILL.md must have integrates_with field'
      )
    })
  })

  describe('Reference File: 06-agent-activation.md', () => {
    it('should have Subagent Routing Decision Tree', () => {
      assert.ok(
        refContent.includes('Subagent') ||
        refContent.includes('subagent') ||
        refContent.includes('multi-agent'),
        '06-agent-activation.md must document subagent patterns'
      )
    })

    it('should have NO-LOAD rules matching SKILL.md', () => {
      // Reference should have its own NO-LOAD rules or cross-reference
      assert.ok(
        refContent.includes('NO-LOAD') ||
        refContent.includes('no-load') ||
        refContent.includes('DO NOT') ||
        refContent.includes('context depth'),
        '06-agent-activation.md should document activation rules'
      )
    })
  })
})
