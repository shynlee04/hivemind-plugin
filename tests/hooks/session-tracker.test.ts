import { describe, it, expect, vi } from "vitest"
import { createSessionTrackerConsumer } from "../../src/hooks/observers/session-tracker-consumer.js"
import type { SessionTrackerConsumerDeps } from "../../src/hooks/observers/session-tracker-consumer.js"

describe("session-tracker — session-tracker-consumer", () => {
  it("deliberately fails — RED phase placeholder", () => {
    const deps: SessionTrackerConsumerDeps = {
      sessionTracker: { handleSessionEvent: vi.fn() },
    }
    const handler = createSessionTrackerConsumer(deps)
    expect(handler).toBeDefined()
    // Deliberately failing assertion
    expect(null).toBeDefined()
  })
})
