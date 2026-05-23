/**
 * Unit tests for PeriodicNotifier — periodic silent injection of delegation
 * progress into parent sessions via the monitor's inject callback.
 *
 * Covers: construction, register/deregister, handlePollTick dedup,
 * immediate injection on change, toast support, deregister cleanup,
 * activeCount getter, and stripDuration helper.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PeriodicNotifier } from "../../../../src/coordination/delegation/periodic-notifier.js"
import type { PeriodicNotifierConfig } from "../../../../src/coordination/delegation/periodic-notifier.js"
import type { DelegationSnapshot } from "../../../../src/coordination/delegation/periodic-notifier.js"

vi.mock("../../../../src/shared/session-api.js", () => ({
  showTuiToast: vi.fn().mockResolvedValue(undefined),
}))

import { showTuiToast } from "../../../../src/shared/session-api.js"

function makeSnapshot(overrides: Partial<DelegationSnapshot> = {}): DelegationSnapshot {
  return {
    delegationId: "del-001",
    parentSessionId: "parent-ses-001",
    agent: "test-agent",
    toolCount: 0,
    actionCount: 0,
    elapsedMs: 5000,
    ...overrides,
  }
}

function makeConfig(overrides: Partial<PeriodicNotifierConfig> = {}): PeriodicNotifierConfig {
  return {
    cadenceMs: 30000,
    batchWindowMs: 2000,
    showToast: false,
    client: {} as any,
    ...overrides,
  }
}

describe("PeriodicNotifier", () => {
  let notifier: PeriodicNotifier
  let config: PeriodicNotifierConfig
  let injectFn: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    config = makeConfig()
    injectFn = vi.fn()
    notifier = new PeriodicNotifier(config, injectFn)
    vi.mocked(showTuiToast).mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    notifier.destroy()
    vi.useRealTimers()
  })

  it("constructs without error and has zero active delegations", () => {
    expect(notifier.activeCount).toBe(0)
  })

  it("register adds a delegation and activeCount increments", () => {
    notifier.register(makeSnapshot())
    expect(notifier.activeCount).toBe(1)
  })

  it("deregister removes a delegation and activeCount decrements", () => {
    notifier.register(makeSnapshot())
    notifier.deregister("del-001")
    expect(notifier.activeCount).toBe(0)
  })

  it("deregister is a no-op for unknown delegation IDs", () => {
    notifier.register(makeSnapshot())
    notifier.deregister("del-nonexistent")
    expect(notifier.activeCount).toBe(1)
  })

  it("handlePollTick skips injection when toolCount and actionCount are unchanged", () => {
    const snap = makeSnapshot({ toolCount: 5, actionCount: 3 })
    notifier.register(snap)
    notifier.handlePollTick(snap)
    expect(injectFn).not.toHaveBeenCalled()
  })

  it("handlePollTick injects when toolCount changes", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    const snap2 = makeSnapshot({ toolCount: 3, actionCount: 0 })
    notifier.handlePollTick(snap2)
    expect(injectFn).toHaveBeenCalledTimes(1)
  })

  it("handlePollTick injects when actionCount changes", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    const snap2 = makeSnapshot({ toolCount: 0, actionCount: 5 })
    notifier.handlePollTick(snap2)
    expect(injectFn).toHaveBeenCalledTimes(1)
  })

  it("handlePollTick injects on each change with no double injection", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    const snap2 = makeSnapshot({ toolCount: 1, actionCount: 0 })
    notifier.handlePollTick(snap2)

    const snap3 = makeSnapshot({ toolCount: 3, actionCount: 2 })
    notifier.handlePollTick(snap3)

    expect(injectFn).toHaveBeenCalledTimes(2)
  })

  it("handlePollTick passes parentSessionId and formatted line to inject", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    const snap2 = makeSnapshot({ toolCount: 2, actionCount: 1, elapsedMs: 45000 })
    notifier.handlePollTick(snap2)

    const lastCall = injectFn.mock.calls[injectFn.mock.calls.length - 1]
    expect(lastCall[0]).toBe("parent-ses-001")
    expect(lastCall[1]).toContain("[DT:del-001]")
    expect(lastCall[1]).toContain("tools=2")
    expect(lastCall[2]).toBe("del-001")
  })

  it("showToast=true triggers showTuiToast after inject", async () => {
    const toastConfig = makeConfig({ showToast: true })
    const toastNotifier = new PeriodicNotifier(toastConfig, injectFn)
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    toastNotifier.register(snap1)
    toastNotifier.handlePollTick(snap1)

    const snap2 = makeSnapshot({ toolCount: 1, actionCount: 0 })
    toastNotifier.handlePollTick(snap2)
    await vi.runAllTimersAsync()

    expect(showTuiToast).toHaveBeenCalled()
    toastNotifier.destroy()
  })

  it("showToast=false does NOT trigger showTuiToast", async () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    const snap2 = makeSnapshot({ toolCount: 1, actionCount: 0 })
    notifier.handlePollTick(snap2)
    await vi.runAllTimersAsync()

    expect(showTuiToast).not.toHaveBeenCalled()
  })

  it("multiple changes within same tick each trigger injection", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    notifier.handlePollTick(makeSnapshot({ toolCount: 1, actionCount: 0 }))
    notifier.handlePollTick(makeSnapshot({ toolCount: 3, actionCount: 1 }))

    expect(injectFn).toHaveBeenCalledTimes(2)
  })

  it("deregister prevents further injection for that delegation", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    notifier.handlePollTick(makeSnapshot({ toolCount: 1, actionCount: 0 }))
    notifier.deregister("del-001")

    expect(injectFn).toHaveBeenCalledTimes(1)
  })

  it("showTuiToast failure does not throw (fire-and-forget)", async () => {
    vi.mocked(showTuiToast).mockRejectedValueOnce(new Error("network failure"))

    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(snap1)

    const snap2 = makeSnapshot({ toolCount: 1, actionCount: 0 })
    notifier.handlePollTick(snap2)
    await vi.runAllTimersAsync()

    expect(() => {}).not.toThrow()
  })

  it("destroy clears all tracked delegations", () => {
    notifier.register(makeSnapshot({ delegationId: "del-a" }))
    notifier.register(makeSnapshot({ delegationId: "del-b" }))

    notifier.destroy()

    expect(notifier.activeCount).toBe(0)
  })

  it("activeCount reflects only currently tracked delegations", () => {
    notifier.register(makeSnapshot({ delegationId: "del-a" }))
    notifier.register(makeSnapshot({ delegationId: "del-b" }))
    expect(notifier.activeCount).toBe(2)

    notifier.deregister("del-a")
    expect(notifier.activeCount).toBe(1)

    notifier.deregister("del-b")
    expect(notifier.activeCount).toBe(0)
  })

  it("destroy clears all tracked delegations and flush timers", () => {
    notifier.register(makeSnapshot({ delegationId: "del-a" }))
    notifier.register(makeSnapshot({ delegationId: "del-b" }))

    notifier.handlePollTick(makeSnapshot({ delegationId: "del-a", toolCount: 1, actionCount: 0 }))

    notifier.destroy()

    expect(notifier.activeCount).toBe(0)

    vi.advanceTimersByTime(5000)
    expect(injectFn).toHaveBeenCalledTimes(1)
  })
})

describe("stripDuration", () => {
  it("removes duration substring from formatted notification line", async () => {
    const { stripDuration } = await import("../../../../src/coordination/delegation/periodic-notifier.js")
    const input = "[DT:del-001] ✅ running | 45.0s | tools=3 | agent=test"
    const result = stripDuration(input)
    expect(result).toBe("[DT:del-001] ✅ running | - | tools=3 | agent=test")
  })

  it("handles milliseconds duration format", async () => {
    const { stripDuration } = await import("../../../../src/coordination/delegation/periodic-notifier.js")
    const input = "[DT:del-001] ✅ running | 500ms | tools=1 | agent=test"
    const result = stripDuration(input)
    expect(result).toBe("[DT:del-001] ✅ running | - | tools=1 | agent=test")
  })

  it("handles minutes-and-seconds duration format", async () => {
    const { stripDuration } = await import("../../../../src/coordination/delegation/periodic-notifier.js")
    const input = "[DT:del-001] ✅ running | 2m 30s | tools=5 | agent=test"
    const result = stripDuration(input)
    expect(result).toBe("[DT:del-001] ✅ running | - | tools=5 | agent=test")
  })
})
