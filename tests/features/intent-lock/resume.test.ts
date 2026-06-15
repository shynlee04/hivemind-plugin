/**
 * TDD tests for src/features/intent-lock/resume.ts
 *
 * Evidence: small unit tests (no real FS needed; all I/O injected via deps).
 *
 * Acceptance criteria covered:
 * - AC-22: inherits LOCKED_CODE_CHANGE from old session
 * - AC-23: old non-code intent → UNLOCKED
 * - AC-30: notify on resume (SPEC §10.2 format)
 * - AC-31: unknownSub kind → skip with warning (fail-safe)
 * - Plus: resume disabled, no root entry found
 */

import { describe, expect, it, vi } from "vitest"

import { IntentState } from "../../../src/features/intent-lock/types.js"
import {
  type ContinuityEntry,
  type ResumeDeps,
  resolveContinuedSession,
} from "../../../src/features/intent-lock/resume.js"

function makeDeps(overrides?: Partial<ResumeDeps>): ResumeDeps {
  return {
    readContinuityStore: vi.fn(() => ({ sessions: [] })),
    upsertIntentLockState: vi.fn((_projectRoot: string, state) => state),
    showToast: vi.fn(() => Promise.resolve()),
    logWarn: vi.fn(),
    config: { resumeInheritsLock: true, notifyResume: true },
    ...overrides,
  }
}

function makeRootEntry(overrides?: Partial<ContinuityEntry>): ContinuityEntry {
  return {
    sessionId: "old_ses",
    kind: "root",
    endedAt: 1,
    phaseId: "P27.1-test",
    intentId: "INT-20260609-abcdef",
    summary: "implement gate",
    state: IntentState.LOCKED_CODE_CHANGE,
    ...overrides,
  }
}

describe("src/features/intent-lock/resume", () => {
  describe("AC-22: inherits LOCKED_CODE_CHANGE from old session", () => {
    it("inherits state and calls upsert", async () => {
      const rootEntry = makeRootEntry()
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({ sessions: [rootEntry] })),
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.LOCKED_CODE_CHANGE)
      expect(result.inheritedFrom).toBe("old_ses")
      expect(deps.upsertIntentLockState).toHaveBeenCalledWith(
        "/tmp/proj",
        expect.objectContaining({
          sessionId: "new_ses",
          state: IntentState.LOCKED_CODE_CHANGE,
          intentId: "INT-20260609-abcdef",
          phaseId: "P27.1-test",
          isCodeChange: true,
          summary: "implement gate",
        }),
      )
    })

    it("calls showToast with SPEC §10.2 format", async () => {
      const rootEntry = makeRootEntry()
      const showToast = vi.fn(() => Promise.resolve())
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({ sessions: [rootEntry] })),
        showToast,
      })

      await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(showToast).toHaveBeenCalledTimes(1)
      // SPEC §10.2 format: "Resuming from {oldSessionId}, locked phase {phaseId} (intent: {summary})"
      expect(showToast).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Resuming from old_ses, locked phase P27\.1-test \(intent: implement gate\)$/,
        ),
        "info",
      )
    })
  })

  describe("AC-23: old non-code intent → UNLOCKED", () => {
    it("returns UNLOCKED for LOCKED_NON_CODE", async () => {
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [makeRootEntry({ state: IntentState.LOCKED_NON_CODE })],
        })),
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.UNLOCKED)
      expect(result.inheritedFrom).toBeUndefined()
      expect(deps.upsertIntentLockState).not.toHaveBeenCalled()
      expect(deps.showToast).not.toHaveBeenCalled()
    })

    it("returns UNLOCKED for COMPLETED", async () => {
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [makeRootEntry({ state: IntentState.COMPLETED })],
        })),
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.UNLOCKED)
      expect(deps.upsertIntentLockState).not.toHaveBeenCalled()
    })

    it("returns UNLOCKED for UNLOCKED", async () => {
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [makeRootEntry({ state: IntentState.UNLOCKED })],
        })),
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.UNLOCKED)
      expect(deps.upsertIntentLockState).not.toHaveBeenCalled()
    })
  })

  describe("AC-30: notify on resume", () => {
    it("calls showToast when notifyResume is true", async () => {
      const showToast = vi.fn(() => Promise.resolve())
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [makeRootEntry()],
        })),
        showToast,
        config: { resumeInheritsLock: true, notifyResume: true },
      })

      await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(showToast).toHaveBeenCalledTimes(1)
    })

    it("does NOT call showToast when notifyResume is false", async () => {
      const showToast = vi.fn(() => Promise.resolve())
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [makeRootEntry()],
        })),
        showToast,
        config: { resumeInheritsLock: true, notifyResume: false },
      })

      await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(showToast).not.toHaveBeenCalled()
    })
  })

  describe("AC-31: unknownSub kind → skip with warning (fail-safe)", () => {
    it("returns UNLOCKED and logs warning for unknownSub", async () => {
      const logWarn = vi.fn()
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [
            makeRootEntry({
              kind: "unknownSub",
              state: IntentState.LOCKED_CODE_CHANGE,
              summary: "stale entry",
            }),
          ],
        })),
        logWarn,
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.UNLOCKED)
      expect(result.inheritedFrom).toBeUndefined()
      expect(deps.upsertIntentLockState).not.toHaveBeenCalled()
      expect(deps.showToast).not.toHaveBeenCalled()
      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining("unknownSub"),
      )
      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining("skipping inheritance"),
      )
    })
  })

  describe("config.resumeInheritsLock: false → no inheritance", () => {
    it("returns UNLOCKED without checking store", async () => {
      const readStore = vi.fn(() => ({ sessions: [makeRootEntry()] }))
      const deps = makeDeps({
        readContinuityStore: readStore,
        config: { resumeInheritsLock: false, notifyResume: true },
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.UNLOCKED)
      expect(readStore).not.toHaveBeenCalled()
      expect(deps.showToast).not.toHaveBeenCalled()
    })
  })

  describe("no root entry found → UNLOCKED", () => {
    it("returns UNLOCKED when store is empty", async () => {
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({ sessions: [] })),
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.UNLOCKED)
      expect(result.inheritedFrom).toBeUndefined()
    })

    it("returns UNLOCKED when only child entries exist", async () => {
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [
            {
              sessionId: "child_1",
              kind: "child" as const,
              endedAt: 100,
              state: IntentState.EXECUTING,
            },
          ],
        })),
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      expect(result.state).toBe(IntentState.UNLOCKED)
    })
  })

  describe("toast failure does not propagate", () => {
    it("returns success even when showToast throws", async () => {
      const deps = makeDeps({
        readContinuityStore: vi.fn(() => ({
          sessions: [makeRootEntry()],
        })),
        showToast: vi.fn(() => Promise.reject(new Error("toast network error"))),
        logWarn: vi.fn(),
      })

      const result = await resolveContinuedSession("new_ses", "/tmp/proj", deps)

      // Should still return the inherited state — toast failure is non-fatal.
      expect(result.state).toBe(IntentState.LOCKED_CODE_CHANGE)
      expect(result.inheritedFrom).toBe("old_ses")
      expect(deps.logWarn).toHaveBeenCalledWith(
        expect.stringContaining("toast notification failed"),
        expect.anything(),
      )
    })
  })
})
