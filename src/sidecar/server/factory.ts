/**
 * Sidecar HTTP server factory.
 *
 * Creates a lightweight Node HTTP server bound to `127.0.0.1` on a
 * port chosen from a fixed pool (default `4096-4105`). The first port
 * in the pool that successfully binds wins. The companion sidecar
 * client (`sidecar/src/lib/plugin-client.ts`) probes the same pool to
 * find the active plugin server.
 *
 * Port selection precedence (highest first):
 *   1. `HIVEMIND_PLUGIN_PORT`      — single explicit port
 *   2. `HIVEMIND_PLUGIN_PORT_LIST` — comma-separated list (env override)
 *   3. `HIVEMIND_PLUGIN_PORT_LIST` default constant
 *
 * The actual bound port is written to
 * `.hivemind/state/sidecar-port.json` so non-sidecar consumers
 * (legacy Next.js discovery) can still locate the server.
 *
 * Server start does NOT block plugin init — start failures are
 * handled by the caller (fire-and-forget with log warning).
 *
 * @see /Users/apple/hivemind-plugin-private/.hivemind/planning/plugin-port-pool-2026-06-07/00-landscape.md
 * @module sidecar/server/factory
 */

import http from "node:http"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"

import type { SidecarDependencyRegistry } from "./registry.js"
import type { SseConnectionPool } from "./sse/pool.js"
import type { Route } from "./handler.js"
import { SidecarRouter } from "./handler.js"
import { findAvailablePort, parsePortList } from "./constants.js"

/** Options for {@link createSidecarServer}. */
export interface SidecarServerOptions {
  registry: SidecarDependencyRegistry
  ssePool: SseConnectionPool
  projectDirectory: string
  /** Optional routes for the SidecarRouter (SC-02 extension). */
  routes?: Route[]
}

/** Handle returned by {@link createSidecarServer}. */
export interface SidecarServerHandle {
  port: number
  close: () => Promise<void>
}

/**
 * Resolve which TCP port the sidecar server should bind to.
 *
 * Precedence:
 *   1. `HIVEMIND_PLUGIN_PORT` env var (single explicit port)
 *   2. First free port in `HIVEMIND_PLUGIN_PORT_LIST`
 *      (env-overridden via `HIVEMIND_PLUGIN_PORT_LIST`, otherwise the
 *      default 10-port pool from {@link parsePortList})
 *
 * @returns A TCP port number guaranteed free at probe time.
 * @throws `[Harness]` error when the explicit port is invalid or when
 *   every port in the pool is taken.
 */
async function resolveBindPort(): Promise<number> {
  const envPort = process.env["HIVEMIND_PLUGIN_PORT"]
  if (envPort !== undefined && envPort !== "") {
    const parsed = Number.parseInt(envPort, 10)
    if (!Number.isInteger(parsed) || parsed <= 0 || parsed >= 65536) {
      throw new Error(
        `[Harness] HIVEMIND_PLUGIN_PORT must be a valid TCP port (1-65535), got "${envPort}"`,
      )
    }
    return parsed
  }
  return findAvailablePort(parsePortList())
}

/**
 * Create and start a sidecar HTTP server.
 *
 * Port allocation: {@link resolveBindPort} picks a port from the
 * default pool (or env-overridden pool) and the server binds to that
 * specific port. On success the actual port is written to
 * `.hivemind/state/sidecar-port.json` for legacy Next.js discovery.
 *
 * @param options - Server options including the dependency registry,
 *   SSE pool, and project directory.
 * @returns A handle with the assigned port and a close function.
 * @throws `[Harness]` error when no port in the pool is free.
 */
export async function createSidecarServer(
  options: SidecarServerOptions,
): Promise<SidecarServerHandle> {
  const startTime = Date.now()
  const { registry: _registry, ssePool, projectDirectory, routes } = options

  const router = new SidecarRouter(routes ?? [], options.registry)

  const server = http.createServer((req, res) => {
    // GET /health -> 200 { status: "ok", uptime: <ms> }
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" })
      res.end(JSON.stringify({ status: "ok", uptime: Date.now() - startTime }))
      return
    }

    // All other routes -> SidecarRouter
    void router.handle(req, res)
  })

  // Register cleanup on process signals
  const cleanup = () => {
    ssePool.stop()
    server.close()
  }
  process.on("SIGTERM", cleanup)
  process.on("SIGINT", cleanup)

  const port = await resolveBindPort()

  return new Promise<SidecarServerHandle>((resolve, reject) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        reject(new Error("[Harness] Sidecar: failed to get server address"))
        return
      }
      const boundPort = address.port

      // Write port file for Next.js discovery (non-fatal on failure)
      try {
        const stateDir = join(projectDirectory, ".hivemind", "state")
        if (!existsSync(stateDir)) {
          mkdirSync(stateDir, { recursive: true })
        }
        writeFileSync(
          join(stateDir, "sidecar-port.json"),
          JSON.stringify({ port: boundPort }),
          "utf8",
        )
      } catch {
        // Port file write failure is non-fatal (D-SC01-04)
      }

      // Start SSE heartbeat
      ssePool.startHeartbeat()

      resolve({
        port: boundPort,
        close: () =>
          new Promise<void>((res) => {
            ssePool.stop()
            server.close(() => res())
          }),
      })
    })

    server.on("error", (err: Error) => {
      reject(err)
    })
  })
}
