import { describe, it, expect } from "vitest"
import { inferContinuityStatusFromEvent } from "../../src/shared/runtime.js"

describe("inferContinuityStatusFromEvent", () => {
  // Test 1: session.created → "pending"
  it('returns "pending" for session.created events', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.created" },
      eventType: "session.created",
    })
    expect(result).toBe("pending")
  })

  // Test 2: failed status signal → "failed"
  it('returns "failed" for events with {status: {type: "failed"}} nested signal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: { type: "failed" } } },
      eventType: "session.updated",
    })
    expect(result).toBe("failed")
  })

  // Test 3: error status signal → "failed"
  it('returns "failed" for events with "error" status signal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "error" } },
      eventType: "session.updated",
    })
    expect(result).toBe("failed")
  })

  // Test 4: cancelled status signal → "failed"
  it('returns "failed" for events with "cancelled" status signal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "cancelled" } },
      eventType: "session.updated",
    })
    expect(result).toBe("failed")
  })

  // Test 5: busy signal → "running"
  it('returns "running" for events with "busy" status signal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "busy" } },
      eventType: "session.updated",
      existingLastToolActivityAt: Date.now(),
    })
    expect(result).toBe("running")
  })

  // Test 6: running status signal → "running"
  it('returns "running" for events with "running" status signal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "running" } },
      eventType: "session.updated",
      existingLastToolActivityAt: Date.now(),
    })
    expect(result).toBe("running")
  })

  // Test 7: "idle" status signal → "completed" (default)
  it('returns "completed" for idle status signal when not pending and not terminal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.idle", status: "idle" },
      eventType: "session.updated",
      currentStatus: "running",
    })
    expect(result).toBe("completed")
  })

  // Test 8: "completed" status signal → "completed"
  it('returns "completed" for events with "completed" status signal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "completed" } },
      eventType: "session.updated",
      currentStatus: "running",
    })
    expect(result).toBe("completed")
  })

  // Test 9: Terminal preservation — currentStatus="failed" with idle status signal → stays "failed"
  it('preserves "failed" status when currentStatus is "failed" and idle status signal arrives', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", status: "idle" },
      eventType: "session.updated",
      currentStatus: "failed",
    })
    expect(result).toBe("failed")
  })

  // Test 10: requireEvidence with pending status and busy signal → stays "pending"
  it("blocks running inference when requireEvidence is true and no existingLastToolActivityAt", () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "busy" } },
      eventType: "session.updated",
      requireEvidence: true,
      currentStatus: "pending",
    })
    expect(result).toBe("pending")
  })

  // Test 11: requireEvidence with running status and busy signal → returns "running" (already running)
  it('returns "running" when already "running" with busy signal', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "busy" } },
      eventType: "session.updated",
      requireEvidence: true,
      currentStatus: "running",
      existingLastToolActivityAt: Date.now(),
    })
    expect(result).toBe("running")
  })

  // Test 12: No recognizable status signal → returns undefined
  it("returns undefined for events with no recognizable status signal and no matching eventType", () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "some.other.event" },
      eventType: "some.other.event",
    })
    expect(result).toBeUndefined()
  })

  // Bonus: session.updated with no status signal preserves currentStatus
  it("returns currentStatus for session.updated events without status signal match", () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: {} },
      eventType: "session.updated",
      currentStatus: "running",
    })
    expect(result).toBe("running")
  })

  // Bonus: "done" status signal → "completed" equivalent
  it('treats "done" status signal as completed', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", properties: { status: "done" } },
      eventType: "session.updated",
      currentStatus: "running",
    })
    expect(result).toBe("completed")
  })

  // Bonus: terminal error preservation
  it('preserves "error" currentStatus as terminal when idle signal arrives', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", status: "idle" },
      eventType: "session.updated",
      currentStatus: "error",
    })
    expect(result).toBe("error")
  })

  // Bonus: pending → "running" on completion signal
  it('returns "running" (not "completed") when currentStatus is "pending" and idle signal arrives', () => {
    const result = inferContinuityStatusFromEvent({
      event: { type: "session.updated", status: "idle" },
      eventType: "session.updated",
      currentStatus: "pending",
    })
    expect(result).toBe("running")
  })
})
