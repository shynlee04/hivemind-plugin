import { describe, it, expect, vi, beforeEach } from "vitest"
import { createSessionMainConsumer } from "../../../src/hooks/observers/session-main-consumer.js"

describe("createSessionMainConsumer", () => {
  const mockObserver = vi.fn<[input: { event?: unknown }], Promise<void>>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a function", () => {
    const consumer = createSessionMainConsumer(mockObserver)
    expect(typeof consumer).toBe("function")
  })

  it("calls the injected observer with event payload", async () => {
    mockObserver.mockResolvedValue(undefined)
    const consumer = createSessionMainConsumer(mockObserver)
    await consumer({ event: { type: "session.created" } })
    expect(mockObserver).toHaveBeenCalledWith({ event: { type: "session.created" } })
  })

  it("does not throw when observer fails — catches error silently", async () => {
    mockObserver.mockRejectedValue(new Error("boom"))
    const consumer = createSessionMainConsumer(mockObserver)
    await expect(consumer({ event: {} })).resolves.toBeUndefined()
  })

  it("handles null/undefined event without crashing", async () => {
    mockObserver.mockResolvedValue(undefined)
    const consumer = createSessionMainConsumer(mockObserver)
    await expect(consumer({ event: null })).resolves.toBeUndefined()
    await expect(consumer({ event: undefined })).resolves.toBeUndefined()
  })
})
