/**
 * Typed HTTP client for the SC-02 plugin server API.
 *
 * Discovers the plugin port by probing a fixed list of ports
 * (`HIVEMIND_PLUGIN_PORT_LIST`, default `[4096..4105]`) on startup,
 * then uses the first port that responds to `GET /health`. This allows
 * multiple OpenCode instances to coexist (each gets a unique port in the
 * pool) without the race condition that occurred when every instance
 * wrote to a single shared port file.
 *
 * Port discovery precedence (highest first):
 *   1. `HIVEMIND_PLUGIN_PORT` env var      — single explicit port
 *   2. Probe `HIVEMIND_PLUGIN_PORT_LIST` in order
 *   3. Fall back to `FALLBACK_PORT` (3199) if the singleton is constructed
 *      before probing completes
 *
 * Backward compat: `NEXT_PUBLIC_PLUGIN_PORT` env var (Next.js convention)
 * is also honored, taking precedence over the probe result if set.
 *
 * Companion: `src/sidecar/server/factory.ts` (Wave 1) which tries the
 * same port list on bind. The two lists are duplicated (not imported)
 * because of the SC-03 "no forbidden src/sidecar imports" rule — keep
 * them in sync manually.
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
import { FALLBACK_PORT } from "./constants"

/**
 * Default port pool for the Hivemind plugin server.
 *
 * **DUPLICATE** of `src/sidecar/server/constants.ts:30` —
 * `HIVEMIND_PLUGIN_PORT_LIST`. The two lists CANNOT be imported from
 * each other because of the SC-03 "no forbidden src/sidecar imports"
 * rule (the sidecar is a separate package). Keep them in sync
 * manually; an integration test in Wave 3 verifies they match.
 *
 * Ten consecutive ports starting at 4096. The first port that responds
 * to `GET /health` wins.
 */
export const HIVEMIND_PLUGIN_PORT_LIST: readonly number[] = [
  4096, 4097, 4098, 4099, 4100, 4101, 4102, 4103, 4104, 4105,
] as const

/** Timeout per port probe (in ms). Total probe time bounded at ~10s. */
const PORT_PROBE_TIMEOUT_MS = 1000

/** Hostname used for HTTP probes. */
const PROBE_HOSTNAME = "127.0.0.1"

export interface PluginClientOptions {
  /** Optional explicit project root path. Defaults to env HIVEMIND_DIR or empty. */
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
    const initialPort = this.resolveInitialPort()
    this.port = initialPort
    this.baseUrl = `http://${PROBE_HOSTNAME}:${this.port}`
  }

  // ── Port resolution ──

  /**
   * Determine the initial port to use at construction time.
   *
   * Precedence (highest first):
   *   1. `NEXT_PUBLIC_PLUGIN_PORT` env var (Next.js public env)
   *   2. Cached discovered port (set by `initPluginClient()` before construction)
   *   3. `FALLBACK_PORT` (3199)
   */
  private resolveInitialPort(): number {
    const envPort = process.env.NEXT_PUBLIC_PLUGIN_PORT
      ? parseInt(process.env.NEXT_PUBLIC_PLUGIN_PORT, 10)
      : NaN
    if (Number.isInteger(envPort) && envPort > 0 && envPort < 65536) {
      return envPort
    }
    if (cachedDiscoveredPort !== null) {
      return cachedDiscoveredPort
    }
    return FALLBACK_PORT
  }

  /**
   * Rebind the client to a new port (typically after `initPluginClient()`
   * discovers the active plugin server).
   */
  setPort(port: number): void {
    this.port = port
    this.baseUrl = `http://${PROBE_HOSTNAME}:${port}`
  }

  /**
   * Re-read the cached discovered port from the module-level cache
   * (used to pick up a port that was probed after this client was
   * constructed).
   */
  refreshFromCache(): void {
    if (cachedDiscoveredPort !== null) {
      this.setPort(cachedDiscoveredPort)
    }
  }

  /** Get the current port. */
  getPort(): number {
    return this.port
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

  /**
   * Re-read port on HTTP error (handles plugin restart).
   *
   * Triggers a fresh probe so the client can recover if the plugin
   * server moved to a different port.
   */
  private async handleConnectionError(): Promise<void> {
    // Fire-and-forget: the next call will pick up the new port from
    // the module-level cache (populated by the in-flight probe).
    void probePluginPort().then((port) => {
      if (port !== null) this.setPort(port)
    })
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
  async getSessionDelegations(
    id: string,
  ): Promise<{ delegations: DelegationRecord[] }> {
    return this.get<{ delegations: DelegationRecord[] }>(
      `/api/state/sessions/${id}/delegations`,
    )
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
    return `ws://${PROBE_HOSTNAME}:${this.port}/ws/delegation`
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
  async postDelegationStatus(
    params: Record<string, unknown>,
  ): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/delegation-status", params)
  }

  /** POST /api/tools/execute-slash-command — execute a slash command. */
  async postExecuteSlashCommand(
    params: Record<string, unknown>,
  ): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/execute-slash-command", params)
  }

  /** POST /api/tools/hivemind-trajectory — query or update trajectory. */
  async postTrajectory(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/hivemind-trajectory", params)
  }

  /** POST /api/tools/hivemind-session-view — view session details. */
  async postSessionView(
    params: Record<string, unknown>,
  ): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/hivemind-session-view", params)
  }

  /** POST /api/tools/session-patch — patch session files. */
  async postSessionPatch(params: Record<string, unknown>): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/session-patch", params)
  }

  /** POST /api/tools/hivemind-command-engine — list or discover commands. */
  async postCommandEngine(
    params: Record<string, unknown>,
  ): Promise<ToolResponse> {
    return this.post<ToolResponse>("/api/tools/hivemind-command-engine", params)
  }
}

