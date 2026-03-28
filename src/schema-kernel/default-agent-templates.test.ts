/**
 * Tests for default HiveMind agent templates.
 *
 * Validates schema compliance, uniqueness, count, and mode correctness
 * for all 10 default agent definitions.
 *
 * @module schema-kernel/default-agent-templates.test
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { AgentTemplate } from './agent-records.js'

// This import will fail until the implementation file exists (RED gate)
import {
  DEFAULT_AGENT_TEMPLATES,
  HIVEMINDER,
  HIVEDFIVER,
  HIVEHEALER,
  HIVEQ,
  HIVERD,
  HIVEXPLORER,
  HITEA,
  ARCHITECT,
  HIVEMAKER,
  CODE_SKEPTIC,
} from './default-agent-templates.js'

describe('default-agent-templates', () => {
  describe('schema validation', () => {
    it('should parse every template with AgentTemplate.parse()', () => {
      for (const template of DEFAULT_AGENT_TEMPLATES) {
        const parsed = AgentTemplate.parse(template)
        assert.ok(parsed.name, `Template "${template.name}" must have a name`)
        assert.ok(
          parsed.description,
          `Template "${template.name}" must have a description`,
        )
      }
    })

    it('should have descriptions of ≤2 sentences each', () => {
      for (const template of DEFAULT_AGENT_TEMPLATES) {
        const sentenceCount = template.description
          .split(/[.!?]+/)
          .filter((s) => s.trim().length > 0).length
        assert.ok(
          sentenceCount <= 2,
          `Template "${template.name}" description must be ≤2 sentences, got ${sentenceCount}: "${template.description}"`,
        )
      }
    })
  })

  describe('array composition', () => {
    it('should export exactly 10 templates', () => {
      assert.equal(
        DEFAULT_AGENT_TEMPLATES.length,
        10,
        `Expected 10 templates, got ${DEFAULT_AGENT_TEMPLATES.length}`,
      )
    })

    it('should have no duplicate names', () => {
      const names = DEFAULT_AGENT_TEMPLATES.map((t) => t.name)
      const unique = new Set(names)
      assert.equal(
        unique.size,
        names.length,
        `Duplicate names found: ${names.filter(
          (n, i) => names.indexOf(n) !== i,
        )}`,
      )
    })
  })

  describe('mode correctness', () => {
    const modeMap: Record<string, string> = {
      hiveminder: 'primary',
      hivefiver: 'all',
      hivehealer: 'subagent',
      hiveq: 'subagent',
      hiverd: 'subagent',
      hivexplorer: 'subagent',
      hitea: 'subagent',
      architect: 'subagent',
      hivemaker: 'subagent',
      'code-skeptic': 'subagent',
    }

    it('should assign correct modes per spec', () => {
      for (const template of DEFAULT_AGENT_TEMPLATES) {
        const expected = modeMap[template.name]
        assert.ok(
          expected,
          `Unexpected agent name: "${template.name}"`,
        )
        assert.equal(
          template.mode,
          expected,
          `Agent "${template.name}" should have mode="${expected}", got "${template.mode}"`,
        )
      }
    })
  })

  describe('individual exports', () => {
    it('should export HIVEMINDER as primary mode', () => {
      assert.equal(HIVEMINDER.mode, 'primary')
      assert.equal(HIVEMINDER.name, 'hiveminder')
    })

    it('should export HIVEDFIVER as all mode', () => {
      assert.equal(HIVEDFIVER.mode, 'all')
      assert.equal(HIVEDFIVER.name, 'hivefiver')
    })

    it('should export HIVEHEALER as subagent mode', () => {
      assert.equal(HIVEHEALER.mode, 'subagent')
      assert.equal(HIVEHEALER.name, 'hivehealer')
    })

    it('should export HIVEQ as subagent mode', () => {
      assert.equal(HIVEQ.mode, 'subagent')
      assert.equal(HIVEQ.name, 'hiveq')
    })

    it('should export HIVERD as subagent mode', () => {
      assert.equal(HIVERD.mode, 'subagent')
      assert.equal(HIVERD.name, 'hiverd')
    })

    it('should export HIVEXPLORER as subagent mode', () => {
      assert.equal(HIVEXPLORER.mode, 'subagent')
      assert.equal(HIVEXPLORER.name, 'hivexplorer')
    })

    it('should export HITEA as subagent mode', () => {
      assert.equal(HITEA.mode, 'subagent')
      assert.equal(HITEA.name, 'hitea')
    })

    it('should export ARCHITECT as subagent mode', () => {
      assert.equal(ARCHITECT.mode, 'subagent')
      assert.equal(ARCHITECT.name, 'architect')
    })

    it('should export HIVEMAKER as subagent mode', () => {
      assert.equal(HIVEMAKER.mode, 'subagent')
      assert.equal(HIVEMAKER.name, 'hivemaker')
    })

    it('should export CODE_SKEPTIC as subagent mode', () => {
      assert.equal(CODE_SKEPTIC.mode, 'subagent')
      assert.equal(CODE_SKEPTIC.name, 'code-skeptic')
    })
  })
})
