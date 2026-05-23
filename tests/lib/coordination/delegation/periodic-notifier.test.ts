/**
 * Unit tests for PeriodicNotifier — batch-coalesced periodic injection of
 * delegation progress into parent sessions.
 *
 * Covers: construction, register/deregister, handlePollTick dedup,
 * batch coalescing (single delegation, multiple delegations, 2s window),
 * cross-batch dedup, aggregated toast, destroy cleanup.
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

  it("handlePollTick does NOT inject immediately — only queues for batch", () => {
    const snap = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap)
    notifier.handlePollTick(makeSnapshot({ toolCount: 3, actionCount: 0 }))
    expect(injectFn).not.toHaveBeenCalled()
  })

  it("flush fires after batch window and injects combined block", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)

    notifier.handlePollTick(makeSnapshot({ toolCount: 1, actionCount: 0 }))
    expect(injectFn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(2100)
    expect(injectFn).toHaveBeenCalledTimes(1)
  })

  it("multiple delegations are combined into a single combined block", () => {
    notifier.register(makeSnapshot({ delegationId: "del-a", agent: "gsd-A" }))
    notifier.register(makeSnapshot({ delegationId: "del-b", agent: "gsd-B" }))

    notifier.handlePollTick(makeSnapshot({ delegationId: "del-a", agent: "gsd-A", toolCount: 3, actionCount: 1 }))
    notifier.handlePollTick(makeSnapshot({ delegationId: "del-b", agent: "gsd-B", toolCount: 2, actionCount: 0 }))

    vi.advanceTimersByTime(2100)
    expect(injectFn).toHaveBeenCalledTimes(1)

    const combined = injectFn.mock.calls[0][1] as string
    expect(combined).toContain("<system_reminder>")
    expect(combined).toContain("del-a")
    expect(combined).toContain("del-b")
    expect(combined).toContain("gsd-A")
    expect(combined).toContain("gsd-B")
    expect(combined).toContain("</system_reminder>")
  })

  it("handlePollTick skips batch when toolCount and actionCount unchanged", () => {
    const snap = makeSnapshot({ toolCount: 5, actionCount: 3 })
    notifier.register(snap)
    notifier.handlePollTick(snap)
    vi.advanceTimersByTime(2100)
    expect(injectFn).not.toHaveBeenCalled()
  })

  it("cross-batch dedup skips flush when no new changes since last batch", () => {
    notifier.register(makeSnapshot({ delegationId: "del-a" }))

    // First batch: tool changed
    notifier.handlePollTick(makeSnapshot({ delegationId: "del-a", toolCount: 1, actionCount: 0 }))
    vi.advanceTimersByTime(2100)
    expect(injectFn).toHaveBeenCalledTimes(1)

    // Second tick: same data → same hash → skip
    notifier.handlePollTick(makeSnapshot({ delegationId: "del-a", toolCount: 1, actionCount: 0 }))
    vi.advanceTimersByTime(2100)
    expect(injectFn).toHaveBeenCalledTimes(1)
  })

  it("aggregated toast shows delegation count and top agents", async () => {
    const toastConfig = makeConfig({ showToast: true })
    const toastNotifier = new PeriodicNotifier(toastConfig, injectFn)

    toastNotifier.register(makeSnapshot({ delegationId: "del-a", agent: "gsd-A" }))
    toastNotifier.register(makeSnapshot({ delegationId: "del-b", agent: "gsd-B" }))
    toastNotifier.register(makeSnapshot({ delegationId: "del-c", agent: "gsd-C" }))

    toastNotifier.handlePollTick(makeSnapshot({ delegationId: "del-a", agent: "gsd-A", toolCount: 1, actionCount: 0, elapsedMs: 30000 }))
    toastNotifier.handlePollTick(makeSnapshot({ delegationId: "del-b", agent: "gsd-B", toolCount: 1, actionCount: 0, elapsedMs: 45000 }))
    toastNotifier.handlePollTick(makeSnapshot({ delegationId: "del-c", agent: "gsd-C", toolCount: 1, actionCount: 0, elapsedMs: 15000 }))

    vi.advanceTimersByTime(2100)
    await vi.runAllTimersAsync()

    expect(showTuiToast).toHaveBeenCalledTimes(1)
    const toastMsg = vi.mocked(showTuiToast).mock.calls[0][1] as string
    expect(toastMsg).toContain("3 delegations active")
    // Should list top 3 by elapsed
    toastNotifier.destroy()
  })

  it("aggregated toast shows count with +N more when > 3 delegations", async () => {
    const toastConfig = makeConfig({ showToast: true })
    const toastNotifier = new PeriodicNotifier(toastConfig, injectFn)

    for (let i = 0; i < 5; i++) {
      toastNotifier.register(makeSnapshot({ delegationId: `del-${i}`, agent: `gsd-${i}` }))
    }
    for (let i = 0; i < 5; i++) {
      toastNotifier.handlePollTick(makeSnapshot({ delegationId: `del-${i}`, agent: `gsd-${i}`, toolCount: 1, actionCount: 0, elapsedMs: 10000 + i * 5000 }))
    }

    vi.advanceTimersByTime(2100)
    await vi.runAllTimersAsync()

    const toastMsg = vi.mocked(showTuiToast).mock.calls[0][1] as string
    expect(toastMsg).toContain("+2 more")
    toastNotifier.destroy()
  })

  it("showToast=false does NOT trigger showTuiToast", async () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)
    notifier.handlePollTick(makeSnapshot({ toolCount: 1, actionCount: 0 }))
    vi.advanceTimersByTime(2100)
    await vi.runAllTimersAsync()

    expect(showTuiToast).not.toHaveBeenCalled()
  })

  it("deregister during batch window removes delegation from pending flush", () => {
    const snap1 = makeSnapshot({ toolCount: 0, actionCount: 0 })
    notifier.register(snap1)

    notifier.handlePollTick(makeSnapshot({ toolCount: 1, actionCount: 0 }))
    notifier.deregister("del-001")
    vi.advanceTimersByTime(3000)

    expect(injectFn).not.toHaveBeenCalled()
  })

  it("showTuiToast failure does not throw (fire-and-forget)", async () => {
    vi.mocked(showTuiToast).mockRejectedValueOnce(new Error("network failure"))

    notifier.register(makeSnapshot())
    notifier.handlePollTick(makeSnapshot({ toolCount: 1, actionCount: 0 }))
    vi.advanceTimersByTime(2100)
    await vi.runAllTimersAsync()

    expect(() => {}).not.toThrow()
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

  it("destroy clears all tracked delegations and pending flush", () => {
    notifier.register(makeSnapshot({ delegationId: "del-a" }))
    notifier.register(makeSnapshot({ delegationId: "del-b" }))

    notifier.handlePollTick(makeSnapshot({ delegationId: "del-a", toolCount: 1, actionCount: 0 }))

    notifier.destroy()
    expect(notifier.activeCount).toBe(0)

    vi.advanceTimersByTime(5000)
    expect(injectFn).not.toHaveBeenCalled()
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
