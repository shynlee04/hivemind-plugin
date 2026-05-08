/**
 * Regression tests for config workflow state machine.
 * Tests real failure scenarios and edge cases beyond the happy path.
 *
 * @module tests/config-workflow/workflow-regression
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { rmSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { join } from "node:path"

/** Temp dir for test isolation — scoped by PID to avoid collisions. */
const TEST_STATE_DIR = join(process.cwd(), ".tmp", "workflow-reg-" + process.pid)

describe("workflow regression tests", () => {
  beforeEach(() => {
    process.env.OPENCODE_HARNESS_STATE_DIR = join(TEST_STATE_DIR, "state")
  })

  afterEach(() => {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
    rmSync(TEST_STATE_DIR, { recursive: true, force: true })
  })

  // -----------------------------------------------------------------------
  // Regression: Workflow state not mutated by concurrent reads
  // -----------------------------------------------------------------------

  describe("concurrent reads do not mutate state", () => {
    it("should return identical values from 10 rapid reads", async () => {
      const { createWorkflowState, completeCurrentTurn, advanceTurn } = await import(
        "../../../src/config/workflow/workflow-state.js"
      )
      const { persistWorkflow, readWorkflow } = await import(
        "../../../src/config/workflow/workflow-persistence.js"
      )

      let state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "concurrent-test" }],
        scope: "project",
        mode: "create",
      })
      state = completeCurrentTurn(state, { discovered: ["a", "b"] })
      state = advanceTurn(state, 1)
      persistWorkflow(state)

      const reads = []
      for (let i = 0; i < 10; i++) {
        reads.push(readWorkflow(state.id))
      }

      // All reads should produce the same values
      for (let i = 1; i < reads.length; i++) {
        expect(reads[i]!.currentTurn).toBe(reads[0]!.currentTurn)
        expect(reads[i]!.turns[0].output).toEqual(reads[0]!.turns[0].output)
      }
    })
  })

  // -----------------------------------------------------------------------
  // Regression: Corrupted JSON file handled gracefully
  // -----------------------------------------------------------------------

  describe("corrupted JSON file handling", () => {
    it("should return undefined (not crash) when JSON file contains garbage", async () => {
      const { getWorkflowStorePath } = await import(
        "../../../src/config/workflow/workflow-persistence.js"
      )
      const { readWorkflow } = await import(
        "../../../src/config/workflow/workflow-persistence.js"
      )

      const filePath = getWorkflowStorePath()
      mkdirSync(join(filePath, ".."), { recursive: true })
      writeFileSync(filePath, "NOT VALID JSON {{{}}}}", "utf-8")

      // Should not throw — return undefined gracefully
      const result = readWorkflow("any-id")
      expect(result).toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // Regression: Missing state directory auto-created
  // -----------------------------------------------------------------------

  describe("auto-creation of state directory", () => {
    it("should recreate state directory when persistWorkflow is called", async () => {
      const { createWorkflowState } = await import(
        "../../../src/config/workflow/workflow-state.js"
      )
      const { persistWorkflow, readWorkflow, getWorkflowStorePath } = await import(
        "../../../src/config/workflow/workflow-persistence.js"
      )

      // Delete the state directory entirely
      const stateDir = join(getWorkflowStorePath(), "..")
      if (existsSync(stateDir)) {
        rmSync(stateDir, { recursive: true, force: true })
      }

      const state = createWorkflowState({
        type: "skill-config",
        targetPrimitives: [{ type: "skill", name: "auto-create-test" }],
        scope: "project",
        mode: "create",
      })

      // Should NOT throw — auto-creates directory
      expect(() => persistWorkflow(state)).not.toThrow()

      // Verify persistence worked
      const loaded = readWorkflow(state.id)
      expect(loaded).toBeDefined()
      expect(loaded!.id).toBe(state.id)
    })
  })

  // -----------------------------------------------------------------------
  // Regression: Empty workflow ID
  // -----------------------------------------------------------------------

  describe("empty workflow ID handling", () => {
    it("should readWorkflow returns undefined for empty string ID", async () => {
      const { readWorkflow } = await import(
        "../../../src/config/workflow/workflow-persistence.js"
      )

      const result = readWorkflow("")
      expect(result).toBeUndefined()
    })

    it("should deleteWorkflow be a no-op for empty string ID", async () => {
      const { deleteWorkflow } = await import(
        "../../../src/config/workflow/workflow-persistence.js"
      )

      expect(() => deleteWorkflow("")).not.toThrow()
    })
  })

  // -----------------------------------------------------------------------
  // Regression: advanceTurn to same turn (idempotent)
  // -----------------------------------------------------------------------

  describe("advanceTurn to same turn (idempotent re-do)", () => {
    it("should allow advancing from turn 3 to turn 3 (no-op re-do)", async () => {
      const { createWorkflowState, advanceTurn, completeCurrentTurn } = await import(
        "../../../src/config/workflow/workflow-state.js"
      )

      let state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "idempotent" }],
        scope: "project",
        mode: "create",
      })

      // Walk to turn 3
      for (let i = 0; i < 3; i++) {
        if (i > 0) state = advanceTurn(state, i)
        state = completeCurrentTurn(state, { step: i })
      }
      state = advanceTurn(state, 3)
      expect(state.currentTurn).toBe(3)

      // Re-do turn 3 → should be allowed (skip-back to same turn)
      const redoState = advanceTurn(state, 3)
      expect(redoState.currentTurn).toBe(3)
      expect(redoState.updatedAt).toBeGreaterThanOrEqual(state.updatedAt)
    })
  })

  // -----------------------------------------------------------------------
  // Regression: Complete already-complete turn
  // -----------------------------------------------------------------------

  describe("complete already-complete turn", () => {
    it("should overwrite the previous completion with new output", async () => {
      const { createWorkflowState, completeCurrentTurn } = await import(
        "../../../src/config/workflow/workflow-state.js"
      )

      const state = createWorkflowState({
        type: "command-config",
        targetPrimitives: [{ type: "command", name: "recomplete" }],
        scope: "project",
        mode: "create",
      })

      const first = completeCurrentTurn(state, { first: true })
      expect(first.turns[0].status).toBe("complete")
      expect(first.turns[0].output).toEqual({ first: true })

      // Complete again — should overwrite
      const second = completeCurrentTurn(first, { second: true })
      expect(second.turns[0].status).toBe("complete")
      expect(second.turns[0].output).toEqual({ second: true })
      expect(second.turns[0].completedAt).toBeGreaterThanOrEqual(first.turns[0].completedAt!)
    })
  })

  // -----------------------------------------------------------------------
  // Regression: Persist then delete then read
  // -----------------------------------------------------------------------

  describe("persist then delete then read", () => {
    it("should fully remove a workflow after deletion", async () => {
      const { createWorkflowState } = await import(
        "../../../src/config/workflow/workflow-state.js"
      )
      const { persistWorkflow, readWorkflow, deleteWorkflow, readPersistedWorkflows } = await import(
        "../../../src/config/workflow/workflow-persistence.js"
      )

      const state = createWorkflowState({
        type: "skill-config",
        targetPrimitives: [{ type: "skill", name: "delete-test" }],
        scope: "project",
        mode: "create",
      })

      persistWorkflow(state)
      expect(readWorkflow(state.id)).toBeDefined()

      deleteWorkflow(state.id)
      expect(readWorkflow(state.id)).toBeUndefined()

      // Also verify it's not in the full map
      const all = readPersistedWorkflows()
      expect(all.has(state.id)).toBe(false)
    })
  })
})
