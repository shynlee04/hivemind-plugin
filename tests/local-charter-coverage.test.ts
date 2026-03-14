import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const CHARTERS = [
  '/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/core/trajectory/AGENTS.md',
  '/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/delegation/AGENTS.md',
  '/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/context/prompt-packet/AGENTS.md',
  '/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/recovery/AGENTS.md',
  '/Users/apple/hivemind-plugin/.worktrees/ecosystem-revamp/src/governance/AGENTS.md',
]

describe('local charter coverage', () => {
  it('defines ownership and mutation boundaries for high-risk bridge subsystems', () => {
    for (const filePath of CHARTERS) {
      const raw = readFileSync(filePath, 'utf-8')
      assert.match(raw, /Responsibilities/)
      assert.match(raw, /Owned Failures/)
      assert.match(raw, /Mutation Boundary/)
      assert.match(raw, /Contracts/)
    }
  })
})
