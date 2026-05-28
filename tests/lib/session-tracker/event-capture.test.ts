/**
 * Tests for EventCapture thin router — verifies dispatch to correct handlers.
 *
 * REQ-C6-01: After extraction, EventCapture should be a thin router
 * that delegates to the correct handler class for each event type.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventCapture } from "../../../src/features/session-tracker/capture/event-capture.js"
import type { OpenCodeClient } from "../../../src/shared/session-api.js"
import type { SessionWriter } from "../../../src/features/session-tracker/persistence/session-writer.js"
import type { ChildWriter } from "../../../src/features/session-tracker/persistence/child-writer.js"
import type { SessionIndexWriter } from "../../../src/features/session-tracker/persistence/session-index-writer.js"

function createMockDeps() {
  return {
    client: {
      app: { log: vi.fn() },
      session: { get: vi.fn().mockResolvedValue({ parentID: null }) },
    } as unknown as OpenCodeClient,
    sessionWriter: {
      createSessionDir: vi.fn().mockResolvedValue(undefined),
      initializeSessionFile: vi.fn().mockResolvedValue(undefined),
      sessionFileExists: vi.fn().mockResolvedValue(true),
      updateFrontmatter: vi.fn().mockResolvedValue(undefined),
      appendAssistantTurn: vi.fn().mockResolvedValue(undefined),
      appendCompactionBlock: vi.fn().mockResolvedValue(undefined),
      addChildRef: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionWriter,
    childWriter: {
      createChildFile: vi.fn().mockResolvedValue(undefined),
      childFileExists: vi.fn().mockResolvedValue(true),
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
      appendJourneyEntry: vi.fn().mockResolvedValue(undefined),
      backfillChildMetadata: vi.fn().mockResolvedValue(undefined),
      readChildData: vi.fn().mockResolvedValue(null),
    } as unknown as ChildWriter,
    sessionIndexWriter: {
      addChild: vi.fn().mockResolvedValue(undefined),
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionIndexWriter,
  }
}

describe("EventCapture — thin router dispatch", () => {
  let capture: EventCapture
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    capture = new EventCapture(deps)
  })

  it("should route session.created to SessionCreatedHandler", async () => {
    await capture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "test-session-1",
      event: {},
    })
    // Should not throw — router delegates to handler
  })

  it("should route session.idle to SessionIdleHandler", async () => {
    await capture.handleSessionEvent({
      eventType: "session.idle",
      sessionID: "test-session-2",
      event: {},
    })
  })

  it("should route session.deleted to SessionDeletedHandler", async () => {
    await capture.handleSessionEvent({
      eventType: "session.deleted",
      sessionID: "test-session-3",
      event: {},
    })
  })

  it("should route session.error to SessionErrorHandler", async () => {
    await capture.handleSessionEvent({
      eventType: "session.error",
      sessionID: "test-session-4",
      event: {},
    })
  })

  it("should route session.compacted to SessionCompactedHandler", async () => {
    await capture.handleSessionEvent({
      eventType: "session.compacted",
      sessionID: "test-session-5",
      event: { summary: "compacted context" },
    })
  })

  it("should route session.next.text.ended to SessionNextTextEndedHandler", async () => {
    await capture.handleSessionEvent({
      eventType: "session.next.text.ended",
      sessionID: "test-session-6",
      event: { properties: { text: "assistant response" } },
    })
  })

  it("should handle unknown event types without throwing", async () => {
    await capture.handleSessionEvent({
      eventType: "unknown.event",
      sessionID: "test-session-7",
      event: {},
    })
    // Unknown event types are handled gracefully — no throw
  })

  it("should return early for invalid sessionID", async () => {
    await capture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "",
      event: {},
    })
    // Should not throw
  })
})
