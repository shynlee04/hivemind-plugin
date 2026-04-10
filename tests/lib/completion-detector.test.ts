import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { CompletionDetector } from "../../src/lib/completion-detector.js"
import type { CompletionResult } from "../../src/lib/completion-detector.js"

describe("CompletionDetector", () => {
  let detector: CompletionDetector

  beforeEach(() => {
    vi.useFakeTimers()
    detector = new CompletionDetector(100)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // --- feed → watch ---
  describe("feed + watch", () => {
    it("resolves with idle when session.idle is fed", async () => {
      const resultPromise = detector.watch("ses_1", 5000)
      detector.feed("session.idle", "ses_1")

      await expect(resultPromise).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_1",
      })
    })

    it("resolves with error when session.error is fed", async () => {
      const resultPromise = detector.watch("ses_1", 5000)
      detector.feed("session.error", "ses_1", "oops")

      await expect(resultPromise).resolves.toEqual({
        signal: "error",
        sessionID: "ses_1",
        error: "oops",
      })
    })

    it("resolves with deleted when session.deleted is fed", async () => {
      const resultPromise = detector.watch("ses_1", 5000)
      detector.feed("session.deleted", "ses_1")

      await expect(resultPromise).resolves.toEqual({
        signal: "deleted",
        sessionID: "ses_1",
      })
    })
  })

  // --- cache before watch ---
  describe("cache before watch", () => {
    it("does not cache external idle events before a watcher exists", async () => {
      detector.feed("session.idle", "ses_1")

      const resultPromise = detector.watch("ses_1", 50)
      vi.advanceTimersByTime(60)

      await expect(resultPromise).resolves.toEqual({
        signal: "timeout",
        sessionID: "ses_1",
      })
    })

    it("returns cached error result when feed arrives before watch", async () => {
      detector.feed("session.error", "ses_1", "crash")

      const result = await detector.watch("ses_1", 5000)
      expect(result).toEqual({
        signal: "error",
        sessionID: "ses_1",
        error: "crash",
      })
    })

    it("still caches idle results produced by the internal stability timer", async () => {
      detector.feedMessageCount("ses_2", 5)
      vi.advanceTimersByTime(100)

      const result = await detector.watch("ses_2", 5000)
      expect(result).toEqual({
        signal: "idle",
        sessionID: "ses_2",
      })
    })
  })

  // --- timeout ---
  describe("timeout", () => {
    it("resolves with timeout when no event arrives", async () => {
      const resultPromise = detector.watch("ses_1", 50)
      vi.advanceTimersByTime(60)

      await expect(resultPromise).resolves.toEqual({
        signal: "timeout",
        sessionID: "ses_1",
      })
    })
  })

  // --- cancel ---
  describe("cancel", () => {
    it("resolves waiting watcher with cancelled", async () => {
      const resultPromise = detector.watch("ses_1", 5000)
      detector.cancel("ses_1")

      await expect(resultPromise).resolves.toEqual({
        signal: "cancelled",
        sessionID: "ses_1",
      })
    })

    it("caches cancelled result for later watch", async () => {
      detector.cancel("ses_1")

      const result = await detector.watch("ses_1", 5000)
      expect(result).toEqual({
        signal: "cancelled",
        sessionID: "ses_1",
      })
    })
  })

  // --- feedMessageCount stability ---
  describe("feedMessageCount", () => {
    it("starts stability timer on first call", async () => {
      const resultPromise = detector.watch("ses_1", 5000)
      detector.feedMessageCount("ses_1", 3)

      // Stability timer fires after 100ms (constructor arg)
      vi.advanceTimersByTime(100)

      await expect(resultPromise).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_1",
      })
    })

    it("resets stability timer when count changes", async () => {
      const resultPromise = detector.watch("ses_1", 5000)

      detector.feedMessageCount("ses_1", 3)
      vi.advanceTimersByTime(80) // 80ms in, not yet stable

      detector.feedMessageCount("ses_1", 5) // count changed — timer resets
      vi.advanceTimersByTime(80) // only 80ms since reset

      // Should NOT have resolved yet
      const earlyResult = detector.watch("ses_2", 10)
      vi.advanceTimersByTime(15)
      await expect(earlyResult).resolves.toEqual({
        signal: "timeout",
        sessionID: "ses_2",
      })

      // Original watcher still waiting — advance past stability
      vi.advanceTimersByTime(20) // total 100ms since last count change
      await expect(resultPromise).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_1",
      })
    })

    it("stays pending until the latest count is stable for the full window", async () => {
      const resultPromise = detector.watch("ses_1", 5000)

      detector.feedMessageCount("ses_1", 2)
      vi.advanceTimersByTime(60)
      detector.feedMessageCount("ses_1", 4)
      vi.advanceTimersByTime(60)
      detector.feedMessageCount("ses_1", 5)
      vi.advanceTimersByTime(90)

      const sentinel = detector.watch("ses_guard", 10)
      vi.advanceTimersByTime(15)
      await expect(sentinel).resolves.toEqual({
        signal: "timeout",
        sessionID: "ses_guard",
      })

      vi.advanceTimersByTime(10)
      await expect(resultPromise).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_1",
      })
    })

    it("resolves with idle after stable count (short timeout)", async () => {
      const fastDetector = new CompletionDetector(50)
      const resultPromise = fastDetector.watch("ses_1", 5000)

      fastDetector.feedMessageCount("ses_1", 2)
      vi.advanceTimersByTime(50)

      await expect(resultPromise).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_1",
      })
    })

    it("clears stability timer on terminal event", async () => {
      detector.feedMessageCount("ses_1", 3)
      detector.feed("session.error", "ses_1", "fail")

      const result = await detector.watch("ses_1", 5000)
      expect(result).toEqual({
        signal: "error",
        sessionID: "ses_1",
        error: "fail",
      })
    })
  })

  // --- multiple watchers ---
  describe("multiple sessions", () => {
    it("handles independent watchers for different sessions", async () => {
      const p1 = detector.watch("ses_a", 5000)
      const p2 = detector.watch("ses_b", 5000)

      detector.feed("session.idle", "ses_a")
      detector.feed("session.deleted", "ses_b")

      await expect(p1).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_a",
      })
      await expect(p2).resolves.toEqual({
        signal: "deleted",
        sessionID: "ses_b",
      })
    })

    it("handles one timeout and one success independently", async () => {
      const p1 = detector.watch("ses_a", 50)
      const p2 = detector.watch("ses_b", 5000)

      detector.feed("session.idle", "ses_b")
      vi.advanceTimersByTime(60)

      await expect(p1).resolves.toEqual({
        signal: "timeout",
        sessionID: "ses_a",
      })
      await expect(p2).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_b",
      })
    })
  })

  // --- feedMessageCount input guards (Bug F3) ---
  describe("feedMessageCount input guards", () => {
    it("is a no-op when count is NaN", () => {
      detector.feedMessageCount("ses_1", NaN)
      // messageCounts should not have been updated — no stability timer started
      // Verify: advancing past stability window produces no idle signal in cache
      vi.advanceTimersByTime(200)
      // No watcher, no cached result — session is unaffected
      const resultPromise = detector.watch("ses_1", 10)
      vi.advanceTimersByTime(15)
      return expect(resultPromise).resolves.toEqual({ signal: "timeout", sessionID: "ses_1" })
    })

    it("is a no-op when count is undefined (cast as number)", () => {
      detector.feedMessageCount("ses_1", undefined as unknown as number)
      vi.advanceTimersByTime(200)
      const resultPromise = detector.watch("ses_1", 10)
      vi.advanceTimersByTime(15)
      return expect(resultPromise).resolves.toEqual({ signal: "timeout", sessionID: "ses_1" })
    })

    it("is a no-op when count is negative", () => {
      detector.feedMessageCount("ses_1", -1)
      vi.advanceTimersByTime(200)
      const resultPromise = detector.watch("ses_1", 10)
      vi.advanceTimersByTime(15)
      return expect(resultPromise).resolves.toEqual({ signal: "timeout", sessionID: "ses_1" })
    })

    it("accepts count of 0 as valid and starts stability timer", async () => {
      const resultPromise = detector.watch("ses_1", 5000)
      detector.feedMessageCount("ses_1", 0)
      vi.advanceTimersByTime(100)
      await expect(resultPromise).resolves.toEqual({ signal: "idle", sessionID: "ses_1" })
    })

    it("accepts positive integer count and starts stability timer normally", async () => {
      const resultPromise = detector.watch("ses_1", 5000)
      detector.feedMessageCount("ses_1", 5)
      vi.advanceTimersByTime(100)
      await expect(resultPromise).resolves.toEqual({ signal: "idle", sessionID: "ses_1" })
    })
  })

  // --- edge cases ---
  describe("edge cases", () => {
    it("ignores feed with undefined sessionID", () => {
      expect(() => detector.feed("session.idle", undefined)).not.toThrow()
    })

    it("ignores unknown event types", async () => {
      detector.feed("session.created", "ses_1")

      const resultPromise = detector.watch("ses_1", 50)
      vi.advanceTimersByTime(60)

      await expect(resultPromise).resolves.toEqual({
        signal: "timeout",
        sessionID: "ses_1",
      })
    })

    it("watch after timeout still works for new session", async () => {
      const p1 = detector.watch("ses_a", 50)
      vi.advanceTimersByTime(60)
      await p1

      const p2 = detector.watch("ses_b", 5000)
      detector.feed("session.idle", "ses_b")
      await expect(p2).resolves.toEqual({
        signal: "idle",
        sessionID: "ses_b",
      })
    })
  })
})
