/**
 * Tests for ensureSessionReady classification removal (CP-ST-05-02 Task 1).
 *
 * ensureSessionReady must NOT classify child sessions. After this change,
 * it trusts its callers (handleChatMessage, handleToolExecuteAfter) to have
 * already classified the session. It only bootstraps root main sessions.
 *
 * @module tests/features/session-tracker/ensure-session-ready-classification
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTracker } from "../../../src/features/session-tracker/index.js"

// Mock session-api
vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

describe("ensureSessionReady() classification removal", () => {
  let tracker: SessionTracker
  let mockAppLog: ReturnType<typeof vi.fn>
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockAddSession: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()
    mockAppLog = vi.fn()
    mockCreateSessionDir = vi.fn()
    mockInitializeSessionFile = vi.fn()
    mockAddSession = vi.fn()

    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: { get: mockGetSession },
      } as any,
      projectRoot: "/fake/project",
    })

    // Wire private fields for testing
    ;(tracker as any).sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
    }
    ;(tracker as any).projectIndexWriter = {
      addSession: mockAddSession,
      initializeIndex: vi.fn(),
    }
    ;(tracker as any).hierarchyIndex = {
      isChild: vi.fn().mockReturnValue(false),
      getParent: vi.fn().mockReturnValue(undefined),
    }
    ;(tracker as any).pendingRegistry = {
      has: vi.fn().mockReturnValue(false),
      get: vi.fn().mockReturnValue(undefined),
    }
    ;(tracker as any).bootstrappedSessions = new Set()
    ;(tracker as any).messageCapture = { handleChatMessage: vi.fn() }
    ;(tracker as any).toolCapture = { handleToolExecuteAfter: vi.fn() }
    ;(tracker as any).childWriter = { appendChildTurn: vi.fn() }
  })

  it("ensureSessionReady does NOT query SDK for parentID (classification removed)", async () => {
    await tracker.handleToolExecuteAfter(
      { tool: "read", sessionID: "ses_root789", callID: "call-1", args: {} },
      { title: "read", output: "ok", metadata: {} },
    )

    // handleToolExecuteAfter calls getSession once for its own classification.
    // ensureSessionReady should NOT call it again after our fix.
    // Total: exactly 1 call.
    expect(mockGetSession).toHaveBeenCalledTimes(1)
  })

  it("ensureSessionReady does NOT check hierarchyIndex for child classification", async () => {
    await tracker.handleChatMessage(
      { sessionID: "ses_root789" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    // handleChatMessage uses hierarchyIndex.getParent (not isChild).
    // ensureSessionReady used to call hierarchyIndex.isChild but no longer does.
    // Total: getParent called once (from handleChatMessage), isChild never called.
    expect((tracker as any).hierarchyIndex.getParent).toHaveBeenCalledTimes(1)
    expect((tracker as any).hierarchyIndex.isChild).toHaveBeenCalledTimes(0)
  })

  it("ensureSessionReady does NOT check pendingRegistry for child classification", async () => {
    await tracker.handleChatMessage(
      { sessionID: "ses_root789" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    // handleChatMessage checks pendingRegistry.has once.
    // ensureSessionReady should NOT check it again.
    expect((tracker as any).pendingRegistry.has).toHaveBeenCalledTimes(1)
  })

  it("ensureSessionReady creates directory for root main session when caller classified it", async () => {
    await tracker.handleChatMessage(
      { sessionID: "ses_root789" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_root789")
    expect(mockInitializeSessionFile).toHaveBeenCalled()
    expect(mockAddSession).toHaveBeenCalled()
  })

  it("ensureSessionReady skips when session is already bootstrapped", async () => {
    ;(tracker as any).bootstrappedSessions.add("ses_root789")

    await tracker.handleChatMessage(
      { sessionID: "ses_root789" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    expect(mockCreateSessionDir).not.toHaveBeenCalled()
  })

  it("handleChatMessage routes child sessions to childWriter, not ensureSessionReady", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_child456", parentID: "ses_parent123" })

    await tracker.handleChatMessage(
      { sessionID: "ses_child456" },
      { message: { role: "user" }, parts: [{ type: "text", text: "hello" }] },
    )

    // Child session: should go to childWriter, NOT ensureSessionReady
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    expect((tracker as any).childWriter.appendChildTurn).toHaveBeenCalled()
  })
})
