import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  PluginClient,
  getPluginClient,
  initPluginClient,
  probePluginPort,
  resetCachedPort,
  HIVEMIND_PLUGIN_PORT_LIST,
} from "../src/lib/plugin-client"

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

  // ── Port probing (Wave 2) ──
  //
  // Companion to src/sidecar/server/factory.ts (Wave 1, commit b5823581).
  // The plugin server binds the first free port in HIVEMIND_PLUGIN_PORT_LIST;
  // the sidecar client probes that same list on startup to find the active
  // server.

  describe("port probing (HIVEMIND_PLUGIN_PORT_LIST)", () => {
    beforeEach(() => {
      resetCachedPort()
      delete process.env.HIVEMIND_PLUGIN_PORT
      vi.restoreAllMocks()
    })

    afterEach(() => {
      resetCachedPort()
      delete process.env.HIVEMIND_PLUGIN_PORT
    })

    it("HIVEMIND_PLUGIN_PORT_LIST contains 10 consecutive ports starting at 4096", () => {
      expect(HIVEMIND_PLUGIN_PORT_LIST).toEqual([
        4096, 4097, 4098, 4099, 4100, 4101, 4102, 4103, 4104, 4105,
      ])
    })

    it("probePluginPort returns the first port that responds with HTTP 200", async () => {
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes(":4097")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const port = await probePluginPort()
      expect(port).toBe(4097)
    })

    it("probePluginPort returns null if no port in the list responds", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const port = await probePluginPort()
      expect(port).toBeNull()
    })

    it("probePluginPort honors HIVEMIND_PLUGIN_PORT env var (highest precedence)", async () => {
      process.env.HIVEMIND_PLUGIN_PORT = "7777"
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes(":7777")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const port = await probePluginPort()
      expect(port).toBe(7777)
    })

    it("probePluginPort caches the discovered port on subsequent calls", async () => {
      // 4096 always responds
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes(":4096")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const first = await probePluginPort()
      expect(first).toBe(4096)

      // After caching, change fetch behavior — second call should still return cached 4096
      mockFetch.mockImplementation(() => {
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const second = await probePluginPort()
      expect(second).toBe(4096)
    })

    it("resetCachedPort clears the cached discovered port", async () => {
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes(":4096")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const first = await probePluginPort()
      expect(first).toBe(4096)

      resetCachedPort()

      // After reset, probe should re-attempt and (since fetch still only responds
      // to 4096) find 4096 again — proving the cache was cleared
      const second = await probePluginPort()
      expect(second).toBe(4096)
    })

    it("initPluginClient updates the singleton's port to the discovered port", async () => {
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes(":4102")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      // Before init: client uses FALLBACK_PORT (3199) since no probe has run
      const before = getPluginClient()
      expect(before.getBaseUrl()).toContain("3199")

      // After init: client is rebound to the discovered port
      await initPluginClient()

      const after = getPluginClient()
      expect(after.getBaseUrl()).toContain("4102")
    })

  describe("API-first port discovery (Wave 3)", () => {
    it("probePluginPort returns the canonical port from GET /api/plugin-port JSON", async () => {
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes("/api/plugin-port")) {
          return Promise.resolve(
            new Response(JSON.stringify({ port: 4099 }), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          )
        }
        // Port list probes: all 404
        return Promise.resolve(new Response("not found", { status: 404 }))
      })

      const port = await probePluginPort()
      expect(port).toBe(4099)
    })

    it("probePluginPort falls through to port-probe when /api/plugin-port returns 404", async () => {
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes("/api/plugin-port")) {
          return Promise.resolve(new Response("not found", { status: 404 }))
        }
        if (u.includes(":4097")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const port = await probePluginPort()
      expect(port).toBe(4097)
    })

    it("probePluginPort falls through to port-probe when /api/plugin-port returns invalid JSON (500)", async () => {
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes("/api/plugin-port")) {
          return Promise.resolve(new Response("not json", { status: 500 }))
        }
        if (u.includes(":4097")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const port = await probePluginPort()
      expect(port).toBe(4097)
    })

    it("probePluginPort prefers API port (4098) over lower-indexed port-probe result (4097)", async () => {
      mockFetch.mockImplementation((url: string | URL) => {
        const u = String(url)
        if (u.includes("/api/plugin-port")) {
          return Promise.resolve(
            new Response(JSON.stringify({ port: 4098 }), {
              status: 200,
              headers: { "content-type": "application/json" },
            }),
          )
        }
        if (u.includes(":4097")) {
          return Promise.resolve(new Response("ok", { status: 200 }))
        }
        return Promise.resolve(new Response("not found", { status: 503 }))
      })

      const port = await probePluginPort()
      expect(port).toBe(4098)
    })
  })

  })
})
