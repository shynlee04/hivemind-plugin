import { describe, it, expect } from "vitest"

describe("workflow-guards", () => {
  describe("validateTurnPrecondition", () => {
    it("should pass for Turn 0 with no prerequisites", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { validateTurnPrecondition } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const result = validateTurnPrecondition(state, 0)
      expect(result.valid).toBe(true)
    })

    it("should fail Turn 1 when targetPrimitives is empty", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { validateTurnPrecondition } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const result = validateTurnPrecondition(state, 1)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0]).toContain("target primitive")
      }
    })

    it("should pass Turn 1 when targetPrimitives has at least one entry", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { validateTurnPrecondition } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "researcher" }],
        scope: "project",
        mode: "create",
      })
      const result = validateTurnPrecondition(state, 1)
      expect(result.valid).toBe(true)
    })

    it("should fail Turn 5 when Turn 4 output is missing", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { validateTurnPrecondition } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "researcher" }],
        scope: "project",
        mode: "create",
      })
      // Turn 4 (Validate) has no output — Turn 5 should fail
      const result = validateTurnPrecondition(state, 5)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors[0]).toContain("Turn 5")
        expect(result.errors[0]).toContain("Turn 4")
      }
    })

    it("should return descriptive error messages listing what is missing", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { validateTurnPrecondition } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const result = validateTurnPrecondition(state, 3)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors.length).toBeGreaterThan(0)
        // Each error should mention which turn is required
        expect(result.errors[0]).toMatch(/Turn \d/)
      }
    })

    it("should reject unknown turn indices", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { validateTurnPrecondition } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      const result = validateTurnPrecondition(state, 99)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.errors[0]).toContain("Unknown turn index")
      }
    })
  })

  describe("hasCollectedPrerequisites", () => {
    it("should return false when no target primitives", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { hasCollectedPrerequisites } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      expect(hasCollectedPrerequisites(state)).toBe(false)
    })

    it("should return true when at least one target primitive", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { hasCollectedPrerequisites } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "builder" }],
        scope: "project",
        mode: "create",
      })
      expect(hasCollectedPrerequisites(state)).toBe(true)
    })
  })

  describe("hasCompilePrerequisites", () => {
    it("should return false when Turn 2 has no output", async () => {
      const { createWorkflowState } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { hasCompilePrerequisites } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      const state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "builder" }],
        scope: "project",
        mode: "create",
      })
      expect(hasCompilePrerequisites(state)).toBe(false)
    })

    it("should return true when Turn 2 output contains spec data", async () => {
      const { createWorkflowState, completeCurrentTurn, advanceTurn } = await import("../../../src/lib/config-workflow/workflow-state.js")
      const { hasCompilePrerequisites } = await import("../../../src/lib/config-workflow/workflow-guards.js")
      let state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "builder" }],
        scope: "project",
        mode: "create",
      })
      // Complete Turn 0, advance to 1, complete, advance to 2, complete with spec
      state = completeCurrentTurn(state, { discovered: true })
      state = advanceTurn(state, 1)
      state = completeCurrentTurn(state, { investigated: true })
      state = advanceTurn(state, 2)
      state = completeCurrentTurn(state, { spec: { name: "builder", description: "test" } })
      expect(hasCompilePrerequisites(state)).toBe(true)
    })
  })
})
