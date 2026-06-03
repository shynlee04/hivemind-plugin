import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PluginClient, getPluginClient } from "../src/lib/plugin-client"

// ── Mock fetch globally ──

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve({ ok, data }),
  })
}

describe("plugin-client", () => {
  let client: PluginClient

  beforeEach(() => {
    vi.restoreAllMocks()
    mockFetch.mockReset()
    // Create a fresh client for each test
    client = new PluginClient()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Port discovery ──

  describe("port discovery", () => {
    it("should construct base URL with fallback port when no env var", () => {
      // FALLBACK_PORT is 3199
      const url = client.getBaseUrl()
      expect(url).toContain("127.0.0.1")
      expect(url).toContain("3199")
    })

    it("should use NEXT_PUBLIC_PLUGIN_PORT env when set", () => {
      const original = process.env.NEXT_PUBLIC_PLUGIN_PORT
      process.env.NEXT_PUBLIC_PLUGIN_PORT = "4099"
      const customClient = new PluginClient()
      expect(customClient.getBaseUrl()).toContain("4099")
      process.env.NEXT_PUBLIC_PLUGIN_PORT = original
    })
  })

  // ── 17 endpoint methods existence ──

  describe("17 endpoint methods", () => {
    it("should have snapshot method", () => {
      expect(typeof client.snapshot).toBe("function")
    })

    it("should have getSessions method", () => {
      expect(typeof client.getSessions).toBe("function")
    })

    it("should have getSessionChildren method", () => {
      expect(typeof client.getSessionChildren).toBe("function")
    })

    it("should have getSessionContext method", () => {
      expect(typeof client.getSessionContext).toBe("function")
    })

    it("should have getSessionDelegations method", () => {
      expect(typeof client.getSessionDelegations).toBe("function")
    })

    it("should have getSessionDocs method", () => {
      expect(typeof client.getSessionDocs).toBe("function")
    })

    it("should have getEventsUrl returning SSE endpoint", () => {
      const url = client.getEventsUrl()
      expect(url).toContain("/api/events")
    })

    it("should have getCatalog method", () => {
      expect(typeof client.getCatalog).toBe("function")
    })

    it("should have getCatalogTools method", () => {
      expect(typeof client.getCatalogTools).toBe("function")
    })

    it("should have getWsUrl returning WS endpoint", () => {
      const url = client.getWsUrl()
      expect(url).toContain("/ws/delegation")
    })

    it("should have postDelegateTask method", () => {
      expect(typeof client.postDelegateTask).toBe("function")
    })

    it("should have postDelegationStatus method", () => {
      expect(typeof client.postDelegationStatus).toBe("function")
    })

    it("should have postExecuteSlashCommand method", () => {
      expect(typeof client.postExecuteSlashCommand).toBe("function")
    })

    it("should have postTrajectory method", () => {
      expect(typeof client.postTrajectory).toBe("function")
    })

    it("should have postSessionView method", () => {
      expect(typeof client.postSessionView).toBe("function")
    })

    it("should have postSessionPatch method", () => {
      expect(typeof client.postSessionPatch).toBe("function")
    })

    it("should have postCommandEngine method", () => {
      expect(typeof client.postCommandEngine).toBe("function")
    })
  })

  // ── GET endpoint functionality ──

  describe("GET endpoints", () => {
    it("should call fetch with correct URL for snapshot", async () => {
      mockFetchResponse({
        sessions: [],
        delegations: [],
        trajectory: [],
        pressure: { score: 0, tier: 0, timestamp: 0 },
        config: {},
        server: { uptime: 0, port: 0, version: "0", startedAt: 0 },
      })
      const result = await client.snapshot()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/state/snapshot"),
      )
      expect(result).toHaveProperty("sessions")
      expect(result).toHaveProperty("delegations")
    })

    it("should call fetch with correct URL for getSessions", async () => {
      mockFetchResponse({ sessions: [] })
      await client.getSessions()
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/state/sessions"),
      )
    })

    it("should include session ID in getSessionChildren URL", async () => {
      mockFetchResponse({ children: [] })
      await client.getSessionChildren("ses_123")
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/state/sessions/ses_123/children"),
      )
    })
  })

  // ── POST endpoint functionality ──

  describe("POST endpoints", () => {
    it("should POST to delegate-task with JSON body", async () => {
      mockFetchResponse({ ok: true, data: { result: "success" } })
      await client.postDelegateTask({ agent: "test", prompt: "hello" })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tools/delegate-task"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"agent"'),
        }),
      )
    })
  })

  // ── Error handling ──

  describe("error handling", () => {
    it("should throw on non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ ok: false, error: "Internal Server Error" }),
      })
      await expect(client.snapshot()).rejects.toThrow()
    })
  })

  // ── Singleton ──

  describe("getPluginClient singleton", () => {
    it("should return a PluginClient instance", () => {
      const instance = getPluginClient()
      expect(instance).toBeInstanceOf(PluginClient)
    })

    it("should return the same instance on subsequent calls", () => {
      const a = getPluginClient()
      const b = getPluginClient()
      expect(a).toBe(b)
    })
  })
})
