/**
 * Sidecar HTTP router and test server factory.
 *
 * Exports the {@link SidecarRouter} class for method+path-based HTTP routing,
 * JSON response helpers, and a {@link createServer} convenience function for
 * spinning up a test server with all SC-02 routes wired.
 *
 * @module sidecar/server/handler
 */

import type { IncomingMessage, ServerResponse } from "node:http"
import type { Duplex } from "node:stream"

import type { SidecarDependencyRegistry } from "./registry.js"

// ── Route types ──────────────────────────────────────────────

/** Context passed to a domain route handler after URL parsing. */
export interface RouteContext {
  params: Record<string, string>
  query: Record<string, string>
  body: unknown
}

/** Standard result envelope returned by domain route handlers. */
export interface RouteResult {
  ok: boolean
  data?: unknown
  error?: { code: string; message: string }
  /** Optional HTTP response headers override (e.g. for SSE Content-Type). */
  _headers?: Record<string, string>
  /** Optional raw body to send instead of JSON-serialised RouteResult. */
  _rawBody?: string
}

/**
 * A domain route entry. Used by route modules (state, sessions, tools,
 * events, catalog) to declare their endpoints.
 *
 * The `handler` receives a parsed context and returns a structured result
 * that the router serialises as JSON.
 */
export interface Route {
  method: string
  path: string
  handler: (
    ctx: RouteContext,
    registry: SidecarDependencyRegistry,
  ) => Promise<RouteResult>
}

// ── JSON response helpers ────────────────────────────────────

/**
 * Send a JSON response with the given status code and body.
 *
 * @param res    - HTTP server response.
 * @param status - HTTP status code.
 * @param body   - Serializable body.
 * @param headers - Optional extra response headers.
 */
export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): void {
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    "access-control-allow-origin": "*",
    ...headers,
  }
  res.writeHead(status, h)
  res.end(JSON.stringify(body))
}

/**
 * Send a transport-level error response (not a {@link RouteResult}).
 *
 * @param res     - HTTP server response.
 * @param status  - HTTP error status code.
 * @param code    - Machine-readable error code.
 * @param message - Human-readable error description.
 */
export function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
): void {
  sendJson(res, status, { ok: false, error: { code, message } })
}

// ── SidecarRouter ────────────────────────────────────────────

/** Internal compiled route entry (pattern compiled from Route.path). */
interface CompiledRoute {
  method: string
  pattern: RegExp
  paramNames: string[]
  handler: (
    ctx: RouteContext,
    registry: SidecarDependencyRegistry,
  ) => Promise<RouteResult>
}

/**
 * Method+path HTTP router for the sidecar server.
 *
 * Routes are declared as lazy {@link Route} arrays and compiled to
 * RegExp patterns on construction. URL parameters (e.g. `:id`) are
 * extracted as named capture groups.
 *
 * @example
 * ```ts
 * const router = new SidecarRouter(routes, registry)
 * const server = http.createServer((req, res) => { void router.handle(req, res) })
 * server.listen(0, "127.0.0.1")
 * ```
 */
export class SidecarRouter {
  readonly #routes: CompiledRoute[]
  readonly #registry: SidecarDependencyRegistry

  constructor(routes: Route[], registry: SidecarDependencyRegistry) {
    this.#registry = registry
    this.#routes = routes.map(this.#compileRoute)
  }

  /** Compile a Route's path pattern (e.g. `/sessions/:id`) to a RegExp. */
  #compileRoute(r: Route): CompiledRoute {
    const paramNames: string[] = []
    const patternStr = r.path.replace(/:(\w+)/g, (_m, name: string) => {
      paramNames.push(name)
      return "([^/]+)"
    })
    return {
      method: r.method,
      pattern: new RegExp(`^${patternStr}$`),
      paramNames,
      handler: r.handler,
    }
  }

  /**
   * Handle an incoming HTTP request.
   *
   * 1. Matches the HTTP method + URL path against compiled routes.
   * 2. If matched, extracts URL params, parses query string, reads body.
   * 3. Calls the route handler and sends the result as JSON.
   * 4. If not matched → 404.
   * 5. If method mismatch → 405.
   *
   * @param req - Incoming HTTP request.
   * @param res - HTTP server response.
   */
  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const method = (req.method ?? "GET").toUpperCase()
    const url = req.url ?? "/"

    // Strip query string for path matching; keep for params
    const qmIdx = url.indexOf("?")
    const path = qmIdx === -1 ? url : url.slice(0, qmIdx)
    const qs = qmIdx === -1 ? "" : url.slice(qmIdx + 1)

    // CORS preflight: respond 204 for OPTIONS on any path (browser needs
    // Access-Control-Allow-Origin on the preflight before it sends the
    // actual GET/POST). Permissive by design — this is a local dev tool.
    if (method === "OPTIONS") {
      const corsPreflightHeaders: Record<string, string> = {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Content-Type, Authorization",
        "access-control-max-age": "86400",
      }
      res.writeHead(204, corsPreflightHeaders)
      res.end()
      return
    }

    // Collect all routes that match the path (for method check)
    const pathRoutes = this.#routes.filter((r) => path.match(r.pattern))

    // If no route matches the path at all → 404
    if (pathRoutes.length === 0) {
      sendError(res, 404, "NOT_FOUND", `Route not found: ${method} ${path}`)
      return
    }

    // Find a route matching both method and path
    for (const r of pathRoutes) {
      if (r.method !== method) continue

      const match = path.match(r.pattern)!
      const params: Record<string, string> = {}
      for (let i = 0; i < r.paramNames.length; i++) {
        params[r.paramNames[i]] = match[i + 1] ?? ""
      }

      // Parse query string
      const query: Record<string, string> = {}
      if (qs) {
        for (const part of qs.split("&")) {
          if (!part) continue
          const eqIdx = part.indexOf("=")
          if (eqIdx === -1) {
            query[decodeURIComponent(part)] = ""
          } else {
            query[decodeURIComponent(part.slice(0, eqIdx))] = decodeURIComponent(part.slice(eqIdx + 1))
          }
        }
      }

      // Read body for POST/PUT/PATCH
      let body: unknown = undefined
      if (["POST", "PUT", "PATCH"].includes(method)) {
        try {
          body = await this.#readJsonBody(req)
        } catch {
          sendError(res, 400, "BAD_REQUEST", "Invalid JSON body")
          return
        }
      }

      // Call handler and send response
      try {
        const result = await r.handler({ params, query, body }, this.#registry)
        if (result._headers && result._rawBody) {
          res.writeHead(200, result._headers)
          res.end(result._rawBody)
        } else if (result._headers) {
          sendJson(res, 200, result, result._headers)
        } else {
          sendJson(res, 200, result)
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        sendError(res, 500, "INTERNAL_ERROR", msg)
      }
      return
    }

    // A path was matched but not with this method → 405
    sendError(res, 405, "METHOD_NOT_ALLOWED", `Method ${method} not allowed for ${path}`)
  }

  /** Read and parse a JSON request body. */
  async #readJsonBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(chunk as Buffer)
    }
    const raw = Buffer.concat(chunks).toString("utf8")
    if (!raw) return undefined
    return JSON.parse(raw)
  }
}

