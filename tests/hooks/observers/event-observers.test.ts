import { describe, it, expect } from "vitest"
// @ts-expect-error — createSessionIsMainObserver not yet exported from event-observers.ts (RED)
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

  it("isMainSession returns false for non-cached session ID", () => {
    const { isMainSession } = createSessionIsMainObserver()
    expect(isMainSession("ses_unknown")).toBe(false)
  })

  it("handles null parentID as main session", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = makeSessionCreatedEvent("ses_null_parent", null)
    await observer({ event })
    // getEventParentID(null) returns undefined (asString(null) === undefined)
    expect(isMainSession("ses_null_parent")).toBe(true)
  })

  it("ignores non-session.created event types", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = {
      type: "session.deleted",
      properties: {
        info: { id: "ses_other", parentID: undefined, title: "t", version: "1", time: { created: 1, updated: 1 } },
      },
    }
    await observer({ event })
    expect(isMainSession("ses_other")).toBe(false)
  })

  it("ignores events with no sessionId", async () => {
    const { observer, isMainSession } = createSessionIsMainObserver()
    const event = {
      type: "session.created",
      properties: {
        info: { title: "no-id", version: "1", time: { created: 1, updated: 1 } },
      },
    }
    await observer({ event })
    // No sessions should be cached since we couldn't extract an ID
    expect(isMainSession("")).toBe(false)
  })
})
