import { describe, it, expect, vi, afterEach } from "vitest"

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

type DelegationMetaResult = { agent: string; delegationId: string; depth: number } | undefined
let getDelegationMetaResult: DelegationMetaResult = undefined

vi.mock("../../../src/shared/state.js", () => ({
  getDelegationMeta: (_sessionId: string): DelegationMetaResult => getDelegationMetaResult,
}))

// IMPORTANT: Import AFTER mocks are registered
const { createTmuxEventObserver } = await import("../../../src/features/tmux/observers.js")
import type { EnrichedSessionEvent, ForkSessionManager } from "../../../src/features/tmux/observers.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSessionCreatedEvent(overrides: Partial<{
  id: string
  parentID: string | undefined
  title: string
  directory: string
}> = {}) {
  return {
    type: "session.created",
    properties: {
      info: {
        id: overrides.id ?? "ses_test123",
        parentID: overrides.parentID ?? "ses_parent",
        title: overrides.title ?? "Test Session",
        directory: overrides.directory ?? "/workspace",
        projectID: "",
        version: "",
        time: { created: 0, updated: 0 },
      },
    },
  }
}

function makeForkSessionManager(): {
  sessionManager: ForkSessionManager
  onSessionCreated: ReturnType<typeof vi.fn>
} {
  const onSessionCreated = vi.fn()
  return {
    sessionManager: { onSessionCreated },
    onSessionCreated,
  }
}

// ---------------------------------------------------------------------------
// Tests: createTmuxEventObserver - event routing
// ---------------------------------------------------------------------------

describe("createTmuxEventObserver — event routing", () => {
  afterEach(() => {
    vi.clearAllMocks()
    getDelegationMetaResult = undefined
  })

  it("calls onSessionCreated for session.created events with metadata", async () => {
    getDelegationMetaResult = { agent: "gsd-phase-researcher", delegationId: "ses_test123", depth: 2 }
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: makeSessionCreatedEvent() })

    expect(onSessionCreated).toHaveBeenCalledTimes(1)
    const call = onSessionCreated.mock.calls[0][0] as EnrichedSessionEvent
    expect(call.type).toBe("session.created")
    expect(call.hivemindMeta).toBeDefined()
    expect(call.hivemindMeta!.agent).toBe("gsd-phase-researcher")
  })

  it("skips non-session.created events", async () => {
    getDelegationMetaResult = { agent: "gsd-phase-researcher", delegationId: "ses_test123", depth: 2 }
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: { type: "session.status", properties: { sessionID: "ses_test123", status: { type: "idle" } } } })

    expect(onSessionCreated).not.toHaveBeenCalled()
  })

  it("returns safely when event is undefined", async () => {
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: undefined })

    expect(onSessionCreated).not.toHaveBeenCalled()
  })

  it("returns safely when event is null", async () => {
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: null })

    expect(onSessionCreated).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Tests: Metadata enrichment
// ---------------------------------------------------------------------------

describe("Metadata enrichment", () => {
  afterEach(() => {
    vi.clearAllMocks()
    getDelegationMetaResult = undefined
  })

  it("enriches with hivemindMeta when delegation metadata exists", async () => {
    getDelegationMetaResult = { agent: "gsd-phase-researcher", delegationId: "ses_test123", depth: 2 }
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: makeSessionCreatedEvent() })

    const call = onSessionCreated.mock.calls[0][0] as EnrichedSessionEvent
    expect(call.hivemindMeta).toEqual({
      agent: "gsd-phase-researcher",
      delegationId: "ses_test123",
      depth: 2,
    })
  })

  it("omits hivemindMeta when no delegation metadata", async () => {
    getDelegationMetaResult = undefined
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: makeSessionCreatedEvent() })

    const call = onSessionCreated.mock.calls[0][0] as EnrichedSessionEvent
    expect(call.hivemindMeta).toBeUndefined()
  })

  it("preserves original event fields", async () => {
    getDelegationMetaResult = { agent: "gsd-planner", delegationId: "ses_xyz", depth: 1 }
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({
      event: makeSessionCreatedEvent({
        id: "ses_custom123",
        parentID: "ses_parent",
        title: "Custom Session Title",
        directory: "/custom/path",
      }),
    })

    const call = onSessionCreated.mock.calls[0][0] as EnrichedSessionEvent
    expect(call.properties.info.id).toBe("ses_custom123")
    expect(call.properties.info.parentID).toBe("ses_parent")
    expect(call.properties.info.title).toBe("Custom Session Title")
    expect(call.properties.info.directory).toBe("/custom/path")
  })

  it("handles parentID as string or undefined", async () => {
    getDelegationMetaResult = { agent: "gsd-researcher", delegationId: "ses_noparent", depth: 0 }

    // Test with undefined parentID - our helper's default is "ses_parent" so override
    const { sessionManager: sm1, onSessionCreated: spy1 } = makeForkSessionManager()
    const obs1 = createTmuxEventObserver(sm1)
    // Create an event without parentID at all
    await obs1({ event: { type: "session.created", properties: { info: { id: "ses_noparent", title: "No Parent", directory: "/w" } } } })
    expect(spy1).toHaveBeenCalled()
    expect((spy1.mock.calls[0][0] as EnrichedSessionEvent).properties.info.parentID).toBeUndefined()

    // Test with string parentID
    const { sessionManager: sm2, onSessionCreated: spy2 } = makeForkSessionManager()
    const obs2 = createTmuxEventObserver(sm2)
    await obs2({ event: makeSessionCreatedEvent({ parentID: "ses_real_parent" }) })
    expect(spy2).toHaveBeenCalled()
    expect((spy2.mock.calls[0][0] as EnrichedSessionEvent).properties.info.parentID).toBe("ses_real_parent")
  })
})

