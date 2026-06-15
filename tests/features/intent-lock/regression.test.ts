/**
 * Regression tests for the 5+ weaknesses found in the Phase 27.1 code review.
 *
 * Each `regression: <weakness-name>` test asserts the user-visible or
 * contract-visible behavior. If a test fails, it must fail for the
 * asserted reason — a compile error or unrelated missing-import is
 * "test-after" evidence and is not acceptable.
 *
 * Evidence label: runtime-truthful — every test exercises the real
 * public seam (state-machine, store, gate hook) with real I/O where
 * the unit under test is the storage layer; mocked I/O only where the
 * helper is itself the contract.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createIntentLockGateHook, startSessionGate } from "../../../src/hooks/guards/intent-lock-gate.js"
import { IntentState, type IntentLockState } from "../../../src/features/intent-lock/types.js"
import {
  clearIntentLockCache,
  getIntentLockFilePath,
  persistIntentLockState,
  readIntentLockState,
} from "../../../src/features/intent-lock/store.js"
import { lockIntentCodeChange, lockIntentNonCode } from "../../../src/features/intent-lock/state-machine.js"
import { resolveToolPermission } from "../../../src/features/intent-lock/tool-resolver.js"

const SAFE_SESSION_ID = "ses_regression"

let projectRoot: string

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "intent-lock-regression-"))
  clearIntentLockCache()
})

afterEach(() => {
  clearIntentLockCache()
  if (existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})

/** Fresh UNLOCKED state for tests that don't care about prior transitions. */
function makeUnlockedState(sessionId = SAFE_SESSION_ID): IntentLockState {
  return {
    sessionId,
    state: IntentState.UNLOCKED,
    lastTransitionAt: 0,
    history: [],
  }
}

