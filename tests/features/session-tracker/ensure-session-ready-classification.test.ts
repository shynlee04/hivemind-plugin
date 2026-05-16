/**
 * Tests for session routing classification in handleChatMessage and handleToolExecuteAfter.
 *
 * After CP-ST-06, handleChatMessage uses sessionRouter.route() while
 * handleToolExecuteAfter uses classifier.classify() directly. Both route
 * child sessions to childWriter and main sessions to their respective capture handlers.
 *
 * @module tests/features/session-tracker/session-routing
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTracker } from "../../../src/features/session-tracker/index.js"

// Mock session-api
vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

describe("Session routing classification", () => {
  let tracker: SessionTracker
  let mockAppLog: ReturnType<typeof vi.fn>
  let mockHandleChatMessage: ReturnType<typeof vi.fn>
  let mockHandleToolExecuteAfter: ReturnType<typeof vi.fn>
  let mockRoute: ReturnType<typeof vi.fn>
  let mockClassify: ReturnType<typeof vi.fn>
  let mockRecordChildMessage: ReturnType<typeof vi.fn>
  let mockRecordChildToolJourney: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockAppLog = vi.fn()
    mockHandleChatMessage = vi.fn()
    mockHandleToolExecuteAfter = vi.fn()
    mockRoute = vi.fn()
    mockClassify = vi.fn()
    mockRecordChildMessage = vi.fn()
    mockRecordChildToolJourney = vi.fn()

    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: { get: mockGetSession },
      } as any,
      projectRoot: "/fake/project",
    })

    // Wire private fields for testing — focus on routing decisions, not bootstrap internals
    ;(tracker as any).bootstrappedSessions = new Set()
    ;(tracker as any).messageCapture = { handleChatMessage: mockHandleChatMessage }
    ;(tracker as any).toolCapture = { handleToolExecuteAfter: mockHandleToolExecuteAfter }
    ;(tracker as any).sessionRouter = { route: mockRoute }
    ;(tracker as any).classifier = { classify: mockClassify }
    ;(tracker as any).bootstrap = {
      ensureSessionReady: vi.fn().mockResolvedValue(undefined),
    }
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
  })

  it("routes main session to messageCapture", async () => {
    mockRoute.mockResolvedValue({ route: "main" })

    await tracker.handleChatMessage(
      { sessionID: "ses_root789" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    expect(mockRoute).toHaveBeenCalledWith("ses_root789")
    expect(mockHandleChatMessage).toHaveBeenCalled()
    expect(mockRecordChildMessage).not.toHaveBeenCalled()
  })

  it("routes child session to childRecorder", async () => {
    mockRoute.mockResolvedValue({ route: "child", parentID: "ses_parent123" })
    ;(tracker as any).childWriter = { appendChildTurn: vi.fn() }

    await tracker.handleChatMessage(
      { sessionID: "ses_child456" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    expect(mockRoute).toHaveBeenCalledWith("ses_child456")
    expect(mockHandleChatMessage).not.toHaveBeenCalled()
    expect(mockRecordChildMessage).toHaveBeenCalled()
  })

  it("skips bootstrap when session is already bootstrapped", async () => {
    mockRoute.mockResolvedValue({ route: "main" })
    ;(tracker as any).bootstrappedSessions.add("ses_root789")

    await tracker.handleChatMessage(
      { sessionID: "ses_root789" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    // ensureSessionReady is called but returns early internally (bootstrappedSessions check)
    expect((tracker as any).bootstrap.ensureSessionReady).toHaveBeenCalledWith(
      "ses_root789",
      (tracker as any).bootstrappedSessions,
    )
    expect(mockHandleChatMessage).toHaveBeenCalled()
  })

  it("handleToolExecuteAfter routes main session to toolCapture", async () => {
    mockClassify.mockResolvedValue({ kind: "main" })

    await tracker.handleToolExecuteAfter(
      { tool: "read", sessionID: "ses_root789", callID: "call-1", args: {} },
      { title: "read", output: "ok", metadata: {} },
    )

    expect(mockClassify).toHaveBeenCalledWith("ses_root789", expect.any(Function))
    expect(mockHandleToolExecuteAfter).toHaveBeenCalled()
    expect(mockRecordChildToolJourney).not.toHaveBeenCalled()
  })

  it("handleToolExecuteAfter routes child session to toolDelegation", async () => {
    mockClassify.mockResolvedValue({ kind: "child", parentID: "ses_parent123" })
    ;(tracker as any).childWriter = { appendChildTurn: vi.fn() }

    await tracker.handleToolExecuteAfter(
      { tool: "read", sessionID: "ses_child456", callID: "call-2", args: {} },
      { title: "read", output: "ok", metadata: {} },
    )

    expect(mockClassify).toHaveBeenCalledWith("ses_child456", expect.any(Function))
    expect(mockHandleToolExecuteAfter).not.toHaveBeenCalled()
    expect(mockRecordChildToolJourney).toHaveBeenCalled()
  })

  it("handleToolExecuteAfter removes pending entry by callID", async () => {
    mockClassify.mockResolvedValue({ kind: "main" })

    await tracker.handleToolExecuteAfter(
      { tool: "read", sessionID: "ses_root789", callID: "call-pending", args: {} },
      { title: "read", output: "ok", metadata: {} },
    )

    expect((tracker as any).pendingRegistry.removeByCallID).toHaveBeenCalledWith("call-pending")
  })
})
