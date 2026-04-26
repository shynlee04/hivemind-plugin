/**
 * End-to-end workflow simulation test.
 * Simulates a COMPLETE configuration workflow from start to finish,
 * exercising the full 8-turn state machine.
 *
 * @module tests/config-workflow/workflow-e2e
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { rmSync } from "node:fs"
import { join } from "node:path"

/** Temp dir for test isolation. */
const TEST_STATE_DIR = join(process.cwd(), ".tmp", "workflow-e2e-" + process.pid)

describe("workflow E2E: full 8-turn configuration journey", () => {
  beforeEach(() => {
    process.env.OPENCODE_HARNESS_STATE_DIR = join(TEST_STATE_DIR, "state")
  })

  afterEach(() => {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
    rmSync(TEST_STATE_DIR, { recursive: true, force: true })
  })

  it("should complete the full workflow from discovery to save", async () => {
    const {
      createWorkflowState, advanceTurn, completeCurrentTurn,
      isWorkflowComplete, canAdvanceTurn, getTurnName,
    } = await import("../../../src/lib/config-workflow/workflow-state.js")
    const { persistWorkflow, readWorkflow } = await import(
      "../../../src/lib/config-workflow/workflow-persistence.js"
    )
    const { validateTurnPrecondition } = await import(
      "../../../src/lib/config-workflow/workflow-guards.js"
    )

    // 1. Create workflow for batch-config of 3 primitives
    const targets = [
      { type: "agent" as const, name: "researcher" },
      { type: "command" as const, name: "start-work" },
      { type: "skill" as const, name: "planning" },
    ]

    let state = createWorkflowState({
      type: "batch-config",
      targetPrimitives: targets,
      scope: "project",
      mode: "batch-modify",
    })

    expect(state.currentTurn).toBe(0)
    expect(getTurnName(0)).toBe("discovery")

    // Turn names for the journey
    const turnNames = [
      "discovery", "investigate", "collect", "proposal",
      "validate", "compile", "test", "save",
    ]

    // Output data for each turn (simulating real workflow output)
    const turnOutputs: Record<number, Record<string, unknown>> = {
      0: { discoveredFiles: ["agents/researcher.md", "commands/start-work.md", "skills/planning/SKILL.md"] },
      1: { schemaValidation: { researcher: "valid", "start-work": "valid", planning: "valid" } },
      2: { collectedFields: { temperature: 0.7, tools: ["read", "write"], permissions: ["allow"] } },
      3: { proposal: { changes: 3, additions: 0, removals: 0 }, content: "Compiled spec proposal" },
      4: { validationPass: true, conflicts: [], warnings: [] },
      5: { writtenFiles: [".opencode/agents/researcher.md", ".opencode/commands/start-work.md"] },
      6: { testResults: { passed: 5, failed: 0, skipped: 0 } },
      7: { saved: true, persistedAt: Date.now() },
    }

    // 2-9. Walk through all 8 turns
    for (let turn = 0; turn < 8; turn++) {
      // Verify state machine enforces order
      expect(state.currentTurn).toBe(turn)
      expect(getTurnName(turn)).toBe(turnNames[turn])

      // Verify precondition guard passes
      const guard = validateTurnPrecondition(state, turn)
      expect(guard.valid).toBe(true)

      // Complete the current turn with output
      state = completeCurrentTurn(state, turnOutputs[turn])
      expect(state.turns[turn].status).toBe("complete")
      expect(state.turns[turn].output).toEqual(turnOutputs[turn])

      // Persist and verify durability
      persistWorkflow(state)
      const restored = readWorkflow(state.id)
      expect(restored).toBeDefined()
      expect(restored!.turns[turn].status).toBe("complete")

      // Advance to next turn (if not the last)
      if (turn < 7) {
        state = advanceTurn(state, turn + 1)
        expect(state.currentTurn).toBe(turn + 1)

        // Persist the advanced state
        persistWorkflow(state)
      }
    }

    // 10. Verify skipping is rejected midway
    // Reset to a mid-workflow state to test skip rejection
    let midState = createWorkflowState({
      type: "agent-config",
      targetPrimitives: [{ type: "agent", name: "skip-test" }],
      scope: "project",
      mode: "create",
    })
    midState = completeCurrentTurn(midState, { step: 0 })
    midState = advanceTurn(midState, 1)
    midState = completeCurrentTurn(midState, { step: 1 })
    midState = advanceTurn(midState, 2)

    // At turn 2, trying to jump to turn 5 should be rejected
    expect(canAdvanceTurn(midState, 5)).toBe(false)

    // Trying to skip from turn 2 to turn 4 should also be rejected
    expect(canAdvanceTurn(midState, 4)).toBe(false)

    // 11. Verify final state
    expect(isWorkflowComplete(state)).toBe(true)

    // Verify all 8 turns are complete
    let completedCount = 0
    for (let i = 0; i < 8; i++) {
      if (state.turns[i].status === "complete") {
        completedCount++
      }
    }
    expect(completedCount).toBe(8)
  })

  it("should reject out-of-order transitions at every boundary", async () => {
    const { createWorkflowState, canAdvanceTurn } = await import(
      "../../../src/lib/config-workflow/workflow-state.js"
    )

    const state = createWorkflowState({
      type: "agent-config",
      targetPrimitives: [{ type: "agent", name: "boundary-test" }],
      scope: "project",
      mode: "create",
    })

    // From turn 0: can go to 0 (re-do) and 1 (forward)
    expect(canAdvanceTurn(state, 0)).toBe(true)
    expect(canAdvanceTurn(state, 1)).toBe(true)
    expect(canAdvanceTurn(state, 2)).toBe(false)
    expect(canAdvanceTurn(state, 3)).toBe(false)
    expect(canAdvanceTurn(state, 7)).toBe(false)
    expect(canAdvanceTurn(state, -1)).toBe(false)
    expect(canAdvanceTurn(state, 8)).toBe(false)
    expect(canAdvanceTurn(state, 100)).toBe(false)
  })

  it("should support skip-back to re-do a previous turn", async () => {
    const { createWorkflowState, advanceTurn, completeCurrentTurn } = await import(
      "../../../src/lib/config-workflow/workflow-state.js"
    )

    let state = createWorkflowState({
      type: "agent-config",
      targetPrimitives: [{ type: "agent", name: "redo-test" }],
      scope: "project",
      mode: "create",
    })

    // Walk to turn 4
    for (let i = 0; i < 4; i++) {
      state = completeCurrentTurn(state, { step: i })
      if (i < 4) state = advanceTurn(state, i + 1)
    }
    expect(state.currentTurn).toBe(4)

    // Skip back to turn 2 (re-do)
    state = advanceTurn(state, 2)
    expect(state.currentTurn).toBe(2)

    // Re-do with new output
    state = completeCurrentTurn(state, { step: 2, redo: true })
    expect(state.turns[2].output).toEqual({ step: 2, redo: true })

    // Walk forward again
    state = advanceTurn(state, 3)
    expect(state.currentTurn).toBe(3)
  })
})
