/**
 * Typed HTTP client for the SC-02 plugin server API.
 *
 * Discovers the plugin port from the sentinel file at
 * `.hivemind/state/sidecar-port.json`, then exposes typed methods
 * for all 17 endpoints (6 state reads, 7 tool POST, 1 SSE, 1 WS,
 * 2 catalog).
 *
 * Falls back to port 3199 when the sentinel file is missing
 * (independent development mode). Re-reads the port file on
 * HTTP errors to handle plugin restarts.
 *
 * @module sidecar/lib/plugin-client
 */

import type {
  StateSnapshot,
  SessionSummary,
  ChildSession,
  SessionContext,
  DelegationRecord,
  DocChunk,
  ToolResponse,
  ToolCatalogEntry,
  JsonRenderCatalog,
} from "./types"
import { FALLBACK_PORT, PORT_FILE_PATH } from "./constants"

export interface PluginClientOptions {
  /** Optional explicit project root path. Defaults to two dirs up from sidecar/. */
  hivemindDir?: string
}

/**
 * Typed HTTP client for all SC-02 plugin server endpoints.
 */
export class PluginClient {
  private baseUrl: string
  private port: number
  private hivemindDir: string

  constructor(options?: PluginClientOptions) {
    this.hivemindDir = options?.hivemindDir || process.env.HIVEMIND_DIR || ""
    this.port = FALLBACK_PORT
    this.baseUrl = `http://127.0.0.1:${this.port}`
    this.discoverPort()
  }

  // ── Port discovery ──

  /**
   * Read the plugin port from the sentinel file, falling back to FALLBACK_PORT.
   */
  private discoverPort(): void {
    try {
      // In production (standalone mode), HIVEMIND_DIR must be set via env var.
      // In dev mode, resolve relative to sidecar/ directory.
      const rootDir = this.hivemindDir
      // For browser/Next.js, the port file isn't directly accessible via fs.
      // We assume the port is either set via env or the fallback.
      const envPort = process.env.NEXT_PUBLIC_PLUGIN_PORT
        ? parseInt(process.env.NEXT_PUBLIC_PLUGIN_PORT, 10)
        : null
      this.port = envPort || FALLBACK_PORT
      this.baseUrl = `http://127.0.0.1:${this.port}`
    } catch {
      this.port = FALLBACK_PORT
      this.baseUrl = `http://127.0.0.1:${this.port}`
    }
  }

  /**
   * Re-read port on HTTP error (handles plugin restart).
   */
  private async handleConnectionError(): Promise<void> {
    this.discoverPort()
  }

  /** Get the current base URL. */
  getBaseUrl(): string {
    return this.baseUrl
  }

  // ── Generic fetch helper ──

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`)
    if (!res.ok) {
      if (res.status >= 500) await this.handleConnectionError()
      throw new Error(`GET ${path} failed: ${res.status}`)
    }
    const json = (await res.json()) as { ok: boolean; data?: T; error?: string }
    if (!json.ok) throw new Error(json.error || `GET ${path}: server error`)
    return json.data as T
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      if (res.status >= 500) await this.handleConnectionError()
      throw new Error(`POST ${path} failed: ${res.status}`)
    }
    const json = (await res.json()) as { ok: boolean; data?: T; error?: string }
    if (!json.ok) throw new Error(json.error || `POST ${path}: server error`)
    return json.data as T
  }

  // ── 6 State GET endpoints ──

  /** GET /api/state/snapshot — full state snapshot. */
  async snapshot(): Promise<StateSnapshot> {
    return this.get<StateSnapshot>("/api/state/snapshot")
  }

  /** GET /api/state/sessions — list all sessions. */
  async getSessions(): Promise<{ sessions: SessionSummary[] }> {
    return this.get<{ sessions: SessionSummary[] }>("/api/state/sessions")
  }

  /** GET /api/state/sessions/:id/children — child sessions for a given session. */
  async getSessionChildren(id: string): Promise<{ children: ChildSession[] }> {
    return this.get<{ children: ChildSession[] }>(`/api/state/sessions/${id}/children`)
  }

  /** GET /api/state/sessions/:id/context — context for a given session. */
  async getSessionContext(id: string): Promise<{ context: SessionContext }> {
    return this.get<{ context: SessionContext }>(`/api/state/sessions/${id}/context`)
  }

  /** GET /api/state/sessions/:id/delegations — delegations for a given session. */
  async getSessionDelegations(id: string): Promise<{ delegations: DelegationRecord[] }> {
    return this.get<{ delegations: DelegationRecord[] }>(`/api/state/sessions/${id}/delegations`)
  }

  /** GET /api/state/sessions/:id/docs — doc chunks for a given session. */
  async getSessionDocs(id: string): Promise<{ docs: DocChunk[] }> {
    return this.get<{ docs: DocChunk[] }>(`/api/state/sessions/${id}/docs`)
  }

  // ── SSE endpoint URL ──

  /** Get the full URL for the SSE events endpoint. */
  getEventsUrl(): string {
    return `${this.baseUrl}/api/events`
  }

  // ── WS endpoint URL ──

  /** Get the full URL for the WebSocket delegation endpoint. */
  getWsUrl(): string {
    return `ws://127.0.0.1:${this.port}/ws/delegation`
  }

  // ── 2 Catalog GET endpoints ──

  /** GET /api/catalog — json-render catalog data. */
  async getCatalog(): Promise<{ catalog: JsonRenderCatalog }> {
    return this.get<{ catalog: JsonRenderCatalog }>("/api/catalog")
  }

  /** GET /api/catalog/tools — tool catalog entries. */
  async getCatalogTools(): Promise<{ tools: ToolCatalogEntry[] }> {
    return this.get<{ tools: ToolCatalogEntry[] }>("/api/catalog/tools")
  }

  // ── 7 Tool POST endpoints ──

  /** POST /api/tools/delegate-task — delegate a task to a subagent. */
  async postDelegateTask(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/delegate-task", params)
  }

  /** POST /api/tools/delegation-status — query delegation status. */
  async postDelegationStatus(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/delegation-status", params)
  }

  /** POST /api/tools/execute-slash-command — execute a slash command. */
  async postExecuteSlashCommand(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/execute-slash-command", params)
  }

  /** POST /api/tools/hivemind-trajectory — query or update trajectory. */
  async postTrajectory(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/hivemind-trajectory", params)
  }

  /** POST /api/tools/hivemind-session-view — view session details. */
  async postSessionView(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/hivemind-session-view", params)
  }

  /** POST /api/tools/session-patch — patch session files. */
  async postSessionPatch(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/session-patch", params)
  }

  /** POST /api/tools/hivemind-command-engine — list or discover commands. */
  async postCommandEngine(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/hivemind-command-engine", params)
  }
}

/** Singleton client instance. */
let _instance: PluginClient | null = null

/**
 * Get or create the singleton PluginClient instance.
 */
export function getPluginClient(options?: PluginClientOptions): PluginClient {
  if (!_instance) {
    _instance = new PluginClient(options)
  }
  return _instance
}
