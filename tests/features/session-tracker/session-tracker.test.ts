/**
 * SessionTracker tests — session initialization and parentID gate.
 *
 * @module tests/features/session-tracker/session-tracker
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTracker } from "../../../src/features/session-tracker/index.js"

// Mock the session-api module — getSession is the SDK call used by ensureSessionReady
vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

// Mock node:fs/promises for readFile used by copyForkedChildren
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockRejectedValue(new Error("ENOENT: no such file")),
}))

describe("SessionTracker — ensureSessionReady parentID gate (F-01)", () => {
  let tracker: SessionTracker
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockAddSession: ReturnType<typeof vi.fn>
  let mockHandleSessionEvent: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue("/fake/path/ses_test12345abcdefg0")
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockAddSession = vi.fn().mockResolvedValue(undefined)
    mockHandleSessionEvent = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()

    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: {
          get: mockGetSession,
        },
      } as any,
      projectRoot: "/fake/project",
    })

    // Set up the internal writers so ensureSessionReady doesn't bail early
    // Use array access to reach private fields for test setup
    ;(tracker as any).sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
      updateFrontmatter: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
    }
    ;(tracker as any).projectIndexWriter = {
      addSession: mockAddSession,
      initializeIndex: vi.fn(),
    }
    ;(tracker as any).sessionIndexWriter = {
      addChild: vi.fn(),
    }
    ;(tracker as any).eventCapture = {
      handleSessionEvent: mockHandleSessionEvent,
    }
  })

  describe("parentID gate — child sessions", () => {
    it("should NOT create directory for child sessions (has parentID)", async () => {
      // Arrange: SDK returns a child session (has parentID)
      mockGetSession.mockResolvedValue({
        id: "ses_child1234567890a",
        parentID: "ses_parent9876543210b",
        title: "Child Session",
      })

      // Act: trigger handleSessionEvent which calls ensureSessionReady
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child1234567890a",
        event: {},
      })

      // Assert: must NOT create dir, NOT init file, NOT register
      expect(mockCreateSessionDir).not.toHaveBeenCalled()
      expect(mockInitializeSessionFile).not.toHaveBeenCalled()
      expect(mockAddSession).not.toHaveBeenCalled()
    })

    it("should still delegate to eventCapture even for child sessions", async () => {
      // Arrange
      mockGetSession.mockResolvedValue({
        id: "ses_child1234567890a",
        parentID: "ses_parent9876543210b",
        title: "Child Session",
      })

      // Act
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child1234567890a",
        event: {},
      })

      // Assert: eventCapture should still be called (it handles child events)
      expect(mockHandleSessionEvent).toHaveBeenCalled()
    })
  })

  describe("parentID gate — main (root) sessions", () => {
    it("should create directory for main sessions (parentID null)", async () => {
      // Arrange: SDK returns a root session (parentID is null)
      mockGetSession.mockResolvedValue({
        id: "ses_main1234567890ab",
        parentID: null,
        title: "Main Session",
      })

      // Act
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_main1234567890ab",
        event: {},
      })

      // Assert: must create dir, init file, register
      expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_main1234567890ab")
      expect(mockInitializeSessionFile).toHaveBeenCalled()
      expect(mockAddSession).toHaveBeenCalled()
    })

    it("should create directory for main sessions (parentID undefined)", async () => {
      // Arrange: SDK returns a root session with undefined parentID
      mockGetSession.mockResolvedValue({
        id: "ses_main2345678901bc",
        title: "Main Session",
      })

      // Act
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_main2345678901bc",
        event: {},
      })

      // Assert: must create dir, init file, register
      expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_main2345678901bc")
      expect(mockInitializeSessionFile).toHaveBeenCalled()
      expect(mockAddSession).toHaveBeenCalled()
    })
  })

  describe("parentID gate — SDK failure fallback", () => {
    it("should treat session as main when SDK call fails (conservative fallback)", async () => {
      // Arrange: SDK throws — we can't determine parentID, so treat as main
      mockGetSession.mockRejectedValue(new Error("SDK unavailable"))

      // Act
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_fallback3456789012c",
        event: {},
      })

      // Assert: fallback to main-session bootstrap (creates dir, init, register)
      expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_fallback3456789012c")
      expect(mockInitializeSessionFile).toHaveBeenCalled()
      expect(mockAddSession).toHaveBeenCalled()
    })
  })

  describe("idempotency", () => {
    it("should not bootstrap the same session twice", async () => {
      // Arrange
      mockGetSession.mockResolvedValue({
        id: "ses_once1234567890def",
        parentID: null,
        title: "Test",
      })

      // Act: call twice
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_once1234567890def",
        event: {},
      })
      await tracker.handleSessionEvent({
        eventType: "chat.message",
        sessionID: "ses_once1234567890def",
        event: {},
      })

      // Assert: only bootstrapped once
      expect(mockCreateSessionDir).toHaveBeenCalledTimes(1)
      expect(mockInitializeSessionFile).toHaveBeenCalledTimes(1)
      expect(mockAddSession).toHaveBeenCalledTimes(1)
    })
  })
})