// ── Module-level port discovery cache ──

/** Cached discovered port (set by `probePluginPort()` after a successful probe). */
let cachedDiscoveredPort: number | null = null

/** In-flight probe promise (to coalesce concurrent probe calls). */
let probeInProgress: Promise<number | null> | null = null

/**
 * Probe a single TCP port by attempting a `GET /health` request.
 * Returns `true` if the port responds with HTTP 2xx; `false` otherwise.
 *
 * Aborts the request after `PORT_PROBE_TIMEOUT_MS` (1s by default).
 */
async function probeSinglePort(port: number): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PORT_PROBE_TIMEOUT_MS)
  try {
    const response = await fetch(
      `http://${PROBE_HOSTNAME}:${port}/health`,
      { signal: controller.signal },
    )
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Discover the active plugin server port.
 *
 * Precedence (highest first):
 *   1. `HIVEMIND_PLUGIN_PORT` env var (probe that single port)
 *   2. Probe `HIVEMIND_PLUGIN_PORT_LIST` in order, return first responder
 *
 * The result is cached — subsequent calls return the same value
 * until `resetCachedPort()` is called. Concurrent calls share the
 * same in-flight probe promise (no duplicate work).
 *
 * @returns The discovered port, or `null` if no candidate responded.
 */
export async function probePluginPort(): Promise<number | null> {
  if (cachedDiscoveredPort !== null) return cachedDiscoveredPort
  if (probeInProgress) return probeInProgress

  probeInProgress = (async (): Promise<number | null> => {
    try {
      // 1. Env var override (single explicit port)
      const envPort = process.env.HIVEMIND_PLUGIN_PORT
      if (envPort !== undefined && envPort !== "") {
        const parsed = Number.parseInt(envPort, 10)
        if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) {
          if (await probeSinglePort(parsed)) {
            cachedDiscoveredPort = parsed
            return parsed
          }
          // Env-var port is set but not responding — do NOT fall through
          // to the port list, the operator was explicit.
          return null
        }
      }

      // 2. Probe the port list in order
      for (const port of HIVEMIND_PLUGIN_PORT_LIST) {
        if (await probeSinglePort(port)) {
          cachedDiscoveredPort = port
          return port
        }
      }

      return null
    } finally {
      probeInProgress = null
    }
  })()

  return probeInProgress
}

/**
 * Reset the cached discovered port. Used by tests and by the client
 * on HTTP 5xx errors (to recover from a plugin restart that moved
 * the server to a different port).
 *
 * Also clears any in-flight probe so that subsequent calls start
 * fresh (avoids stale-promise pollution in tests and reconnect paths).
 */
export function resetCachedPort(): void {
  cachedDiscoveredPort = null
  probeInProgress = null
}

// ── Singleton client instance ──

let _instance: PluginClient | null = null

/**
 * Get or create the singleton PluginClient instance (synchronous).
 *
 * If the singleton was constructed before `initPluginClient()` ran,
 * the initial port will be `FALLBACK_PORT` (or `NEXT_PUBLIC_PLUGIN_PORT`).
 * Call `initPluginClient()` at app startup to discover the active
 * port and rebind the singleton.
 */
export function getPluginClient(options?: PluginClientOptions): PluginClient {
  if (!_instance) {
    _instance = new PluginClient(options)
  } else {
    // Pick up any port that was discovered after construction
    _instance.refreshFromCache()
  }
  return _instance
}

/**
 * Initialize the plugin client by probing for the active server.
 *
 * Call this once at app startup (e.g., in a top-level `useEffect`).
 * The result is cached — subsequent `getPluginClient()` calls reuse
 * the discovered port.
 *
 * If probing fails (no server found), the singleton is left at
 * `FALLBACK_PORT` (3199) and HTTP calls will surface the connection
 * error to the caller.
 */
export async function initPluginClient(): Promise<PluginClient> {
  const port = await probePluginPort()
  const client = getPluginClient()
  if (port !== null) {
    client.setPort(port)
  }
  return client
}
