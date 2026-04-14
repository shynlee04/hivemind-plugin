import { describe, expect, it } from "vitest"

import {
  IDLE_TIMEOUT_MS,
  FAILURE_RETRY_LIMIT,
  checkIdleTimeout,
  createFailureState,
  incrementRetry,
  isPermanentlyFailed,
  markActivity,
  markIdleStart,
  shouldRetry,
} from "../../../../src/lib/tasking/completion/failure-handler.js"

describe("failure-handler (D-13)", () => {
  it("creates the default failure state with 2 retries and 180s timeout", () => {
    // WHY: D-13 requires maxRetries=2 and idle timeout=180000ms as the canonical defaults.
    const state = createFailureState("ses_child_1")

    expect(state).toEqual({
      maxRetries: FAILURE_RETRY_LIMIT,
      retryCount: 0,
      lastSessionID: "ses_child_1",
      idleSinceMs: null,
      idleTimeoutMs: IDLE_TIMEOUT_MS,
    })
  })

  it("shouldRetry is true before exhaustion and false once retryCount reaches 2", () => {
    // WHY: D-13 allows up to 2 resume-first retries, then terminal failure.
    const initial = createFailureState("ses_child_1")
    const exhausted = { ...initial, retryCount: FAILURE_RETRY_LIMIT }

    expect(shouldRetry(initial)).toBe(true)
    expect(shouldRetry(exhausted)).toBe(false)
  })

  it("markIdleStart records the idle timestamp and timeout stays false before 180s", () => {
    // WHY: D-13 treats idle timeout as elapsed inactivity, not immediate failure.
    const state = markIdleStart(createFailureState("ses_child_1"), 1_000)

    expect(state.idleSinceMs).toBe(1_000)
    expect(checkIdleTimeout(state, 180_999)).toEqual({ timedOut: false, idleDurationMs: 179_999 })
  })

  it("checkIdleTimeout returns timedOut=true after 180 seconds of inactivity", () => {
    // WHY: D-13 defines 180000ms as the failure threshold for idle child sessions.
    const state = markIdleStart(createFailureState("ses_child_1"), 5_000)

    expect(checkIdleTimeout(state, 185_000)).toEqual({ timedOut: true, idleDurationMs: 180_000 })
  })

  it("checkIdleTimeout returns zero duration when no idle window is active", () => {
    const state = createFailureState("ses_child_1")

    expect(checkIdleTimeout(state, 100_000)).toEqual({ timedOut: false, idleDurationMs: 0 })
  })

  it("markActivity clears idleSinceMs back to null", () => {
    // WHY: New evidence should reset inactivity tracking before any retry/failure logic runs.
    const idle = markIdleStart(createFailureState("ses_child_1"), 10_000)

    expect(markActivity(idle)).toEqual({ ...idle, idleSinceMs: null })
  })

  it("incrementRetry returns a new state with retryCount incremented", () => {
    // WHY: Retry accounting must stay immutable and monotonic across resume attempts.
    const state = createFailureState("ses_child_1")
    const next = incrementRetry(state)

    expect(next.retryCount).toBe(1)
    expect(state.retryCount).toBe(0)
  })

  it("resume-first keeps using the same session id across retries", () => {
    // WHY: D-13 explicitly prefers resuming the existing child session instead of creating a new one.
    const initial = createFailureState("ses_child_1")
    const firstRetry = incrementRetry(initial)
    const secondRetry = incrementRetry(firstRetry)

    expect(firstRetry.lastSessionID).toBe("ses_child_1")
    expect(secondRetry.lastSessionID).toBe("ses_child_1")
  })

  it("isPermanentlyFailed becomes true after the retry budget is exhausted", () => {
    // WHY: D-13 requires terminal failure after 2 retries with no infinite loop.
    const initial = createFailureState("ses_child_1")
    const exhausted = incrementRetry(incrementRetry(initial))

    expect(shouldRetry(exhausted)).toBe(false)
    expect(isPermanentlyFailed(exhausted)).toBe(true)
  })
})
