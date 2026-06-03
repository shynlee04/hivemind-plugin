import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

interface SseHookResult {
  connected: boolean
  lastEvent: string | null
}

describe("use-sse", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("EventSource connection", () => {
    it("should connect to SSE endpoint on mount", () => {
      // RED: will fail until use-sse.ts provides useSse hook
      const result: SseHookResult = useSse({ url: "http://localhost:3199/api/events" })
      expect(result.connected).toBe(true)
    })

    it("should dispatch events to store on message", () => {
      const result: SseHookResult = useSse({ url: "http://localhost:3199/api/events" })
      expect(result.lastEvent).toBeDefined()
    })
  })

  describe("cleanup", () => {
    it("should close EventSource on unmount", () => {
      const closeSpy = vi.fn()
      vi.spyOn(globalThis, "EventSource").mockImplementation(() => {
        return { close: closeSpy, onmessage: null, onerror: null } as unknown as EventSource
      })
      const result: { cleanup: () => void } = useSse({ url: "http://localhost:3199/api/events" })
      result.cleanup()
      expect(closeSpy).toHaveBeenCalled()
    })

    it("should not accumulate listeners on reconnection", () => {
      const closeSpy = vi.fn()
      let instanceCount = 0
      vi.spyOn(globalThis, "EventSource").mockImplementation(() => {
        instanceCount++
        return { close: closeSpy, onmessage: null, onerror: null } as unknown as EventSource
      })
      const result: { cleanup: () => void; reconnect: () => void } = useSse({
        url: "http://localhost:3199/api/events",
      })
      result.reconnect()
      result.cleanup()
      expect(instanceCount).toBeLessThanOrEqual(2)
    })
  })

  describe("exponential backoff", () => {
    it("should start with 1s backoff on first reconnect", () => {
      const result: { getBackoffMs: () => number } = useSse({
        url: "http://localhost:3199/api/events",
      })
      expect(result.getBackoffMs()).toBe(1000)
    })

    it("should double backoff on each attempt (1s→2s→4s→8s→16s→30s)", () => {
      const result: { getBackoffMs: () => number; recordFailedAttempt: () => void } = useSse({
        url: "http://localhost:3199/api/events",
      })
      const expected = [1000, 2000, 4000, 8000, 16000, 30000]
      for (const exp of expected) {
        expect(result.getBackoffMs()).toBe(exp)
        result.recordFailedAttempt()
      }
    })

    it("should cap backoff at 30s maximum", () => {
      const result: {
        getBackoffMs: () => number
        recordFailedAttempt: () => void
      } = useSse({ url: "http://localhost:3199/api/events" })
      for (let i = 0; i < 10; i++) {
        result.recordFailedAttempt()
      }
      expect(result.getBackoffMs()).toBeLessThanOrEqual(30000)
    })
  })

  describe("heartbeat timeout", () => {
    it("should detect heartbeat timeout after 90s", () => {
      vi.useFakeTimers()
      const result: { connected: boolean } = useSse({
        url: "http://localhost:3199/api/events",
        heartbeatTimeoutMs: 90000,
      })
      vi.advanceTimersByTime(91000)
      expect(result.connected).toBe(false)
      vi.useRealTimers()
    })
  })
})

// ── Helper: Mock factory ──

function useSse(options: {
  url: string
  heartbeatTimeoutMs?: number
}): SseHookResult & { cleanup: () => void; reconnect: () => void; getBackoffMs: () => number; recordFailedAttempt: () => void } {
  // RED scaffold: will fail until use-sse.ts provides the real implementation
  throw new Error("NOT_IMPLEMENTED: useSse must be provided by use-sse.ts")
}
