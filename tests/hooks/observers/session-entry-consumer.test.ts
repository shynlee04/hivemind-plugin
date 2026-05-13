import { describe, it, expect, vi, beforeEach } from "vitest"
import { createSessionEntryConsumer } from "../../../src/hooks/observers/session-entry-consumer.js"
import type { SessionEntryEventFact } from "../../../src/hooks/observers/event-observers.js"

describe("createSessionEntryConsumer", () => {
  const mockObserver = vi.fn<[input: { event?: unknown }], Promise<SessionEntryEventFact>>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a function", () => {
    const consumer = createSessionEntryConsumer(mockObserver)
    expect(typeof consumer).toBe("function")
  })

  it("calls the injected observer with event payload", async () => {
    mockObserver.mockResolvedValue({ kind: "ignored" })
    const consumer = createSessionEntryConsumer(mockObserver)
    await consumer({ event: { type: "session.created" } })
    expect(mockObserver).toHaveBeenCalledWith({ event: { type: "session.created" } })
  })

  it("does not throw when observer fails — catches error silently", async () => {
    mockObserver.mockRejectedValue(new Error("boom"))
    const consumer = createSessionEntryConsumer(mockObserver)
    await expect(consumer({ event: {} })).resolves.toBeUndefined()
  })

  it("handles null/undefined event without crashing", async () => {
    mockObserver.mockResolvedValue({ kind: "ignored" })
    const consumer = createSessionEntryConsumer(mockObserver)
    await expect(consumer({ event: null })).resolves.toBeUndefined()
    await expect(consumer({ event: undefined })).resolves.toBeUndefined()
  })
})
