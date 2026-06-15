/**
 * Tests for transitionWithCheckpoint — auto-invoke pre_executing (P27.2 T15, REQ-15).
 *
 * Evidence label: runtime-truthful (small). The checkpointInvoker is mocked;
 * state-machine functions are real.
 */

import { describe, it, expect } from "vitest"

import { IntentState, IntentLockStateTransitionError } from "../../../src/features/intent-lock/types.js"
import {
  transitionWithCheckpoint,
  transitionToExecuting,
} from "../../../src/features/intent-lock/state-machine.js"

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    sessionId: "ses_test_c13",
    state: IntentState.PHASE_AUTHORIZED,
    lastTransitionAt: Date.now(),
    history: [],
    checkpointEvidence: {},
    ...overrides,
  }
}

describe("transitionWithCheckpoint (T15, REQ-15)", () => {
  it("calls checkpointInvoker when transitioning to EXECUTING", async () => {
    const state = makeState()
    let invokedCheckpoint: string | undefined

    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      async (checkpoint) => {
        invokedCheckpoint = checkpoint
        return "ACCEPTED" as const
      },
      "abc123def456abc123def456abc123def456abc1",
    )

    expect(invokedCheckpoint).toBe("pre_executing")
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  it("on ACCEPTED: transition completes to EXECUTING", async () => {
    const state = makeState()
    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      async () => "ACCEPTED" as const,
      "abc123def456abc123def456abc123def456abc2",
    )
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  it("on REJECTED: throws IntentLockStateTransitionError with Review intent", async () => {
    const state = makeState()
    await expect(
      transitionWithCheckpoint(
        state,
        IntentState.EXECUTING,
        async () => "REJECTED" as const,
        "abc123def456abc123def456abc123def456abc3",
      ),
    ).rejects.toThrow(IntentLockStateTransitionError)
  })

  it("on TIMEOUT: transition proceeds", async () => {
    const state = makeState()
    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      async () => "TIMEOUT" as const,
      "abc123def456abc123def456abc123def456abc4",
    )
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  it("without checkpointInvoker: behaves like transitionToExecuting", async () => {
    const state = makeState()
    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      undefined,
      "abc123def456abc123def456abc123def456abc5",
    )
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  it("backward compat: transitionToExecuting still works unchanged", () => {
    const state = makeState({ state: IntentState.PHASE_AUTHORIZED })
    const result = transitionToExecuting(state, "abc123def456abc123def456abc123def456abc6")
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  // P27.2 T17: pre_verifying checkpoint
  const VERIFIER = "abc123def456abc123def456abc123def456abc7"

  it("[T17] auto-invokes pre_verifying with verifying=true option", async () => {
    const state = makeState({ state: IntentState.EXECUTING })
    let invokedCheckpoint: string | undefined

    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      async (checkpoint) => {
        invokedCheckpoint = checkpoint
        return "ACCEPTED" as const
      },
      VERIFIER,
      { verifying: true },
    )

    expect(invokedCheckpoint).toBe("pre_verifying")
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  it("[T17] on ACCEPTED: transition completes", async () => {
    const state = makeState({ state: IntentState.EXECUTING })
    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      async () => "ACCEPTED" as const,
      VERIFIER,
      { verifying: true },
    )
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  it("[T17] on REJECTED: state stays EXECUTING", async () => {
    const state = makeState({ state: IntentState.EXECUTING })
    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      async () => "REJECTED" as const,
      VERIFIER,
      { verifying: true },
    )
    expect(result.state).toBe(IntentState.EXECUTING)
  })

  it("[T17] on TIMEOUT: transition proceeds", async () => {
    const state = makeState({ state: IntentState.EXECUTING })
    const result = await transitionWithCheckpoint(
      state,
      IntentState.EXECUTING,
      async () => "TIMEOUT" as const,
      VERIFIER,
      { verifying: true },
    )
    expect(result.state).toBe(IntentState.EXECUTING)
  })
})
