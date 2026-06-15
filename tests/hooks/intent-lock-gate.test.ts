/**
 * Intent-lock gate hook tests — AC-24 through AC-27 + 2 edge cases.
 *
 * Evidence label: transport-mocked — real hook logic through public seam
 * with classifier and store replaced by in-process mocks.
 *
 * Test size: small (single unit, public seam, focused command).
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

import { IntentState } from "../../src/features/intent-lock/types.js"
import {
  addSessionOverride,
  createIntentLockGateHook,
  resetSoftStartTracking,
  resolveLocaleForGate,
} from "../../src/hooks/guards/intent-lock-gate.js"

import type { IntentLockGateDeps } from "../../src/hooks/guards/intent-lock-gate.js"

/** Build mock deps with sensible defaults; callers override what they need. */
function buildMockDeps(overrides: Partial<IntentLockGateDeps> = {}): IntentLockGateDeps {
  return {
    projectRoot: "/project",
    getConfig: () => ({ enabled: true }),
    readIntentLockState: vi.fn().mockReturnValue({
      state: IntentState.UNLOCKED,
      phaseId: undefined,
      intentId: undefined,
      summary: undefined,
    }),
    classifier: {
      classify: vi.fn().mockResolvedValue({ kind: "root", gate: "sdk" }),
    },
    getSessionSafely: vi.fn().mockResolvedValue({}),
    // Default: state file exists on disk (existing tests assume state lookups work)
    stateFileExists: () => true,
    logWarn: vi.fn(),
    ...overrides,
  }
}

