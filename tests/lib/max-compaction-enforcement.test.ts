import { describe, it } from "node:test"
import assert from "node:assert/strict"

import {
  MAX_COMPACTION_COUNT,
  shouldCreateNewSession,
} from "../../src/lib/session-boundary.js"
import { generateNextCompactionReport } from "../../src/lib/compaction-engine.js"
import { createTree } from "../../src/lib/hierarchy-tree.js"
import {
  BRAIN_STATE_FIELD_CLASSIFICATION,
  createBrainState,
} from "../../src/schemas/brain-state.js"
import { createConfig } from "../../src/schemas/config.js"

describe("max compaction enforcement", () => {
  it("exports MAX_COMPACTION_COUNT = 3", () => {
    assert.equal(MAX_COMPACTION_COUNT, 3)
  })

  it("recommends new session when compaction is exhausted", () => {
    const recommendation = shouldCreateNewSession({
      turnCount: 10,
      userTurnCount: 10,
      contextPercent: 30,
      hierarchyComplete: false,
      isMainSession: true,
      compactionExhausted: true,
      hasDelegations: false,
      compactionCount: 3,
    })

    assert.equal(recommendation.recommended, true)
    assert.equal(
      recommendation.reason,
      "Compaction limit reached (3/3). Context quality degrading. New session recommended."
    )
  })

  it("compaction exhaustion overrides defensive guards", () => {
    const recommendation = shouldCreateNewSession({
      turnCount: 10,
      userTurnCount: 1,
      contextPercent: 95,
      hierarchyComplete: false,
      isMainSession: true,
      compactionExhausted: true,
      hasDelegations: true,
      compactionCount: 3,
    })

    assert.equal(recommendation.recommended, true)
  })

  it("compaction exhaustion does not apply to sub-sessions", () => {
    const recommendation = shouldCreateNewSession({
      turnCount: 10,
      userTurnCount: 10,
      contextPercent: 20,
      hierarchyComplete: true,
      isMainSession: false,
      compactionExhausted: true,
      hasDelegations: false,
      compactionCount: 3,
    })

    assert.equal(recommendation.recommended, false)
  })

  it("adds compaction warning to report when next count reaches max", () => {
    const state = createBrainState("7c0f4cc6-2f0f-455f-a0ce-5f69c95de189", createConfig(), "plan_driven")
    state.compaction_count = MAX_COMPACTION_COUNT - 1

    const report = generateNextCompactionReport(createTree(), [], state)
    const warning = report.resumeInstructions.find((line) =>
      line.includes("⚠️ COMPACTION LIMIT")
    )

    assert.ok(warning)
    assert.ok(report.text.includes("⚠️ COMPACTION LIMIT"))
  })

  it("BrainState includes compaction_limit_reached", () => {
    const state = createBrainState("4af8b9ce-1db9-4f7c-aafb-e6945ec4dc05", createConfig(), "plan_driven")
    assert.ok("compaction_limit_reached" in state)
  })

  it("createBrainState initializes compaction_limit_reached to false", () => {
    const state = createBrainState("fd3ec677-b00f-4cc7-b5dd-92413a301fa2", createConfig(), "plan_driven")
    assert.equal(state.compaction_limit_reached, false)
  })

  it("classifies compaction_limit_reached as runtime", () => {
    assert.equal(BRAIN_STATE_FIELD_CLASSIFICATION.compaction_limit_reached, "runtime")
  })
})
