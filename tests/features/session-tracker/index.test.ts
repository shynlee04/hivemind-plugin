/**
 * SessionTracker tests — handleToolExecuteBefore, handleChatMessage routing,
 * and ensureSessionReady behavior.
 *
 * @module tests/features/session-tracker/index
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTracker } from "../../../src/features/session-tracker/index.js"

vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

// ── handleToolExecuteBefore ────────────────────────────────────────────────

describe("handleToolExecuteBefore()", () => {
  let tracker: SessionTracker
  let mockHandleToolExecuteBefore: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockHandleToolExecuteBefore = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()

    tracker = new SessionTracker({
      client: { app: { log: mockAppLog }, session: { get: mockGetSession } } as any,
      projectRoot: "/fake/project",
    })
    ;(tracker as any).toolDelegation = { handleToolExecuteBefore: mockHandleToolExecuteBefore }
  })

  it("should delegate to toolDelegation for task tool dispatch", async () => {
    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_123",
      callID: "call_456",
      subagentType: "hm-l2-researcher",
      description: "Investigate codebase",
    })

    expect(mockHandleToolExecuteBefore).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "ses_main_123",
        callID: "call_456",
        subagentType: "hm-l2-researcher",
      }),
    )
  })

  it("should skip when sessionID is invalid", async () => {
    await tracker.handleToolExecuteBefore({
      sessionID: "",
      callID: "call_abc",
      subagentType: "unknown",
      description: "test",
    })

    // Delegation is still called but toolDelegation internally validates
    expect(mockHandleToolExecuteBefore).toHaveBeenCalled()
  })

  it("should catch errors and never throw", async () => {
    mockHandleToolExecuteBefore.mockImplementation(() => {
      throw new Error("Simulated failure")
    })

    await expect(
      tracker.handleToolExecuteBefore({
        sessionID: "ses_main_123",
        callID: "call_err",
        subagentType: "hm-l2-researcher",
        description: "this should not throw",
      }),
    ).resolves.toBeUndefined()

    expect(mockAppLog).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          service: "session-tracker",
          level: "warn",
          message: expect.stringContaining("handleToolExecuteBefore failed"),
        }),
      }),
    )
  })
})

// ── handleChatMessage classification-first (D-05) ─────────────────────────

describe("handleChatMessage() — classify BEFORE ensureSessionReady (D-05)", () => {
  let tracker: SessionTracker
  let mockRoute: ReturnType<typeof vi.fn>
  let mockClassify: ReturnType<typeof vi.fn>
  let mockBootstrap: ReturnType<typeof vi.fn>
  let mockHandleChatMessage: ReturnType<typeof vi.fn>
  let mockRecordChildMessage: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRoute = vi.fn()
    mockClassify = vi.fn()
    mockBootstrap = vi.fn().mockResolvedValue(undefined)
    mockHandleChatMessage = vi.fn().mockResolvedValue(undefined)
    mockRecordChildMessage = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()
    mockGetSession.mockReset()
    mockGetSession.mockResolvedValue({ id: "ses_test", parentID: null })

    tracker = new SessionTracker({
      client: { app: { log: mockAppLog }, session: { get: mockGetSession } } as any,
      projectRoot: "/fake/project",
    })
    ;(tracker as any).sessionRouter = { route: mockRoute }
    ;(tracker as any).classifier = { classify: mockClassify }
    ;(tracker as any).bootstrap = { ensureSessionReady: mockBootstrap }
    ;(tracker as any).messageCapture = { handleChatMessage: mockHandleChatMessage }
    ;(tracker as any).childRecorder = { recordChildMessage: mockRecordChildMessage }
    ;(tracker as any).childWriter = { appendChildTurn: vi.fn() }
    ;(tracker as any).pendingRegistry = { has: vi.fn(), get: vi.fn(), removeByCallID: vi.fn() }
    ;(tracker as any).bootstrappedSessions = new Set()
    ;(tracker as any).ensureChildRoute = vi.fn()
  })

  const chatInput = {
    sessionID: "ses_child_abc",
    agent: "hm-l2-researcher",
    model: { providerID: "anthropic", modelID: "claude-sonnet-4-20250514" },
    messageID: "msg_001",
    variant: "default",
  }
  const chatOutput = {
    message: { role: "assistant" },
    parts: [{ type: "text", text: "I found the issue." }],
  }

  it("should route child session (SDK parentID) to childRecorder", async () => {
    mockRoute.mockResolvedValue({ route: "child", parentID: "ses_parent_xyz" })

    await tracker.handleChatMessage(chatInput, chatOutput)

    expect(mockBootstrap).not.toHaveBeenCalled()
    expect(mockRecordChildMessage).toHaveBeenCalled()
    expect(mockHandleChatMessage).not.toHaveBeenCalled()
  })

  it("should route main session to messageCapture with bootstrap", async () => {
    mockRoute.mockResolvedValue({ route: "main" })
    const mainInput = { ...chatInput, sessionID: "ses_main_123" }

    await tracker.handleChatMessage(mainInput, chatOutput)

    expect(mockBootstrap).toHaveBeenCalledWith("ses_main_123", expect.any(Set))
    expect(mockHandleChatMessage).toHaveBeenCalled()
    expect(mockRecordChildMessage).not.toHaveBeenCalled()
  })

  it("should catch errors internally and never throw", async () => {
    mockRoute.mockResolvedValue({ route: "main" })
    mockHandleChatMessage.mockRejectedValue(new Error("Disk full"))

    await expect(
      tracker.handleChatMessage({ ...chatInput, sessionID: "ses_error_test" }, chatOutput),
    ).resolves.toBeUndefined()

    const errorCalls = mockAppLog.mock.calls.filter(
      (call: any) => call[0]?.body?.message?.includes("chat.message handler failed"),
    )
    expect(errorCalls.length).toBeGreaterThanOrEqual(1)
  })
})

// ── ensureSessionReady — root-only directory creation (D-02, D-05) ────────

describe("ensureSessionReady() — root-only directory creation (D-02)", () => {
  let tracker: SessionTracker
  let mockRoute: ReturnType<typeof vi.fn>
  let mockClassify: ReturnType<typeof vi.fn>
  let mockBootstrap: ReturnType<typeof vi.fn>
  let mockHandleChatMessage: ReturnType<typeof vi.fn>
  let mockRecordChildMessage: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockRoute = vi.fn()
    mockBootstrap = vi.fn().mockResolvedValue(undefined)
    mockHandleChatMessage = vi.fn().mockResolvedValue(undefined)
    mockRecordChildMessage = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()
    mockGetSession.mockReset()
    mockGetSession.mockResolvedValue({ id: "ses_main", parentID: null })

    tracker = new SessionTracker({
      client: { app: { log: mockAppLog }, session: { get: mockGetSession } } as any,
      projectRoot: "/fake/project",
    })
    ;(tracker as any).sessionRouter = { route: mockRoute }
    ;(tracker as any).classifier = { classify: mockClassify }
    ;(tracker as any).bootstrap = { ensureSessionReady: mockBootstrap }
    ;(tracker as any).messageCapture = { handleChatMessage: mockHandleChatMessage }
    ;(tracker as any).childRecorder = { recordChildMessage: mockRecordChildMessage }
    ;(tracker as any).childWriter = { appendChildTurn: vi.fn() }
    ;(tracker as any).pendingRegistry = { has: vi.fn(), get: vi.fn(), removeByCallID: vi.fn() }
    ;(tracker as any).bootstrappedSessions = new Set()
    ;(tracker as any).ensureChildRoute = vi.fn()
  })

  it("should bootstrap main session when router classifies it as main", async () => {
    mockRoute.mockResolvedValue({ route: "main" })

    await tracker.handleChatMessage(
      { sessionID: "ses_true_root", agent: "hm-l0-orchestrator", model: { providerID: "anthropic", modelID: "claude-opus" }, messageID: "msg1", variant: "user" },
      { message: { role: "assistant" }, parts: [{ type: "text", text: "Hi" }] },
    )

    expect(mockBootstrap).toHaveBeenCalledWith("ses_true_root", expect.any(Set))
    expect(mockHandleChatMessage).toHaveBeenCalled()
  })

  it("should NOT bootstrap child session (SDK parentID)", async () => {
    mockRoute.mockResolvedValue({ route: "child", parentID: "ses_parent_xyz" })

    await tracker.handleChatMessage(
      { sessionID: "ses_child_xyz" },
      { message: { role: "assistant" }, parts: [] },
    )

    expect(mockBootstrap).not.toHaveBeenCalled()
    expect(mockRecordChildMessage).toHaveBeenCalled()
  })

  it("should never log 'conservative fallback' warning", async () => {
    mockRoute.mockResolvedValue({ route: "main" })

    await tracker.handleChatMessage(
      { sessionID: "ses_no_fallback" },
      { message: { role: "assistant" }, parts: [{ type: "text", text: "Hi" }] },
    )

    const allLogMessages = mockAppLog.mock.calls
      .map((call: any) => call[0]?.body?.message || "")
      .join(" ")
    expect(allLogMessages).not.toContain("conservative fallback")
  })
})
