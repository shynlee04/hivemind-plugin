/**
 * EventCapture tests — session lifecycle event handling.
 *
 * @module tests/features/session-tracker/capture/event-capture
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventCapture } from "../../../../src/features/session-tracker/capture/event-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"

// Mock the session-api module
vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

describe("EventCapture", () => {
  let eventCapture: EventCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockUpdateFrontmatter: ReturnType<typeof vi.fn>
  let mockUpdateChildStatus: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue("/fake/path")
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockUpdateFrontmatter = vi.fn().mockResolvedValue(undefined)
    mockUpdateChildStatus = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
      updateFrontmatter: mockUpdateFrontmatter,
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
    } as unknown as SessionWriter

    childWriter = {
      updateChildStatus: mockUpdateChildStatus,
    } as unknown as ChildWriter

    sessionIndexWriter = {
      updateChildStatus: mockUpdateChildStatus,
    } as unknown as SessionIndexWriter

    eventCapture = new EventCapture({
      client: {} as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
    })
  })

  describe("session.created", () => {
    it("should create subdir + .md for root sessions (parentID null)", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_test12345abcdefg0")
      expect(mockInitializeSessionFile).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        expect.objectContaining({
          sessionID: "ses_test12345abcdefg0",
          parentSessionID: null,
          delegationDepth: 0,
          status: "active",
        }),
      )
    })

    it("should skip subdir creation for child sessions (parentID exists)", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_child123456789ab",
        parentID: "ses_parent987654321xy",
        title: "Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child123456789ab",
        event: {},
      })

      expect(mockCreateSessionDir).not.toHaveBeenCalled()
      expect(mockInitializeSessionFile).not.toHaveBeenCalled()
    })
  })

  describe("session.idle", () => {
    it("should update session status to idle for main session", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.idle",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        { status: "idle" },
      )
    })
  })

  describe("session.deleted", () => {
    it("should mark session status as completed for main session", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.deleted",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        { status: "completed" },
      )
    })
  })

  describe("session.error", () => {
    it("should mark session status as error for main session", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.error",
        sessionID: "ses_test12345abcdefg0",
        event: { error: "Something went wrong" },
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        { status: "error" },
      )
    })
  })

  describe("graceful failure", () => {
    it("should not throw on malformed input (missing sessionID)", async () => {
      // Should not throw even with bad input
      await expect(
        eventCapture.handleSessionEvent({
          eventType: "session.created",
          sessionID: "",
          event: {},
        }),
      ).resolves.toBeUndefined()
    })

    it("should not throw when getSession fails", async () => {
      mockGetSession.mockRejectedValue(new Error("Network error"))

      await expect(
        eventCapture.handleSessionEvent({
          eventType: "session.created",
          sessionID: "ses_test12345abcdefg0",
          event: {},
        }),
      ).resolves.toBeUndefined()
    })

    it("should log warning on unknown event type", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      await eventCapture.handleSessionEvent({
        eventType: "session.unknown_type",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(warnSpy).toHaveBeenCalled()
      warnSpy.mockRestore()
    })
  })
})
