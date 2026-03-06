import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildPluginFallbackContextBlock,
  type PluginFallbackContextInput,
} from "../src/lib/plugin-fallback-context.js"

function createBaseInput(overrides: Partial<PluginFallbackContextInput> = {}): PluginFallbackContextInput {
  return {
    agent: "hivefiver",
    turnCount: 4,
    delegationDepth: 1,
    isChildSession: false,
    healthSummary: "Health: 93/100 (healthy)",
    delegatedToExplorer: true,
    profile: {
      id: "profile-hivefiver",
      intent: "repair",
      constraints: ["keep scope tight", "verify before mutation"],
      capabilities: {
        paths: ["src/**", ".opencode/**"],
        depth_limit: 4,
        delegate_to: ["hivexplorer", "hiveq"],
      },
    },
    todoState: {
      items: [
        { id: "1", content: "stabilize plugin fallback", status: "in_progress", priority: "high" },
        { id: "2", content: "verify context ownership", status: "pending", priority: "high" },
      ],
      last_updated: Date.now(),
    },
    hierarchyState: {
      trajectory: "Trajectory Alpha",
      tactic: "Tactic Beta",
      action: "Action Gamma",
    },
    contextRecovery: {
      trajectory_summary: "Trajectory Alpha",
      active_todos: ["stabilize plugin fallback"],
      key_decisions: ["src owns context semantics"],
      recommended_next: "Continue bounded extraction",
    },
    healthMetrics: {
      composite: {
        score: 93,
        status: "healthy",
      },
      signals: {
        drift: { score: 88, velocity: 1 },
        evidence: { score: 91, velocity: 0 },
      },
      thresholds: {
        hard_block: {
          signals: ["drift"],
          below: 25,
        },
      },
    },
    scopeViolationCount: 0,
    entryDetection: {
      entry_condition: "resume",
      lineage: "hivefiver",
      state_exists: true,
      hierarchy_status: "active",
      trajectory_status: "active",
      bootstrap_executed: true,
    },
    intentClassification: {
      lineage: "hivefiver",
      source: "heuristic",
      persisted_to_profile: true,
      input_excerpt: "continue bounded extraction",
    },
    ...overrides,
  }
}

describe("plugin fallback context block", () => {
  it("builds minimized child-session fallback context without main-session semantic sections", () => {
    const block = buildPluginFallbackContextBlock(
      createBaseInput({
        isChildSession: true,
      }),
    )

    assert.equal(typeof block, "string")
    assert.match(block, /## GX-Pack Governance Context \(Auto-Injected\)/)
    assert.match(block, /### Child Session Focus/)
    assert.doesNotMatch(block, /### Active TODO/)
    assert.doesNotMatch(block, /### Hierarchy Cursor/)
    assert.doesNotMatch(block, /### Context Recovery/)
  })

  it("builds main-session fallback context with todo, hierarchy, recovery, and advisory sections", () => {
    const block = buildPluginFallbackContextBlock(createBaseInput())

    assert.equal(typeof block, "string")
    assert.match(block, /### Active TODO/)
    assert.match(block, /### Hierarchy Cursor/)
    assert.match(block, /### Context Recovery \(auto-recovered\)/)
    assert.match(block, /### HIVEFIVER CAPABILITY ADVISORY/)
    assert.match(block, /### Scope: Clean/)
  })

  it("returns null when no meaningful snapshot or runtime context is available", () => {
    const block = buildPluginFallbackContextBlock(
      createBaseInput({
        profile: null,
        todoState: null,
        hierarchyState: null,
        contextRecovery: null,
        healthMetrics: null,
        entryDetection: null,
        intentClassification: null,
        delegatedToExplorer: false,
        scopeViolationCount: 0,
      }),
    )

    assert.equal(block, null)
  })
})
