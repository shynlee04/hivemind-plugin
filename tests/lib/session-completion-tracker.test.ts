import { describe, it, expect, vi, beforeEach } from "vitest"

describe("SessionCompletionTracker", () => {
  let tracker: import("../../src/lib/session-completion-tracker.js").SessionCompletionTracker

  beforeEach(async () => {
    const mod = await import("../../src/lib/session-completion-tracker.js")
    tracker = new mod.SessionCompletionTracker()
  })

  describe("feed + watch", () => {
    it("resolves watch with idle signal when session.idle event is fed", async () => {
      const result = tracker.watch("sess-1", 5000)

      tracker.feed("session.idle", "sess-1")

      await expect(result).resolves.toEqual({
        signal: "idle",
        sessionID: "sess-1",
      })
    })

    it("resolves watch with error signal when session.error event is fed", async () => {
      const result = tracker.watch("sess-2", 5000)

      tracker.feed("session.error", "sess-2", "rate limit exceeded")

      await expect(result).resolves.toEqual({
        signal: "error",
        sessionID: "sess-2",
        error: "rate limit exceeded",
      })
    })

    it("resolves watch with deleted signal when session.deleted event is fed", async () => {
      const result = tracker.watch("sess-3", 5000)

      tracker.feed("session.deleted", "sess-3")

      await expect(result).resolves.toEqual({
        signal: "deleted",
        sessionID: "sess-3",
      })
    })

    it("resolves watch immediately when session.idle was fed before watch starts", async () => {
      tracker.feed("session.idle", "sess-race-idle")

      const result = tracker.watch("sess-race-idle", 5000)

      await expect(
        Promise.race([
          result,
          Promise.resolve({ signal: "pending", sessionID: "sess-race-idle" as const }),
        ]),
      ).resolves.toEqual({
        signal: "idle",
        sessionID: "sess-race-idle",
      })
    })

    it("resolves watch immediately when session.error was fed before watch starts", async () => {
      tracker.feed("session.error", "sess-race-error", "boom")

      const result = tracker.watch("sess-race-error", 5000)

      await expect(
        Promise.race([
          result,
          Promise.resolve({ signal: "pending", sessionID: "sess-race-error" as const }),
        ]),
      ).resolves.toEqual({
        signal: "error",
        sessionID: "sess-race-error",
        error: "boom",
      })
    })

    it("resolves watch immediately when session.deleted was fed before watch starts", async () => {
      tracker.feed("session.deleted", "sess-race-deleted")

      const result = tracker.watch("sess-race-deleted", 5000)

      await expect(
        Promise.race([
          result,
          Promise.resolve({ signal: "pending", sessionID: "sess-race-deleted" as const }),
        ]),
      ).resolves.toEqual({
        signal: "deleted",
        sessionID: "sess-race-deleted",
      })
    })

    it("resolves watch with timeout signal after timeoutMs", async () => {
      vi.useFakeTimers()

      const result = tracker.watch("sess-timeout", 100)

      vi.advanceTimersByTime(150)

      await expect(result).resolves.toEqual({
        signal: "timeout",
        sessionID: "sess-timeout",
      })

      vi.useRealTimers()
    })

    it("does not resolve watch for events of other sessions", async () => {
      const result = tracker.watch("sess-target", 200)

      tracker.feed("session.idle", "sess-other")

      vi.useFakeTimers()
      vi.advanceTimersByTime(250)
      const resolved = await result
      vi.useRealTimers()

      expect(resolved.signal).toBe("timeout")
    })
  })

  describe("cancel", () => {
    it("resolves watch with cancelled signal when cancel is called", async () => {
      const result = tracker.watch("sess-cancel", 5000)

      tracker.cancel("sess-cancel")

      await expect(result).resolves.toEqual({
        signal: "cancelled",
        sessionID: "sess-cancel",
      })
    })

    it("does not resolve if cancel called on non-existent session", () => {
      expect(() => tracker.cancel("non-existent")).not.toThrow()
    })

    it("clears cached terminal result when cancel is called before watch starts", async () => {
      tracker.feed("session.idle", "sess-cancel-cached")

      tracker.cancel("sess-cancel-cached")

      vi.useFakeTimers()
      const result = tracker.watch("sess-cancel-cached", 100)
      vi.advanceTimersByTime(150)

      await expect(result).resolves.toEqual({
        signal: "timeout",
        sessionID: "sess-cancel-cached",
      })

      vi.useRealTimers()
    })
  })

  describe("feed edge cases", () => {
    it("ignores events with undefined sessionID", () => {
      expect(() => tracker.feed("session.idle", undefined)).not.toThrow()
    })

    it("ignores events for sessions with no watcher", () => {
      expect(() => tracker.feed("session.idle", "no-watcher")).not.toThrow()
    })

    it("clears timeout when event resolves the watcher", async () => {
      vi.useFakeTimers()

      const result = tracker.watch("sess-clear", 200)

      tracker.feed("session.idle", "sess-clear")

      vi.advanceTimersByTime(300)

      await expect(result).resolves.toEqual({
        signal: "idle",
        sessionID: "sess-clear",
      })

      vi.useRealTimers()
    })
  })

  describe("multiple sessions", () => {
    it("tracks multiple sessions independently", async () => {
      const result1 = tracker.watch("sess-a", 5000)
      const result2 = tracker.watch("sess-b", 5000)

      tracker.feed("session.idle", "sess-a")
      tracker.feed("session.error", "sess-b", "fail")

      const [r1, r2] = await Promise.all([result1, result2])

      expect(r1).toEqual({ signal: "idle", sessionID: "sess-a" })
      expect(r2).toEqual({ signal: "error", sessionID: "sess-b", error: "fail" })
    })

    it("removes watcher after resolution", async () => {
      const result1 = tracker.watch("sess-dup", 200)

      tracker.feed("session.idle", "sess-dup")
      await result1

      vi.useFakeTimers()
      const result2 = tracker.watch("sess-dup", 100)
      vi.advanceTimersByTime(150)
      const resolved = await result2
      vi.useRealTimers()

      expect(resolved.signal).toBe("timeout")
    })
  })
})
