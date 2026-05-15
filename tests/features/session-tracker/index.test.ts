/**
 * SessionTracker handleToolExecuteBefore & pollForChildSessions tests.
 *
 * Covers planned Task 1 behaviors per CP-ST-02-02-PLAN.md:
 * - Task tool dispatch detection (adds pending entry)
 * - Resume detection (task_id present → skip)
 * - Error handling (best-effort, never throws)
 * - Fire-and-forget polling (non-blocking)
 * - Child discovery via SDK children() API
 * - HierarchyIndex and PendingDispatchRegistry updates
 * - Max attempts exhausted gracefully
 *
 * @module tests/features/session-tracker/index
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTracker } from "../../../src/features/session-tracker/index.js"

// Mock session-api
vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

// Mock isValidSessionID — available but we test its invocation
vi.mock("../../../src/features/session-tracker/types.js", async () => {
  const actual = await vi.importActual("../../../src/features/session-tracker/types.js")
  return {
    ...actual,
  }
})

describe("handleToolExecuteBefore()", () => {
  let tracker: SessionTracker
  let mockAdd: ReturnType<typeof vi.fn>
  let mockUpdateWithChildID: ReturnType<typeof vi.fn>
  let mockRegisterChild: ReturnType<typeof vi.fn>
  let mockIsChild: ReturnType<typeof vi.fn>
  let mockHas: ReturnType<typeof vi.fn>
  let mockChildren: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockAdd = vi.fn()
    mockUpdateWithChildID = vi.fn()
    mockRegisterChild = vi.fn()
    mockIsChild = vi.fn().mockReturnValue(false)
    mockHas = vi.fn().mockReturnValue(false)
    mockChildren = vi.fn().mockResolvedValue({ data: [] })
    mockAppLog = vi.fn()

    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: {
          get: mockGetSession,
          children: mockChildren,
        },
      } as any,
      projectRoot: "/fake/project",
    })

    // Wire private fields via property access for tests
    ;(tracker as any).pendingRegistry = {
      add: mockAdd,
      updateWithChildID: mockUpdateWithChildID,
      has: mockHas,
      get: vi.fn(),
      remove: vi.fn(),
      removeByCallID: vi.fn(),
      cleanupStale: vi.fn(),
    }
    ;(tracker as any).hierarchyIndex = {
      registerChild: mockRegisterChild,
      isChild: mockIsChild,
      getParent: vi.fn(),
    }
  })

  // ── Task dispatch detection ──────────────────────────────────────────────

  it("should add pending entry when task tool is dispatched (no task_id)", async () => {
    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_123",
      callID: "call_456",
      subagentType: "hm-l2-researcher",
      description: "Investigate codebase structure",
    })

    expect(mockAdd).toHaveBeenCalledTimes(1)
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        parentSessionID: "ses_main_123",
        callID: "call_456",
        subagentType: "hm-l2-researcher",
        timestamp: expect.any(Number),
      }),
    )
  })

  // ── Resume detection (AC-10) ────────────────────────────────────────────

  it("should skip registration when task_id is present (resume)", async () => {
    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_123",
      callID: "call_789",
      subagentType: "hm-l2-investigator",
      description: "Continue investigation",
      taskId: "ses_existing_child",
    })

    expect(mockAdd).not.toHaveBeenCalled()
  })

  // ── Invalid session ID ───────────────────────────────────────────────────

  it("should skip when sessionID is invalid", async () => {
    await tracker.handleToolExecuteBefore({
      sessionID: "",
      callID: "call_abc",
      subagentType: "unknown",
      description: "test",
    })

    expect(mockAdd).not.toHaveBeenCalled()
  })

  // ── Uninitialized pendingRegistry ────────────────────────────────────────

  it("should skip when pendingRegistry is not initialized", async () => {
    ;(tracker as any).pendingRegistry = undefined

    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_123",
      callID: "call_def",
      subagentType: "hm-l2-researcher",
      description: "test",
    })

    // Should not throw — just return early.
    expect(mockAdd).not.toHaveBeenCalled()
  })

  // ── Best-effort error handling ───────────────────────────────────────────

  it("should catch errors and log warning (never throws)", async () => {
    mockAdd.mockImplementation(() => {
      throw new Error("Simulated add failure")
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

  // ── Fire-and-forget polling ──────────────────────────────────────────────

  it("should start polling loop via fire-and-forget (void)", async () => {
    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_poll",
      callID: "call_poll",
      subagentType: "hm-l2-investigator",
      description: "Poll me",
    })

    // add() should have been called (dispatch registered)
    expect(mockAdd).toHaveBeenCalled()

    // The polling loop is void'd — it runs asynchronously.
    // We can verify that children() is eventually called.
    await vi.waitFor(
      () => {
        expect(mockChildren).toHaveBeenCalledWith(
          expect.objectContaining({
            path: { id: "ses_main_poll" },
          }),
        )
      },
      { timeout: 2000 },
    )
  })

  it("should register child in HierarchyIndex and update pending registry on discovery", async () => {
    const childID = "ses_child_discovered"
    mockChildren.mockResolvedValue({
      data: [
        { id: childID, parentID: "ses_main_poll" },
      ],
    })

    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_poll",
      callID: "call_discover",
      subagentType: "hm-l2-researcher",
      description: "Discover me",
    })

    await vi.waitFor(
      () => {
        expect(mockRegisterChild).toHaveBeenCalledWith("ses_main_poll", childID)
        expect(mockUpdateWithChildID).toHaveBeenCalledWith("call_discover", childID)
      },
      { timeout: 3000 },
    )
  })

  it("should stop polling after max 5 attempts if no children found", async () => {
    // Always return empty — no children ever discovered
    mockChildren.mockResolvedValue({ data: [] })

    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_empty",
      callID: "call_empty",
      subagentType: "hm-l2-researcher",
      description: "No children",
    })

    // Wait enough time for all 5 attempts (5 × 200ms = 1000ms + buffer)
    await vi.waitFor(
      () => {
        expect(mockChildren).toHaveBeenCalledTimes(5)
      },
      { timeout: 3000 },
    )
  })

  it("should log warning when polling is exhausted without discovery", async () => {
    mockChildren.mockResolvedValue({ data: [] })

    await tracker.handleToolExecuteBefore({
      sessionID: "ses_exhausted",
      callID: "call_exhausted",
      subagentType: "hm-l2-researcher",
      description: "Exhaustion test",
    })

    await vi.waitFor(
      () => {
        const warnCalls = mockAppLog.mock.calls.filter(
          (call: any) =>
            call[0]?.body?.message?.includes("polling exhausted"),
        )
        expect(warnCalls.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  // ── SDK children() failure tolerance ─────────────────────────────────────

  it("should catch SDK children() failures silently", async () => {
    mockChildren.mockRejectedValue(new Error("Network error"))

    await tracker.handleToolExecuteBefore({
      sessionID: "ses_network_fail",
      callID: "call_net_fail",
      subagentType: "hm-l2-researcher",
      description: "Network issues",
    })

    // Should not throw — the method resolves normally.
    // After max attempts, should log exhaustion warning.
    await vi.waitFor(
      () => {
        const warnCalls = mockAppLog.mock.calls.filter(
          (call: any) =>
            call[0]?.body?.message?.includes("polling exhausted"),
        )
        expect(warnCalls.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  it("should skip already-registered children (dedup via isChild)", async () => {
    const childID = "ses_already_known"
    mockChildren.mockResolvedValue({
      data: [{ id: childID, parentID: "ses_main_dup" }],
    })
    mockIsChild.mockReturnValue(true) // already in hierarchy index

    await tracker.handleToolExecuteBefore({
      sessionID: "ses_main_dup",
      callID: "call_dup",
      subagentType: "hm-l2-researcher",
      description: "Duplicate test",
    })

    await vi.waitFor(
      () => {
        // Should call children() but NOT register or update
        expect(mockChildren).toHaveBeenCalled()
        expect(mockRegisterChild).not.toHaveBeenCalled()
        expect(mockUpdateWithChildID).not.toHaveBeenCalled()
      },
      { timeout: 2000 },
    )
  })
})

// ── handleChatMessage classification-first (D-05) ─────────────────────────

describe("handleChatMessage() — classify BEFORE ensureSessionReady (D-05)", () => {
  let tracker: SessionTracker
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockAppendChildTurn: ReturnType<typeof vi.fn>
  let mockMessageCaptureHandler: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>
  let mockGetParent: ReturnType<typeof vi.fn>
  let mockIsChild: ReturnType<typeof vi.fn>
  let mockPendingHas: ReturnType<typeof vi.fn>
  let mockPendingGet: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue(undefined)
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockAppendChildTurn = vi.fn().mockResolvedValue(undefined)
    mockMessageCaptureHandler = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()
    mockGetParent = vi.fn().mockReturnValue(undefined)
    mockIsChild = vi.fn().mockReturnValue(false)
    mockPendingHas = vi.fn().mockReturnValue(false)
    mockPendingGet = vi.fn().mockReturnValue(undefined)

    // Reset getSession mock behavior
    mockGetSession.mockReset()
    mockGetSession.mockResolvedValue({ id: "ses_test", parentID: undefined })

    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: {
          get: mockGetSession,
          children: vi.fn().mockResolvedValue({ data: [] }),
        },
      } as any,
      projectRoot: "/fake/project",
    })

    // Wire internals for test verification
    ;(tracker as any).sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
    }
    ;(tracker as any).childWriter = {
      appendChildTurn: mockAppendChildTurn,
    }
    ;(tracker as any).messageCapture = {
      handleChatMessage: mockMessageCaptureHandler,
    }
    ;(tracker as any).hierarchyIndex = {
      getParent: mockGetParent,
      isChild: mockIsChild,
    }
    ;(tracker as any).pendingRegistry = {
      has: mockPendingHas,
      get: mockPendingGet,
    }
    ;(tracker as any).projectIndexWriter = {
      addSession: vi.fn().mockResolvedValue(undefined),
    }
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
    parts: [
      { type: "text", text: "I found the issue: the key is wrong." },
      { type: "thinking", text: "Let me think about this..." },
    ],
  }

  // ── Test 1: Child via SDK parentID → skip ensureSessionReady ──────────

  it("should NOT call ensureSessionReady when SDK reports parentID (Gate 1 child)", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_child_abc",
      parentID: "ses_parent_xyz",
    })

    await tracker.handleChatMessage(chatInput, chatOutput)

    // ensureSessionReady's side effect: createSessionDir must NOT be called
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    // Child should be routed to childWriter
    expect(mockAppendChildTurn).toHaveBeenCalledWith(
      "ses_parent_xyz",
      "ses_child_abc",
      expect.objectContaining({
        actor: "hm-l2-researcher",
        content: "I found the issue: the key is wrong.",
        tools: [],
      }),
    )
    // messageCapture must NOT be used for child sessions
    expect(mockMessageCaptureHandler).not.toHaveBeenCalled()
  })

  // ── Test 2: Child via HierarchyIndex → skip ensureSessionReady ────────

  it("should NOT call ensureSessionReady when HierarchyIndex detects child (Gate 2)", async () => {
    // SDK reports no parent
    mockGetSession.mockResolvedValue({ id: "ses_child_abc", parentID: undefined })
    // But HierarchyIndex knows the parent
    mockGetParent.mockReturnValue("ses_parent_from_index")

    await tracker.handleChatMessage(chatInput, chatOutput)

    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    expect(mockAppendChildTurn).toHaveBeenCalledWith(
      "ses_parent_from_index",
      "ses_child_abc",
      expect.any(Object),
    )
    expect(mockMessageCaptureHandler).not.toHaveBeenCalled()
  })

  // ── Test 3: Child via PendingDispatchRegistry → skip ensureSessionReady ─

  it("should NOT call ensureSessionReady when PendingDispatchRegistry detects child (Gate 3)", async () => {
    // SDK and HierarchyIndex both miss
    mockGetSession.mockResolvedValue({ id: "ses_child_abc", parentID: undefined })
    mockGetParent.mockReturnValue(undefined)
    // But pendingRegistry has an entry for this session's parent
    mockPendingHas.mockReturnValue(true)
    mockPendingGet.mockReturnValue({
      parentSessionID: "ses_parent_from_pending",
      callID: "call_xyz",
      subagentType: "hm-l2-researcher",
      timestamp: Date.now(),
    })

    await tracker.handleChatMessage(chatInput, chatOutput)

    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    expect(mockAppendChildTurn).toHaveBeenCalledWith(
      "ses_parent_from_pending",
      "ses_child_abc",
      expect.any(Object),
    )
    expect(mockMessageCaptureHandler).not.toHaveBeenCalled()
  })

  // ── Test 4: Main session → ensureSessionReady IS called ──────────────

  it("should call ensureSessionReady for main sessions (no parent, no hierarchy, no pending)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_main_123", parentID: undefined })
    mockGetParent.mockReturnValue(undefined)
    mockPendingHas.mockReturnValue(false)

    // Must use the same sessionID as in ensureSessionReady flow
    const mainInput = { ...chatInput, sessionID: "ses_main_123" }

    await tracker.handleChatMessage(mainInput, chatOutput)

    // ensureSessionReady's side effect: createSessionDir MUST be called
    expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_main_123")
    // messageCapture should be called
    expect(mockMessageCaptureHandler).toHaveBeenCalled()
    // childWriter must NOT be used
    expect(mockAppendChildTurn).not.toHaveBeenCalled()
  })

  // ── Test 5: Error handling — never throws ────────────────────────────

  it("should catch errors internally and never throw (best-effort)", async () => {
    // Trigger an error in the main path
    mockMessageCaptureHandler.mockRejectedValue(new Error("Disk full"))

    // Should not throw
    await expect(
      tracker.handleChatMessage({ ...chatInput, sessionID: "ses_error_test" }, chatOutput),
    ).resolves.toBeUndefined()

    // Should log the error
    const errorCalls = mockAppLog.mock.calls.filter(
      (call: any) =>
        call[0]?.body?.message?.includes("chat.message handler failed"),
    )
    expect(errorCalls.length).toBeGreaterThanOrEqual(1)
  })
})

// ── ensureSessionReady — root-only directory creation (D-02, D-05) ────────

describe("ensureSessionReady() — root-only directory creation (D-02)", () => {
  let tracker: SessionTracker
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockAddSession: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>
  let mockIsChild: ReturnType<typeof vi.fn>
  let mockPendingHas: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue(undefined)
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockAddSession = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()
    mockIsChild = vi.fn().mockReturnValue(false)
    mockPendingHas = vi.fn().mockReturnValue(false)

    mockGetSession.mockReset()
    mockGetSession.mockResolvedValue({ id: "ses_main", parentID: undefined })

    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: {
          get: mockGetSession,
          children: vi.fn().mockResolvedValue({ data: [] }),
        },
      } as any,
      projectRoot: "/fake/project",
    })

    // Wire internals
    ;(tracker as any).sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
    }
    ;(tracker as any).projectIndexWriter = {
      addSession: mockAddSession,
    }
    ;(tracker as any).hierarchyIndex = {
      isChild: mockIsChild,
      getParent: vi.fn().mockReturnValue(undefined),
    }
    ;(tracker as any).pendingRegistry = {
      has: mockPendingHas,
      get: vi.fn().mockReturnValue(undefined),
    }
    ;(tracker as any).childWriter = {
      appendChildTurn: vi.fn().mockResolvedValue(undefined),
    }
    ;(tracker as any).messageCapture = {
      handleChatMessage: vi.fn().mockResolvedValue(undefined),
    }
  })

  // ── Test 1: Main session → directory created ──────────────────────────

  it("should create directory for a main session (no parent, not child, no pending)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_main_123", parentID: undefined })
    mockIsChild.mockReturnValue(false)
    mockPendingHas.mockReturnValue(false)

    const chatInput = {
      sessionID: "ses_main_123",
      agent: "hm-l0-orchestrator",
      model: { providerID: "anthropic", modelID: "claude-opus" },
    }

    await tracker.handleChatMessage(chatInput, {
      message: { role: "assistant" },
      parts: [{ type: "text", text: "Hello" }],
    })

    // Main session → createSessionDir MUST be called
    expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_main_123")
    expect(mockInitializeSessionFile).toHaveBeenCalled()
  })

  // ── Test 2: Child via SDK parentID → NO directory ─────────────────────

  it("should NOT create directory when SDK reports parentID (Gate 1)", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_child_xyz",
      parentID: "ses_parent_xyz",
    })

    // Call through handleChatMessage which uses classification-first
    await tracker.handleChatMessage(
      { sessionID: "ses_child_xyz" },
      { message: { role: "assistant" }, parts: [] },
    )

    // No directory for children
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
  })

  // ── Test 3: Child via hierarchyIndex.isChild() → NO directory ─────────

  it("should NOT create directory when HierarchyIndex.isChild() returns true (Gate 2)", async () => {
    // SDK says no parentID
    mockGetSession.mockResolvedValue({ id: "ses_child_from_index", parentID: undefined })
    // But hierarchy index confirms it's a child
    mockIsChild.mockReturnValue(true)

    // Go through the handleChatMessage path which consults all 3 gates
    await tracker.handleChatMessage(
      { sessionID: "ses_child_from_index" },
      { message: { role: "assistant" }, parts: [] },
    )

    // No directory — Gate 2 catch prevents it
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
  })

  // ── Test 4: Child via pendingRegistry.has() → NO directory ────────────

  it("should NOT create directory when PendingDispatchRegistry.has() returns true (Gate 3)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_child_pending", parentID: undefined })
    mockIsChild.mockReturnValue(false)
    // But pendingRegistry detects the dispatch
    mockPendingHas.mockReturnValue(true)

    await tracker.handleChatMessage(
      { sessionID: "ses_child_pending" },
      { message: { role: "assistant" }, parts: [] },
    )

    // No directory — Gate 3 blocks it
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
  })

  // ── Test 5: All gates fail → treated as MAIN → directory created ──────

  it("should create directory when all three gates fail (root main session)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_true_root", parentID: undefined })
    mockIsChild.mockReturnValue(false)
    mockPendingHas.mockReturnValue(false)

    await tracker.handleChatMessage(
      { sessionID: "ses_true_root" },
      { message: { role: "assistant" }, parts: [{ type: "text", text: "Hi" }] },
    )

    // This is the ONLY path that creates directories (D-02)
    expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_true_root")
    // Must NOT log "conservative fallback" warning
    const warnCalls = mockAppLog.mock.calls.filter(
      (call: any) =>
        call[0]?.body?.message?.includes("conservative fallback"),
    )
    expect(warnCalls).toHaveLength(0)
  })

  // ── Test 6: No conservative fallback warning log exists ────────────────

  it("should never log 'conservative fallback' warning (removed per D-02)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_no_fallback", parentID: undefined })
    mockIsChild.mockReturnValue(false)
    mockPendingHas.mockReturnValue(false)

    await tracker.handleChatMessage(
      { sessionID: "ses_no_fallback" },
      { message: { role: "assistant" }, parts: [{ type: "text", text: "Hi" }] },
    )

    // Examine ALL log calls — "conservative fallback" must not appear
    const allLogMessages = mockAppLog.mock.calls
      .map((call: any) => call[0]?.body?.message || "")
      .join(" ")
    expect(allLogMessages).not.toContain("conservative fallback")
  })
})
