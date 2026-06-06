/**
 * Tests for the useSessions() hook — Session Explorer Panel (SC-04).
 *
 * RED phase (per 04-PLAN.md Wave 1 T1.1, T1.3, AC-SC04-02):
 * These tests assert on the public seam of the hook. They are expected
 * to fail before the hook is implemented.
 *
 * @see ../../src/lib/use-sessions.ts
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md (UR-SC04-01, ER-SC04-01, SR-SC04-01, AC-SC04-02)
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PLAN.md (Wave 1, T1.1, T1.2, T1.3)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, waitFor, cleanup } from "@testing-library/react"

// Hoisted mocks so we can override return values per-test
const mocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  useSse: vi.fn(),
}))

// Mock the plugin-client module — replaces the real getPluginClient
vi.mock("../src/lib/plugin-client", () => ({
  getPluginClient: () => ({ getSessions: mocks.getSessions }),
}))

// Mock the useSse module — replaces the real hook
vi.mock("../src/lib/use-sse", () => ({
  useSse: mocks.useSse,
}))

// Default useSse mock: connected, no event, no-op reconnect
function setupDefaultSseMock(): void {
  mocks.useSse.mockReturnValue({
    connected: true,
    lastEvent: null,
    reconnect: vi.fn(),
  })
}

describe("useSessions() — Session Explorer hook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cleanup()
    setupDefaultSseMock()
  })

  it("returns loading=true initially (before fetch resolves)", async () => {
    // Resolve the fetch to a known result so we can wait for it
    mocks.getSessions.mockResolvedValue({
      sessions: [
        {
          id: "ses-init",
          name: "Initial",
          status: "active",
          createdAt: 1,
          messageCount: 0,
          childCount: 0,
        },
      ],
    })

    const { useSessions } = await import("../src/lib/use-sessions")
    const { result } = renderHook(() => useSessions())

    // On first render, loading must be true (fetch is in flight)
    expect(result.current.loading).toBe(true)

    // Wait for the fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false))
  })

  it("fetches sessions on mount and returns the session array", async () => {
    const fakeSession = {
      id: "ses-1",
      name: "Main",
      status: "active",
      createdAt: 1700000000000,
      messageCount: 5,
      childCount: 2,
    }
    const fakeSession2 = {
      id: "ses-2",
      name: "Research",
      status: "running",
      createdAt: 1699999940000,
      messageCount: 3,
      childCount: 0,
    }
    mocks.getSessions.mockResolvedValue({
      sessions: [fakeSession, fakeSession2],
    })

    const { useSessions } = await import("../src/lib/use-sessions")
    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Hook should have called getSessions exactly once on mount
    expect(mocks.getSessions).toHaveBeenCalledTimes(1)
    expect(result.current.sessions).toHaveLength(2)
    expect(result.current.sessions[0]?.id).toBe("ses-1")
    expect(result.current.sessions[0]?.status).toBe("active")
    expect(result.current.sessions[1]?.id).toBe("ses-2")
  })

  it("exposes the SSE connection status from useSse()", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: [] })
    mocks.useSse.mockReturnValue({
      connected: false, // simulate disconnected
      lastEvent: null,
      reconnect: vi.fn(),
    })

    const { useSessions } = await import("../src/lib/use-sessions")
    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.connected).toBe(false)
  })

  it("returns error if plugin-client getSessions throws", async () => {
    mocks.getSessions.mockRejectedValue(new Error("Network error"))

    const { useSessions } = await import("../src/lib/use-sessions")
    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe("Network error")
    expect(result.current.sessions).toEqual([])
  })

  it("exposes refresh() to manually re-fetch", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: [] })

    const { useSessions } = await import("../src/lib/use-sessions")
    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.loading).toBe(false))

    // First call: mount
    expect(mocks.getSessions).toHaveBeenCalledTimes(1)

    // refresh must be a function
    expect(typeof result.current.refresh).toBe("function")

    // Prepare a second response for the refresh
    mocks.getSessions.mockResolvedValueOnce({
      sessions: [
        {
          id: "ses-after-refresh",
          name: "Refreshed",
          status: "running",
          createdAt: 1,
          messageCount: 0,
          childCount: 0,
        },
      ],
    })

    // Trigger refresh and wait for React to flush the state update
    await result.current.refresh()
    await waitFor(() => expect(result.current.sessions).toHaveLength(1))

    // getSessions should have been called twice (mount + refresh)
    expect(mocks.getSessions).toHaveBeenCalledTimes(2)
    expect(result.current.sessions[0]?.id).toBe("ses-after-refresh")
  })

  it("returns empty array when plugin server has zero sessions", async () => {
    mocks.getSessions.mockResolvedValue({ sessions: [] })

    const { useSessions } = await import("../src/lib/use-sessions")
    const { result } = renderHook(() => useSessions())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.sessions).toEqual([])
    expect(result.current.error).toBeNull()
  })
})
