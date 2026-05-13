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
