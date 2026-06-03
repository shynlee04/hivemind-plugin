import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"

// Mock EventSource before importing the hook
const mockEventSourceInstances: Array<{
  close: ReturnType<typeof vi.fn>
  onopen: (() => void) | null
  onmessage: ((e: MessageEvent) => void) | null
  onerror: (() => void) | null
}> = []

class MockEventSource {
  close = vi.fn()
  onopen: (() => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: (() => void) | null = null

  constructor(public url: string) {
    mockEventSourceInstances.push(this)
  }
}

vi.stubGlobal("EventSource", MockEventSource)

describe("use-sse", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.useFakeTimers()
    mockEventSourceInstances.length = 0
  })

  afterEach(() => {
    vi.useRealTimers()
    cleanup()
  })

  describe("module export", () => {
    it("should export useSse function", async () => {
      const mod = await import("../src/lib/use-sse")
      expect(mod.useSse).toBeDefined()
      expect(typeof mod.useSse).toBe("function")
    })

    it("should export UseSseOptions and UseSseResult types", async () => {
      const mod = await import("../src/lib/use-sse")
      // Type exports are erased at runtime — just verify module loads
      expect(mod).toBeDefined()
    })
  })

  describe("initial state", () => {
    it("should start disconnected", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      const { result } = renderHook(() => useSse())
      // Initially disconnected — no EventSource.onopen has fired
      expect(result.current.connected).toBe(false)
    })

    it("should have null lastEvent initially", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      const { result } = renderHook(() => useSse())
      expect(result.current.lastEvent).toBe(null)
    })
  })

  describe("connection", () => {
    it("should create EventSource on mount", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      renderHook(() => useSse())
      expect(mockEventSourceInstances.length).toBe(1)
    })

    it("should become connected when EventSource fires onopen", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      const { result } = renderHook(() => useSse())

      const es = mockEventSourceInstances[mockEventSourceInstances.length - 1]
      act(() => {
        es.onopen?.()
      })

      expect(result.current.connected).toBe(true)
    })

    it("should update lastEvent on SSE message", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      const { result } = renderHook(() => useSse())

      const es = mockEventSourceInstances[mockEventSourceInstances.length - 1]
      act(() => {
        es.onopen?.()
      })

      act(() => {
        es.onmessage?.({
          data: JSON.stringify({ type: "session.created", payload: {}, timestamp: Date.now() }),
        } as MessageEvent)
      })

      expect(result.current.lastEvent).toBe("session.created")
    })
  })

  describe("cleanup", () => {
    it("should close EventSource on unmount", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      const { unmount } = renderHook(() => useSse())

      const es = mockEventSourceInstances[mockEventSourceInstances.length - 1]
      unmount()
      expect(es.close).toHaveBeenCalled()
    })
  })

  describe("reconnect method", () => {
    it("should expose a reconnect method", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      const { result } = renderHook(() => useSse())
      expect(typeof result.current.reconnect).toBe("function")
    })

    it("should create new EventSource on reconnect", async () => {
      const { useSse } = await import("../src/lib/use-sse")
      const { result } = renderHook(() => useSse())

      const initialCount = mockEventSourceInstances.length

      act(() => {
        result.current.reconnect()
      })

      expect(mockEventSourceInstances.length).toBeGreaterThan(initialCount)
    })
  })
})
