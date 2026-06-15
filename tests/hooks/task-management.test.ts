import { describe, it, expect, vi } from "vitest"
import { createDelegationEventObserver } from "../../src/hooks/observers/event-observers.js"

describe("task-management — delegation-event-observer", () => {
  it("returns delegation-session-idle for session.idle events", async () => {
    const observer = createDelegationEventObserver(vi.fn())
    const fact = await observer({ event: { type: "session.idle", sessionID: "ses_001" } })
    expect(fact).toEqual({ kind: "delegation-session-idle", sessionId: "ses_001" })
  })

  it("returns delegation-session-error for session.error events", async () => {
    const observer = createDelegationEventObserver(vi.fn())
    const fact = await observer({ event: { type: "session.error", sessionID: "ses_002", error: "timeout" } })
    expect(fact).toEqual({ kind: "delegation-session-error", sessionId: "ses_002", error: "timeout" })
  })

  it("returns delegation-session-deleted for session.deleted events", async () => {
    const observer = createDelegationEventObserver(vi.fn())
    const fact = await observer({ event: { type: "session.deleted", sessionID: "ses_003" } })
    expect(fact).toEqual({ kind: "delegation-session-deleted", sessionId: "ses_003" })
  })

  it("returns ignored for session.updated events", async () => {
    const observer = createDelegationEventObserver(vi.fn())
    const fact = await observer({ event: { type: "session.updated", sessionID: "ses_004" } })
    expect(fact).toEqual({ kind: "ignored" })
  })

  it("returns ignored when event has no type", async () => {
    const observer = createDelegationEventObserver(vi.fn())
    const fact = await observer({ event: { sessionID: "ses_005" } })
    expect(fact).toEqual({ kind: "ignored" })
  })

  it("returns ignored when event has no sessionID", async () => {
    const observer = createDelegationEventObserver(vi.fn())
    const fact = await observer({ event: { type: "session.idle" } })
    expect(fact).toEqual({ kind: "ignored" })
  })

  it("returns ignored for unrecognized event types", async () => {
    const observer = createDelegationEventObserver(vi.fn())
    const fact = await observer({ event: { type: "session.created", sessionID: "ses_006" } })
    expect(fact).toEqual({ kind: "ignored" })
  })
})
