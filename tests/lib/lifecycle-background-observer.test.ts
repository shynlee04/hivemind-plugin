import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { observeBackgroundCompletion } from "../../src/lib/lifecycle-background-observer.js"
import type { SessionContinuityRecord } from "../../src/lib/types.js"

// Mock dependencies
vi.mock("../../src/lib/session-api.js", () => ({
  getSessionStatusMap: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock("../../src/lib/notification-handler.js", () => ({
  notifyParentSession: vi.fn(),
}))

vi.mock("../../src/lib/continuity.js", () => ({
  patchSessionContinuity: vi.fn(),
  getSessionContinuity: vi.fn(),
}))

import { getSessionStatusMap, getSession } from "../../src/lib/session-api.js"
import { notifyParentSession } from "../../src/lib/notification-handler.js"
import { patchSessionContinuity, getSessionContinuity } from "../../src/lib/continuity.js"

const mockGetSessionStatusMap = vi.mocked(getSessionStatusMap)
const mockNotifyParentSession = vi.mocked(notifyParentSession)
const mockPatchSessionContinuity = vi.mocked(patchSessionContinuity)
const mockGetSessionContinuity = vi.mocked(getSessionContinuity)
const mockGetSession = vi.mocked(getSession)

describe("observeBackgroundCompletion", () => {
  const mockNow = vi.fn()
  const mockPatchLifecycle = vi.fn()
  const mockReleaseQueue = vi.fn()
  const mockGetSessionContinuity = vi.fn()
  const instantSleep = vi.fn().mockResolvedValue(undefined)

  const mockContinuity: SessionContinuityRecord = {
    sessionID: "child-123",
    metadata: {
      parentSessionID: "parent-456",
      rootSessionID: "root-789",
      delegation: {
        rootID: "root-789",
        childDepth: 1,
        budgetUsed: 100,
        agent: "researcher",
        route: {} as any,
        queueKey: "test-key",
      },
      delegationPacket: {
        description: "Test task",
        parentChain: ["root-789", "parent-456"],
        status: "running",
      },
      execution: {
        family: "delegation",
        submode: "builtin-subsession",
        rationale: "test",
        characteristics: {},
        capabilityEvidence: { projectRoot: "/tmp" },
      },
      title: "Test task",
      description: "Test task",
      category: "research",
      route: {} as any,
      scope: "test",
      constraints: [],
      runInBackground: true,
      status: "running",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lifecycle: {
        phase: "running",
        runMode: "async",
        queueKey: "test-key",
        observation: {
          source: "test",
          observedAt: Date.now(),
          detail: "test",
        },
      },
    },
  }

  beforeEach(() => {
    mockNow.mockReturnValue(Date.now())
    mockPatchLifecycle.mockReset()
    mockReleaseQueue.mockReset()
    mockGetSessionContinuity.mockReset()
    mockGetSessionContinuity.mockReturnValue(mockContinuity)
    mockNotifyParentSession.mockReset()
    mockGetSessionStatusMap.mockReset()
    instantSleep.mockClear()
  })

  it("completes when session becomes idle", async () => {
    const startTime = Date.now()
    let currentTime = startTime
    mockNow.mockImplementation(() => currentTime)

    // First poll: busy, second poll: idle
    mockGetSessionStatusMap
      .mockResolvedValueOnce({ "child-123": { type: "busy" } })
      .mockResolvedValueOnce({ "child-123": { type: "idle" } })

    await observeBackgroundCompletion({
      sessionID: "child-123",
      client: {} as any,
      pollTimeoutMs: 60000,
      now: mockNow,
      getSessionContinuity: mockGetSessionContinuity,
      patchLifecycle: mockPatchLifecycle,
      releaseQueue: mockReleaseQueue,
      sleepFn: instantSleep,
    })

    // After first poll (busy), time advances
    currentTime = startTime + 15000

    expect(mockPatchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "child-123",
        status: "completed",
        phase: "completed",
        observation: expect.objectContaining({
          source: "observe:poll-idle",
          detail: "background-completion-poll-idle",
        }),
      }),
    )

    expect(mockNotifyParentSession).toHaveBeenCalledWith(
      expect.any(Object),
      "parent-456",
      expect.objectContaining({
        sessionID: "child-123",
        status: "completed",
      }),
      expect.any(Function),
    )

    expect(mockReleaseQueue).toHaveBeenCalledWith("background-complete")
  })

  it("fails when session enters retry state", async () => {
    mockGetSessionStatusMap.mockResolvedValueOnce({ "child-123": { type: "retry" } })

    await observeBackgroundCompletion({
      sessionID: "child-123",
      client: {} as any,
      pollTimeoutMs: 60000,
      now: mockNow,
      getSessionContinuity: mockGetSessionContinuity,
      patchLifecycle: mockPatchLifecycle,
      releaseQueue: mockReleaseQueue,
      sleepFn: instantSleep,
    })

    expect(mockPatchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "child-123",
        status: "error",
        phase: "failed",
        observation: expect.objectContaining({
          source: "observe:poll-retry",
        }),
      }),
    )

    expect(mockNotifyParentSession).toHaveBeenCalledWith(
      expect.any(Object),
      "parent-456",
      expect.objectContaining({
        sessionID: "child-123",
        status: "failed",
      }),
      expect.any(Function),
    )
  })

  it("fails when session is deleted (not in status map)", async () => {
    mockGetSessionStatusMap.mockResolvedValueOnce({})

    await observeBackgroundCompletion({
      sessionID: "child-123",
      client: {} as any,
      pollTimeoutMs: 60000,
      now: mockNow,
      getSessionContinuity: mockGetSessionContinuity,
      patchLifecycle: mockPatchLifecycle,
      releaseQueue: mockReleaseQueue,
      sleepFn: instantSleep,
    })

    expect(mockPatchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "child-123",
        status: "error",
        phase: "failed",
        observation: expect.objectContaining({
          source: "observe:poll-deleted",
          detail: "background-completion-poll-deleted",
        }),
      }),
    )
  })

  it("fails when SDK call throws", async () => {
    mockGetSessionStatusMap.mockRejectedValueOnce(new Error("Network error"))

    await observeBackgroundCompletion({
      sessionID: "child-123",
      client: {} as any,
      pollTimeoutMs: 60000,
      now: mockNow,
      getSessionContinuity: mockGetSessionContinuity,
      patchLifecycle: mockPatchLifecycle,
      releaseQueue: mockReleaseQueue,
      sleepFn: instantSleep,
    })

    expect(mockPatchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "child-123",
        status: "error",
        phase: "failed",
        observation: expect.objectContaining({
          source: "observe:poll-failed",
          detail: "background-completion-poll-sdk-error",
        }),
      }),
    )
  })

  it("fails when polling times out", async () => {
    const startTime = Date.now()
    let callCount = 0
    let currentTime = startTime
    
    mockGetSessionStatusMap.mockImplementation(async () => {
      callCount++
      // After 3 calls, advance time past timeout
      if (callCount >= 3) {
        currentTime = startTime + 35000
      }
      return { "child-123": { type: "busy" } }
    })
    
    mockNow.mockImplementation(() => currentTime)

    await observeBackgroundCompletion({
      sessionID: "child-123",
      client: {} as any,
      pollTimeoutMs: 30000,
      now: mockNow,
      getSessionContinuity: mockGetSessionContinuity,
      patchLifecycle: mockPatchLifecycle,
      releaseQueue: mockReleaseQueue,
      sleepFn: instantSleep,
    })

    expect(mockPatchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "child-123",
        status: "error",
        phase: "failed",
        observation: expect.objectContaining({
          source: "observe:poll-timeout",
          detail: "background-completion-poll-timeout",
        }),
      }),
    )
  })

  it("continues polling while session is busy", async () => {
    // Busy for 3 polls, then idle
    mockGetSessionStatusMap
      .mockResolvedValueOnce({ "child-123": { type: "busy" } })
      .mockResolvedValueOnce({ "child-123": { type: "busy" } })
      .mockResolvedValueOnce({ "child-123": { type: "busy" } })
      .mockResolvedValueOnce({ "child-123": { type: "idle" } })

    await observeBackgroundCompletion({
      sessionID: "child-123",
      client: {} as any,
      pollTimeoutMs: 120000,
      now: mockNow,
      getSessionContinuity: mockGetSessionContinuity,
      patchLifecycle: mockPatchLifecycle,
      releaseQueue: mockReleaseQueue,
      sleepFn: instantSleep,
    })

    // Should have called getStatusMap 4 times
    expect(mockGetSessionStatusMap).toHaveBeenCalledTimes(4)

    // Should have completed successfully
    expect(mockPatchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        phase: "completed",
      }),
    )
  })

  it("does not notify parent if parentSessionID is missing", async () => {
    const continuityWithoutParent: SessionContinuityRecord = {
      ...mockContinuity,
      metadata: {
        ...mockContinuity.metadata,
        parentSessionID: undefined,
      },
    }
    mockGetSessionContinuity.mockReturnValue(continuityWithoutParent)

    mockGetSessionStatusMap.mockResolvedValueOnce({ "child-123": { type: "idle" } })

    await observeBackgroundCompletion({
      sessionID: "child-123",
      client: {} as any,
      pollTimeoutMs: 60000,
      now: mockNow,
      getSessionContinuity: mockGetSessionContinuity,
      patchLifecycle: mockPatchLifecycle,
      releaseQueue: mockReleaseQueue,
      sleepFn: instantSleep,
    })

    expect(mockNotifyParentSession).not.toHaveBeenCalled()
  })
})
