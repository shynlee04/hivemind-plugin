import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

// ── Types mirroring what plugin-client will export ──

interface StateSnapshot {
  sessions: Array<{ id: string; status: string; description: string }>
  delegations: Array<{ id: string; agent: string; status: string }>
  trajectory: Array<{ phase: string; summary: string; timestamp: number }>
  pressure: { score: number; tier: number; timestamp: number }
  config: Record<string, unknown>
  server: { uptime: number; port: number; version: string; startedAt: number }
}

interface ToolResponse {
  ok: boolean
  data?: unknown
  error?: string
}

interface SidecarEvent {
  type: string
  payload: Record<string, unknown>
  timestamp: number
}

interface PluginClient {
  getBaseUrl(): string
  snapshot(): Promise<StateSnapshot>
  getSessions(): Promise<{ sessions: Array<{ id: string; status: string }> }>
  getSessionChildren(id: string): Promise<{ children: Array<{ id: string }> }>
  getSessionContext(id: string): Promise<{ context: Record<string, unknown> }>
  getSessionDelegations(id: string): Promise<{ delegations: Array<{ id: string }> }>
  getSessionDocs(id: string): Promise<{ docs: Array<{ id: string; title: string }> }>
  getEventsUrl(): string
  getCatalog(): Promise<{ catalog: { components: Record<string, unknown> } }>
  getCatalogTools(): Promise<{ tools: Array<{ name: string }> }>
  getWsUrl(): string
  postDelegateTask(params: unknown): Promise<ToolResponse>
  postDelegationStatus(params: unknown): Promise<ToolResponse>
  postExecuteSlashCommand(params: unknown): Promise<ToolResponse>
  postTrajectory(params: unknown): Promise<ToolResponse>
  postSessionView(params: unknown): Promise<ToolResponse>
  postSessionPatch(params: unknown): Promise<ToolResponse>
  postCommandEngine(params: unknown): Promise<ToolResponse>
}

// ── Scaffold tests ──

describe("plugin-client", () => {
  const mockPort = 3199
  const mockBaseUrl = `http://127.0.0.1:${mockPort}`

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("port discovery", () => {
    it("should read port from sentinel file and construct base URL", async () => {
      // RED: this will fail until plugin-client.ts is implemented
      const client: PluginClient = await createPluginClient()
      expect(client.getBaseUrl()).toBe(mockBaseUrl)
    })

    it("should use fallback port 3199 when sentinel file is missing", async () => {
      const client: PluginClient = await createPluginClient({ fileMissing: true })
      expect(client.getBaseUrl()).toContain("3199")
    })
  })

  describe("17 endpoint methods", () => {
    it("should have typed snapshot method returning StateSnapshot", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.snapshot()
      expect(result).toHaveProperty("sessions")
      expect(result).toHaveProperty("delegations")
      expect(result).toHaveProperty("trajectory")
      expect(result).toHaveProperty("pressure")
    })

    it("should have typed getSessions method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.getSessions()
      expect(result.sessions).toBeInstanceOf(Array)
    })

    it("should have typed getSessionChildren method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.getSessionChildren("test-id")
      expect(result).toHaveProperty("children")
    })

    it("should have typed getSessionContext method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.getSessionContext("test-id")
      expect(result).toHaveProperty("context")
    })

    it("should have typed getSessionDelegations method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.getSessionDelegations("test-id")
      expect(result).toHaveProperty("delegations")
    })

    it("should have typed getSessionDocs method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.getSessionDocs("test-id")
      expect(result).toHaveProperty("docs")
    })

    it("should have getEventsUrl returning SSE endpoint", async () => {
      const client: PluginClient = await createPluginClient()
      const url = client.getEventsUrl()
      expect(url).toContain("/api/events")
    })

    it("should have typed getCatalog method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.getCatalog()
      expect(result.catalog.components).toBeDefined()
    })

    it("should have typed getCatalogTools method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.getCatalogTools()
      expect(result.tools).toBeInstanceOf(Array)
    })

    it("should have getWsUrl returning WS endpoint", async () => {
      const client: PluginClient = await createPluginClient()
      const url = client.getWsUrl()
      expect(url).toContain("/ws/delegation")
    })

    it("should have typed postDelegateTask method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.postDelegateTask({ agent: "test", prompt: "hello" })
      expect(result).toHaveProperty("ok")
    })

    it("should have typed postDelegationStatus method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.postDelegationStatus({ delegationId: "test" })
      expect(result).toHaveProperty("ok")
    })

    it("should have typed postExecuteSlashCommand method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.postExecuteSlashCommand({ command: "test" })
      expect(result).toHaveProperty("ok")
    })

    it("should have typed postTrajectory method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.postTrajectory({ action: "inspect" })
      expect(result).toHaveProperty("ok")
    })

    it("should have typed postSessionView method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.postSessionView({ sessionId: "test" })
      expect(result).toHaveProperty("ok")
    })

    it("should have typed postSessionPatch method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.postSessionPatch({ sessionId: "test" })
      expect(result).toHaveProperty("ok")
    })

    it("should have typed postCommandEngine method", async () => {
      const client: PluginClient = await createPluginClient()
      const result = await client.postCommandEngine({ action: "discover" })
      expect(result).toHaveProperty("ok")
    })
  })

  describe("error handling", () => {
    it("should handle connection failure without throwing", async () => {
      const client: PluginClient = await createPluginClient({ failRequests: true })
      const result = await client.snapshot()
      expect(result).toBeDefined()
    })
  })
})

// ── Helper: Mock factory that will be replaced by real implementation ──

async function createPluginClient(options?: {
  fileMissing?: boolean
  failRequests?: boolean
}): Promise<PluginClient> {
  // RED scaffold: will fail until plugin-client.ts provides the real implementation
  throw new Error("NOT_IMPLEMENTED: createPluginClient must be provided by plugin-client.ts")
}
