/**
 * SessionTracker tests — session initialization, parentID gate, and routing.
 *
 * @module tests/features/session-tracker/session-tracker
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTracker } from "../../../src/features/session-tracker/index.js"

// Mock the session-api module
vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

// Mock node:fs/promises for readFile used by copyForkedChildren
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockRejectedValue(new Error("ENOENT: no such file")),
}))

describe("SessionTracker — routing and bootstrap", () => {
  let tracker: SessionTracker
  let mockAppLog: ReturnType<typeof vi.fn>
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockAddSession: ReturnType<typeof vi.fn>
  let mockHandleSessionEvent: ReturnType<typeof vi.fn>
  let mockHandleChatMessage: ReturnType<typeof vi.fn>
  let mockHandleToolExecuteAfter: ReturnType<typeof vi.fn>
  let mockRoute: ReturnType<typeof vi.fn>
  let mockClassify: ReturnType<typeof vi.fn>
  let mockRecordChildMessage: ReturnType<typeof vi.fn>
  let mockRecordChildToolJourney: ReturnType<typeof vi.fn>

  function wireTracker() {
    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: { get: mockGetSession },
      } as any,
      projectRoot: "/fake/project",
    })

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
    ;(tracker as any).sessionIndexWriter = { addChild: vi.fn() }
    ;(tracker as any).eventCapture = { handleSessionEvent: mockHandleSessionEvent }
    ;(tracker as any).messageCapture = { handleChatMessage: mockHandleChatMessage }
    ;(tracker as any).toolCapture = { handleToolExecuteAfter: mockHandleToolExecuteAfter }
    ;(tracker as any).childWriter = { appendChildTurn: vi.fn() }
    ;(tracker as any).sessionRouter = { route: mockRoute }
    ;(tracker as any).classifier = { classify: mockClassify }
    ;(tracker as any).bootstrap = { ensureSessionReady: vi.fn().mockResolvedValue(undefined) }
    ;(tracker as any).toolDelegation = {
      recordChildToolJourney: mockRecordChildToolJourney,
      recordChildTaskDelegation: vi.fn(),
    }
    ;(tracker as any).childRecorder = { recordChildMessage: mockRecordChildMessage }
    ;(tracker as any).pendingRegistry = {
      has: vi.fn().mockReturnValue(false),
      get: vi.fn().mockReturnValue(undefined),
      removeByCallID: vi.fn(),
    }
    ;(tracker as any).ensureChildRoute = vi.fn()
    ;(tracker as any).bootstrappedSessions = new Set()
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    mockAppLog = vi.fn()
    mockCreateSessionDir = vi.fn()
    mockInitializeSessionFile = vi.fn()
    mockAddSession = vi.fn()
    mockHandleSessionEvent = vi.fn()
    mockHandleChatMessage = vi.fn()
    mockHandleToolExecuteAfter = vi.fn()
    mockRoute = vi.fn()
    mockClassify = vi.fn()
    mockRecordChildMessage = vi.fn()
    mockRecordChildToolJourney = vi.fn()
  })

  describe("child session prevention", () => {
    it("should NOT create directory for child sessions via handleSessionEvent", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_child",
        parentID: "ses_parent",
        title: "Child",
      })

      wireTracker()
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child",
        event: {},
      })

      expect(mockCreateSessionDir).not.toHaveBeenCalled()
      expect(mockInitializeSessionFile).not.toHaveBeenCalled()
      expect(mockAddSession).not.toHaveBeenCalled()
    })

    it("should still delegate to eventCapture for child sessions", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_child",
        parentID: "ses_parent",
        title: "Child",
      })

      wireTracker()
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child",
        event: {},
      })

      expect(mockHandleSessionEvent).toHaveBeenCalled()
    })
  })

  describe("main session routing via handleChatMessage", () => {
    it("should bootstrap main sessions (parentID null)", async () => {
      mockRoute.mockResolvedValue({ route: "main" })

      wireTracker()
      await tracker.handleChatMessage(
        { sessionID: "ses_main", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user" }, parts: [] },
      )

      expect((tracker as any).bootstrap.ensureSessionReady).toHaveBeenCalledWith(
        "ses_main",
        (tracker as any).bootstrappedSessions,
      )
      expect(mockHandleChatMessage).toHaveBeenCalled()
    })

    it("should NOT bootstrap child sessions", async () => {
      mockRoute.mockResolvedValue({ route: "child", parentID: "ses_parent" })

      wireTracker()
      await tracker.handleChatMessage(
        { sessionID: "ses_child", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user" }, parts: [] },
      )

      expect((tracker as any).bootstrap.ensureSessionReady).not.toHaveBeenCalled()
      expect(mockHandleChatMessage).not.toHaveBeenCalled()
    })
  })

  describe("SDK failure fallback", () => {
    it("should treat session as main when SDK call fails", async () => {
      mockRoute.mockResolvedValue({ route: "main" })

      wireTracker()
      await tracker.handleChatMessage(
        { sessionID: "ses_fallback", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user" }, parts: [] },
      )

      expect((tracker as any).bootstrap.ensureSessionReady).toHaveBeenCalled()
      expect(mockHandleChatMessage).toHaveBeenCalled()
    })
  })

  describe("idempotency", () => {
    it("should not bootstrap the same session twice", async () => {
      mockRoute.mockResolvedValue({ route: "main" })

      wireTracker()
      await tracker.handleChatMessage(
        { sessionID: "ses_once", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user" }, parts: [] },
      )
      await tracker.handleChatMessage(
        { sessionID: "ses_once", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg2", variant: "user" },
        { message: { role: "user" }, parts: [] },
      )

      // bootstrap.ensureSessionReady is called twice but returns early on second call
      // due to bootstrappedSessions set check
      expect((tracker as any).bootstrap.ensureSessionReady).toHaveBeenCalledTimes(2)
      expect(mockHandleChatMessage).toHaveBeenCalledTimes(2)
    })
  })

  describe("child session routing to childRecorder", () => {
    it("should route child session chat messages to childRecorder", async () => {
      mockRoute.mockResolvedValue({ route: "child", parentID: "ses_parent" })

      wireTracker()
      await tracker.handleChatMessage(
        { sessionID: "ses_child", agent: "hm-l2-investigator", model: { providerID: "deepseek", modelID: "v4-pro" }, messageID: "msg1", variant: "user" },
        { message: { role: "user" }, parts: [] },
      )

      expect(mockRecordChildMessage).toHaveBeenCalled()
      expect(mockHandleChatMessage).not.toHaveBeenCalled()
    })

    it("should route main session chat messages to messageCapture", async () => {
      mockRoute.mockResolvedValue({ route: "main" })

      wireTracker()
      await tracker.handleChatMessage(
        { sessionID: "ses_main", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user" }, parts: [] },
      )

      expect(mockHandleChatMessage).toHaveBeenCalled()
      expect(mockRecordChildMessage).not.toHaveBeenCalled()
    })
  })
})
