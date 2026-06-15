import { describe, it, expect } from "vitest"
import { createSessionIsMainObserver } from "../../../src/hooks/observers/event-observers.js"

// ===========================================================================
// createSessionIsMainObserver (BOOT-09-01-T3)
// ===========================================================================

function makeSessionCreatedEvent(
  sessionId: string,
  parentId: string | null | undefined,
): { type: string; properties: { info: { id: string; parentID?: string | null; title: string; version: string; time: { created: number; updated: number } } } } {
  const session: Record<string, unknown> = {
    id: sessionId,
    title: "test",
    version: "1",
    time: { created: Date.now(), updated: Date.now() },
  }
  if (parentId !== undefined) {
    session.parentID = parentId
  }
  return {
    type: "session.created",
    properties: { info: session as any },
  }
}

describe("createSessionIsMainObserver", () => {
  it("returns observer and isMainSession functions", () => {
    const result = createSessionIsMainObserver()
    expect(result).toHaveProperty("observer")
    expect(result).toHaveProperty("isMainSession")
    expect(typeof result.observer).toBe("function")
    expect(typeof result.isMainSession).toBe("function")
  })

  it("stores session as main when event has no parentID", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = makeSessionCreatedEvent("ses_main", undefined)
    await observer({ event })
    expect(isMainSession("ses_main")).toBe(true)
  })

  it("does NOT store session when parentID exists", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = makeSessionCreatedEvent("ses_child", "ses_parent")
    await observer({ event })
    expect(isMainSession("ses_child")).toBe(false)
  })

  it("isMainSession returns true for uncached session ID (default-to-main)", () => {
    const { isMainSession } = createSessionIsMainObserver()
    // Before ANY events fire, system.transform may call isMainSession.
    // Must return true to enable language injection (safe default).
    // Once the observer processes the session.created event, the cache
    // will have the correct value.
    expect(isMainSession("ses_unknown")).toBe(true)
  })

  it("handles null parentID as main session", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = makeSessionCreatedEvent("ses_null_parent", null)
    await observer({ event })
    // getEventParentID(null) returns undefined (asString(null) === undefined)
    expect(isMainSession("ses_null_parent")).toBe(true)
  })

  it("ignores non-session.created event types — session NOT cached, defaults to true", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = {
      type: "session.deleted",
      properties: {
        info: { id: "ses_other", parentID: undefined, title: "t", version: "1", time: { created: 1, updated: 1 } },
      },
    }
    await observer({ event })
    // Session was NOT cached (non-session.created event ignored).
    // Uncached sessions default to true to avoid blocking language injection
    // when system.transform fires before the event observer runs.
    expect(isMainSession("ses_other")).toBe(true)
  })

  it("ignores events with no sessionId — no cache entry, defaults to true", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = {
      type: "session.created",
      properties: {
        info: { title: "no-id", version: "1", time: { created: 1, updated: 1 } },
      },
    }
    await observer({ event })
    // No session cached (couldn't extract ID).
    // Uncached sessions default to true.
    expect(isMainSession("")).toBe(true)
  })

  it("returns true for uncached session before any event is processed", () => {
    const { isMainSession } = createSessionIsMainObserver()
    // Before ANY events fire, system.transform may call isMainSession.
    // Must return true to enable language injection (safe default).
    expect(isMainSession("ses_fresh")).toBe(true)
  })
})
