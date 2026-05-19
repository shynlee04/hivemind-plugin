import { vi } from "vitest"

import { DelegationMonitor } from "../../../../src/coordination/delegation/monitor.js"
import type { Delegation } from "../../../../src/coordination/delegation/types.js"

function createMockDelegation(overrides?: Partial<Delegation>): Delegation {
  return {
    id: "dt-1",
    parentSessionId: "parent-1",
    childSessionId: "child-1",
    agent: "test-agent",
    status: "running",
    createdAt: Date.now(),
    lastMessageCount: 0,
    stablePollCount: 0,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: "/tmp",
    queueKey: "default",
    actionCount: 0,
    toolCallCount: 0,
    ...overrides,
  }
}

describe("DelegationMonitor", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("injects thin-line status at each polling cadence point", () => {
    const inject = vi.fn()
    const record = createMockDelegation({ actionCount: 3, toolCallCount: 2 })
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => record,
      getActionCount: () => 3,
      onComplete: vi.fn(),
      onFailure: vi.fn(),
    })

    monitor.start("dt-1", "parent-1")

    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(15_000)
    vi.advanceTimersByTime(15_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(60_000)

    const statusLines = inject.mock.calls.filter((call) => call[1].includes("status=running"))
    expect(statusLines.length).toBe(6)
    expect(statusLines[0][1]).toContain("agent=test-agent")
    expect(statusLines[0][1]).toContain("actions=3")
  })

  it("stops injecting after completion", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation(),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure: vi.fn(),
    })

    monitor.start("dt-1", "parent-1")
    vi.advanceTimersByTime(30_000)
    monitor.onCompletion("dt-1", {
      toolActivityStalled: true,
      hasAssistantMessage: true,
      hasFileChanges: true,
      isComplete: true,
      lastToolActivityAt: null,
      secondsSinceLastToolActivity: null,
    })
    vi.runAllTimers()

    expect(inject).toHaveBeenCalledTimes(1)
  })

  it("triggers failure when action count unchanged at 60s checkpoint", () => {
    const inject = vi.fn()
    const onFailure = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation({ actionCount: 0 }),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure,
    })

    monitor.start("dt-1", "parent-1")
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)

    expect(onFailure).toHaveBeenCalled()
    const failureResult = onFailure.mock.calls[0][1]
    expect(failureResult).toEqual(
      expect.objectContaining({
        delegationId: "dt-1",
        level: 1,
        elapsedSeconds: 60,
      }),
    )
  })

  it("triggers final failure at 300s and stops injection", () => {
    const inject = vi.fn()
    const onFailure = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation({ actionCount: 0 }),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure,
    })

    monitor.start("dt-1", "parent-1")

    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(60_000)
    vi.advanceTimersByTime(120_000)

    expect(onFailure).toHaveBeenCalledTimes(4)
    const finalFailureResult = onFailure.mock.calls[3][1]
    expect(finalFailureResult).toEqual(
      expect.objectContaining({
        level: 4,
        elapsedSeconds: 300,
        isFinal: true,
      }),
    )
  })

  it("does not fail when actions progress between checkpoints", () => {
    const actionCounts: Record<number, number> = { 30: 0, 45: 0, 60: 5, 90: 8, 120: 12, 180: 20 }
    let currentElapsed = 0
    const onFailure = vi.fn()
    const monitor = new DelegationMonitor({
      inject: vi.fn(),
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation({ actionCount: 0 }),
      getActionCount: () => actionCounts[currentElapsed] ?? 0,
      onComplete: vi.fn(),
      onFailure,
    })

    monitor.start("dt-1", "parent-1")

    currentElapsed = 30
    vi.advanceTimersByTime(30_000)
    currentElapsed = 45
    vi.advanceTimersByTime(15_000)
    currentElapsed = 60
    vi.advanceTimersByTime(15_000)
    currentElapsed = 90
    vi.advanceTimersByTime(30_000)
    currentElapsed = 120
    vi.advanceTimersByTime(30_000)
    currentElapsed = 180
    vi.advanceTimersByTime(60_000)

    expect(onFailure).toHaveBeenCalledTimes(0)
  })

  it("keeps monitoring active for other delegations when one completes", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation(),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure: vi.fn(),
      pollingCadence: [30],
    })

    monitor.start("dt-1", "parent-1")
    monitor.start("dt-2", "parent-2")
    monitor.onCompletion("dt-1", {
      toolActivityStalled: true,
      hasAssistantMessage: true,
      hasFileChanges: true,
      isComplete: true,
      lastToolActivityAt: null,
      secondsSinceLastToolActivity: null,
    })
    vi.advanceTimersByTime(30_000)

    expect(inject).toHaveBeenCalledTimes(1)
    expect(inject).toHaveBeenCalledWith("parent-2", expect.stringContaining("dt-2"), "dt-2")
  })

  it("stops all timers when stopped without delegationId", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation(),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure: vi.fn(),
      pollingCadence: [30],
    })

    monitor.start("dt-1", "parent-1")
    monitor.start("dt-2", "parent-2")
    monitor.stop()
    vi.runAllTimers()

    expect(inject).not.toHaveBeenCalled()
  })

  it("injects failure notification with correct format for executed-running-fail", () => {
    let actionCount = 5
    const inject = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation({ actionCount }),
      getActionCount: () => actionCount,
      onComplete: vi.fn(),
      onFailure: vi.fn(),
    })

    monitor.start("dt-1", "parent-1")
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)

    const failureCalls = inject.mock.calls.filter((call) => call[1].includes("Stall failure"))
    expect(failureCalls.length).toBeGreaterThan(0)
    expect(failureCalls[0][1]).toContain("level 1")
  })

  it("injects failure notification with correct format for fail-from-threshold", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation({ actionCount: 0 }),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure: vi.fn(),
    })

    monitor.start("dt-1", "parent-1")
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000)

    const failureCalls = inject.mock.calls.filter((call) => call[1].includes("Execution failure"))
    expect(failureCalls.length).toBeGreaterThan(0)
    expect(failureCalls[0][1]).toContain("no actions recorded")
  })

  it("triggers 600s auto-abort when no assistant message after final failure", () => {
    const inject = vi.fn()
    const onFailure = vi.fn()
    const monitor = new DelegationMonitor({
      inject,
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation({ actionCount: 0 }),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure,
    })

    monitor.start("dt-1", "parent-1")

    // Advance through all 4 failure checkpoints (60, 120, 180, 300)
    vi.advanceTimersByTime(30_000)
    vi.advanceTimersByTime(30_000) // 60s → level 1
    vi.advanceTimersByTime(60_000) // 120s → level 2
    vi.advanceTimersByTime(60_000) // 180s → level 3
    vi.advanceTimersByTime(120_000) // 300s → level 4 (final)

    expect(onFailure).toHaveBeenCalledTimes(4)
    expect(onFailure.mock.calls[3][1]).toEqual(
      expect.objectContaining({ level: 4, elapsedSeconds: 300, isFinal: true }),
    )

    // Advance to 600s — should trigger auto-abort callback
    vi.advanceTimersByTime(300_000) // 600s total

    expect(onFailure).toHaveBeenCalledTimes(5)
    expect(onFailure.mock.calls[4][1]).toEqual(
      expect.objectContaining({
        delegationId: "dt-1",
        elapsedSeconds: 600,
        isAutoAbort: true,
      }),
    )
  })

  it("returns null or correct escalation level based on checkpoint tracker failure level", () => {
    const monitor = new DelegationMonitor({
      inject: vi.fn(),
      getStatus: () => "running",
      getDelegationRecord: () => createMockDelegation({ actionCount: 0 }),
      getActionCount: () => 0,
      onComplete: vi.fn(),
      onFailure: vi.fn(),
    })

    expect(monitor.getEscalationLevel("dt-1")).toBeNull()

    monitor.start("dt-1", "parent-1")
    expect(monitor.getEscalationLevel("dt-1")).toBeNull()

    // Advance to 60s -> level 1 failure
    vi.advanceTimersByTime(60_000)
    expect(monitor.getEscalationLevel("dt-1")).toBe("Level 1")

    // Advance to 120s -> level 2 failure
    vi.advanceTimersByTime(60_000)
    expect(monitor.getEscalationLevel("dt-1")).toBe("Level 2")

    monitor.stop("dt-1")
    expect(monitor.getEscalationLevel("dt-1")).toBeNull()
  })
})
