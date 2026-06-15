import { describe, it, expect, vi, beforeEach } from "vitest"
import { createSessionTrackerConsumer } from "../../../src/hooks/observers/session-tracker-consumer.js"

describe("createSessionTrackerConsumer", () => {
  const mockHandleSessionEvent = vi.fn<[input: { eventType: string; sessionID: string; event: unknown }], Promise<void>>()
  const mockSessionTracker = {
    handleSessionEvent: mockHandleSessionEvent,
  }
  const mockLogWarn = vi.fn<(message: string, error: unknown) => void>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a function", () => {
    const consumer = createSessionTrackerConsumer({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    expect(typeof consumer).toBe("function")
  })

  it("calls sessionTracker.handleSessionEvent for valid events with sessionID", async () => {
    mockHandleSessionEvent.mockResolvedValue(undefined)
    const consumer = createSessionTrackerConsumer({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    await consumer({ event: { type: "session.created", properties: { info: { id: "ses_abc" } } } })
    expect(mockHandleSessionEvent).toHaveBeenCalled()
    const call = mockHandleSessionEvent.mock.calls[0]![0]
    expect(call.eventType).toBe("session.created")
    expect(call.sessionID).toBe("ses_abc")
  })

  it("does not throw when sessionTracker.handleSessionEvent fails — calls logWarn", async () => {
    mockHandleSessionEvent.mockRejectedValue(new Error("boom"))
    const consumer = createSessionTrackerConsumer({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    await expect(consumer({ event: { type: "session.created", properties: { info: { id: "ses_abc" } } } })).resolves.toBeUndefined()
    expect(mockLogWarn).toHaveBeenCalled()
  })

  it("skips call when no sessionID is resolved", async () => {
    mockHandleSessionEvent.mockResolvedValue(undefined)
    const consumer = createSessionTrackerConsumer({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    await consumer({ event: { type: "unknown" } })
    expect(mockHandleSessionEvent).not.toHaveBeenCalled()
  })

  it("handles null/undefined event without crashing", async () => {
    const consumer = createSessionTrackerConsumer({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    await expect(consumer({ event: null })).resolves.toBeUndefined()
    await expect(consumer({ event: undefined })).resolves.toBeUndefined()
  })

  it("uses eventType field when type is absent", async () => {
    mockHandleSessionEvent.mockResolvedValue(undefined)
    const consumer = createSessionTrackerConsumer({
      sessionTracker: mockSessionTracker,
      logWarn: mockLogWarn,
    })
    await consumer({ event: { eventType: "session.deleted", properties: { info: { id: "ses_xyz" } } } })
    const call = mockHandleSessionEvent.mock.calls[0]![0]
    expect(call.eventType).toBe("session.deleted")
    expect(call.sessionID).toBe("ses_xyz")
  })
})
