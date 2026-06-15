import { describe, it, expect } from "vitest"

describe("workflow-state", () => {
  describe("createWorkflowState", () => {
    it("should create state at turn 0 with all turns pending", async () => {
      const { createWorkflowState, TOTAL_TURNS } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "test-agent" }],
        scope: "project",
        mode: "create",
      })
      expect(state.currentTurn).toBe(0)
      expect(state.type).toBe("agent-config")
      expect(state.scope).toBe("project")
      expect(state.mode).toBe("create")
      for (let i = 0; i < TOTAL_TURNS; i++) {
        expect(state.turns[i].status).toBe("pending")
        expect(state.turns[i].output).toBeNull()
      }
    })

    it("should set startedAt and updatedAt to current timestamp", async () => {
      const { createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const before = Date.now()
      const state = createWorkflowState({
        type: "skill-config",
        targetPrimitives: [],
        scope: "global",
        mode: "modify",
      })
      const after = Date.now()
      expect(state.startedAt).toBeGreaterThanOrEqual(before)
      expect(state.startedAt).toBeLessThanOrEqual(after)
      expect(state.updatedAt).toBe(state.startedAt)
    })

    it("should store target primitives, scope, and mode", async () => {
      const { createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const targets = [
        { type: "agent" as const, name: "researcher" },
        { type: "command" as const, name: "start-work" },
      ]
      const state = createWorkflowState({
        type: "batch-config",
        targetPrimitives: targets,
        scope: "project",
        mode: "batch-modify",
      })
      expect(state.targetPrimitives).toHaveLength(2)
      expect(state.targetPrimitives[0].name).toBe("researcher")
      expect(state.targetPrimitives[1].type).toBe("command")
    })
  })

  describe("canAdvanceTurn", () => {
    it("should allow advancing from turn 0 to turn 1", async () => {
      const { canAdvanceTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      expect(canAdvanceTurn(state, 1)).toBe(true)
    })

    it("should allow advancing from turn 6 to turn 7", async () => {
      const { canAdvanceTurn, createWorkflowState, advanceTurn, completeCurrentTurn } = await import("../../../src/config/workflow/workflow-state.js")
      let state = createWorkflowState({
        type: "agent-config", targetPrimitives: [{ type: "agent", name: "a" }], scope: "project", mode: "create",
      })
      // Walk through turns 0→1→2→3→4→5→6
      for (let i = 0; i < 7; i++) {
        state = advanceTurn(state, state.currentTurn + 1)
        state = completeCurrentTurn(state, { step: i })
      }
      expect(state.currentTurn).toBe(7)
      expect(canAdvanceTurn(state, 7)).toBe(true) // re-do current turn (skip-back)
    })

    it("should allow skip-back from turn 5 to turn 3", async () => {
      const { canAdvanceTurn, createWorkflowState, advanceTurn, completeCurrentTurn } = await import("../../../src/config/workflow/workflow-state.js")
      let state = createWorkflowState({
        type: "agent-config", targetPrimitives: [{ type: "agent", name: "a" }], scope: "project", mode: "create",
      })
      for (let i = 0; i < 5; i++) {
        state = advanceTurn(state, state.currentTurn + 1)
        state = completeCurrentTurn(state, { step: i })
      }
      expect(state.currentTurn).toBe(5)
      expect(canAdvanceTurn(state, 3)).toBe(true)
    })

    it("should reject skip-forward from turn 0 to turn 3", async () => {
      const { canAdvanceTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      expect(canAdvanceTurn(state, 3)).toBe(false)
    })

    it("should reject negative turn numbers", async () => {
      const { canAdvanceTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      expect(canAdvanceTurn(state, -1)).toBe(false)
    })

    it("should reject turn numbers > 7", async () => {
      const { canAdvanceTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      expect(canAdvanceTurn(state, 8)).toBe(false)
      expect(canAdvanceTurn(state, 100)).toBe(false)
    })
  })

  describe("advanceTurn", () => {
    it("should return new state with updated currentTurn", async () => {
      const { advanceTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const next = advanceTurn(state, 1)
      expect(next.currentTurn).toBe(1)
      expect(next.updatedAt).toBeGreaterThanOrEqual(state.updatedAt)
    })

    it("should not mutate the original state", async () => {
      const { advanceTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const originalTurn = state.currentTurn
      advanceTurn(state, 1)
      expect(state.currentTurn).toBe(originalTurn)
    })

    it("should throw [Hivemind] error on invalid transition", async () => {
      const { advanceTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      expect(() => advanceTurn(state, 3)).toThrow(/\[Hivemind\]/)
      expect(() => advanceTurn(state, 3)).toThrow(/cannot advance from turn 0 to turn 3/)
    })
  })

  describe("completeCurrentTurn", () => {
    it("should mark current turn as complete with output", async () => {
      const { completeCurrentTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const output = { discovered: ["agent-a", "agent-b"] }
      const completed = completeCurrentTurn(state, output)
      expect(completed.turns[0].status).toBe("complete")
      expect(completed.turns[0].output).toEqual(output)
    })

    it("should not mutate the original state", async () => {
      const { completeCurrentTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      completeCurrentTurn(state, { data: true })
      expect(state.turns[0].status).toBe("pending")
    })

    it("should refresh updatedAt timestamp", async () => {
      const { completeCurrentTurn, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const completed = completeCurrentTurn(state, {})
      expect(completed.updatedAt).toBeGreaterThanOrEqual(state.updatedAt)
    })
  })

  describe("isWorkflowComplete", () => {
    it("should return false when currentTurn < 7", async () => {
      const { isWorkflowComplete, createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      expect(isWorkflowComplete(state)).toBe(false)
    })

    it("should return true when turn 7 is complete", async () => {
      const { isWorkflowComplete, createWorkflowState, advanceTurn, completeCurrentTurn } = await import("../../../src/config/workflow/workflow-state.js")
      let state = createWorkflowState({
        type: "agent-config", targetPrimitives: [{ type: "agent", name: "a" }], scope: "project", mode: "create",
      })
      for (let i = 0; i < 8; i++) {
        if (i > 0) state = advanceTurn(state, i)
        state = completeCurrentTurn(state, { step: i })
      }
      expect(isWorkflowComplete(state)).toBe(true)
    })
  })

  describe("cloneWorkflowState", () => {
    it("should produce a deep copy (mutation safe)", async () => {
      const { cloneWorkflowState, createWorkflowState, completeCurrentTurn } = await import("../../../src/config/workflow/workflow-state.js")
      const state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "original" }],
        scope: "project",
        mode: "create",
      })
      const withOutput = completeCurrentTurn(state, { key: "value" })
      const clone = cloneWorkflowState(withOutput)

      // Mutate clone — original should be unaffected
      clone.targetPrimitives[0].name = "mutated"
      clone.turns[0].output!["key"] = "mutated"

      expect(withOutput.targetPrimitives[0].name).toBe("original")
      expect(withOutput.turns[0].output!["key"]).toBe("value")
    })
  })

  describe("getTurnName", () => {
    it("should return correct turn names for indices 0-7", async () => {
      const { getTurnName } = await import("../../../src/config/workflow/workflow-state.js")
      expect(getTurnName(0)).toBe("discovery")
      expect(getTurnName(1)).toBe("investigate")
      expect(getTurnName(2)).toBe("collect")
      expect(getTurnName(3)).toBe("proposal")
      expect(getTurnName(4)).toBe("validate")
      expect(getTurnName(5)).toBe("compile")
      expect(getTurnName(6)).toBe("test")
      expect(getTurnName(7)).toBe("save")
    })

    it("should throw for out-of-range indices", async () => {
      const { getTurnName } = await import("../../../src/config/workflow/workflow-state.js")
      expect(() => getTurnName(-1)).toThrow(/\[Hivemind\]/)
      expect(() => getTurnName(8)).toThrow(/\[Hivemind\]/)
    })
  })
})
