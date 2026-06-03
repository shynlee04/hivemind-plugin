/**
 * Sidecar HTTP server factory.
 *
 * Creates a lightweight Node HTTP server bound to `127.0.0.1:0`
 * (random port) that exposes a `GET /health` endpoint and returns
 * `501 Not Implemented` for all other routes.  The port is written
 * to `.hivemind/state/sidecar-port.json` for Next.js discovery.
 *
 * Server start does NOT block plugin init — start failures are
 * handled by the caller (fire-and-forget with log warning).
 *
 * @module sidecar/server/factory
 */

import http from "node:http"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"

import type { SidecarDependencyRegistry } from "./registry.js"
import type { SseConnectionPool } from "./sse/pool.js"
import type { Route } from "./handler.js"
import { SidecarRouter } from "./handler.js"

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
 * Create and start a sidecar HTTP server.
 *
 * The server binds to `127.0.0.1:0` (random port assigned by the OS).
 * On success the actual port is written to
 * `.hivemind/state/sidecar-port.json` for Next.js discovery.
 *
 * @param options - Server options including the dependency registry,
 *   SSE pool, and project directory.
 * @returns A handle with the assigned port and a close function.
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

  return new Promise<SidecarServerHandle>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address()
      if (!address || typeof address === "string") {
        reject(new Error("[Harness] Sidecar: failed to get server address"))
        return
      }
      const port = address.port

      // Write port file for Next.js discovery (non-fatal on failure)
      try {
        const stateDir = join(projectDirectory, ".hivemind", "state")
        if (!existsSync(stateDir)) {
          mkdirSync(stateDir, { recursive: true })
        }
        writeFileSync(
          join(stateDir, "sidecar-port.json"),
          JSON.stringify({ port }),
          "utf8",
        )
      } catch {
        // Port file write failure is non-fatal (D-SC01-04)
      }

      // Start SSE heartbeat
      ssePool.startHeartbeat()

      resolve({
        port,
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
