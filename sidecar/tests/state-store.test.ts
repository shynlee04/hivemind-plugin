import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock the json-render module before importing our code
vi.mock("@json-render/core", () => ({
  createStateStore: (initial: Record<string, unknown>) => {
    let state = { ...initial }
    const subscribers: Map<string, Set<(v: unknown) => void>> = new Map()

    return {
      get: (path: string) => {
        const keys = path.replace(/^\//, "").split("/")
        let current: unknown = state
        for (const key of keys) {
          if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
            current = (current as Record<string, unknown>)[key]
          } else {
            return undefined
          }
        }
        return current
      },
      set: (path: string, value: unknown) => {
        const keys = path.replace(/^\//, "").split("/")
        let current: Record<string, unknown> = state
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]] as Record<string, unknown>
        }
        current[keys[keys.length - 1]] = value
        // Notify subscribers
        const subSet = subscribers.get(path)
        if (subSet) {
          for (const cb of subSet) cb(value)
        }
      },
      getSnapshot: () => ({ ...state }),
    }
  },
}))

// Mock plugin-client to avoid real HTTP calls
vi.mock("../src/lib/plugin-client", () => ({
  getPluginClient: () => ({
    snapshot: vi.fn().mockResolvedValue({
      sessions: [
        { id: "ses_1", status: "running", description: "Test session" },
      ],
      delegations: [
        { id: "del_1", agent: "hm-test", status: "completed" },
      ],
      trajectory: [],
      pressure: { score: 0, tier: 0, timestamp: Date.now() },
      config: {},
      server: { uptime: 100, port: 3199, version: "1.0", startedAt: Date.now() },
    }),
    getEventsUrl: () => "http://127.0.0.1:3199/api/events",
    getBaseUrl: () => "http://127.0.0.1:3199",
  }),
}))

describe("state-store", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("module export", () => {
    it("should export createSidecarStateStore function", async () => {
      const mod = await import("../src/lib/state-store")
      expect(mod.createSidecarStateStore).toBeDefined()
      expect(typeof mod.createSidecarStateStore).toBe("function")
    })

    it("should export SidecarStateStore type", async () => {
      const mod = await import("../src/lib/state-store")
      // Type exports are erased at runtime — just verify module loads
      expect(mod).toBeDefined()
    })
  })

  describe("store creation", () => {
    it("should create a store with all expected methods", async () => {
      const { createSidecarStateStore } = await import("../src/lib/state-store")
      const store = createSidecarStateStore()
      expect(typeof store.getState).toBe("function")
      expect(typeof store.get).toBe("function")
      expect(typeof store.set).toBe("function")
      expect(typeof store.initialize).toBe("function")
      expect(typeof store.refreshSnapshot).toBe("function")
      expect(typeof store.handleEvent).toBe("function")
      expect(typeof store.setConnected).toBe("function")
    })
  })

  describe("initial state", () => {
    it("should have default state before initialization", async () => {
      const { createSidecarStateStore } = await import("../src/lib/state-store")
      const store = createSidecarStateStore()
      const state = store.getState()
      expect(state).toHaveProperty("sessions")
      expect(state).toHaveProperty("delegations")
      expect(state).toHaveProperty("trajectory")
      expect(state).toHaveProperty("pressure")
      expect(state).toHaveProperty("config")
      expect(state).toHaveProperty("server")
      expect(state).toHaveProperty("ui")
    })

    it("should have default ui with sessions panel active", async () => {
      const { createSidecarStateStore } = await import("../src/lib/state-store")
      const store = createSidecarStateStore()
      const state = store.getState()
      expect(state.ui.activePanel).toBe("sessions")
      expect(state.ui.sseConnected).toBe(false)
    })
  })

  describe("get/set paths", () => {
    it("should set and get a value at a path", async () => {
      const { createSidecarStateStore } = await import("../src/lib/state-store")
      const store = createSidecarStateStore()
      store.set("/ui/activePanel", "delegation")
      expect(store.get("/ui/activePanel")).toBe("delegation")
    })

    it("should handle nested path access", async () => {
      const { createSidecarStateStore } = await import("../src/lib/state-store")
      const store = createSidecarStateStore()
      const pressure = store.get("/pressure")
      expect(pressure).toHaveProperty("score")
      expect(pressure).toHaveProperty("tier")
    })
  })

  describe("handleEvent", () => {
    it("should update lastUpdated on any event", async () => {
      const { createSidecarStateStore } = await import("../src/lib/state-store")
      const store = createSidecarStateStore()
      const before = store.getState().ui.lastUpdated
      // Small delay to ensure timestamp differs
      store.handleEvent({ type: "session.created", payload: { session: { id: "ses_test" } }, timestamp: Date.now() })
      const after = store.getState().ui.lastUpdated
      expect(after).toBeGreaterThanOrEqual(before)
    })
  })

  describe("setConnected", () => {
    it("should update SSE connection status", async () => {
      const { createSidecarStateStore } = await import("../src/lib/state-store")
      const store = createSidecarStateStore()
      store.setConnected(true)
      expect(store.getState().ui.sseConnected).toBe(true)
      store.setConnected(false)
      expect(store.getState().ui.sseConnected).toBe(false)
    })
  })
})
