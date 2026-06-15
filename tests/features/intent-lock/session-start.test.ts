/**
 * Tests for runSessionStartFlow (P27.2 T6, REQ-2, REQ-3).
 *
 * Evidence label: runtime-truthful (small). Tests the public seam of
 * runSessionStartFlow.
 */

import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, it, expect, beforeEach } from "vitest"

import { IntentState } from "../../../src/features/intent-lock/types.js"
import { runSessionStartFlow } from "../../../src/features/intent-lock/session-start.js"

function makeProjectRoot(): string {
  const dir = mkdtempSync(join(tmpdir(), "hm-session-start-"))
  // Create .hivemind/intent-lock/
  mkdirSync(join(dir, ".hivemind", "intent-lock"), { recursive: true })
  return dir
}

function writeState(
  root: string,
  sessionId: string,
  state: IntentState,
  overrides: Record<string, unknown> = {},
): void {
  const base: Record<string, unknown> = {
    sessionId,
    state,
    phaseId: "P27.2-test",
    summary: "Test summary for session start flow",
    intentId: "INT-20260610-a1b2c3",
    isCodeChange: state !== IntentState.UNLOCKED,
    lastTransitionAt: Date.now(),
    history: [],
    ...overrides,
  }
  writeFileSync(
    join(root, ".hivemind", "intent-lock", `${sessionId}.json`),
    JSON.stringify(base, null, 2),
    "utf-8",
  )
}

describe("runSessionStartFlow", () => {
  let root: string
  let testCounter = 0

  /** Unique session ID per test to avoid in-memory cache collision. */
  function sessionId(): string {
    testCounter++
    return `ses_start_${testCounter}`
  }

  beforeEach(() => {
    root = makeProjectRoot()
  })

  it("returns isNewSession:true when state file is absent", () => {
    const sid = sessionId()
    const result = runSessionStartFlow(root, sid, "implement the new feature")
    expect(result.isNewSession).toBe(true)
    expect(result.sessionId).toBe(sid)
  })

  it("classifies user prompt in new session", () => {
    const sid = sessionId()
    const result = runSessionStartFlow(root, sid, "how does the gate work")
    expect(result.isNewSession).toBe(true)
    expect(result.classification).toBeDefined()
    expect(result.classification!.category).toBe("RESEARCH")
    expect(result.classification!.confidence).toBeGreaterThanOrEqual(0.6)
  })

  it("returns isNewSession:true without classification for empty prompt", () => {
    const sid = sessionId()
    const result = runSessionStartFlow(root, sid)
    expect(result.isNewSession).toBe(true)
    expect(result.classification).toBeUndefined()
  })

  it("returns isNewSession:true when state is UNLOCKED", () => {
    const sid = sessionId()
    writeState(root, sid, IntentState.UNLOCKED)
    const result = runSessionStartFlow(root, sid)
    expect(result.isNewSession).toBe(true)
  })

  it("returns shouldAskContinuity for EXECUTING state", () => {
    const sid = sessionId()
    writeState(root, sid, IntentState.EXECUTING, {
      summary: "Implement the new feature",
    })
    const result = runSessionStartFlow(root, sid)
    expect(result.isNewSession).toBe(false)
    expect(result.shouldAskContinuity).toBe(true)
    expect(result.previousSession).toBe(sid)
    expect(result.previousState).toBe(IntentState.EXECUTING)
  })

  it("returns shouldAskContinuity for LOCKED_CODE_CHANGE state", () => {
    const sid = sessionId()
    writeState(root, sid, IntentState.LOCKED_CODE_CHANGE)
    const result = runSessionStartFlow(root, sid)
    expect(result.isNewSession).toBe(false)
    expect(result.shouldAskContinuity).toBe(true)
    expect(result.previousState).toBe(IntentState.LOCKED_CODE_CHANGE)
  })

  it("returns shouldAskContinuity:false for COMPLETED state", () => {
    const sid = sessionId()
    writeState(root, sid, IntentState.COMPLETED)
    const result = runSessionStartFlow(root, sid)
    expect(result.isNewSession).toBe(false)
    expect(result.shouldAskContinuity).toBe(false)
  })

  it("returns shouldAskContinuity:false for LOCKED_NON_CODE state", () => {
    const sid = sessionId()
    writeState(root, sid, IntentState.LOCKED_NON_CODE)
    const result = runSessionStartFlow(root, sid)
    expect(result.isNewSession).toBe(false)
    expect(result.shouldAskContinuity).toBe(false)
  })
})
