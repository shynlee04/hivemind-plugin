import { describe, it, expect, vi } from "vitest"
import { createDelegationConsumer } from "../../src/hooks/observers/delegation-consumer.js"
import type { DelegationConsumerDeps } from "../../src/hooks/observers/delegation-consumer.js"
import type { DelegationEventFact } from "../../src/hooks/observers/event-observers.js"

describe("delegation — delegation-consumer", () => {
  function createDeps(overrides?: Partial<DelegationConsumerDeps>): DelegationConsumerDeps {
    return {
      observer: vi.fn(),
      handleSessionIdle: vi.fn(),
      handleSessionDeleted: vi.fn(),
      ...overrides,
    }
  }

  it("creates a handler function", () => {
    const deps = createDeps()
    const handler = createDelegationConsumer(deps)
    expect(handler).toBeInstanceOf(Function)
  })

  it("calls handleSessionIdle when fact is delegation-session-idle", async () => {
    const handleSessionIdle = vi.fn()
    const observer = vi.fn().mockResolvedValue({
      kind: "delegation-session-idle",
      sessionId: "ses_001",
    } satisfies DelegationEventFact)
    const deps = createDeps({ observer, handleSessionIdle })
    const handler = createDelegationConsumer(deps)

    await handler({ event: { type: "session.idle", sessionID: "ses_001" } })

    expect(handleSessionIdle).toHaveBeenCalledWith("ses_001")
  })

  it("calls handleSessionDeleted when fact is delegation-session-deleted", async () => {
    const handleSessionDeleted = vi.fn()
    const observer = vi.fn().mockResolvedValue({
      kind: "delegation-session-deleted",
      sessionId: "ses_002",
    } satisfies DelegationEventFact)
    const deps = createDeps({ observer, handleSessionDeleted })
    const handler = createDelegationConsumer(deps)

    await handler({ event: { type: "session.deleted", sessionID: "ses_002" } })

    expect(handleSessionDeleted).toHaveBeenCalledWith("ses_002")
  })

  it("calls handleSessionError when fact is delegation-session-error and handler is provided", async () => {
    const handleSessionError = vi.fn()
    const observer = vi.fn().mockResolvedValue({
      kind: "delegation-session-error",
      sessionId: "ses_003",
      error: "timeout",
    } satisfies DelegationEventFact)
    const deps = createDeps({ observer, handleSessionError })
    const handler = createDelegationConsumer(deps)

    await handler({ event: { type: "session.error", sessionID: "ses_003" } })

    expect(handleSessionError).toHaveBeenCalledWith("ses_003", "timeout")
  })

  it("does not crash when handleSessionError is undefined", async () => {
    const observer = vi.fn().mockResolvedValue({
      kind: "delegation-session-error",
      sessionId: "ses_004",
      error: "crash",
    } satisfies DelegationEventFact)
    const deps = createDeps({ observer, handleSessionError: undefined })
    const handler = createDelegationConsumer(deps)

    await expect(
      handler({ event: { type: "session.error", sessionID: "ses_004" } }),
    ).resolves.toBeUndefined()
  })

  it("does nothing when fact kind is ignored", async () => {
    const handleSessionIdle = vi.fn()
    const handleSessionDeleted = vi.fn()
    const observer = vi.fn().mockResolvedValue({ kind: "ignored" } satisfies DelegationEventFact)
    const deps = createDeps({ observer, handleSessionIdle, handleSessionDeleted })
    const handler = createDelegationConsumer(deps)

    await handler({ event: { type: "session.updated", sessionID: "ses_005" } })

    expect(handleSessionIdle).not.toHaveBeenCalled()
    expect(handleSessionDeleted).not.toHaveBeenCalled()
  })

  it("passes the event to the observer", async () => {
    const observer = vi.fn().mockResolvedValue({ kind: "ignored" } satisfies DelegationEventFact)
    const deps = createDeps({ observer })
    const handler = createDelegationConsumer(deps)

    const eventPayload = { event: { type: "session.updated", sessionID: "ses_006" } }
    await handler(eventPayload)

    expect(observer).toHaveBeenCalledWith(eventPayload)
  })
})
