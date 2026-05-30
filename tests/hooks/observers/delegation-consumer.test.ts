import { describe, it, expect, vi, beforeEach } from "vitest"
import { createDelegationConsumer } from "../../../src/hooks/observers/delegation-consumer.js"
import type { DelegationEventFact } from "../../../src/hooks/observers/event-observers.js"

describe("createDelegationConsumer", () => {
  const mockObserver = vi.fn<[input: { event?: unknown }], Promise<DelegationEventFact>>()
  const mockHandleSessionIdle = vi.fn<(sessionId: string) => void>()
  const mockHandleSessionDeleted = vi.fn<(sessionId: string) => void>()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a function", () => {
    const consumer = createDelegationConsumer({
      observer: mockObserver,
      handleSessionIdle: mockHandleSessionIdle,
      handleSessionDeleted: mockHandleSessionDeleted,
    })
    expect(typeof consumer).toBe("function")
  })

  it("calls handleSessionIdle for delegation-session-idle facts", async () => {
    mockObserver.mockResolvedValue({ kind: "delegation-session-idle", sessionId: "ses_abc" })
    const consumer = createDelegationConsumer({
      observer: mockObserver,
      handleSessionIdle: mockHandleSessionIdle,
      handleSessionDeleted: mockHandleSessionDeleted,
    })
    await consumer({ event: {} })
    expect(mockHandleSessionIdle).toHaveBeenCalledWith("ses_abc")
    expect(mockHandleSessionDeleted).not.toHaveBeenCalled()
  })

  it("calls handleSessionDeleted for delegation-session-deleted facts", async () => {
    mockObserver.mockResolvedValue({ kind: "delegation-session-deleted", sessionId: "ses_xyz" })
    const consumer = createDelegationConsumer({
      observer: mockObserver,
      handleSessionIdle: mockHandleSessionIdle,
      handleSessionDeleted: mockHandleSessionDeleted,
    })
    await consumer({ event: {} })
    expect(mockHandleSessionDeleted).toHaveBeenCalledWith("ses_xyz")
    expect(mockHandleSessionIdle).not.toHaveBeenCalled()
  })

  it("calls neither for ignored facts", async () => {
    mockObserver.mockResolvedValue({ kind: "ignored" })
    const consumer = createDelegationConsumer({
      observer: mockObserver,
      handleSessionIdle: mockHandleSessionIdle,
      handleSessionDeleted: mockHandleSessionDeleted,
    })
    await consumer({ event: {} })
    expect(mockHandleSessionIdle).not.toHaveBeenCalled()
    expect(mockHandleSessionDeleted).not.toHaveBeenCalled()
  })
})
