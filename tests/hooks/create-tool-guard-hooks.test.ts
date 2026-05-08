import { describe, it, expect, vi, beforeEach } from "vitest"
import { createToolGuardHooks } from "../../src/hooks/guards/tool-guard-hooks.js"

/**
 * In-memory state manager that tracks tool calls.
 */
function createFakeStateManager() {
  const stats = new Map<string, {
    total: number
    byTool: Record<string, number>
    loop: { signature: string; count: number }
    warnings: string[]
    messages: Array<{ role: string; content: string }>
  }>()

  return {
    ensureStats(sessionID: string) {
      if (!stats.has(sessionID)) {
        stats.set(sessionID, {
          total: 0,
          byTool: {},
          loop: { signature: "", count: 0 },
          warnings: [],
          messages: [],
        })
      }
      return stats.get(sessionID)!
    },
    getStats(sessionID: string) {
      return stats.get(sessionID)
    },
    addWarning: vi.fn(),
    hasStats: vi.fn().mockReturnValue(false),
  }
}

describe("createToolGuardHooks", () => {
  let stateManager: ReturnType<typeof createFakeStateManager>

  beforeEach(() => {
    stateManager = createFakeStateManager()
  })

  describe("tool.execute.before", () => {
    it("accepts tools within budget (allow path)", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      // Should not throw for first few tool calls
      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_001", tool: "delegate-task" },
          { args: { agent: "builder" } }
        )
      ).resolves.toBeUndefined()

      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_001", tool: "delegation-status" },
          { args: {} }
        )
      ).resolves.toBeUndefined()

      const s = stateManager.getStats("ses_001")
      expect(s?.total).toBe(2)
    })

    it("bails out when sessionID is missing", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      await expect(
        hooks["tool.execute.before"](
          { tool: "delegate-task" },
          {}
        )
      ).resolves.toBeUndefined()

      // No stats should be created
      expect(stateManager.getStats("any")).toBeUndefined()
    })

    it("bails out when tool name is missing", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_001" },
          {}
        )
      ).resolves.toBeUndefined()
    })

    it("throws when tool budget is exceeded", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      // Max is 400 by default (DEFAULT_RUNTIME_POLICY)
      const stats = stateManager.ensureStats("ses_002")
      stats.total = 401

      await expect(
        hooks["tool.execute.before"](
          { sessionID: "ses_002", tool: "delegate-task" },
          {}
        )
      ).rejects.toThrow(/exceeded the tool call budget/)
    })

    it("counts repeated same-signature tool calls", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      // Same args produce same signature
      const input = { sessionID: "ses_003", tool: "delegate-task" }
      const output = { args: { agent: "builder", prompt: "do work" } }

      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)

      const s = stateManager.getStats("ses_003")
      expect(s?.total).toBe(3)
      expect(s?.loop.count).toBe(3)
    })

    it("trips circuit breaker after threshold repeated calls", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const input = { sessionID: "ses_cb", tool: "delegate-task" }
      const output = { args: { agent: "builder" } }

      // Circuit breaker threshold is 16 by default
      // Call 15 times with identical signature — should succeed
      for (let i = 0; i < 15; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      // 16th call should trip the circuit breaker
      await expect(
        hooks["tool.execute.before"](input, output)
      ).rejects.toThrow(/Circuit breaker tripped/)
    })
  })

  describe("tool.execute.after", () => {
    it("injects _harness metadata into output", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const output: Record<string, unknown> = {}
      await hooks["tool.execute.after"](
        { sessionID: "ses_010", tool: "delegate-task", args: {} },
        output
      )

      expect(output.metadata).toBeDefined()
      const meta = output.metadata as Record<string, unknown>
      expect(meta._harness).toBeDefined()
      const harness = meta._harness as Record<string, unknown>
      expect(harness).toMatchObject({
        totalToolCalls: expect.any(Number),
        recentWarnings: expect.any(Array),
      })
    })

    it("merges _harness with existing metadata", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const output: Record<string, unknown> = {
        metadata: { existingKey: "existingValue" },
      }
      await hooks["tool.execute.after"](
        { sessionID: "ses_011", tool: "delegate-task", args: {} },
        output
      )

      const meta = output.metadata as Record<string, unknown>
      expect(meta.existingKey).toBe("existingValue")
      expect(meta._harness).toBeDefined()
    })

    it("bails out when sessionID is missing", async () => {
      const hooks = createToolGuardHooks({
        stateManager: stateManager as never,
      })

      const output: Record<string, unknown> = {}
      await hooks["tool.execute.after"](
        { tool: "delegate-task" },
        output
      )

      // No metadata injected since sessionID is missing
      expect(output.metadata).toBeUndefined()
    })
  })
})