// ── createServer (test convenience) ──────────────────────────

export interface SidecarServerHandle {
  port: number
  close: () => Promise<void>
}

/**
 * Create a test HTTP server with all SC-02 routes wired.
 *
 * This function is a convenience for the handler smoke test. It attempts
 * to dynamically import every route module; imports that fail (routes
 * not yet implemented) are silently skipped so the function works from
 * W1 onward.
 *
 * @param options - Server options including the dependency registry.
 * @returns A server handle bound to `127.0.0.1:0`.
 */
export async function createServer(options: {
  registry: SidecarDependencyRegistry
}): Promise<SidecarServerHandle> {
  const { registry } = options

  const allRoutes: Route[] = []

  // Dynamic import of route modules — each guarded by try/catch
  // Dynamic import of route modules — path variables avoid TS2307 on
  // string literal imports of files that don't exist yet (W1).
  const tryImport = async (path: string) => {
    try {
      return await import(path)
    } catch {
      return null
    }
  }

  const stateMod = await tryImport("./routes/state.js")
  if (stateMod) allRoutes.push(...stateMod.createStateRoutes(registry))

  const sessionsMod = await tryImport("./routes/sessions.js")
  if (sessionsMod) allRoutes.push(...sessionsMod.createSessionsRoutes(registry))

  const toolsMod = await tryImport("./routes/tools.js")
  if (toolsMod) allRoutes.push(...toolsMod.createToolsRoutes(registry))

  const catalogMod = await tryImport("./routes/catalog.js")
  if (catalogMod) allRoutes.push(...catalogMod.createCatalogRoutes(registry))

  // Try to import SseConnectionPool for SSE route
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ssePool: any = { stop: () => {}, startHeartbeat: () => {} }
  const sseMod = await tryImport("./sse/pool.js")
  if (sseMod) ssePool = new sseMod.SseConnectionPool({})

  const evMod = await tryImport("./routes/events.js")
  if (evMod) allRoutes.push(...evMod.createEventsRoute({ registry, ssePool }))

  // Try to import WS delegation handler for upgrade support
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wsPool: any = { stop: () => {}, startHeartbeat: () => {}, addClient: () => "ws-dummy", removeClient: () => {} }
  const wsMod = await tryImport("./ws/pool.js")
  if (wsMod) wsPool = new wsMod.WsConnectionPool({})

  const router = new SidecarRouter(allRoutes, registry)

  const http = await import("node:http")
  const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
    void router.handle(req, res)
  })

  // Handle WebSocket upgrade requests for /ws/delegation
  server.on("upgrade", (req: IncomingMessage, socket: Duplex, _head: Buffer) => {
    const url = req.url ?? "/"
    const path = url.indexOf("?") === -1 ? url : url.slice(0, url.indexOf("?"))
    if (path === "/ws/delegation") {
      // Minimal 101 response for tests, then close
      socket.write("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: dummy\r\n\r\n")
      try { wsPool.addClient() } catch { /* pool full */ }
      setImmediate(() => { try { socket.end() } catch { /* ignore */ } })
    } else {
      socket.destroy()
    }
  })

  return new Promise<SidecarServerHandle>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address()
      if (!addr || typeof addr === "string") {
        reject(new Error("[Hivemind] Sidecar: failed to get server address"))
        return
      }
      resolve({
        port: addr.port,
        close: () =>
          new Promise<void>((res) => {
            try { ssePool.stop() } catch { /* ignore */ }
            server.close(() => res())
          }),
      })
    })
    server.on("error", reject)
  })
}
