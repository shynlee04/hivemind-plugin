import { describe, it, expect, vi, afterEach } from "vitest"

import { CompletionDetector } from "../../../src/coordination/completion/detector.js"

describe("CompletionDetector.pruneStaleTimers", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("pruneStaleTimers removes all stale timers when maxAgeMs is 0", () => {
    vi.useFakeTimers()
    const detector = new CompletionDetector(30000)

    // Add 3 stability timers with start times older than 0ms
    detector["stabilityTimers"].set("session-1", setTimeout(() => {}, 30000))
    detector["stabilityTimers"].set("session-2", setTimeout(() => {}, 30000))
    detector["stabilityTimers"].set("session-3", setTimeout(() => {}, 30000))
    detector["messageCounts"].set("session-1", 5)
    detector["messageCounts"].set("session-2", 3)
    detector["messageCounts"].set("session-3", 7)
    detector["timerStartTimes"].set("session-1", Date.now() - 5000)
    detector["timerStartTimes"].set("session-2", Date.now() - 10000)
    detector["timerStartTimes"].set("session-3", Date.now() - 2000)

    const pruned = detector.pruneStaleTimers(0)

    expect(pruned).toBe(3)
    expect(detector["stabilityTimers"].size).toBe(0)
    expect(detector["messageCounts"].size).toBe(0)
    expect(detector["timerStartTimes"].size).toBe(0)
  })

  it("pruneStaleTimers prunes nothing when maxAgeMs is large and timers are recent", () => {
    vi.useFakeTimers()
    const detector = new CompletionDetector(30000)

    // Add 3 stability timers with recent start times
    detector["stabilityTimers"].set("session-1", setTimeout(() => {}, 30000))
    detector["stabilityTimers"].set("session-2", setTimeout(() => {}, 30000))
    detector["stabilityTimers"].set("session-3", setTimeout(() => {}, 30000))
    detector["messageCounts"].set("session-1", 5)
    detector["messageCounts"].set("session-2", 3)
    detector["messageCounts"].set("session-3", 7)
    detector["timerStartTimes"].set("session-1", Date.now() - 1000)
    detector["timerStartTimes"].set("session-2", Date.now() - 500)
    detector["timerStartTimes"].set("session-3", Date.now() - 800)

    const pruned = detector.pruneStaleTimers(120_000)

    expect(pruned).toBe(0)
    expect(detector["stabilityTimers"].size).toBe(3)
    expect(detector["messageCounts"].size).toBe(3)
    expect(detector["timerStartTimes"].size).toBe(3)
  })

  it("pruneStaleTimers handles empty Maps gracefully", () => {
    const detector = new CompletionDetector(30000)

    const pruned = detector.pruneStaleTimers(5000)

    expect(pruned).toBe(0)
    // No errors thrown
  })

  it("pruneStaleTimers partially prunes when some timers are stale", () => {
    vi.useFakeTimers()
    const detector = new CompletionDetector(30000)

    // Add 3 timers: session-1 (5000ms old), session-2 (1000ms old), session-3 (10000ms old)
    detector["stabilityTimers"].set("session-1", setTimeout(() => {}, 30000))
    detector["stabilityTimers"].set("session-2", setTimeout(() => {}, 30000))
    detector["stabilityTimers"].set("session-3", setTimeout(() => {}, 30000))
    detector["messageCounts"].set("session-1", 5)
    detector["messageCounts"].set("session-2", 3)
    detector["messageCounts"].set("session-3", 7)
    detector["timerStartTimes"].set("session-1", Date.now() - 5000)
    detector["timerStartTimes"].set("session-2", Date.now() - 1000)
    detector["timerStartTimes"].set("session-3", Date.now() - 10000)

    // Prune timers older than 3 seconds
    const pruned = detector.pruneStaleTimers(3000)

    expect(pruned).toBe(2)
    expect(detector["stabilityTimers"].size).toBe(1)
    expect(detector["messageCounts"].size).toBe(1)
    expect(detector["timerStartTimes"].size).toBe(1)
    expect(detector["stabilityTimers"].has("session-2")).toBe(true)
    expect(detector["messageCounts"].has("session-2")).toBe(true)
    expect(detector["timerStartTimes"].has("session-2")).toBe(true)
  })
})