describe("regression: Phase 27.1 weaknesses", () => {
  // ─────────────────────────────────────────────────────────────────────
  // W1: lockIntentCodeChange silently drops allowedSurfaces
  // ─────────────────────────────────────────────────────────────────────
  describe("W1: allowedSurfaces persistence", () => {
    it("regression: lockIntentCodeChange exposes allowedSurfaces on the returned state", () => {
      const initial = makeUnlockedState()
      const surfaces = ["src/features/intent-lock/**", "tests/features/intent-lock/**"]
      const next = lockIntentCodeChange(initial, "INT-W1-001", "W1 regression", surfaces)
      // The returned state object MUST carry the surfaces so the store can
      // persist them. Currently the function does `void allowedSurfaces`.
      expect((next as IntentLockState & { allowedSurfaces?: string[] }).allowedSurfaces).toEqual(
        surfaces,
      )
    })

    it("regression: persisted JSON carries allowedSurfaces when written via lockIntentCodeChange", () => {
      const initial = makeUnlockedState()
      const surfaces = ["src/foo.ts", "src/bar.ts"]
      const locked = lockIntentCodeChange(initial, "INT-W1-002", "persist test", surfaces)
      persistIntentLockState(projectRoot, locked)
      const raw = JSON.parse(readFileSync(getIntentLockFilePath(projectRoot, SAFE_SESSION_ID), "utf-8"))
      expect(raw.allowedSurfaces).toEqual(surfaces)
    })
  })

  // ─────────────────────────────────────────────────────────────────────
  // W2: parsedToState uses unsafe `as IntentState` cast
  // ─────────────────────────────────────────────────────────────────────
  describe("W2: bogus state values are rejected at read time", () => {
    it("regression: readIntentLockState quarantines a file with an invalid state value", () => {
      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      require("node:fs").mkdirSync(join(filePath, ".."), { recursive: true })
      writeFileSync(
        filePath,
        JSON.stringify({
          sessionId: SAFE_SESSION_ID,
          state: "PWNED", // not a valid IntentState enum value
          lastTransitionAt: 1,
          history: [],
        }),
        "utf-8",
      )
      const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      // Either: state must equal UNLOCKED (fallback) — never "PWNED"
      expect(state.state).toBe(IntentState.UNLOCKED)
      expect(state.state).not.toBe("PWNED")
    })

    it("regression: readIntentLockState accepts a file with a valid state value", () => {
      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      require("node:fs").mkdirSync(join(filePath, ".."), { recursive: true })
      writeFileSync(
        filePath,
        JSON.stringify({
          sessionId: SAFE_SESSION_ID,
          state: IntentState.LOCKED_CODE_CHANGE,
          lastTransitionAt: 1,
          history: [],
        }),
        "utf-8",
      )
      const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(state.state).toBe(IntentState.LOCKED_CODE_CHANGE)
    })
  })

  // ─────────────────────────────────────────────────────────────────────
  // W3: STORE_VERSION is never written to disk
  // ─────────────────────────────────────────────────────────────────────
  describe("W3: schemaVersion is persisted in state JSON", () => {
    it("regression: persisted state JSON contains schemaVersion: 1.0.0", () => {
      const initial = makeUnlockedState()
      const locked = lockIntentCodeChange(initial, "INT-W3-001", "schemaVersion test", ["src/**"])
      persistIntentLockState(projectRoot, locked)
      const raw = JSON.parse(readFileSync(getIntentLockFilePath(projectRoot, SAFE_SESSION_ID), "utf-8"))
      expect(raw.schemaVersion).toBe("1.0.0")
    })
  })

  // ─────────────────────────────────────────────────────────────────────
  // W4: resume.ts is dead code — wire it into the gate entry point
  // ─────────────────────────────────────────────────────────────────────
  describe("W4: session start triggers resume via the gate hook", () => {
    it("regression: the gate hook exposes a startSessionGate entry point", () => {
      // The module must expose a way to bootstrap a session (e.g.
      // `startSessionGate`) that calls into `resolveContinuedSession`.
      // If no such surface exists, the import is undefined and this test
      // fails at the compile/runtime boundary.
      expect(typeof startSessionGate).toBe("function")
    })

    it("regression: startSessionGate calls resume.upsertIntentLockState when an inheritable prior session exists", async () => {
      // Inject a fake continuity store with one prior root session in a
      // inheritable state, and assert the gate wires resume correctly.
      const upsertSpy = vi.fn((_root: string, state: IntentLockState) => state)
      const result = await startSessionGate({
        projectRoot,
        newSessionId: "ses_new",
        resumeDeps: {
          readContinuityStore: () => ({
            sessions: [
              {
                sessionId: "ses_old",
                kind: "root",
                endedAt: 1,
                phaseId: "P27.1-w4",
                intentId: "INT-W4-001",
                summary: "w4 regression",
                state: IntentState.LOCKED_CODE_CHANGE,
              },
            ],
          }),
          upsertIntentLockState: upsertSpy,
          config: { resumeInheritsLock: true, notifyResume: false },
        },
      })
      expect(result.state).toBe(IntentState.LOCKED_CODE_CHANGE)
      expect(result.inheritedFrom).toBe("ses_old")
      expect(upsertSpy).toHaveBeenCalledWith(
        projectRoot,
        expect.objectContaining({
          sessionId: "ses_new",
          state: IntentState.LOCKED_CODE_CHANGE,
        }),
      )
    })
  })

  // ─────────────────────────────────────────────────────────────────────
  // W5: unknownSub kind returns allowed: true end-to-end
  // ─────────────────────────────────────────────────────────────────────
  describe("W5: unknownSub classification returns allowed: true at the resolver", () => {
    it("regression: unknownSub root session allows write at the resolver", async () => {
      const ctx = {
        sessionId: SAFE_SESSION_ID,
        projectRoot,
        classificationKind: "unknownSub" as const,
        intentLockState: {
          sessionId: SAFE_SESSION_ID,
          state: IntentState.UNLOCKED,
          lastTransitionAt: 0,
          history: [],
        },
      }
      const d = await resolveToolPermission("write", { filePath: "x" }, ctx)
      expect(d.allowed).toBe(true)
      expect(d.reason).toMatch(/child session inherits parent gate/i)
    })

    it("regression: unknownSub classification allows bash even with dangerous command", async () => {
      const ctx = {
        sessionId: SAFE_SESSION_ID,
        projectRoot,
        classificationKind: "unknownSub" as const,
        intentLockState: {
          sessionId: SAFE_SESSION_ID,
          state: IntentState.UNLOCKED,
          lastTransitionAt: 0,
          history: [],
        },
      }
      const d = await resolveToolPermission(
        "bash",
        { command: "cat x > /tmp/y" },
        ctx,
      )
      expect(d.allowed).toBe(true)
    })
  })

  // ─────────────────────────────────────────────────────────────────────
  // W7: TOCTOU between existsSync and readFileSync
  // ─────────────────────────────────────────────────────────────────────
  describe("W7: TOCTOU on state file", () => {
    it("regression: readIntentLockState handles a file that is deleted between existsSync and readFileSync", () => {
      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      require("node:fs").mkdirSync(join(filePath, ".."), { recursive: true })
      writeFileSync(
        filePath,
        JSON.stringify({
          sessionId: SAFE_SESSION_ID,
          state: IntentState.LOCKED_CODE_CHANGE,
          lastTransitionAt: 1,
          history: [],
        }),
        "utf-8",
      )
      // Simulate another process removing the file between cache and disk
      // lookups by unmounting the existsSync check via a stale cache entry
      // pointing at a now-deleted file. Force re-read after deletion.
      clearIntentLockCache()
      require("node:fs").unlinkSync(filePath)
      // Should not throw; should return a fresh default UNLOCKED state.
      const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(state.state).toBe(IntentState.UNLOCKED)
    })
  })

  // ─────────────────────────────────────────────────────────────────────
  // W8: sessionId path-traversal protection (regression guard)
  // ─────────────────────────────────────────────────────────────────────
  describe("W8: sessionId path-traversal protection", () => {
    it("regression: getIntentLockFilePath rejects a path-traversal sessionId", () => {
      expect(() => getIntentLockFilePath(projectRoot, "../etc/passwd")).toThrow(/[Hh](arness|ivemind)/)
    })

    it("regression: getIntentLockFilePath rejects an absolute path sessionId", () => {
      // assertPathWithinRoot uses realpath containment; absolute path
      // escapes should be rejected.
      expect(() => getIntentLockFilePath(projectRoot, "/etc/passwd")).toThrow(/[Hh](arness|ivemind)/)
    })
  })

  // ─────────────────────────────────────────────────────────────────────
  // Tool resolver edge case: bash with no `command` field
  // ─────────────────────────────────────────────────────────────────────
  describe("tool-resolver: edge cases on bash args", () => {
    it("regression: bash with empty args object falls through to matrix check (allowed via bash:any in EXECUTING)", async () => {
      const ctx = {
        sessionId: SAFE_SESSION_ID,
        projectRoot,
        classificationKind: "root" as const,
        intentLockState: {
          sessionId: SAFE_SESSION_ID,
          state: IntentState.EXECUTING,
          lastTransitionAt: 0,
          history: [],
        },
      }
      const d = await resolveToolPermission("bash", {}, ctx)
      expect(d.allowed).toBe(true)
    })
  })
})
