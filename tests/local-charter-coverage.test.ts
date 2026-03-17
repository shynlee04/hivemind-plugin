import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const CHARTERS = [
  '/Users/apple/hivemind-plugin/src/core/trajectory/AGENTS.md',
  '/Users/apple/hivemind-plugin/src/delegation/AGENTS.md',
  '/Users/apple/hivemind-plugin/src/context/prompt-packet/AGENTS.md',
  '/Users/apple/hivemind-plugin/src/recovery/AGENTS.md',
  '/Users/apple/hivemind-plugin/src/governance/AGENTS.md',
]

describe('local charter coverage', () => {
  it('defines ownership and mutation boundaries for high-risk bridge subsystems', () => {
    for (const filePath of CHARTERS) {
      const raw = readFileSync(filePath, 'utf-8')
      // Current section model: heading + Boundary table + Design/Audit notes
      assert.match(raw, /Boundary/, `${filePath} should have Boundary section`)
      assert.match(raw, /Purpose|Design|Manages/, `${filePath} should describe its purpose`)
    }
  })
})
