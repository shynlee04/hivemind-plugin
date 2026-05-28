import { describe, it, expect, vi } from "vitest"
import { createSessionTrackerConsumer } from "../../src/hooks/observers/session-tracker-consumer.js"
import type { SessionTrackerConsumerDeps } from "../../src/hooks/observers/session-tracker-consumer.js"

describe("session-tracker — session-tracker-consumer", () => {
  function createDeps(overrides?: Partial<SessionTrackerConsumerDeps>): SessionTrackerConsumerDeps {
    return {
      sessionTracker: { handleSessionEvent: vi.fn() },
      ...overrides,
    }
  }

  it("creates a handler function", () => {
    const deps = createDeps()
    const handler = createSessionTrackerConsumer(deps)
    expect(handler).toBeInstanceOf(Function)
  })

  it("calls handleSessionEvent with extracted eventType and sessionID", async () => {
    const handleSessionEvent = vi.fn()
    const deps = createDeps({ sessionTracker: { handleSessionEvent } })
    const handler = createSessionTrackerConsumer(deps)

    await handler({ event: { type: "session.created", sessionID: "ses_001" } })

    expect(handleSessionEvent).toHaveBeenCalledWith({
      eventType: "session.created",
      sessionID: "ses_001",
      event: { type: "session.created", sessionID: "ses_001" },
    })
  })

  it("does not call handleSessionEvent when sessionID is empty", async () => {
    const handleSessionEvent = vi.fn()
    const deps = createDeps({ sessionTracker: { handleSessionEvent } })
    const handler = createSessionTrackerConsumer(deps)

    await handler({ event: { type: "session.created" } })

    expect(handleSessionEvent).not.toHaveBeenCalled()
  })

  it("does not call handleSessionEvent when event is empty", async () => {
    const handleSessionEvent = vi.fn()
    const deps = createDeps({ sessionTracker: { handleSessionEvent } })
    const handler = createSessionTrackerConsumer(deps)

    await handler({ event: {} })

    expect(handleSessionEvent).not.toHaveBeenCalled()
  })

  it("falls back to eventType field when type is absent", async () => {
    const handleSessionEvent = vi.fn()
    const deps = createDeps({ sessionTracker: { handleSessionEvent } })
    const handler = createSessionTrackerConsumer(deps)

    await handler({ event: { eventType: "custom.event", sessionID: "ses_002" } })

    expect(handleSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "custom.event", sessionID: "ses_002" }),
    )
  })

  it("calls logWarn when handleSessionEvent throws", async () => {
    const handleSessionEvent = vi.fn().mockRejectedValue(new Error("tracker error"))
    const logWarn = vi.fn()
    const deps = createDeps({ sessionTracker: { handleSessionEvent }, logWarn })
    const handler = createSessionTrackerConsumer(deps)

    await handler({ event: { type: "session.created", sessionID: "ses_err" } })

    expect(logWarn).toHaveBeenCalled()
  })

  it("defaults eventType to 'unknown' when no type fields present", async () => {
    const handleSessionEvent = vi.fn()
    const deps = createDeps({ sessionTracker: { handleSessionEvent } })
    const handler = createSessionTrackerConsumer(deps)

    await handler({ event: { sessionID: "ses_003" } })

    expect(handleSessionEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "unknown", sessionID: "ses_003" }),
    )
  })
})
