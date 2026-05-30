import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { rmSync, existsSync } from "node:fs"
import { join } from "node:path"

/** Temp dir for test isolation — scoped by PID to avoid collisions. */
const TEST_STATE_DIR = join(process.cwd(), ".tmp", "workflow-test-" + process.pid)

describe("workflow-persistence", () => {
  beforeEach(() => {
    process.env.OPENCODE_HARNESS_STATE_DIR = join(TEST_STATE_DIR, "state")
  })

  afterEach(() => {
    delete process.env.OPENCODE_HARNESS_STATE_DIR
    rmSync(TEST_STATE_DIR, { recursive: true, force: true })
  })

  describe("persistWorkflow + readWorkflow", () => {
    it("should persist and read back a workflow state", async () => {
      const { createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const { persistWorkflow, readWorkflow } = await import("../../../src/config/workflow/workflow-persistence.js")

      const state = createWorkflowState({
        type: "agent-config",
        targetPrimitives: [{ type: "agent", name: "researcher" }],
        scope: "project",
        mode: "create",
      })
      persistWorkflow(state)

      const loaded = readWorkflow(state.id)
      expect(loaded).toBeDefined()
      expect(loaded!.id).toBe(state.id)
      expect(loaded!.currentTurn).toBe(0)
      expect(loaded!.type).toBe("agent-config")
    })

    it("should survive a simulated context reset (write, clear cache, read)", async () => {
      const { createWorkflowState, advanceTurn, completeCurrentTurn } = await import("../../../src/config/workflow/workflow-state.js")
      const { persistWorkflow, readWorkflow } = await import("../../../src/config/workflow/workflow-persistence.js")

      let state = createWorkflowState({
        type: "command-config",
        targetPrimitives: [{ type: "command", name: "deploy" }],
        scope: "global",
        mode: "modify",
      })
      state = completeCurrentTurn(state, { found: true })
      state = advanceTurn(state, 1)
      state = completeCurrentTurn(state, { investigated: true })
      persistWorkflow(state)

      // Simulate context reset — read fresh from disk
      const restored = readWorkflow(state.id)
      expect(restored).toBeDefined()
      expect(restored!.currentTurn).toBe(1)
      expect(restored!.turns[0].status).toBe("complete")
      expect(restored!.turns[0].output).toEqual({ found: true })
      expect(restored!.turns[1].status).toBe("complete")
    })

    it("should return undefined for non-existent workflow ID", async () => {
      const { readWorkflow } = await import("../../../src/config/workflow/workflow-persistence.js")
      const result = readWorkflow("wf-nonexistent-12345")
      expect(result).toBeUndefined()
    })

    it("should handle Unicode in target primitive names round-trip", async () => {
      const { createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const { persistWorkflow, readWorkflow } = await import("../../../src/config/workflow/workflow-persistence.js")

      const unicodeName = "ägent-日本語-🤖"
      const state = createWorkflowState({
        type: "skill-config",
        targetPrimitives: [{ type: "skill", name: unicodeName }],
        scope: "project",
        mode: "create",
      })
      persistWorkflow(state)

      const loaded = readWorkflow(state.id)
      expect(loaded).toBeDefined()
      expect(loaded!.targetPrimitives[0].name).toBe(unicodeName)
    })
  })

  describe("deleteWorkflow", () => {
    it("should remove a workflow from persisted store", async () => {
      const { createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const { persistWorkflow, readWorkflow, deleteWorkflow } = await import("../../../src/config/workflow/workflow-persistence.js")

      const state = createWorkflowState({
        type: "agent-config", targetPrimitives: [], scope: "project", mode: "create",
      })
      persistWorkflow(state)
      expect(readWorkflow(state.id)).toBeDefined()

      deleteWorkflow(state.id)
      expect(readWorkflow(state.id)).toBeUndefined()
    })

    it("should be a no-op for non-existent workflow ID", async () => {
      const { deleteWorkflow } = await import("../../../src/config/workflow/workflow-persistence.js")
      expect(() => deleteWorkflow("wf-no-such-id")).not.toThrow()
    })
  })

  describe("concurrent access protection", () => {
    it("should handle two rapid sequential writes without corruption", async () => {
      const { createWorkflowState } = await import("../../../src/config/workflow/workflow-state.js")
      const { persistWorkflow, readWorkflow } = await import("../../../src/config/workflow/workflow-persistence.js")

      const state1 = createWorkflowState({
        type: "agent-config", targetPrimitives: [{ type: "agent", name: "a" }], scope: "project", mode: "create",
      })
      const state2 = createWorkflowState({
        type: "skill-config", targetPrimitives: [{ type: "skill", name: "b" }], scope: "global", mode: "create",
      })

      persistWorkflow(state1)
      persistWorkflow(state2)

      // Both should be readable
      const loaded1 = readWorkflow(state1.id)
      const loaded2 = readWorkflow(state2.id)
      expect(loaded1).toBeDefined()
      expect(loaded2).toBeDefined()
      expect(loaded1!.type).toBe("agent-config")
      expect(loaded2!.type).toBe("skill-config")
    })
  })

  describe("getWorkflowStorePath", () => {
    it("should return a path ending with config-workflows.json", async () => {
      const { getWorkflowStorePath } = await import("../../../src/config/workflow/workflow-persistence.js")
      const path = getWorkflowStorePath()
      expect(path).toMatch(/config-workflows\.json$/)
    })
  })
})
