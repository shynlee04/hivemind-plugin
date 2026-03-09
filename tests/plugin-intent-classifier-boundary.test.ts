/**
 * P1-B: Lineage classifier boundary tests.
 *
 * Replaces the deprecated .opencode/plugins/hiveops-governance intent-classifier
 * boundary tests. Now tests classifyLineageScope() which is the unified
 * lineage classification function in src/lib/session-intent-classifier.ts.
 */
import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { classifyLineageScope } from "../src/lib/session-intent-classifier.js"

describe("lineage classifier boundary (P1-B)", () => {
  describe("deterministic agent-name resolution", () => {
    it("classifies hivefiver as meta-framework", () => {
      assert.equal(classifyLineageScope("hivefiver"), "meta-framework")
    })

    it("classifies hivehealer as meta-framework", () => {
      assert.equal(classifyLineageScope("hivehealer"), "meta-framework")
    })

    it("classifies hitea as meta-framework", () => {
      assert.equal(classifyLineageScope("hitea"), "meta-framework")
    })

    it("classifies hiveminder as project", () => {
      assert.equal(classifyLineageScope("hiveminder"), "project")
    })

    it("classifies hivemaker as project", () => {
      assert.equal(classifyLineageScope("hivemaker"), "project")
    })

    it("classifies hiveplanner as project", () => {
      assert.equal(classifyLineageScope("hiveplanner"), "project")
    })

    it("classifies hiveq as project", () => {
      assert.equal(classifyLineageScope("hiveq"), "project")
    })

    it("classifies hiverd as project", () => {
      assert.equal(classifyLineageScope("hiverd"), "project")
    })

    it("classifies hivexplorer as project", () => {
      assert.equal(classifyLineageScope("hivexplorer"), "project")
    })

    it("handles case-insensitive agent names", () => {
      assert.equal(classifyLineageScope("HiveFiver"), "meta-framework")
      assert.equal(classifyLineageScope("HIVEMINDER"), "project")
    })

    it("handles whitespace in agent names", () => {
      assert.equal(classifyLineageScope("  hivefiver  "), "meta-framework")
      assert.equal(classifyLineageScope(" hiveminder "), "project")
    })
  })

  describe("keyword-based fallback from session text", () => {
    it("classifies meta-framework from keyword signals", () => {
      const result = classifyLineageScope(
        "unresolved",
        "framework governance registry parity check"
      )
      assert.equal(result, "meta-framework")
    })

    it("classifies project from keyword signals", () => {
      const result = classifyLineageScope(
        "unresolved",
        "implement feature for the customer deploy release"
      )
      assert.equal(result, "project")
    })

    it("returns unknown when keywords are ambiguous", () => {
      const result = classifyLineageScope(
        "unresolved",
        "build framework" // 1 project + 1 meta — below 2-margin threshold
      )
      assert.equal(result, "unknown")
    })

    it("returns unknown when no keywords match", () => {
      const result = classifyLineageScope(
        "unresolved",
        "hello world foo bar baz"
      )
      assert.equal(result, "unknown")
    })
  })

  describe("fallback behavior", () => {
    it("returns unknown for unresolved agent without session text", () => {
      assert.equal(classifyLineageScope("unresolved"), "unknown")
    })

    it("returns unknown for empty agent name", () => {
      assert.equal(classifyLineageScope(""), "unknown")
    })

    it("returns unknown for unknown agent names", () => {
      assert.equal(classifyLineageScope("some-random-agent"), "unknown")
    })

    it("agent name takes priority over session text keywords", () => {
      // Even if session text says "project build deploy", agent name wins
      const result = classifyLineageScope("hivefiver", "project build deploy ship")
      assert.equal(result, "meta-framework")
    })
  })
})