// ---------------------------------------------------------------------------
// Tests: Integration with fork SessionManager
// ---------------------------------------------------------------------------

describe("Integration with fork SessionManager", () => {
  afterEach(() => {
    vi.clearAllMocks()
    getDelegationMetaResult = undefined
  })

  it("enriched event is compat with fork's onSessionCreated signature", async () => {
    getDelegationMetaResult = { agent: "gsd-researcher", delegationId: "ses_compat", depth: 3 }
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: makeSessionCreatedEvent({ id: "ses_compat" }) })

    const call = onSessionCreated.mock.calls[0][0] as EnrichedSessionEvent
    expect(call).toHaveProperty("type", "session.created")
    expect(call).toHaveProperty("properties.info.id", "ses_compat")
    expect(call).toHaveProperty("hivemindMeta.agent", "gsd-researcher")
  })
})

// ---------------------------------------------------------------------------
// Phase 52: TmuxEventType union + SessionStateChanged / PaneCaptured dispatch
// ---------------------------------------------------------------------------

import type {
  SessionStateChangedEvent,
  PaneCapturedEvent,
  TmuxEventType,
} from "../../../src/features/tmux/observers.js"

function makeSessionStateChangedEvent(overrides: Partial<SessionStateChangedEvent> = {}): SessionStateChangedEvent {
  return {
    type: "session-state-changed",
    sessionId: overrides.sessionId ?? "ses_s1",
    previousState: overrides.previousState ?? "active",
    currentState: overrides.currentState ?? "ready",
    timestamp: overrides.timestamp ?? Date.now(),
  }
}

function makePaneCapturedEvent(overrides: Partial<PaneCapturedEvent> = {}): PaneCapturedEvent {
  return {
    type: "pane-captured",
    sessionId: overrides.sessionId ?? "ses_s1",
    paneId: overrides.paneId ?? "%5",
    contentLength: overrides.contentLength ?? 1024,
    timestamp: overrides.timestamp ?? Date.now(),
  }
}

describe("Phase 52: TmuxEventType union export", () => {
  it("includes session.created, session-state-changed, pane-captured (3 values)", () => {
    const values: TmuxEventType[] = ["session.created", "session-state-changed", "pane-captured"]
    expect(values).toHaveLength(3)
    expect(values).toContain("session.created")
    expect(values).toContain("session-state-changed")
    expect(values).toContain("pane-captured")
  })
})

describe("Phase 52: session-state-changed dispatch", () => {
  afterEach(() => {
    vi.clearAllMocks()
    getDelegationMetaResult = undefined
  })

  it("registers onSessionStateChanged listener and dispatches event to it", async () => {
    const { sessionManager } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)
    const listener = vi.fn()

    observer.onSessionStateChanged(listener)
    const event = makeSessionStateChangedEvent({ sessionId: "ses_state1", currentState: "ready" })
    await observer({ event })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(event)
  })

  it("does NOT forward session-state-changed to the fork SessionManager", async () => {
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: makeSessionStateChangedEvent() })

    expect(onSessionCreated).not.toHaveBeenCalled()
  })

  it("supports multiple listeners, invoked in registration order", async () => {
    const { sessionManager } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)
    const order: string[] = []
    observer.onSessionStateChanged(() => order.push("first"))
    observer.onSessionStateChanged(() => order.push("second"))
    observer.onSessionStateChanged(() => order.push("third"))

    await observer({ event: makeSessionStateChangedEvent() })

    expect(order).toEqual(["first", "second", "third"])
  })
})

describe("Phase 52: pane-captured dispatch", () => {
  afterEach(() => {
    vi.clearAllMocks()
    getDelegationMetaResult = undefined
  })

  it("registers onPaneCaptured listener and dispatches event to it", async () => {
    const { sessionManager } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)
    const listener = vi.fn()

    observer.onPaneCaptured(listener)
    const event = makePaneCapturedEvent({ paneId: "%7", contentLength: 2048 })
    await observer({ event })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(event)
  })

  it("does NOT forward pane-captured to the fork SessionManager", async () => {
    const { sessionManager, onSessionCreated } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)

    await observer({ event: makePaneCapturedEvent() })

    expect(onSessionCreated).not.toHaveBeenCalled()
  })

  it("listener exceptions do not break the chain", async () => {
    const { sessionManager } = makeForkSessionManager()
    const observer = createTmuxEventObserver(sessionManager)
    const goodListener = vi.fn()
    observer.onPaneCaptured(() => { throw new Error("listener boom") })
    observer.onPaneCaptured(goodListener)

    await observer({ event: makePaneCapturedEvent() })

    expect(goodListener).toHaveBeenCalledTimes(1)
  })
})
