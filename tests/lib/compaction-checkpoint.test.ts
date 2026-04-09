import { TaskStateManager } from "../../src/lib/state.js"
import type { DelegationMeta } from "../../src/lib/types.js"
import {
  captureCheckpoint,
  formatCheckpointContext,
  restoreCheckpoint,
} from "../../src/lib/compaction-checkpoint.js"
import type { CheckpointData } from "../../src/lib/compaction-checkpoint.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeValidMeta = (rootID: string): DelegationMeta => ({
  rootID,
  depth: 2,
  budgetUsed: 3,
  agent: "builder",
  category: "implementation",
  model: "claude-opus-4-5",
  queueKey: "default",
})

const SESSION_ID = "test-session-001"

// ---------------------------------------------------------------------------
// Compaction Checkpoint
// ---------------------------------------------------------------------------

describe("Compaction Checkpoint", () => {
  let mgr: TaskStateManager

  beforeEach(() => {
    mgr = new TaskStateManager()
  })

  // -------------------------------------------------------------------------
  // Capture
  // -------------------------------------------------------------------------

  describe("captureCheckpoint", () => {
    it("returns complete snapshot with all required fields", () => {
      const meta = makeValidMeta("root-001")
      mgr.setDelegationMeta(SESSION_ID, meta)
      const stats = mgr.ensureStats(SESSION_ID)
      stats.total = 7
      stats.byTool = { bash: 4, read: 3 }
      stats.warnings = ["warning-a"]

      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(cp).toHaveProperty("agent")
      expect(cp).toHaveProperty("model")
      expect(cp).toHaveProperty("tools")
      expect(cp).toHaveProperty("delegationMeta")
      expect(cp).toHaveProperty("warnings")
      expect(cp).toHaveProperty("sessionStats")
      expect(cp).toHaveProperty("capturedAt")
    })

    it("includes agent and model from delegation meta", () => {
      const meta = makeValidMeta("root-002")
      mgr.setDelegationMeta(SESSION_ID, meta)

      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(cp.agent).toBe("builder")
      expect(cp.model).toBe("claude-opus-4-5")
    })

    it("includes tools array (empty when meta has no tools field)", () => {
      const meta = makeValidMeta("root-003")
      mgr.setDelegationMeta(SESSION_ID, meta)

      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(Array.isArray(cp.tools)).toBe(true)
    })

    it("includes provided tools when capture options specify them", () => {
      const cp = captureCheckpoint(SESSION_ID, mgr, {
        tools: ["read", "write", "bash"],
      })

      expect(cp.tools).toEqual(["read", "write", "bash"])
    })

    it("includes warnings from session stats", () => {
      const stats = mgr.ensureStats(SESSION_ID)
      stats.warnings = ["loop detected", "budget warning"]

      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(cp.warnings).toEqual(["loop detected", "budget warning"])
    })

    it("includes session stats total and byTool", () => {
      const stats = mgr.ensureStats(SESSION_ID)
      stats.total = 12
      stats.byTool = { bash: 8, glob: 4 }

      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(cp.sessionStats.total).toBe(12)
      expect(cp.sessionStats.byTool).toEqual({ bash: 8, glob: 4 })
    })

    it("includes loop stats from session state", () => {
      const stats = mgr.ensureStats(SESSION_ID)
      stats.loop = { signature: "read:/tmp/demo", count: 4 }

      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(cp.sessionStats.loop).toEqual({
        signature: "read:/tmp/demo",
        count: 4,
      })
    })

    it("records timestamp at capturedAt", () => {
      const before = Date.now()
      const cp = captureCheckpoint(SESSION_ID, mgr)
      const after = Date.now()

      expect(cp.capturedAt).toBeGreaterThanOrEqual(before)
      expect(cp.capturedAt).toBeLessThanOrEqual(after)
    })

    it("handles missing delegation meta — returns null agent, model, and delegationMeta", () => {
      mgr.ensureStats(SESSION_ID)

      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(cp.agent).toBeNull()
      expect(cp.model).toBeNull()
      expect(cp.delegationMeta).toBeNull()
      expect(cp.tools).toEqual([])
    })

    it("handles missing session stats — returns empty defaults", () => {
      // No stats created — getStats will return undefined
      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(cp.warnings).toEqual([])
      expect(cp.sessionStats.total).toBe(0)
      expect(cp.sessionStats.byTool).toEqual({})
    })

    it("deep-clones warnings so mutation of source does not affect checkpoint", () => {
      const stats = mgr.ensureStats(SESSION_ID)
      stats.warnings = ["original"]

      const cp = captureCheckpoint(SESSION_ID, mgr)
      stats.warnings.push("mutated-after-capture")

      expect(cp.warnings).toEqual(["original"])
    })

    it("deep-clones byTool so mutation of source does not affect checkpoint", () => {
      const stats = mgr.ensureStats(SESSION_ID)
      stats.byTool = { bash: 2 }

      const cp = captureCheckpoint(SESSION_ID, mgr)
      stats.byTool["bash"] = 999

      expect(cp.sessionStats.byTool["bash"]).toBe(2)
    })

    it("deep-clones delegationMeta so mutation of source does not affect checkpoint", () => {
      const meta = makeValidMeta("root-clone")
      mgr.setDelegationMeta(SESSION_ID, meta)

      const cp = captureCheckpoint(SESSION_ID, mgr)
      const liveMeta = mgr.getDelegationMeta(SESSION_ID)
      if (liveMeta) {
        liveMeta.depth = 99
      }

      expect(cp.delegationMeta?.depth).toBe(2)
    })
  })

  // -------------------------------------------------------------------------
  // Restore
  // -------------------------------------------------------------------------

  describe("restoreCheckpoint", () => {
    it("rehydrates warnings into TaskStateManager", () => {
      const checkpoint: CheckpointData = {
        agent: "researcher",
        model: "claude-haiku-3",
        tools: [],
        delegationMeta: null,
        warnings: ["warn-1", "warn-2"],
        sessionStats: {
          total: 5,
          byTool: { bash: 5 },
          loop: { signature: "bash:{}", count: 2 },
        },
        capturedAt: Date.now(),
      }

      restoreCheckpoint(SESSION_ID, checkpoint, mgr)

      const stats = mgr.getStats(SESSION_ID)
      expect(stats?.warnings).toEqual(["warn-1", "warn-2"])
      expect(stats?.total).toBe(5)
      expect(stats?.byTool).toEqual({ bash: 5 })
      expect(stats?.loop).toEqual({ signature: "bash:{}", count: 2 })
    })

    it("rehydrates delegation meta into TaskStateManager", () => {
      const meta = makeValidMeta("root-restore")
      const checkpoint: CheckpointData = {
        agent: meta.agent,
        model: meta.model ?? null,
        tools: [],
        delegationMeta: meta,
        warnings: [],
        sessionStats: { total: 0, byTool: {}, loop: { signature: "", count: 0 } },
        capturedAt: Date.now(),
      }

      restoreCheckpoint(SESSION_ID, checkpoint, mgr)

      const restored = mgr.getDelegationMeta(SESSION_ID)
      expect(restored).toEqual(meta)
    })

    it("does not set delegation meta when checkpoint has null delegationMeta", () => {
      const checkpoint: CheckpointData = {
        agent: null,
        model: null,
        tools: [],
        delegationMeta: null,
        warnings: [],
        sessionStats: { total: 0, byTool: {}, loop: { signature: "", count: 0 } },
        capturedAt: Date.now(),
      }

      restoreCheckpoint(SESSION_ID, checkpoint, mgr)

      expect(mgr.getDelegationMeta(SESSION_ID)).toBeUndefined()
    })

    it("is idempotent — calling restore twice does not duplicate warnings", () => {
      const checkpoint: CheckpointData = {
        agent: null,
        model: null,
        tools: [],
        delegationMeta: null,
        warnings: ["warn-once"],
        sessionStats: { total: 0, byTool: {}, loop: { signature: "", count: 0 } },
        capturedAt: Date.now(),
      }

      restoreCheckpoint(SESSION_ID, checkpoint, mgr)
      restoreCheckpoint(SESSION_ID, checkpoint, mgr)

      const stats = mgr.getStats(SESSION_ID)
      expect(stats?.warnings).toEqual(["warn-once"])
    })

    it("deep-clones warnings into state so external mutation does not corrupt manager", () => {
      const warnings = ["warn-a"]
      const checkpoint: CheckpointData = {
        agent: null,
        model: null,
        tools: [],
        delegationMeta: null,
        warnings,
        sessionStats: { total: 0, byTool: {}, loop: { signature: "", count: 0 } },
        capturedAt: Date.now(),
      }

      restoreCheckpoint(SESSION_ID, checkpoint, mgr)
      warnings.push("injected-after-restore")

      const stats = mgr.getStats(SESSION_ID)
      expect(stats?.warnings).toEqual(["warn-a"])
    })
  })

  // -------------------------------------------------------------------------
  // Format
  // -------------------------------------------------------------------------

  describe("formatCheckpointContext", () => {
    it("produces a valid Markdown string", () => {
      const cp = captureCheckpoint(SESSION_ID, mgr)
      const output = formatCheckpointContext(cp)

      expect(typeof output).toBe("string")
      expect(output.length).toBeGreaterThan(0)
    })

    it("includes agent and model info", () => {
      const meta = makeValidMeta("root-fmt")
      mgr.setDelegationMeta(SESSION_ID, meta)

      const cp = captureCheckpoint(SESSION_ID, mgr)
      const output = formatCheckpointContext(cp)

      expect(output).toContain("builder")
      expect(output).toContain("claude-opus-4-5")
    })

    it("includes delegation and repeated signature context when present", () => {
      const meta = makeValidMeta("root-loop")
      mgr.setDelegationMeta(SESSION_ID, meta)
      const stats = mgr.ensureStats(SESSION_ID)
      stats.loop = { signature: "read:/repo/file.ts", count: 3 }

      const cp = captureCheckpoint(SESSION_ID, mgr, { tools: ["read"] })
      const output = formatCheckpointContext(cp)

      expect(output).toContain("**Root session**: root-loop")
      expect(output).toContain("**Delegation depth**: 2")
      expect(output).toContain("**Repeated signature count**: 3")
      expect(output).toContain("read:/repo/file.ts")
    })

    it("includes warning list when warnings are present", () => {
      const stats = mgr.ensureStats(SESSION_ID)
      stats.warnings = ["loop detected", "budget exceeded"]

      const cp = captureCheckpoint(SESSION_ID, mgr)
      const output = formatCheckpointContext(cp)

      expect(output).toContain("loop detected")
      expect(output).toContain("budget exceeded")
    })

    it("handles empty checkpoint gracefully — no throw, no crash", () => {
      const cp = captureCheckpoint(SESSION_ID, mgr)

      expect(() => formatCheckpointContext(cp)).not.toThrow()
    })

    it("shows 'unknown' for null agent and model", () => {
      const cp: CheckpointData = {
        agent: null,
        model: null,
        tools: [],
        delegationMeta: null,
        warnings: [],
        sessionStats: { total: 0, byTool: {}, loop: { signature: "", count: 0 } },
        capturedAt: Date.now(),
      }

      const output = formatCheckpointContext(cp)

      expect(output).toContain("unknown")
    })

    it("includes ## Compaction Checkpoint heading", () => {
      const cp = captureCheckpoint(SESSION_ID, mgr)
      const output = formatCheckpointContext(cp)

      expect(output).toContain("## Compaction Checkpoint")
    })
  })

  // -------------------------------------------------------------------------
  // Roundtrip
  // -------------------------------------------------------------------------

  describe("roundtrip", () => {
    it("checkpoint survives JSON serialize/deserialize", () => {
      const meta = makeValidMeta("root-rt")
      mgr.setDelegationMeta(SESSION_ID, meta)
      const stats = mgr.ensureStats(SESSION_ID)
      stats.total = 3
      stats.byTool = { read: 3 }
      stats.warnings = ["rt-warn"]

      const cp = captureCheckpoint(SESSION_ID, mgr)
      const serialized = JSON.stringify(cp)
      const deserialized = JSON.parse(serialized) as CheckpointData

      expect(deserialized.agent).toBe(cp.agent)
      expect(deserialized.model).toBe(cp.model)
      expect(deserialized.warnings).toEqual(cp.warnings)
      expect(deserialized.sessionStats).toEqual(cp.sessionStats)
      expect(deserialized.capturedAt).toBe(cp.capturedAt)
    })

    it("capture → serialize → deserialize → restore produces consistent state", () => {
      const meta = makeValidMeta("root-e2e")
      mgr.setDelegationMeta(SESSION_ID, meta)
      const stats = mgr.ensureStats(SESSION_ID)
      stats.warnings = ["e2e-warning"]
      stats.total = 9
      stats.byTool = { bash: 9 }
      stats.loop = { signature: "bash:{}", count: 4 }

      // Capture
      const cp = captureCheckpoint(SESSION_ID, mgr)

      // Serialize / deserialize
      const restored = JSON.parse(JSON.stringify(cp)) as CheckpointData

      // Apply to a fresh manager
      const freshMgr = new TaskStateManager()
      restoreCheckpoint(SESSION_ID, restored, freshMgr)

      // Verify consistent state
      const restoredStats = freshMgr.getStats(SESSION_ID)
      const restoredMeta = freshMgr.getDelegationMeta(SESSION_ID)

      expect(restoredStats?.warnings).toEqual(["e2e-warning"])
      expect(restoredStats?.total).toBe(9)
      expect(restoredStats?.byTool).toEqual({ bash: 9 })
      expect(restoredStats?.loop).toEqual({ signature: "bash:{}", count: 4 })
      expect(restoredMeta?.agent).toBe("builder")
      expect(restoredMeta?.rootID).toBe("root-e2e")
      expect(restoredMeta?.depth).toBe(2)
      expect(restoredMeta?.budgetUsed).toBe(3)
      expect(restoredMeta?.queueKey).toBe("default")
    })
  })
})
