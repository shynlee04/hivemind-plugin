/**
 * Intent-lock checkpoint evidence storage tests (AC-44, AC-45).
 *
 * Verifies that:
 * - The state file's `checkpointEvidence` field round-trips correctly.
 * - Empty state returns `checkpointEvidence: {}`.
 * - `submitCheckpointEvidence` returns `{ accepted: true }` for valid evidence.
 * - `submitCheckpointEvidence` returns `{ accepted: false, reason }` for
 *   empty evidence or empty-string evidence items.
 *
 * Evidence label: transport-mocked — real store functions through
 * public seam with temp directory isolation.
 *
 * Test size: small (single unit, public seam, focused command).
 */
import { existsSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { afterEach, beforeEach, describe, expect, it } from "vitest"

import {
  clearIntentLockCache,
  persistIntentLockState,
  readIntentLockState,
  submitCheckpointEvidence,
} from "../../../src/features/intent-lock/store.js"
import { IntentState, type IntentLockState } from "../../../src/features/intent-lock/types.js"

const SAFE_SESSION_ID = "ses_test_checkpoint"

let projectRoot: string

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "intent-lock-checkpoint-"))
  clearIntentLockCache()
})

afterEach(() => {
  clearIntentLockCache()
  if (existsSync(projectRoot)) {
    rmSync(projectRoot, { recursive: true, force: true })
  }
})

describe("checkpointEvidence field (AC-44)", () => {
  it("AC-44: state file includes checkpointEvidence field after persist", () => {
    const initial: IntentLockState = {
      sessionId: SAFE_SESSION_ID,
      state: IntentState.LOCKED_CODE_CHANGE,
      lastTransitionAt: Date.now(),
      history: [],
      checkpointEvidence: {
        UNLOCKED_to_LOCKED: ["phase P27", "purpose implementation"],
      },
    }
    persistIntentLockState(projectRoot, initial)
    clearIntentLockCache() // force re-read from disk

    const read = readIntentLockState(projectRoot, SAFE_SESSION_ID)
    expect(read.checkpointEvidence).toBeDefined()
    expect(read.checkpointEvidence?.UNLOCKED_to_LOCKED).toEqual([
      "phase P27",
      "purpose implementation",
    ])
  })

  it("AC-44: fresh state has checkpointEvidence: {} (not undefined)", () => {
    const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
    expect(state.checkpointEvidence).toBeDefined()
    expect(state.checkpointEvidence).toEqual({})
  })

  it("AC-44: read returns a deep clone of checkpointEvidence", () => {
    persistIntentLockState(projectRoot, {
      sessionId: SAFE_SESSION_ID,
      state: IntentState.LOCKED_CODE_CHANGE,
      lastTransitionAt: Date.now(),
      history: [],
      checkpointEvidence: { cp1: ["a", "b"] },
    })
    clearIntentLockCache()

    const first = readIntentLockState(projectRoot, SAFE_SESSION_ID)
    // Mutate the returned evidence
    if (first.checkpointEvidence) {
      first.checkpointEvidence.cp1 = ["mutated"]
    }
    // Re-read — should be unaffected
    const second = readIntentLockState(projectRoot, SAFE_SESSION_ID)
    expect(second.checkpointEvidence?.cp1).toEqual(["a", "b"])
  })
})

describe("submitCheckpointEvidence (AC-45)", () => {
  it("AC-45: accepts valid non-empty evidence array and returns { accepted: true }", () => {
    const result = submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      ["committed PLAN.md", "test results captured"],
    )
    expect(result.accepted).toBe(true)
    if (result.accepted) {
      expect(result.checkpointId).toBe("pre_executing")
    }
  })

  it("AC-45: persists accepted evidence to state file", () => {
    submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      ["committed PLAN.md"],
    )
    clearIntentLockCache()
    const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
    expect(state.checkpointEvidence?.pre_executing).toEqual(["committed PLAN.md"])
  })

  it("AC-45: rejects empty evidence array with reason", () => {
    const result = submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      [],
    )
    expect(result.accepted).toBe(false)
    if (!result.accepted) {
      expect(result.reason).toBe("Evidence required")
    }
  })

  it("AC-45: rejects evidence containing empty strings with reason", () => {
    const result = submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      [""],
    )
    expect(result.accepted).toBe(false)
    if (!result.accepted) {
      expect(result.reason).toBe("Evidence items must be non-empty strings")
    }
  })

  it("AC-45: rejects evidence containing whitespace-only strings", () => {
    const result = submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      ["   "],
    )
    expect(result.accepted).toBe(false)
    if (!result.accepted) {
      expect(result.reason).toBe("Evidence items must be non-empty strings")
    }
  })

  it("AC-45: rejects evidence with non-string item", () => {
    const result = submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      // Cast to bypass type check — runtime validation matters
      ["valid", null as unknown as string],
    )
    expect(result.accepted).toBe(false)
    if (!result.accepted) {
      expect(result.reason).toBe("Evidence items must be non-empty strings")
    }
  })

  it("AC-45: replaces existing evidence for the same checkpoint (latest submission wins)", () => {
    submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      ["first submission"],
    )
    submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "pre_executing",
      ["second submission"],
    )
    clearIntentLockCache()
    const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
    expect(state.checkpointEvidence?.pre_executing).toEqual(["second submission"])
  })

  it("AC-45: keeps evidence for different checkpoints separate", () => {
    submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "cp1",
      ["a"],
    )
    submitCheckpointEvidence(
      projectRoot,
      SAFE_SESSION_ID,
      "cp2",
      ["b"],
    )
    clearIntentLockCache()
    const state = readIntentLockState(projectRoot, SAFE_SESSION_ID)
    expect(state.checkpointEvidence?.cp1).toEqual(["a"])
    expect(state.checkpointEvidence?.cp2).toEqual(["b"])
  })
})
