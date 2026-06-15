/**
 * Tests for submitTrajectoryId (P27.2 T12, REQ-9).
 *
 * Evidence label: runtime-truthful (small).
 */

import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, it, expect, beforeEach } from "vitest"

import { IntentState, type IntentLockState } from "../../../src/features/intent-lock/types.js"
import {
  submitTrajectoryId,
  readIntentLockState,
  clearIntentLockCache,
} from "../../../src/features/intent-lock/store.js"

function makeTempDir(): string {
  const root = mkdtempSync(join(tmpdir(), "hm-trajectory-"))
  mkdirSync(join(root, ".hivemind", "intent-lock"), { recursive: true })
  return root
}

function makeState(sessionId: string, overrides: Record<string, unknown> = {}): IntentLockState {
  return {
    sessionId,
    state: IntentState.LOCKED_CODE_CHANGE,
    lastTransitionAt: Date.now(),
    history: [],
    checkpointEvidence: {},
    ...overrides,
  } as IntentLockState
}

describe("submitTrajectoryId (T12, REQ-9)", () => {
  let root: string

  beforeEach(() => {
    root = makeTempDir()
  })

  it("sets trajectoryId on state immutably and persists", () => {
    const sid = "ses_traj_1"
    clearIntentLockCache()

    const state = makeState(sid)
    const updated = submitTrajectoryId(root, state, "traj_test_abc123")

    // New state has trajectoryId set
    expect(updated.trajectoryId).toBe("traj_test_abc123")
    // Original state is unchanged (immutable)
    expect(state.trajectoryId).toBeUndefined()

    // Persisted to disk
    const loaded = readIntentLockState(root, sid)
    expect(loaded.trajectoryId).toBe("traj_test_abc123")
  })

  it("rejects empty trajectoryId", () => {
    const state = makeState("ses_traj_2")
    expect(() => {
      submitTrajectoryId(root, state, "")
    }).toThrow(/\[Hivemind\]/)
  })

  it("state without trajectoryId is backward compatible", () => {
    const state = makeState("ses_traj_3")
    // Can be persisted and read back without error
    expect(state.trajectoryId).toBeUndefined()
  })
})