describe("createIntentLockGateHook", () => {
  // AC-24: hook blocks write in non-EXECUTING state
  it("AC-24: blocks write tool when state is UNLOCKED", async () => {
    const deps = buildMockDeps()
    const hook = createIntentLockGateHook(deps)

    await expect(
      hook(
        { tool: "write", sessionID: "ses_1" },
        { args: { filePath: "/src/foo.ts" } },
      ),
    ).rejects.toThrow("[Hivemind]")

    try {
      await hook(
        { tool: "write", sessionID: "ses_1" },
        { args: { filePath: "/src/foo.ts" } },
      )
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      const blocked = err as Error & { toolName: string; currentState: IntentState }
      expect(blocked.toolName).toBe("write")
      expect(blocked.currentState).toBe(IntentState.UNLOCKED)
    }
  })

  // AC-25: guided block message format (P27.2 error feedback pattern)
  it("AC-25: block message includes State, Reason (with Phase/Intent), Fix, Hint sections", async () => {
    const deps = buildMockDeps({
      readIntentLockState: vi.fn().mockReturnValue({
        state: IntentState.LOCKED_CODE_CHANGE,
        phaseId: "P27.1-test",
        intentId: "INT-20260609-abc",
        summary: "test summary",
      }),
    })
    const hook = createIntentLockGateHook(deps)

    try {
      await hook(
        { tool: "write", sessionID: "ses_1" },
        { args: { filePath: "/src/foo.ts" } },
      )
      expect.unreachable("Should have thrown")
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
      const msg = (err as Error).message
      // P27.2 error feedback pattern — State / Reason / Fix / Hint
      expect(msg).toContain("State:")
      expect(msg).toContain("LOCKED_CODE_CHANGE")
      expect(msg).toContain("Reason:")
      expect(msg).toContain("Phase: P27.1-test")
      expect(msg).toContain("Intent: INT-20260609-abc")
      expect(msg).toContain("Fix:")
      expect(msg).toContain("Hint:")
    }
  })

  // AC-26: gate disabled bypass — no state lookup, no error
  it("AC-26: returns undefined when gate disabled without calling readIntentLockState", async () => {
    const readState = vi.fn()
    const deps = buildMockDeps({
      getConfig: () => ({ enabled: false }),
      readIntentLockState: readState,
    })
    const hook = createIntentLockGateHook(deps)

    // Should NOT throw
    await hook({ tool: "write", sessionID: "ses_1" }, { args: {} })

    // readIntentLockState must NOT have been called
    expect(readState).not.toHaveBeenCalled()
  })

  // AC-27: gate enabled + EXECUTING state allows write
  it("AC-27: allows write tool when state is EXECUTING", async () => {
    const deps = buildMockDeps({
      readIntentLockState: vi.fn().mockReturnValue({
        state: IntentState.EXECUTING,
        phaseId: "P27.1-test",
        intentId: "INT-20260609-abc",
        summary: "executing",
      }),
    })
    const hook = createIntentLockGateHook(deps)

    // Should NOT throw — write is allowed in EXECUTING
    await expect(
      hook({ tool: "write", sessionID: "ses_1" }, { args: { filePath: "/src/foo.ts" } }),
    ).resolves.toBeUndefined()
  })

  // Edge case 1: child session bypasses gate even with enabled + non-EXECUTING
  it("allows write tool in child session regardless of state", async () => {
    const deps = buildMockDeps({
      classifier: {
        classify: vi.fn().mockResolvedValue({
          kind: "child",
          parentID: "ses_parent",
          gate: "sdk",
        }),
      },
    })
    const hook = createIntentLockGateHook(deps)

    // Child session should bypass — no throw
    await expect(
      hook({ tool: "write", sessionID: "ses_child" }, { args: { filePath: "/src/foo.ts" } }),
    ).resolves.toBeUndefined()
  })

  // Edge case 2: read-only tools bypass gate regardless of state
  it("allows read-only tool regardless of state", async () => {
    const deps = buildMockDeps()
    const hook = createIntentLockGateHook(deps)

    // read is in READ_ONLY_TOOLS — should bypass even in UNLOCKED
    await expect(
      hook({ tool: "read", sessionID: "ses_1" }, { args: { filePath: "/src/foo.ts" } }),
    ).resolves.toBeUndefined()
  })

  // Edge case 3: no state file means no gate (legacy — store returns undefined)
  it("returns undefined when no state file exists", async () => {
    const deps = buildMockDeps({
      readIntentLockState: vi.fn().mockReturnValue(undefined),
    })
    const hook = createIntentLockGateHook(deps)

    await expect(
      hook({ tool: "write", sessionID: "ses_1" }, { args: {} }),
    ).resolves.toBeUndefined()
  })

  // AC-34: gate no-ops when no state file exists on disk
  // The real store ALWAYS returns a default UNLOCKED object (never undefined).
  // Without an existsSync check, the gate applies to every fresh session.
  it("AC-34: gate no-ops when no state file exists on disk (even if store returns default)", async () => {
    const readState = vi.fn().mockReturnValue({
      state: IntentState.UNLOCKED,
      phaseId: undefined,
      intentId: undefined,
      summary: undefined,
    })
    const deps = buildMockDeps({
      readIntentLockState: readState,
      // Simulate "no state file on disk" — hook should check this BEFORE store
      stateFileExists: () => false,
    })
    const hook = createIntentLockGateHook(deps)

    // Should NOT throw — no state file means session was never locked
    await expect(
      hook(
        { tool: "bash", sessionID: "ses_fresh" },
        { args: { command: "npm run build 2>&1" } },
      ),
    ).resolves.toBeUndefined()

    // readIntentLockState must NOT have been called — existsSync check short-circuits
    expect(readState).not.toHaveBeenCalled()
  })

  // -----------------------------------------------------------------------
  // T4 — Soft-Start Grace Period (AC-35, AC-35a)
  // -----------------------------------------------------------------------
  describe("T4: soft-start grace period", () => {
    // Reset soft-start tracking between tests to avoid cross-test leakage
    beforeEach(() => {
      resetSoftStartTracking()
    })

    // Helper: build deps where state file exists, state is UNLOCKED,
    // and resolveToolPermission returns { allowed: false }.
    // We mock resolveToolPermission by setting up a LOCKED_CODE_CHANGE state
    // which will naturally cause the resolver to return allowed: false for "write".

    // AC-35: first blockable call in fresh UNLOCKED session gets soft-start
    it("AC-35: first blockable call gets softStart: true", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
      })
      const hook = createIntentLockGateHook(deps)

      try {
        await hook(
          { tool: "write", sessionID: "ses_softstart_1" },
          { args: { filePath: "/src/foo.ts" } },
        )
        expect.unreachable("Should have thrown IntentLockBlockedError")
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        const blocked = err as Error & { softStart?: boolean }
        expect(blocked.softStart).toBe(true)
      }
    })

    // AC-35: second blockable call does NOT get soft-start
    it("AC-35: second blockable call does NOT get softStart", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
      })
      const hook = createIntentLockGateHook(deps)

      // First call — soft-start
      try {
        await hook(
          { tool: "write", sessionID: "ses_softstart_2" },
          { args: { filePath: "/src/foo.ts" } },
        )
        expect.unreachable("Should have thrown")
      } catch (err) {
        const blocked = err as Error & { softStart?: boolean }
        expect(blocked.softStart).toBe(true)
      }

      // Second call — no soft-start
      try {
        await hook(
          { tool: "write", sessionID: "ses_softstart_2" },
          { args: { filePath: "/src/bar.ts" } },
        )
        expect.unreachable("Should have thrown")
      } catch (err) {
        const blocked = err as Error & { softStart?: boolean }
        expect(blocked.softStart).toBeFalsy()
      }
    })

    // AC-35a: soft-start error includes nextCommand "hm-spec-phase"
    it("AC-35a: soft-start error nextCommand is hm-spec-phase", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
      })
      const hook = createIntentLockGateHook(deps)

      try {
        await hook(
          { tool: "write", sessionID: "ses_softstart_3" },
          { args: { filePath: "/src/foo.ts" } },
        )
        expect.unreachable("Should have thrown")
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        const blocked = err as Error & { nextCommand?: string; softStart?: boolean }
        expect(blocked.softStart).toBe(true)
        expect(blocked.nextCommand).toBe("hm-spec-phase")
      }
    })

    // Verify read-only tools still bypass even with soft-start active
    it("AC-35: read-only tools bypass gate even in fresh UNLOCKED session", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
      })
      const hook = createIntentLockGateHook(deps)

      // read is in READ_ONLY_TOOLS — should bypass even in fresh session
      await expect(
        hook(
          { tool: "read", sessionID: "ses_softstart_4" },
          { args: { filePath: "/src/foo.ts" } },
        ),
      ).resolves.toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // T5 — Session-Scoped Override (AC-37, AC-37a)
  // -----------------------------------------------------------------------
  describe("T5: session-scoped override", () => {
    // AC-37: gate respects session override file
    it("AC-37: gate bypasses ALL checks when session override is active", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
        readSessionOverride: vi.fn().mockReturnValue({
          disabled: true,
          createdAt: Date.now(),
        }),
      })
      const hook = createIntentLockGateHook(deps)

      // write would normally be blocked in UNLOCKED state
      await expect(
        hook(
          { tool: "write", sessionID: "ses_overridden" },
          { args: { filePath: "/src/foo.ts" } },
        ),
      ).resolves.toBeUndefined()
    })

    // AC-37a: override bypasses ALL checks for dangerous tools
    it("AC-37a: override bypasses write, edit, and dangerous bash commands", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
        readSessionOverride: vi.fn().mockReturnValue({
          disabled: true,
          createdAt: Date.now(),
        }),
      })
      const hook = createIntentLockGateHook(deps)

      const blockedToolCalls = [
        { tool: "write", args: { filePath: "/etc/passwd", content: "hacked" } },
        { tool: "edit", args: { filePath: "/etc/passwd", oldString: "a", newString: "b" } },
        { tool: "bash", args: { command: "rm -rf /" } },
        { tool: "bash", args: { command: "echo hi > /tmp/x" } },
      ]

      for (const call of blockedToolCalls) {
        await expect(
          hook({ tool: call.tool, sessionID: "ses_overridden" }, { args: call.args }),
        ).resolves.toBeUndefined()
      }
    })

    // Stale override for different session has no effect
    it("AC-37b: override for different session has no effect", async () => {
      // ses_other has an override, but we test ses_normal
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
        // Return undefined for ses_normal — no override for THIS session
        readSessionOverride: vi.fn().mockReturnValue(undefined),
      })
      const hook = createIntentLockGateHook(deps)

      // Should still block — no override for ses_normal
      await expect(
        hook(
          { tool: "write", sessionID: "ses_normal" },
          { args: { filePath: "/src/foo.ts" } },
        ),
      ).rejects.toThrow("[Hivemind]")
    })

  // -----------------------------------------------------------------------
  // P27.3 REQ-3: Escape hatch tests — session override + --bypass-gate
  // -----------------------------------------------------------------------
  describe("P27.3 REQ-3: escape hatch overrides", () => {
    // AC-REQ3-1: addSessionOverride("ses_test") → gate bypass for that session
    it("REQ-3a: addSessionOverride bypasses gate for the session", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.UNLOCKED,
          phaseId: undefined,
          intentId: undefined,
          summary: undefined,
        }),
      })
      const hook = createIntentLockGateHook(deps)

      // Register override before invoking hook
      addSessionOverride("ses_req3_override")

      // write would normally be blocked in UNLOCKED — override makes it pass
      await expect(
        hook(
          { tool: "write", sessionID: "ses_req3_override" },
          { args: { filePath: "/src/foo.ts" } },
        ),
      ).resolves.toBeUndefined()
    })

    // AC-REQ3-2: execute-slash-command with --bypass-gate flag → allowed
    // Uses EXECUTING state where only /hm-* commands are allowed by the matrix,
    // so "write" would normally be blocked. The --bypass-gate flag triggers D-05.
    it("REQ-3b: execute-slash-command with --bypass-gate flag bypasses gate", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.EXECUTING,
          phaseId: "P27.3",
          intentId: "INT-REQ3",
          summary: "escape hatch tests",
        }),
      })
      const hook = createIntentLockGateHook(deps)

      // --bypass-gate in command arg triggers D-05 escape hatch
      await expect(
        hook(
          { tool: "execute-slash-command", sessionID: "ses_req3_bypass" },
          { args: { command: "--bypass-gate write /tmp/test" } },
        ),
      ).resolves.toBeUndefined()
    })

    // AC-REQ3-3: execute-slash-command without flag → still blocked
    // Uses EXECUTING state where the permission matrix only allows /hm-* patterns
    // for execute-slash-command. Without --bypass-gate, non-hm commands are blocked.
    it("REQ-3c: execute-slash-command without --bypass-gate flag is still blocked", async () => {
      const deps = buildMockDeps({
        stateFileExists: () => true,
        readIntentLockState: vi.fn().mockReturnValue({
          state: IntentState.EXECUTING,
          phaseId: "P27.3",
          intentId: "INT-REQ3",
          summary: "escape hatch tests",
        }),
      })
      const hook = createIntentLockGateHook(deps)

      // No --bypass-gate → blocked in EXECUTING (write is not /hm-* pattern)
      await expect(
        hook(
          { tool: "execute-slash-command", sessionID: "ses_req3_nobypass" },
          { args: { command: "write" } },
        ),
      ).rejects.toThrow("[Hivemind]")
    })
  })
  })
})

// ---------------------------------------------------------------------------
// REQ-06: resolveLocaleForGate — TDD RED → GREEN
// ---------------------------------------------------------------------------
describe("resolveLocaleForGate", () => {
  it("returns 'vi' when conversation_language is 'vi'", () => {
    expect(resolveLocaleForGate({ conversation_language: "vi" })).toBe("vi")
  })

  it("returns 'en' when conversation_language is 'en'", () => {
    expect(resolveLocaleForGate({ conversation_language: "en" })).toBe("en")
  })

  it("returns 'en' when config is empty", () => {
    expect(resolveLocaleForGate({})).toBe("en")
  })

  it("returns 'en' when no config is provided (graceful fallback)", () => {
    expect(resolveLocaleForGate()).toBe("en")
  })
})

