import { describe, expect, it } from "vitest"
import { delegationStatusToHarnessStatus } from "../../../../src/shared/types.js"
import {
  DelegationErrorCode,
  createDelegationError,
} from "../../../../src/coordination/delegation/types.js"
import type {
  DelegationError,
  DelegationErrorCode as DelegationErrorCodeType,
} from "../../../../src/coordination/delegation/types.js"

describe("P22-01: delegationStatusToHarnessStatus()", () => {
  it("maps dispatched to pending", () => {
    expect(delegationStatusToHarnessStatus("dispatched")).toBe("pending")
  })

  it("maps running to running", () => {
    expect(delegationStatusToHarnessStatus("running")).toBe("running")
  })

  it("maps completed to completed", () => {
    expect(delegationStatusToHarnessStatus("completed")).toBe("completed")
  })

  it("maps error to error", () => {
    expect(delegationStatusToHarnessStatus("error")).toBe("error")
  })

  it('maps timeout to error (no "timeout" in HarnessStatus)', () => {
    expect(delegationStatusToHarnessStatus("timeout")).toBe("error")
  })

  it("is a pure function — same input always returns same output", () => {
    const first = delegationStatusToHarnessStatus("dispatched")
    const second = delegationStatusToHarnessStatus("dispatched")
    expect(first).toBe(second)
  })
})

describe("P22-02: DelegationErrorCode const union", () => {
  it("is defined and has exactly 12 keys", () => {
    const keys = Object.keys(DelegationErrorCode)
    expect(keys).toHaveLength(12)
  })

  it("contains SLOT_LIMIT_REACHED", () => {
    expect(DelegationErrorCode.SLOT_LIMIT_REACHED).toBe("SLOT_LIMIT_REACHED")
  })

  it("contains SLOT_ACQUIRE_TIMEOUT", () => {
    expect(DelegationErrorCode.SLOT_ACQUIRE_TIMEOUT).toBe("SLOT_ACQUIRE_TIMEOUT")
  })

  it("contains PER_KEY_LIMIT_REACHED", () => {
    expect(DelegationErrorCode.PER_KEY_LIMIT_REACHED).toBe("PER_KEY_LIMIT_REACHED")
  })

  it("contains UNKNOWN_AGENT", () => {
    expect(DelegationErrorCode.UNKNOWN_AGENT).toBe("UNKNOWN_AGENT")
  })

  it("contains CHILD_SESSION_FAILED", () => {
    expect(DelegationErrorCode.CHILD_SESSION_FAILED).toBe("CHILD_SESSION_FAILED")
  })

  it("contains CANNEL_TERMINAL", () => {
    expect(DelegationErrorCode.CANNEL_TERMINAL).toBe("CANNEL_TERMINAL")
  })

  it("contains ADJUST_PROMPT_NO_SESSION", () => {
    expect(DelegationErrorCode.ADJUST_PROMPT_NO_SESSION).toBe("ADJUST_PROMPT_NO_SESSION")
  })

  it("contains CHANGE_AGENT_NO_SESSION", () => {
    expect(DelegationErrorCode.CHANGE_AGENT_NO_SESSION).toBe("CHANGE_AGENT_NO_SESSION")
  })

  it("contains RESUME_NO_PROMPT", () => {
    expect(DelegationErrorCode.RESUME_NO_PROMPT).toBe("RESUME_NO_PROMPT")
  })

  it("contains RUNTIME_NOT_CONFIGURED", () => {
    expect(DelegationErrorCode.RUNTIME_NOT_CONFIGURED).toBe("RUNTIME_NOT_CONFIGURED")
  })

  it("contains QUEUE_KEY_DRIFT", () => {
    expect(DelegationErrorCode.QUEUE_KEY_DRIFT).toBe("QUEUE_KEY_DRIFT")
  })

  it("contains UNKNOWN_ERROR", () => {
    expect(DelegationErrorCode.UNKNOWN_ERROR).toBe("UNKNOWN_ERROR")
  })

  it("type-level: allows assignment of any DelegationErrorCode value", () => {
    // Compile-time check: these must all be assignable to DelegationErrorCodeType
    const codes: DelegationErrorCodeType[] = [
      DelegationErrorCode.SLOT_LIMIT_REACHED,
      DelegationErrorCode.SLOT_ACQUIRE_TIMEOUT,
      DelegationErrorCode.PER_KEY_LIMIT_REACHED,
      DelegationErrorCode.UNKNOWN_AGENT,
      DelegationErrorCode.CHILD_SESSION_FAILED,
      DelegationErrorCode.CANNEL_TERMINAL,
      DelegationErrorCode.ADJUST_PROMPT_NO_SESSION,
      DelegationErrorCode.CHANGE_AGENT_NO_SESSION,
      DelegationErrorCode.RESUME_NO_PROMPT,
      DelegationErrorCode.RUNTIME_NOT_CONFIGURED,
      DelegationErrorCode.QUEUE_KEY_DRIFT,
      DelegationErrorCode.UNKNOWN_ERROR,
    ]
    expect(codes).toHaveLength(12)
  })
})

describe("P22-03: DelegationError interface", () => {
  it("can create an object matching DelegationError shape with all fields", () => {
    const err: DelegationError = {
      code: "SLOT_LIMIT_REACHED",
      message: "Slot limit reached",
      sessionId: "ses_123",
      timestamp: Date.now(),
    }
    expect(err.code).toBe("SLOT_LIMIT_REACHED")
    expect(err.message).toBe("Slot limit reached")
    expect(err.sessionId).toBe("ses_123")
    expect(typeof err.timestamp).toBe("number")
  })

  it("allows sessionId to be undefined", () => {
    const err: DelegationError = {
      code: "UNKNOWN_ERROR",
      message: "Something went wrong",
      timestamp: Date.now(),
    }
    expect(err.sessionId).toBeUndefined()
  })
})

describe("P22-04: createDelegationError() factory", () => {
  it("returns object with given code and message", () => {
    const err = createDelegationError("SLOT_LIMIT_REACHED", "Too many slots")
    expect(err.code).toBe("SLOT_LIMIT_REACHED")
    expect(err.message).toBe("Too many slots")
  })

  it("includes sessionId when provided", () => {
    const err = createDelegationError("UNKNOWN_AGENT", "Agent not found", "ses_456")
    expect(err.sessionId).toBe("ses_456")
  })

  it("leaves sessionId undefined when not provided", () => {
    const err = createDelegationError("QUEUE_KEY_DRIFT", "Queue key drift")
    expect(err.sessionId).toBeUndefined()
  })

  it("sets timestamp to approximately Date.now() within 1000ms", () => {
    const before = Date.now()
    const err = createDelegationError("RUNTIME_NOT_CONFIGURED", "Runtime not configured")
    const after = Date.now()
    expect(err.timestamp).toBeGreaterThanOrEqual(before)
    expect(err.timestamp).toBeLessThanOrEqual(after + 1000)
  })
})
