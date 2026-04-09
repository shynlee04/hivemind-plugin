/**
 * Unit tests for createToolGuardHooks.
 *
 * Tests the circuit breaker, tool budget, stats tracking, and warning
 * metadata injection behaviors in isolation from the rest of the plugin.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { createToolGuardHooks } from "../../src/hooks/create-tool-guard-hooks.js"
import { recordSessionContinuity } from "../../src/lib/continuity.js"
import { createHarnessLifecycleManager } from "../../src/lib/lifecycle-manager.js"
import { TaskStateManager, taskState } from "../../src/lib/state.js"
import { DEFAULT_RUNTIME_POLICY, getRuntimePolicyForSession } from "../../src/lib/runtime-policy.js"
import type { RuntimePolicy, SessionPolicyOverride } from "../../src/lib/types.js"
import { mutateGovernanceRule } from "../../src/lib/governance-engine.js"
import { setDelegationMeta } from "../../src/lib/state.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(sessionID: string, toolName: string) {
  return { sessionID, tool: toolName }
}

function makeOutput(args: unknown = {}) {
  return { args }
}

function makeAfterInput(sessionID: string, args: unknown = {}) {
  return { sessionID, args }
}

function makeAfterOutput(): { metadata?: unknown } {
  return {}
}

function makeTempContinuityFile(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "hivemind-tool-guard-governance-test-"))
  return join(tempDir, "session-continuity.json")
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
    delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
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

  describe("tool governance", () => {
    it("surfaces warning rules without blocking execution", async () => {
      process.env.OPENCODE_HARNESS_CONTINUITY_FILE = makeTempContinuityFile()
      mutateGovernanceRule({
        type: "upsert",
        source: "test-suite",
        rule: {
          id: "warn-read",
          scope: "tool.execute.before",
          condition: { toolNames: ["read"] },
          action: { type: "warn", message: "Read calls are watched." },
        },
      })

      const hooks = buildHooks(stateManager)
      const output = makeAfterOutput()

      await expect(
        hooks["tool.execute.before"](makeInput("sid-governance-warn", "read"), makeOutput({ path: "/a" })),
      ).resolves.toBeUndefined()

      await hooks["tool.execute.after"](makeAfterInput("sid-governance-warn"), output)

      const meta = (output.metadata as Record<string, unknown>)["_harness"] as Record<string, unknown>
      const governance = meta["governance"] as Record<string, unknown>
      expect(governance["warnings"]).toEqual([{ ruleID: "warn-read", message: "Read calls are watched." }])
      expect(governance["blocks"]).toEqual([])
    })

    it("emits escalation metadata for matching escalation rules", async () => {
      process.env.OPENCODE_HARNESS_CONTINUITY_FILE = makeTempContinuityFile()
      mutateGovernanceRule({
        type: "upsert",
        source: "test-suite",
        rule: {
          id: "escalate-bash",
          scope: "tool.execute.before",
          condition: { toolNames: ["bash"] },
          action: {
            type: "escalate",
            message: "Escalate bash usage.",
            escalation: { channel: "parent", severity: "high" },
          },
        },
      })

      const hooks = buildHooks(stateManager)
      const output = makeAfterOutput()

      await hooks["tool.execute.before"](
        makeInput("sid-governance-escalate", "bash"),
        makeOutput({ command: "pwd" }),
      )
      await hooks["tool.execute.after"](makeAfterInput("sid-governance-escalate"), output)

      const meta = (output.metadata as Record<string, unknown>)["_harness"] as Record<string, unknown>
      const governance = meta["governance"] as Record<string, unknown>
      expect(governance["escalations"]).toEqual([
        {
          ruleID: "escalate-bash",
          message: "Escalate bash usage.",
          escalation: { channel: "parent", severity: "high" },
        },
      ])
    })

    it("blocks execution deterministically for explicit block rules", async () => {
      process.env.OPENCODE_HARNESS_CONTINUITY_FILE = makeTempContinuityFile()
      mutateGovernanceRule({
        type: "upsert",
        source: "test-suite",
        rule: {
          id: "block-write",
          scope: "tool.execute.before",
          condition: { toolNames: ["write"] },
          action: { type: "block", message: "Write is blocked." },
        },
      })

      const hooks = buildHooks(stateManager)

      await expect(
        hooks["tool.execute.before"](makeInput("sid-governance-block", "write"), makeOutput({ path: "/tmp/x" })),
      ).rejects.toThrow(/Write is blocked\./)
    })

    it("re-applies persisted governance rules after hook/state recovery", async () => {
      process.env.OPENCODE_HARNESS_CONTINUITY_FILE = makeTempContinuityFile()
      mutateGovernanceRule({
        type: "upsert",
        source: "test-suite",
        rule: {
          id: "warn-grep",
          scope: "tool.execute.before",
          condition: { toolNames: ["grep"] },
          action: { type: "warn", message: "Recovered governance warning." },
        },
      })

      const recoveredHooks = buildHooks(new TaskStateManager())
      const output = makeAfterOutput()

      await recoveredHooks["tool.execute.before"](
        makeInput("sid-governance-recovered", "grep"),
        makeOutput({ pattern: "foo" }),
      )
      await recoveredHooks["tool.execute.after"](makeAfterInput("sid-governance-recovered"), output)

      const meta = (output.metadata as Record<string, unknown>)["_harness"] as Record<string, unknown>
      const governance = meta["governance"] as Record<string, unknown>
      expect(governance["warnings"]).toEqual([
        { ruleID: "warn-grep", message: "Recovered governance warning." },
      ])
    })

    it("keeps overlapping tool calls correlated to their own invocation metadata", async () => {
      process.env.OPENCODE_HARNESS_CONTINUITY_FILE = makeTempContinuityFile()
      mutateGovernanceRule({
        type: "upsert",
        source: "test-suite",
        rule: {
          id: "warn-grep-overlap",
          scope: "tool.execute.before",
          condition: { toolNames: ["grep"] },
          action: { type: "warn", message: "Grep overlap warning." },
        },
      })
      mutateGovernanceRule({
        type: "upsert",
        source: "test-suite",
        rule: {
          id: "escalate-bash-overlap",
          scope: "tool.execute.before",
          condition: { toolNames: ["bash"] },
          action: {
            type: "escalate",
            message: "Bash overlap escalation.",
            escalation: { channel: "parent", severity: "high" },
          },
        },
      })

      const hooks = buildHooks(stateManager)
      const firstBeforeOutput = makeOutput({ pattern: "todo" })
      const secondBeforeOutput = makeOutput({ command: "pwd" })

      await hooks["tool.execute.before"](makeInput("sid-governance-overlap", "grep"), firstBeforeOutput)
      await hooks["tool.execute.before"](makeInput("sid-governance-overlap", "bash"), secondBeforeOutput)

      const firstArgs = firstBeforeOutput.args as Record<string, unknown>
      const secondArgs = secondBeforeOutput.args as Record<string, unknown>
      expect(firstArgs["_harnessInvocationKey"]).toEqual(expect.any(String))
      expect(secondArgs["_harnessInvocationKey"]).toEqual(expect.any(String))
      expect(firstArgs["_harnessInvocationKey"]).not.toBe(secondArgs["_harnessInvocationKey"])

      const firstAfterOutput = makeAfterOutput()
      await hooks["tool.execute.after"](
        makeAfterInput("sid-governance-overlap", firstArgs),
        firstAfterOutput,
      )

      const firstGovernance = ((firstAfterOutput.metadata as Record<string, unknown>)["_harness"] as Record<
        string,
        unknown
      >)["governance"] as Record<string, unknown>
      expect(firstGovernance["warnings"]).toEqual(
        expect.arrayContaining([
          { ruleID: "warn-grep-overlap", message: "Grep overlap warning." },
        ]),
      )
      expect(firstGovernance["escalations"]).toEqual([])

      const secondAfterOutput = makeAfterOutput()
      await hooks["tool.execute.after"](
        makeAfterInput("sid-governance-overlap", secondArgs),
        secondAfterOutput,
      )

      const secondGovernance = ((secondAfterOutput.metadata as Record<string, unknown>)["_harness"] as Record<
        string,
        unknown
      >)["governance"] as Record<string, unknown>
      expect(secondGovernance["warnings"]).toEqual([])
      expect(secondGovernance["escalations"]).toEqual(
        expect.arrayContaining([
          {
            ruleID: "escalate-bash-overlap",
            message: "Bash overlap escalation.",
            escalation: { channel: "parent", severity: "high" },
          },
        ]),
      )

      const staleAfterOutput = makeAfterOutput()
      await hooks["tool.execute.after"](
        makeAfterInput("sid-governance-overlap", firstArgs),
        staleAfterOutput,
      )

      const staleGovernance = ((staleAfterOutput.metadata as Record<string, unknown>)["_harness"] as Record<
        string,
        unknown
      >)["governance"] as Record<string, unknown>
      expect(staleGovernance["warnings"]).toEqual([])
      expect(staleGovernance["escalations"]).toEqual([])
      expect(staleGovernance["blocks"]).toEqual([])
    })
  })

  // -------------------------------------------------------------------------
  // Per-session policy resolution (02-07 Task 1 — production wiring)
  // -------------------------------------------------------------------------

  describe("per-session runtime-policy resolution", () => {
    let tempDir: string
    let continuityFile: string

    beforeEach(() => {
      tempDir = mkdtempSync(join(tmpdir(), "hivemind-session-policy-"))
      continuityFile = join(tempDir, "session-continuity.json")
      process.env.OPENCODE_HARNESS_CONTINUITY_FILE = continuityFile
      taskState.clear()
    })

    afterEach(() => {
      taskState.clear()
      delete process.env.OPENCODE_HARNESS_CONTINUITY_FILE
      try { rmSync(tempDir, { recursive: true, force: true }) } catch { /* ignore */ }
    })

    it("resolves per-session budget via getRuntimePolicyForSession using delegation metadata", async () => {
      // Workspace policy has a budget of 400, but session override lowers it to 3
      const workspacePolicy: RuntimePolicy = {
        concurrency: { globalLimit: 3 },
        budget: {
          maxToolCallsPerSession: 400,
          repeatedSignatureThreshold: 16,
          warningCap: 25,
          resetOnCompact: true,
        },
      }
      const sessionOverride: SessionPolicyOverride = {
        budget: {
          maxToolCallsPerSession: 3,
        },
      }

      const hooks = createToolGuardHooks({
        stateManager,
        runtimePolicy: workspacePolicy,
      })

      const sid = "sid-session-budget-resolve"
      // Set delegation metadata to simulate a delegated session with a budget override
      setDelegationMeta(sid, {
        rootID: "root-1",
        depth: 1,
        budgetUsed: 1,
        agent: "builder",
        category: "implementation",
        queueKey: "default",
        runtimePolicyOverride: sessionOverride,
      })

      const input = makeInput(sid, "read")
      const output = makeOutput({ path: "/test" })

      // 2 calls under the session override limit of 3 — succeed
      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)

      // 3rd call pushes total to 3 — still ok (throw when total > 3)
      await hooks["tool.execute.before"](input, output)

      // 4th call should throw because the session override lowers max to 3
      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(
        /\[Harness\]/,
      )
    })

    it("session-specific repeatedSignatureThreshold override changes circuit breaker without source edits", async () => {
      const workspacePolicy: RuntimePolicy = {
        concurrency: { globalLimit: 3 },
        budget: {
          maxToolCallsPerSession: 400,
          repeatedSignatureThreshold: 16,
          warningCap: 25,
          resetOnCompact: true,
        },
      }
      const sessionOverride: SessionPolicyOverride = {
        budget: {
          repeatedSignatureThreshold: 3,
        },
      }

      const hooks = createToolGuardHooks({
        stateManager,
        runtimePolicy: workspacePolicy,
      })

      const sid = "sid-session-cb-override"
      setDelegationMeta(sid, {
        rootID: "root-2",
        depth: 1,
        budgetUsed: 1,
        agent: "researcher",
        category: "research",
        queueKey: "default",
        runtimePolicyOverride: sessionOverride,
      })

      const input = makeInput(sid, "read")
      const output = makeOutput({ path: "/same" })

      // 2 calls — under the session override threshold of 3
      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)

      // 3rd call trips circuit breaker at session threshold=3 (not workspace 16)
      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(
        /\[Harness\] Circuit breaker/,
      )
    })

    it("falls back to workspace policy when delegation metadata has no runtimePolicyOverride", async () => {
      const workspacePolicy: RuntimePolicy = {
        concurrency: { globalLimit: 3 },
        budget: {
          maxToolCallsPerSession: 400,
          repeatedSignatureThreshold: 16,
          warningCap: 25,
          resetOnCompact: true,
        },
      }

      const hooks = createToolGuardHooks({
        stateManager,
        runtimePolicy: workspacePolicy,
      })

      const sid = "sid-no-session-override"
      // Delegation metadata without runtimePolicyOverride
      setDelegationMeta(sid, {
        rootID: "root-3",
        depth: 1,
        budgetUsed: 1,
        agent: "builder",
        category: "implementation",
        queueKey: "default",
      })

      const input = makeInput(sid, "read")
      const output = makeOutput({ path: "/same" })

      // 15 calls — under workspace threshold of 16
      for (let i = 0; i < 15; i++) {
        await hooks["tool.execute.before"](input, output)
      }

      // 16th should trip at workspace threshold
      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(
        /\[Harness\] Circuit breaker/,
      )
    })

    it("enforces runtimePolicyOverride after continuity reload hydrates delegation metadata", async () => {
      const workspacePolicy: RuntimePolicy = {
        concurrency: { globalLimit: 3 },
        budget: {
          maxToolCallsPerSession: 400,
          repeatedSignatureThreshold: 16,
          warningCap: 25,
          resetOnCompact: true,
        },
      }

      recordSessionContinuity({
        sessionID: "sid-reloaded-override",
        toolProfile: {
          permissionRules: [],
          compatibleTools: ["read"],
        },
        promptParams: {
          agent: "builder",
          category: "implementation",
          tools: ["read"],
        },
        metadata: {
          parentSessionID: "parent-session",
          rootSessionID: "root-session",
          delegation: {
            rootID: "root-session",
            depth: 1,
            budgetUsed: 1,
            agent: "builder",
            category: "implementation",
            queueKey: "default",
            runtimePolicyOverride: {
              budget: {
                maxToolCallsPerSession: 3,
              },
            },
          },
          title: "builder: reloaded override",
          description: "builder: reloaded override",
          category: "implementation",
          constraints: [],
          runInBackground: false,
          status: "running",
          createdAt: 1,
          updatedAt: 1,
        },
      })

      taskState.clear()
      const lifecycleManager = createHarnessLifecycleManager({
        client: {} as never,
        pollTimeoutMs: 50,
      })
      lifecycleManager.hydrateFromContinuity()

      const hooks = createToolGuardHooks({
        stateManager,
        runtimePolicy: workspacePolicy,
      })

      const input = makeInput("sid-reloaded-override", "read")
      const output = makeOutput({ path: "/persisted" })

      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)
      await hooks["tool.execute.before"](input, output)

      await expect(hooks["tool.execute.before"](input, output)).rejects.toThrow(/\[Harness\]/)
    })
  })
})
