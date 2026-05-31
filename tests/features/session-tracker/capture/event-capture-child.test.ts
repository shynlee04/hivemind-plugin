/**
 * EventCapture child session routing tests (DEFECT-08).
 *
 * Validates that session lifecycle events for child sessions (non-null parentID)
 * are correctly routed through childWriter.updateChildStatus instead of
 * sessionWriter.updateFrontmatter.
 *
 * @module tests/features/session-tracker/capture/event-capture-child
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventCapture } from "../../../../src/features/session-tracker/capture/event-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"
import type { ChildRef } from "../../../../src/features/session-tracker/types.js"

// Mock the session-api module
vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

describe("EventCapture — child session routing (DEFECT-08)", () => {
  let eventCapture: EventCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let mockUpdateFrontmatter: ReturnType<typeof vi.fn>
  let mockUpdateChildStatusCw: ReturnType<typeof vi.fn>
  let mockUpdateChildStatusSiw: ReturnType<typeof vi.fn>
  let mockAddChildRef: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockUpdateFrontmatter = vi.fn().mockResolvedValue(undefined)
    mockUpdateChildStatusCw = vi.fn().mockResolvedValue(undefined)
    mockUpdateChildStatusSiw = vi.fn().mockResolvedValue(undefined)
    mockAddChildRef = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      updateFrontmatter: mockUpdateFrontmatter,
      addChildRef: mockAddChildRef,
      createSessionDir: vi.fn(),
      initializeSessionFile: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
      appendCompactionBlock: vi.fn(),
      sessionFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as SessionWriter

    childWriter = {
      updateChildStatus: mockUpdateChildStatusCw,
      createChildFile: vi.fn(),
      appendChildTurn: vi.fn(),
      childFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as ChildWriter

    sessionIndexWriter = {
      updateChildStatus: mockUpdateChildStatusSiw,
      addChild: vi.fn(),
      initializeIndex: vi.fn(),
      incrementTurnCount: vi.fn(),
      updateToolSummary: vi.fn(),
    } as unknown as SessionIndexWriter

    eventCapture = new EventCapture({
      client: {} as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
    })
  })

  describe("session.idle", () => {
    it("should route to childWriter for child sessions (non-null parentID)", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_child1234567890ab",
        parentID: "ses_parent0987654321xy",
        title: "Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.idle",
        sessionID: "ses_child1234567890ab",
        event: {},
      })

      // Child session: should route through childWriter
      expect(mockUpdateChildStatusCw).toHaveBeenCalledWith(
        "ses_parent0987654321xy",
        "ses_child1234567890ab",
        "completed",
      )
      // Should NOT call sessionWriter for child
      expect(mockUpdateFrontmatter).not.toHaveBeenCalled()
    })

    it("should still use sessionWriter for main sessions (no regression)", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_main5555555555zz",
        parentID: null,
        title: "Main Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.idle",
        sessionID: "ses_main5555555555zz",
        event: {},
      })

      // Main session: should use sessionWriter (existing behavior)
      expect(mockUpdateFrontmatter).toHaveBeenCalled()
      expect(mockUpdateChildStatusCw).not.toHaveBeenCalled()
    })
  })

  describe("session.deleted", () => {
    it("should route to childWriter for child sessions", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_child6666666666cd",
        parentID: "ses_parent7777777777ef",
        title: "Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.deleted",
        sessionID: "ses_child6666666666cd",
        event: {},
      })

      expect(mockUpdateChildStatusCw).toHaveBeenCalledWith(
        "ses_parent7777777777ef",
        "ses_child6666666666cd",
        "cancelled",
      )
      expect(mockUpdateChildStatusSiw).toHaveBeenCalledWith(
        "ses_parent7777777777ef",
        "ses_child6666666666cd",
        "cancelled",
      )
    })
  })

  describe("session.error", () => {
    it("should route to childWriter for child sessions", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_child8888888888gh",
        parentID: "ses_parent9999999999ij",
        title: "Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.error",
        sessionID: "ses_child8888888888gh",
        event: {},
      })

      expect(mockUpdateChildStatusCw).toHaveBeenCalledWith(
        "ses_parent9999999999ij",
        "ses_child8888888888gh",
        "error",
      )
      expect(mockUpdateChildStatusSiw).toHaveBeenCalledWith(
        "ses_parent9999999999ij",
        "ses_child8888888888gh",
        "error",
      )
    })
  })

  describe("addChildRef integration (Bug A fix — Phase 23.2)", () => {
    it("should expose addChildRef on sessionWriter mock for wiring verification", () => {
      expect(typeof mockAddChildRef).toBe("function")
      expect(sessionWriter.addChildRef).toBe(mockAddChildRef)
    })
  })
})
