import { vi } from "vitest"

import { EscalationTimer, ESCALATION_ICONS } from "../../../../src/coordination/delegation/escalation-timer.js"
import { DelegationMonitor } from "../../../../src/coordination/delegation/monitor.js"

describe("EscalationTimer", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("fires WARN, NUDGE, ALERT, and TERMINATE at configured thresholds", () => {
    const onLevel = vi.fn()
    const timer = new EscalationTimer()

    timer.start("dt-1", [60, 120, 180, 300], onLevel)

    vi.advanceTimersByTime(60_000)
    expect(onLevel).toHaveBeenLastCalledWith("WARN", 60, "⚠", "dt-1")
    vi.advanceTimersByTime(60_000)
    expect(onLevel).toHaveBeenLastCalledWith("NUDGE", 120, "⚠", "dt-1")
    vi.advanceTimersByTime(60_000)
    expect(onLevel).toHaveBeenLastCalledWith("ALERT", 180, "🔴", "dt-1")
    vi.advanceTimersByTime(120_000)
    expect(onLevel).toHaveBeenLastCalledWith("TERMINATE", 300, "⛔", "dt-1")
    expect(ESCALATION_ICONS).toEqual(["⚠", "⚠", "🔴", "⛔"])
  })

  it("clears all pending escalation timers when stopped", () => {
    const onLevel = vi.fn()
    const timer = new EscalationTimer()

    timer.start("dt-1", [60, 120, 180, 300], onLevel)
    timer.stop()
    vi.runAllTimers()

    expect(onLevel).not.toHaveBeenCalled()
  })
})

describe("DelegationMonitor", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("creates six progressive polling injections at the expected cadence", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({ inject, getStatus: () => "running" })

    monitor.start("dt-1", "parent-1")
    for (const elapsed of [30, 45, 60, 90, 120, 180]) {
      vi.advanceTimersByTime(elapsed * 1000)
    }

    const pollingLines = inject.mock.calls
      .map((call) => call[1])
      .filter((line) => line.includes("status=running"))

    expect(pollingLines).toEqual([
      "[DT:dt-1] status=running elapsed=30s",
      "[DT:dt-1] status=running elapsed=45s",
      "[DT:dt-1] status=running elapsed=60s",
      "[DT:dt-1] status=running elapsed=90s",
      "[DT:dt-1] status=running elapsed=120s",
      "[DT:dt-1] status=running elapsed=180s",
    ])
  })

  it("stops polling injections after completion", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({ inject, getStatus: () => "running" })

    monitor.start("dt-1", "parent-1")
    vi.advanceTimersByTime(30_000)
    monitor.onCompletion("dt-1")
    vi.runAllTimers()

    expect(inject).toHaveBeenCalledTimes(1)
  })

  it("keeps monitoring active for other delegations when one delegation completes", () => {
    const inject = vi.fn()
    const monitor = new DelegationMonitor({ inject, getStatus: () => "running", pollingCadence: [30] })

    monitor.start("dt-1", "parent-1")
    monitor.start("dt-2", "parent-2")
    monitor.onCompletion("dt-1")
    vi.advanceTimersByTime(30_000)

    expect(inject).toHaveBeenCalledTimes(1)
    expect(inject).toHaveBeenCalledWith("parent-2", "[DT:dt-2] status=running elapsed=30s")
  })
})
