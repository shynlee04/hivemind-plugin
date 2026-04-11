import { describe, it, expect } from "vitest"

import { PollStrategy, DEFAULT_POLL_CONFIG } from "../../../../src/lib/tasking/completion/poll-strategy.js"

describe("poll-strategy (D-11)", () => {
  describe("default config", () => {
    it("starts at 15000ms", () => {
      // WHY: D-11 specifies 15s initial interval to avoid hammering the SDK
      const strategy = new PollStrategy()
      expect(strategy.nextInterval()).toBe(15_000)
    })

    it("increments by 5000ms each step", () => {
      // WHY: Linear backoff reduces SDK load while staying responsive
      const strategy = new PollStrategy()
      expect(strategy.nextInterval()).toBe(15_000)
      expect(strategy.nextInterval()).toBe(20_000)
      expect(strategy.nextInterval()).toBe(25_000)
    })

    it("caps at 60000ms", () => {
      // WHY: D-11 caps at 60s to prevent unbounded wait times
      const strategy = new PollStrategy()
      const results: number[] = []
      for (let i = 0; i < 20; i++) {
        results.push(strategy.nextInterval())
      }
      // Should cap at 60000 and stay there
      expect(results[9]).toBe(60_000) // 15 + 9*5 = 60
      expect(results[10]).toBe(60_000)
      expect(results[19]).toBe(60_000)
    })
  })

  describe("reset()", () => {
    it("brings interval back to 15000ms", () => {
      // WHY: Poll counter should reset when activity is detected
      const strategy = new PollStrategy()
      strategy.nextInterval() // 15000
      strategy.nextInterval() // 20000
      strategy.nextInterval() // 25000
      strategy.reset()
      expect(strategy.nextInterval()).toBe(15_000)
    })

    it("returns correct sequence after reset", () => {
      // WHY: After reset, backoff should start fresh
      const strategy = new PollStrategy()
      strategy.nextInterval() // 15000
      strategy.nextInterval() // 20000
      strategy.reset()
      expect(strategy.nextInterval()).toBe(15_000)
      expect(strategy.nextInterval()).toBe(20_000)
      expect(strategy.nextInterval()).toBe(25_000)
    })
  })

  describe("getCurrentInterval()", () => {
    it("returns current interval without advancing", () => {
      const strategy = new PollStrategy()
      expect(strategy.getCurrentInterval()).toBe(15_000)
      expect(strategy.getCurrentInterval()).toBe(15_000)
      strategy.nextInterval()
      expect(strategy.getCurrentInterval()).toBe(20_000)
    })
  })

  describe("custom config", () => {
    it("overrides defaults", () => {
      // WHY: Configurability enables testing and different use cases
      const strategy = new PollStrategy({
        initialIntervalMs: 5_000,
        backoffIncrementMs: 2_000,
        maxIntervalMs: 20_000,
      })
      expect(strategy.nextInterval()).toBe(5_000)
      expect(strategy.nextInterval()).toBe(7_000)
      expect(strategy.nextInterval()).toBe(9_000)
    })

    it("respects custom max", () => {
      const strategy = new PollStrategy({
        initialIntervalMs: 5_000,
        backoffIncrementMs: 5_000,
        maxIntervalMs: 15_000,
      })
      expect(strategy.nextInterval()).toBe(5_000)
      expect(strategy.nextInterval()).toBe(10_000)
      expect(strategy.nextInterval()).toBe(15_000)
      expect(strategy.nextInterval()).toBe(15_000)
    })
  })

  describe("DEFAULT_POLL_CONFIG", () => {
    it("has expected values", () => {
      expect(DEFAULT_POLL_CONFIG.initialIntervalMs).toBe(15_000)
      expect(DEFAULT_POLL_CONFIG.backoffIncrementMs).toBe(5_000)
      expect(DEFAULT_POLL_CONFIG.maxIntervalMs).toBe(60_000)
    })
  })
})
