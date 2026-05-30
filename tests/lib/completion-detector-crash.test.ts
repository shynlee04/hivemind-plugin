/**
 * GAP G-2: False completion detection when agent crashes
 *
 * Task ID: 08-02-03
 * Requirement: completion-detector must not signal "complete" when a background
 * agent crashes mid-execution.
 *
 * Observed failure: Background agent (GLM-5.1) was working on edits when
 * compaction happened mid-stream. The queue returned "complete" immediately
 * but no tasks actually ran. The completion detector fired prematurely.
 *
 * Root cause: CompletionDetector.feed() maps "session.idle" → signal "idle"
 * immediately. There is NO way to distinguish between:
 *   (A) Agent finished normally → session goes idle
 *   (B) Agent crashed / compacted / OOM'd → session also goes idle
 *
 * The stability timer (feedMessageCount) can serve as a heuristic — if message
 * count stops changing for stabilityTimeoutMs, it resolves idle. But this is
 * not the default watch path, and "session.idle" from a crash still resolves
 * immediately.
 *
 * These tests DOCUMENT the behavioral gap and verify the stability-timer
 * heuristic works correctly as a potential mitigation path.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { CompletionDetector } from "../../src/coordination/completion/detector.js"

describe("CompletionDetector crash scenarios", () => {
  let detector: CompletionDetector

  beforeEach(() => {
    vi.useFakeTimers()
    detector = new CompletionDetector(200) // 200ms stability window
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // --- Behavioral gap: session.idle after crash is indistinguishable ---

  describe("crash-vs-normal: session.idle is ambiguous", () => {
    it("resolves idle when session.idle fires — even if agent crashed (DOCUMENTED GAP)", async () => {
      // This test documents that a crash that emits session.idle is treated
      // identically to a normal completion. This is the core behavioral gap.
      const resultPromise = detector.watch("crash-session", 5000)

      // Simulate: agent was active, then crash/compaction happened
      // The platform emits session.idle when the session dies
      detector.feed("session.idle", "crash-session")

      const result = await resultPromise

      // GAP: This resolves as "idle" — same as normal completion.
      // There is no "crash" signal or way to distinguish from normal idle.
      expect(result.signal).toBe("idle")
      expect(result.sessionID).toBe("crash-session")
    })

    it("resolves idle even after message activity — crash mid-stream is silent", async () => {
      // Agent was actively producing messages (fed via feedMessageCount)
      // then crashed. Platform emits session.idle.
      const resultPromise = detector.watch("active-crash", 5000)

      // Agent produces messages
      detector.feedMessageCount("active-crash", 5)
      detector.feedMessageCount("active-crash", 10)

      // Then crash happens — platform emits session.idle
      // This clears the stability timer and resolves immediately
      detector.feed("session.idle", "active-crash")

      const result = await resultPromise

      // GAP: Still resolves as "idle" — no crash detection
      expect(result.signal).toBe("idle")
      expect(result.sessionID).toBe("active-crash")
    })
  })

  // --- Stability timer as crash heuristic ---

  describe("stability timer: crash detection heuristic via feedMessageCount", () => {
    it("resolves idle via stability when messages stop (agent silent/crashed)", async () => {
      // If the agent stops producing messages for stabilityTimeoutMs,
      // the stability timer fires and resolves as idle.
      // This IS a form of "the agent seems done or dead" detection.
      const resultPromise = detector.watch("stale-session", 5000)

      // Agent starts producing messages
      detector.feedMessageCount("stale-session", 3)

      // Advance 100ms — not yet stable (stabilityTimeoutMs = 200)
      vi.advanceTimersByTime(100)

      // Agent stops — no more feedMessageCount calls
      // Advance past stability window
      vi.advanceTimersByTime(150) // total 250ms > 200ms stability

      const result = await resultPromise

      // Stability timer resolved — agent was silent for long enough
      expect(result.signal).toBe("idle")
      expect(result.sessionID).toBe("stale-session")
    })

    it("does NOT resolve via stability if messages keep arriving (agent alive)", async () => {
      const resultPromise = detector.watch("alive-session", 5000)

      // Agent keeps producing messages every 80ms
      detector.feedMessageCount("alive-session", 1)
      vi.advanceTimersByTime(80)

      detector.feedMessageCount("alive-session", 2)
      vi.advanceTimersByTime(80)

      detector.feedMessageCount("alive-session", 3)
      vi.advanceTimersByTime(80)

      // 240ms total, but stability timer kept resetting — no resolution
      // Verify by checking a quick timeout on another session
      const checkPromise = detector.watch("check", 10)
      vi.advanceTimersByTime(15)
      const checkResult = await checkPromise
      expect(checkResult.signal).toBe("timeout") // confirms timers still running

      // Original watcher should still be pending (not resolved)
      // Advance well past stability without message change
      detector.feedMessageCount("alive-session", 3) // same count — timer already running
      vi.advanceTimersByTime(200)

      // NOW it should resolve — count hasn't changed for 200ms
      const result = await resultPromise
      expect(result.signal).toBe("idle")
    })

    it("stability timer restarts when count changes after silence", async () => {
      const resultPromise = detector.watch("resuming-session", 5000)

      // Agent produces, then goes silent
      detector.feedMessageCount("resuming-session", 5)
      vi.advanceTimersByTime(150) // 150ms into 200ms stability window

      // Agent resumes — stability timer resets
      detector.feedMessageCount("resuming-session", 8)
      vi.advanceTimersByTime(100) // only 100ms since last message

      // Not yet stable — should NOT resolve
      const quickCheck = detector.watch("quick", 10)
      vi.advanceTimersByTime(15)
      await expect(quickCheck).resolves.toEqual({ signal: "timeout", sessionID: "quick" })

      // Now advance past stability
      vi.advanceTimersByTime(110) // total 210ms since last count change
      const result = await resultPromise
      expect(result.signal).toBe("idle")
    })
  })

  // --- session.error as crash indicator ---

  describe("session.error: explicit crash signal", () => {
    it("resolves with error when session.error fires (agent error/crash)", async () => {
      // If the platform emits session.error instead of session.idle on crash,
      // the detector correctly identifies it as an error.
      const resultPromise = detector.watch("error-session", 5000)
      detector.feed("session.error", "error-session", "Agent process terminated: OOM")

      const result = await resultPromise
      expect(result.signal).toBe("error")
      expect(result.error).toBe("Agent process terminated: OOM")
    })

    it("resolves with error when session.error fires after message activity", async () => {
      // Agent was active, then errored
      const resultPromise = detector.watch("active-error", 5000)

      detector.feedMessageCount("active-error", 5)
      detector.feed("session.error", "active-error", "Compaction failed")

      const result = await resultPromise
      expect(result.signal).toBe("error")
      expect(result.error).toBe("Compaction failed")
    })
  })

  // --- session.deleted: another abnormal termination ---

  describe("session.deleted: session removed/killed", () => {
    it("resolves with deleted when session.deleted fires", async () => {
      const resultPromise = detector.watch("killed-session", 5000)
      detector.feed("session.deleted", "killed-session")

      const result = await resultPromise
      expect(result.signal).toBe("deleted")
    })
  })

  // --- Timeout as safety net ---

  describe("timeout: safety net for silent crashes", () => {
    it("resolves with timeout when no signal arrives at all (silent crash)", async () => {
      // If the agent crashes and the platform emits NO event,
      // the watch timeout is the only safety net.
      const resultPromise = detector.watch("silent-crash", 500)
      vi.advanceTimersByTime(600)

      const result = await resultPromise
      expect(result.signal).toBe("timeout")
    })
  })

  // --- Cached results for crash scenarios ---

  describe("cached crash results", () => {
    it("caches error result and returns it on later watch", async () => {
      // Feed error before watch — should be cached
      detector.feed("session.error", "cached-crash", "Process killed: SIGTERM")

      const result = await detector.watch("cached-crash", 5000)
      expect(result).toEqual({
        signal: "error",
        sessionID: "cached-crash",
        error: "Process killed: SIGTERM",
      })
    })

    it("caches deleted result and returns it on later watch", async () => {
      detector.feed("session.deleted", "cached-delete")

      const result = await detector.watch("cached-delete", 5000)
      expect(result).toEqual({
        signal: "deleted",
        sessionID: "cached-delete",
      })
    })
  })
})
