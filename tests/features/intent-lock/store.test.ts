import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  clearIntentLockCache,
  deleteSessionOverride,
  getIntentLockFilePath,
  getOrCreateIntentLockState,
  persistIntentLockState,
  readIntentLockState,
  readSessionOverride,
  upsertIntentLockState,
} from "../../../src/features/intent-lock/store.js"
import {
  IntentState,
  lockIntentCodeChange,
} from "../../../src/features/intent-lock/index.js"
import type { IntentLockState } from "../../../src/features/intent-lock/types.js"

const SAFE_SESSION_ID = "ses_test_store"

let projectRoot: string

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "intent-lock-store-"))
  clearIntentLockCache()
})

afterEach(() => {
  clearIntentLockCache()
  if (existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})

describe("src/features/intent-lock/store", () => {
  describe("readIntentLockState", () => {
    it("returns default UNLOCKED state when no file exists", () => {
      const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(state.sessionId).toBe(SAFE_SESSION_ID)
      expect(state.state).toBe(IntentState.UNLOCKED)
      expect(state.history).toEqual([])
      expect(state.lastTransitionAt).toBeGreaterThan(0)
    })

    it("returns a deep clone — mutating the returned history does not affect the cache", () => {
      const initial: IntentLockState = {
        sessionId: SAFE_SESSION_ID,
        state: IntentState.UNLOCKED,
        lastTransitionAt: 0,
        history: [],
      }
      const locked = lockIntentCodeChange(initial, "INT-20260610-aaaaaa", "Implement X", ["src/foo.ts"])
      persistIntentLockState(projectRoot, locked)

      const first = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      // Mutate the returned object's history
      first.history.push({ from: IntentState.UNLOCKED, to: IntentState.PHASE_READY, at: 999 })
      // Re-read — should be unaffected
      const second = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(second.history).toHaveLength(1)
      expect(second.history[0]?.to).toBe(IntentState.LOCKED_CODE_CHANGE)
    })

    it("quarantines a corrupt JSON file and returns a default state", () => {
      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      const dir = join(filePath, "..")
      // mkdir via the store's path resolution
      require("node:fs").mkdirSync(dir, { recursive: true })
      writeFileSync(filePath, '{ "not": "valid" }', "utf-8")

      const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(state.state).toBe(IntentState.UNLOCKED)

      // Quarantine file should exist
      const files = readdirSync(dir)
      const quarantine = files.find((f) => f.includes(".corrupt-"))
      expect(quarantine).toBeDefined()
    })

    it("quarantines a syntactically invalid JSON file (parse failure)", () => {
      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      const dir = join(filePath, "..")
      require("node:fs").mkdirSync(dir, { recursive: true })
      writeFileSync(filePath, "{ not-json", "utf-8")

      const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(state.state).toBe(IntentState.UNLOCKED)
    })
  })

  describe("path safety", () => {
    it("rejects sessionId that escapes the .hivemind/intent-lock boundary", () => {
      expect(() => getIntentLockFilePath(projectRoot, "../../../etc/passwd")).toThrow(
        /[Hh](arness|ivemind)/,
      )
    })

    it("accepts a normal sessionId and returns an absolute path inside the boundary", () => {
      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      expect(filePath.startsWith(projectRoot)).toBe(true)
      expect(filePath.includes(".hivemind/intent-lock")).toBe(true)
    })
  })

  describe("persistIntentLockState", () => {
    it("writes valid JSON to disk and updates the cache", () => {
      const state: IntentLockState = {
        sessionId: SAFE_SESSION_ID,
        state: IntentState.LOCKED_CODE_CHANGE,
        intentId: "INT-20260610-111111",
        summary: "test",
        isCodeChange: true,
        lastTransitionAt: 1700000000000,
        history: [
          { from: IntentState.UNLOCKED, to: IntentState.LOCKED_CODE_CHANGE, at: 1700000000000 },
        ],
      }
      persistIntentLockState(projectRoot, state)

      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      expect(existsSync(filePath)).toBe(true)
      const parsed = JSON.parse(readFileSync(filePath, "utf-8"))
      expect(parsed.state).toBe(IntentState.LOCKED_CODE_CHANGE)
      expect(parsed.intentId).toBe("INT-20260610-111111")
    })

    it("uses atomic temp+rename — final file matches last write, no temp leak", () => {
      const sessionId = "ses_rename"
      const filePath = getIntentLockFilePath(projectRoot, sessionId)
      const dir = join(filePath, "..")

      const state1: IntentLockState = {
        sessionId,
        state: IntentState.UNLOCKED,
        lastTransitionAt: 1,
        history: [],
      }
      persistIntentLockState(projectRoot, state1)

      const state2: IntentLockState = {
        ...state1,
        state: IntentState.LOCKED_CODE_CHANGE,
        lastTransitionAt: 2,
        history: [{ from: IntentState.UNLOCKED, to: IntentState.LOCKED_CODE_CHANGE, at: 2 }],
      }
      persistIntentLockState(projectRoot, state2)

      const final = JSON.parse(readFileSync(filePath, "utf-8"))
      expect(final.state).toBe(IntentState.LOCKED_CODE_CHANGE)
      // No leftover .tmp files
      const remaining = readdirSync(dir).filter((f) => f.endsWith(".tmp"))
      expect(remaining).toEqual([])
    })
  })

  describe("upsertIntentLockState", () => {
    it("returns a deep clone of the persisted state", () => {
      const state: IntentLockState = {
        sessionId: SAFE_SESSION_ID,
        state: IntentState.LOCKED_CODE_CHANGE,
        lastTransitionAt: 5,
        history: [],
      }
      const returned = upsertIntentLockState(projectRoot, state)
      expect(returned).not.toBe(state)
      expect(returned.state).toBe(IntentState.LOCKED_CODE_CHANGE)
    })
  })

  describe("clearIntentLockCache", () => {
    it("forces the next read to hit the disk", () => {
      const state: IntentLockState = {
        sessionId: SAFE_SESSION_ID,
        state: IntentState.LOCKED_CODE_CHANGE,
        lastTransitionAt: 5,
        history: [],
      }
      persistIntentLockState(projectRoot, state)

      // First read populates the cache
      const first = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(first.state).toBe(IntentState.LOCKED_CODE_CHANGE)

      // Clear and mutate the file directly
      clearIntentLockCache()
      const filePath = getIntentLockFilePath(projectRoot, SAFE_SESSION_ID)
      require("node:fs").unlinkSync(filePath)

      // Next read should return default state (cache cleared + file missing)
      const second = readIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(second.state).toBe(IntentState.UNLOCKED)
    })
  })

  describe("getOrCreateIntentLockState", () => {
    it("lazily initializes a default state on first call", () => {
      const state = getOrCreateIntentLockState(projectRoot, SAFE_SESSION_ID)
      expect(state.state).toBe(IntentState.UNLOCKED)
      expect(state.sessionId).toBe(SAFE_SESSION_ID)
    })
  })

  // -----------------------------------------------------------------------
  // T5 — Session-Scoped Override (AC-37b)
  // -----------------------------------------------------------------------
  describe("T5: session-scoped override", () => {
    describe("readSessionOverride", () => {
      it("AC-37: returns undefined when no override file exists", () => {
        const result = readSessionOverride(projectRoot, "ses_no_override")
        expect(result).toBeUndefined()
      })

      it("AC-37: reads override file with disabled: true", () => {
        // Create override file
        const overrideDir = join(projectRoot, ".hivemind", "intent-lock")
        require("node:fs").mkdirSync(overrideDir, { recursive: true })
        const overridePath = join(overrideDir, "ses_override_test.override.json")
        writeFileSync(
          overridePath,
          JSON.stringify({ disabled: true, createdAt: Date.now() }),
          "utf-8",
        )

        const result = readSessionOverride(projectRoot, "ses_override_test")
        expect(result).toBeDefined()
        expect(result?.disabled).toBe(true)
        expect(result?.createdAt).toBeGreaterThan(0)
      })

      it("returns undefined when override file has disabled: false", () => {
        const overrideDir = join(projectRoot, ".hivemind", "intent-lock")
        require("node:fs").mkdirSync(overrideDir, { recursive: true })
        const overridePath = join(overrideDir, "ses_false_override.override.json")
        writeFileSync(
          overridePath,
          JSON.stringify({ disabled: false, createdAt: Date.now() }),
          "utf-8",
        )

        const result = readSessionOverride(projectRoot, "ses_false_override")
        expect(result).toBeUndefined()
      })
    })

    describe("deleteSessionOverride", () => {
      it("AC-37b: deletes override file", () => {
        // Create override file
        const overrideDir = join(projectRoot, ".hivemind", "intent-lock")
        require("node:fs").mkdirSync(overrideDir, { recursive: true })
        const overridePath = join(overrideDir, "ses_delete_test.override.json")
        writeFileSync(
          overridePath,
          JSON.stringify({ disabled: true, createdAt: Date.now() }),
          "utf-8",
        )
        expect(existsSync(overridePath)).toBe(true)

        deleteSessionOverride(projectRoot, "ses_delete_test")
        expect(existsSync(overridePath)).toBe(false)
      })

      it("does not throw when override file does not exist", () => {
        expect(() => deleteSessionOverride(projectRoot, "ses_no_file")).not.toThrow()
      })
    })
  })
})
