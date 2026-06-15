/**
 * Tests for completeIntentWithUnblock (P27.2 T18, REQ-22).
 *
 * Evidence label: runtime-truthful (small).
 */

import { describe, it, expect } from "vitest"

import { IntentState, HarnessStateError } from "../../../src/features/intent-lock/types.js"
import {
  completeIntentWithUnblock,
  completeIntent,
  isTerminalState,
} from "../../../src/features/intent-lock/state-machine.js"

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: "ses_test_unblock",
    state: IntentState.EXECUTING,
    lastTransitionAt: Date.now(),
    history: [],
    checkpointEvidence: {},
    ...overrides,
  }
}

describe("completeIntentWithUnblock (T18, REQ-22)", () => {
  it("returns COMPLETED and isTerminalState is true", () => {
    const state = makeState()
    const result = completeIntentWithUnblock(state, { enabled: false })
    expect(result.state).toBe(IntentState.COMPLETED)
    expect(isTerminalState(result.state)).toBe(true)
  })

  it("with enabled:true raises HarnessStateError", () => {
    const state = makeState()
    expect(() => {
      completeIntentWithUnblock(state, { enabled: true })
    }).toThrow(HarnessStateError)
  })

  it("failure message contains remediation guidance", () => {
    const state = makeState()
    expect(() => {
      completeIntentWithUnblock(state, { enabled: true })
    }).toThrow(/set to false/i)
  })

  it("backward compat: completeIntent still works unchanged", () => {
    const state = makeState()
    const result = completeIntent(state)
    expect(result.state).toBe(IntentState.COMPLETED)
  })
})
