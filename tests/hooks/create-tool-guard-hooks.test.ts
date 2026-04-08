/**
 * Unit tests for createToolGuardHooks.
 *
 * Tests the circuit breaker, tool budget, stats tracking, and warning
 * metadata injection behaviors in isolation from the rest of the plugin.
 */
import { describe, it, expect, beforeEach } from "vitest"
import { createToolGuardHooks } from "../../src/hooks/create-tool-guard-hooks.js"
import { TaskStateManager } from "../../src/lib/state.js"
import { DEFAULT_RUNTIME_POLICY } from "../../src/lib/runtime-policy.js"
import type { RuntimePolicy, SessionPolicyOverride } from "../../src/lib/types.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(sessionID: string, toolName: string) {
  return { sessionID, tool: toolName }
}

function makeOutput(args: unknown = {}) {
  return { args }
}

function makeAfterInput(sessionID: string) {
  return { sessionID }
}

function makeAfterOutput(): { metadata?: unknown } {
  return {}
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

function buildHooks(stateManager: TaskStateManager) {
  return createToolGuardHooks({ stateManager })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createToolGuardHooks", () => {
  let stateManager: TaskStateManager

  beforeEach(() => {
    stateManager = new TaskStateManager()
  })

  // -------------------------------------------------------------------------
  // Stats tracking
  // -------------------------------------------------------------------------

  describe("tool.execute.before — stats tracking", () => {
    it("increments total call count on each invocation", async () => {
      const hooks = buildHooks(stateManager)
      const input = makeInput("sid-stats", "read")
      const output = makeOutput({ path: "/foo" })

      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)

      const stats = stateManager.getStats("sid-stats")
      expect(stats?.total).toBe(2)
    })

    it("increments per-tool count in byTool map", async () => {
      const hooks = buildHooks(stateManager)

      await hooks["tool.execute.before"](makeInput("sid-bytool", "read"), makeOutput({ path: "/a" }))
      await hooks["tool.execute.before"](makeInput("sid-bytool", "read"), makeOutput({ path: "/b" }))
      await hooks["tool.execute.before"](makeInput("sid-bytool", "grep"), makeOutput({ pattern: "x" }))

      const stats = stateManager.getStats("sid-bytool")
      expect(stats?.byTool["read"]).toBe(2)
      expect(stats?.byTool["grep"]).toBe(1)
    })

    it("skips processing when sessionID is absent", async () => {
      const hooks = buildHooks(stateManager)
      // No sessionID — should return without throwing or mutating state
      await expect(
        hooks["tool.execute.before"]({ tool: "read" }, makeOutput()),
      ).resolves.toBeUndefined()
    })

    it("skips processing when toolName is absent", async () => {
      const hooks = buildHooks(stateManager)
      await expect(
        hooks["tool.execute.before"]({ sessionID: "sid-no-tool" }, makeOutput()),
      ).resolves.toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Tool budget
  // -------------------------------------------------------------------------

  describe("tool.execute.before — tool budget", () => {
    it("throws [Harness] error when total exceeds MAX_TOOL_CALLS_PER_SESSION (400)", async () => {
      const hooks = buildHooks(stateManager)
      const input = makeInput("sid-budget", "read")
      // Manually set total to 400 to trigger on the 401st call
      const stats = stateManager.ensureStats("sid-budget")
      stats.total = 400

      await expect(hooks["tool.execute.before"](input, makeOutput())).rejects.toThrow(
        /\[Harness\]/,
      )
    })

    it("error message mentions 'tool call budget'", async () => {
      const hooks = buildHooks(stateManager)
      const input = makeInput("sid-budget-msg", "write")
      const stats = stateManager.ensureStats("sid-budget-msg")
      stats.total = 400

      await expect(hooks["tool.execute.before"](input, makeOutput())).rejects.toThrow(
        /tool call budget/i,
      )
    })

    it("adds a warning before throwing the budget error", async () => {
      const hooks = buildHooks(stateManager)
      const input = makeInput("sid-budget-warn", "bash")
      const stats = stateManager.ensureStats("sid-budget-warn")
      stats.total = 400

      await expect(hooks["tool.execute.before"](input, makeOutput())).rejects.toThrow()

      const refreshed = stateManager.getStats("sid-budget-warn")
      expect(refreshed?.warnings.length).toBeGreaterThan(0)
    })
  })

  // -------------------------------------------------------------------------
  // Circuit breaker
  // -------------------------------------------------------------------------

  describe("tool.execute.before — circuit breaker", () => {
    it("throws [Harness] Circuit breaker error when same signature repeats >= 16 times", async () => {
      const hooks = buildHooks(stateManager)
      const input = makeInput("sid-cb", "read")
      const output = makeOutput({ path: "/same" })

      // Call 15 times without error
      for (let i = 0; i < 15; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      // 16th call with the same signature must throw
      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(
        /\[Harness\] Circuit breaker/,
      )
    })

    it("adds a warning when circuit breaker trips", async () => {
      const hooks = buildHooks(stateManager)
      const input = makeInput("sid-cb-warn", "read")
      const output = makeOutput({ path: "/same-warn" })

      for (let i = 0; i < 15; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow()

      const stats = stateManager.getStats("sid-cb-warn")
      expect(stats?.warnings.some((w) => w.includes("Circuit breaker"))).toBe(true)
    })

    it("resets counter when tool name changes", async () => {
      const hooks = buildHooks(stateManager)

      // Drive count to 14 with "read"
      for (let i = 0; i < 14; i++) {
        await hooks["tool.execute.before"](
          makeInput("sid-cb-reset-tool", "read"),
          makeOutput({ path: "/same" }),
        )
      }

      // Switch to "grep" — counter resets, should not throw
      await expect(
        hooks["tool.execute.before"](
          makeInput("sid-cb-reset-tool", "grep"),
          makeOutput({ pattern: "x" }),
        ),
      ).resolves.toBeUndefined()
    })

    it("resets counter when args change", async () => {
      const hooks = buildHooks(stateManager)

      // Drive count to 14 with same args
      for (let i = 0; i < 14; i++) {
        await hooks["tool.execute.before"](
          makeInput("sid-cb-reset-args", "read"),
          makeOutput({ path: "/same" }),
        )
      }

      // Same tool, different args — counter resets
      await expect(
        hooks["tool.execute.before"](
          makeInput("sid-cb-reset-args", "read"),
          makeOutput({ path: "/different" }),
        ),
      ).resolves.toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // Policy-driven budgets (RUN-3h)
  // -------------------------------------------------------------------------

  describe("tool.execute.before — policy-driven budgets", () => {
    it("uses resolved per-session budget from getRuntimePolicyForSession", async () => {
      // Create hooks with a custom policy that has a lower maxToolCallsPerSession
      const customPolicy: RuntimePolicy = {
        concurrency: { globalLimit: 3 },
        budget: {
          maxToolCallsPerSession: 5,
          repeatedSignatureThreshold: 16,
          warningCap: 25,
          resetOnCompact: true,
        },
      }
      const hooks = createToolGuardHooks({
        stateManager,
        runtimePolicy: customPolicy,
      })

      const input = makeInput("sid-custom-budget", "read")
      const output = makeOutput({ path: "/test" })

      // Call 4 times (under limit) — should succeed
      for (let i = 0; i < 4; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      // 5th call pushes total to 5 — still under limit (limit=5, throw when total > 5)
      await hooks["tool.execute.before"](input, output)

      // 6th call should throw since total will be 6 > 5
      const stats = stateManager.getStats("sid-custom-budget")
      expect(stats?.total).toBe(5)

      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(
        /\[Harness\]/,
      )
    })

    it("uses resolved per-session repeatedSignatureThreshold from policy", async () => {
      const customPolicy: RuntimePolicy = {
        concurrency: { globalLimit: 3 },
        budget: {
          maxToolCallsPerSession: 400,
          repeatedSignatureThreshold: 3,
          warningCap: 25,
          resetOnCompact: true,
        },
      }
      const hooks = createToolGuardHooks({
        stateManager,
        runtimePolicy: customPolicy,
      })

      const input = makeInput("sid-custom-cb", "read")
      const output = makeOutput({ path: "/same" })

      // Call 2 times (under threshold) — should succeed
      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)

      // 3rd call should trip circuit breaker (threshold=3)
      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(
        /\[Harness\] Circuit breaker/,
      )
    })

    it("default policy uses standard constants when no override provided", async () => {
      // Without runtimePolicy, should use DEFAULT_RUNTIME_POLICY values
      const hooks = buildHooks(stateManager)
      const input = makeInput("sid-default-policy", "read")
      const output = makeOutput({ path: "/same" })

      // Drive count to 15 — under default threshold of 16
      for (let i = 0; i < 15; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      // 16th should trip (default threshold)
      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(
        /\[Harness\] Circuit breaker/,
      )
    })
  })

  // -------------------------------------------------------------------------
  // Warning metadata injection
  // -------------------------------------------------------------------------

  describe("tool.execute.after — warning metadata", () => {
    it("injects _harness metadata with recentWarnings from stats", async () => {
      const hooks = buildHooks(stateManager)
      stateManager.addWarning("sid-after", "something bad happened")

      const output = makeAfterOutput()
      await hooks["tool.execute.after"](makeAfterInput("sid-after"), output)

      const meta = (output.metadata as Record<string, unknown>)["_harness"] as Record<
        string,
        unknown
      >
      expect(meta).toBeDefined()
      expect(Array.isArray(meta["recentWarnings"])).toBe(true)
      expect((meta["recentWarnings"] as string[]).includes("something bad happened")).toBe(true)
    })

    it("includes totalToolCalls in metadata", async () => {
      const hooks = buildHooks(stateManager)
      const sid = "sid-after-total"
      const stats = stateManager.ensureStats(sid)
      stats.total = 42

      const output = makeAfterOutput()
      await hooks["tool.execute.after"](makeAfterInput(sid), output)

      const meta = (output.metadata as Record<string, unknown>)["_harness"] as Record<
        string,
        unknown
      >
      expect(meta?.["totalToolCalls"]).toBe(42)
    })

    it("returns early without mutating output when sessionID is absent", async () => {
      const hooks = buildHooks(stateManager)
      const output = makeAfterOutput()
      await hooks["tool.execute.after"]({}, output)
      expect(output.metadata).toBeUndefined()
    })

    it("merges into existing metadata without overwriting non-harness keys", async () => {
      const hooks = buildHooks(stateManager)
      const output: { metadata?: unknown } = { metadata: { custom: "kept" } }
      await hooks["tool.execute.after"](makeAfterInput("sid-merge"), output)

      const meta = output.metadata as Record<string, unknown>
      expect(meta["custom"]).toBe("kept")
      expect(meta["_harness"]).toBeDefined()
    })
  })
})
