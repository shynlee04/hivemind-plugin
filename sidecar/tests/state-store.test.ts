import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Types mirroring what state-store will export ──

interface SidecarState {
  sessions: Array<{ id: string; status: string; description: string }>
  delegations: Array<{ id: string; agent: string; status: string }>
  trajectory: Array<{ phase: string; summary: string; timestamp: number }>
  pressure: { score: number; tier: number; timestamp: number }
  config: Record<string, unknown>
  server: { uptime: number; port: number; version: string; startedAt: number }
  ui: {
    activePanel: string
    selectedSessionId: string | null
    sseConnected: boolean
    lastUpdated: number
  }
}

interface StateStore {
  getState(): SidecarState
  get(path: string): unknown
  set(path: string, value: unknown): void
  subscribe(path: string, callback: (value: unknown) => void): () => void
  initialize(): Promise<void>
  refreshSnapshot(): Promise<void>
}

// ── Scaffold tests ──

describe("state-store", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe("initialization", () => {
    it("should initialize from snapshot endpoint", async () => {
      const store: StateStore = await createStateStore()
      const state = store.getState()
      expect(state).toHaveProperty("sessions")
      expect(state).toHaveProperty("delegations")
      expect(state).toHaveProperty("trajectory")
      expect(state).toHaveProperty("pressure")
    })
  })

  describe("SSE event dispatch", () => {
    it("should patch sessions path on session.* event", async () => {
      const store: StateStore = await createStateStore()
      store.set("/sessions", [{ id: "ses_1", status: "running", description: "test" }])
      const sessions = store.get("/sessions") as Array<{ id: string }>
      expect(sessions).toBeInstanceOf(Array)
      expect(sessions[0].id).toBe("ses_1")
    })

    it("should patch delegations path on delegation.* event", async () => {
      const store: StateStore = await createStateStore()
      store.set("/delegations", [{ id: "del_1", agent: "hm-test", status: "running" }])
      const dels = store.get("/delegations") as Array<{ id: string }>
      expect(dels[0].id).toBe("del_1")
    })
  })

  describe("cache invalidation", () => {
    it("should trigger re-fetch on invalidate.cache event", async () => {
      const store: StateStore = await createStateStore()
      const spy = vi.fn()
      store.subscribe("/sessions", spy)
      store.set("/sessions", [])
      expect(spy).toHaveBeenCalled()
    })
  })

  describe("not available state", () => {
    it("should handle plugin unavailable with fallback state", async () => {
      const store: StateStore = await createStateStore({ pluginUnavailable: true })
      const state = store.getState()
      expect(state.ui.sseConnected).toBe(false)
      expect(state.sessions).toBeDefined()
    })
  })
})

// ── Helper: Mock factory ──

async function createStateStore(options?: {
  pluginUnavailable?: boolean
}): Promise<StateStore> {
  // RED scaffold: will fail until state-store.ts provides the real implementation
  throw new Error("NOT_IMPLEMENTED: createStateStore must be provided by state-store.ts")
}
