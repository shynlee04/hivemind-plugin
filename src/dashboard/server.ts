/**
 * HiveMind Dashboard Backend
 *
 * Provides HTTP API for dashboard data:
 * - GET /api/state — Current brain state
 * - GET /api/active — Active session content
 * - GET /api/index — Project trajectory
 * - GET /api/archives — List of archived sessions
 * - GET /api/archives/:id — Specific archive content
 * - GET /api/metrics — Session metrics
 *
 * Serves static dashboard files in production.
 */

import { createServer, IncomingMessage, ServerResponse } from "http"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { join, basename } from "path"
import { createStateManager } from "../lib/persistence.js"
import { readActiveMd, listArchives, getPlanningPaths } from "../lib/planning-fs.js"
import { createLogger } from "../lib/logging.js"

// ─── Types ───────────────────────────────────────────────────────────

interface DashboardConfig {
  projectRoot: string
  port: number
  host: string
}

interface ApiResponse {
  success: boolean
  data?: unknown
  error?: string
}

// ─── CORS Headers ────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
}

// ─── Response Helpers ────────────────────────────────────────────────

function sendJson(res: ServerResponse, status: number, data: ApiResponse): void {
  res.writeHead(status, CORS_HEADERS)
  res.end(JSON.stringify(data))
}

function sendError(res: ServerResponse, status: number, message: string): void {
  sendJson(res, status, { success: false, error: message })
}

// ─── Route Handlers ──────────────────────────────────────────────────

async function handleGetState(
  config: DashboardConfig,
  res: ServerResponse
): Promise<void> {
  try {
    const stateManager = createStateManager(config.projectRoot)
    const state = await stateManager.load()

    if (!state) {
      sendJson(res, 200, { success: true, data: null })
      return
    }

    sendJson(res, 200, { success: true, data: state })
  } catch (err) {
    sendError(res, 500, `Failed to load state: ${err}`)
  }
}

async function handleGetActive(
  config: DashboardConfig,
  res: ServerResponse
): Promise<void> {
  try {
    const activeMd = await readActiveMd(config.projectRoot)
    sendJson(res, 200, { success: true, data: activeMd })
  } catch (err) {
    sendError(res, 500, `Failed to load active.md: ${err}`)
  }
}

async function handleGetIndex(
  config: DashboardConfig,
  res: ServerResponse
): Promise<void> {
  try {
    const paths = getPlanningPaths(config.projectRoot)
    const content = await readFile(paths.indexPath, "utf-8")
    sendJson(res, 200, { success: true, data: { content } })
  } catch (err) {
    sendError(res, 500, `Failed to load index.md: ${err}`)
  }
}

async function handleGetArchives(
  config: DashboardConfig,
  res: ServerResponse
): Promise<void> {
  try {
    const archives = await listArchives(config.projectRoot)
    sendJson(res, 200, {
      success: true,
      data: archives.map((path) => ({
        id: basename(path, ".md"),
        path,
      })),
    })
  } catch (err) {
    sendError(res, 500, `Failed to list archives: ${err}`)
  }
}

async function handleGetArchive(
  config: DashboardConfig,
  archiveId: string,
  res: ServerResponse
): Promise<void> {
  try {
    const paths = getPlanningPaths(config.projectRoot)
    const archivePath = join(paths.archiveDir, `${archiveId}.md`)

    // Security: ensure path is within archive directory
    if (!archivePath.startsWith(paths.archiveDir)) {
      sendError(res, 403, "Invalid archive ID")
      return
    }

    if (!existsSync(archivePath)) {
      sendError(res, 404, "Archive not found")
      return
    }

    const content = await readFile(archivePath, "utf-8")
    sendJson(res, 200, { success: true, data: { id: archiveId, content } })
  } catch (err) {
    sendError(res, 500, `Failed to load archive: ${err}`)
  }
}

async function handleGetMetrics(
  config: DashboardConfig,
  res: ServerResponse
): Promise<void> {
  try {
    const stateManager = createStateManager(config.projectRoot)
    const state = await stateManager.load()
    const archives = await listArchives(config.projectRoot)

    if (!state) {
      sendJson(res, 200, {
        success: true,
        data: {
          hasSession: false,
          totalArchives: archives.length,
        },
      })
      return
    }

    sendJson(res, 200, {
      success: true,
      data: {
        hasSession: true,
        session: {
          id: state.session.id,
          mode: state.session.mode,
          status: state.session.governance_status,
          startTime: state.session.start_time,
        },
        hierarchy: state.hierarchy,
        metrics: state.metrics,
        totalArchives: archives.length,
      },
    })
  } catch (err) {
    sendError(res, 500, `Failed to load metrics: ${err}`)
  }
}

// ─── Router ──────────────────────────────────────────────────────────

function route(
  config: DashboardConfig,
  req: IncomingMessage,
  res: ServerResponse
): void {
  const url = req.url ?? "/"
  const method = req.method ?? "GET"

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  // Only accept GET requests for API
  if (method !== "GET") {
    sendError(res, 405, "Method not allowed")
    return
  }

  // API routes
  if (url === "/api/state") {
    handleGetState(config, res)
    return
  }

  if (url === "/api/active") {
    handleGetActive(config, res)
    return
  }

  if (url === "/api/index") {
    handleGetIndex(config, res)
    return
  }

  if (url === "/api/archives") {
    handleGetArchives(config, res)
    return
  }

  if (url.startsWith("/api/archives/")) {
    const archiveId = url.slice("/api/archives/".length)
    handleGetArchive(config, archiveId, res)
    return
  }

  if (url === "/api/metrics") {
    handleGetMetrics(config, res)
    return
  }

  if (url === "/api/health") {
    sendJson(res, 200, { success: true, data: { status: "ok" } })
    return
  }

  // 404 for unknown routes
  sendError(res, 404, "Not found")
}

// ─── Server Factory ──────────────────────────────────────────────────

export interface DashboardServer {
  start(): Promise<void>
  stop(): Promise<void>
  url: string
}

export function createDashboardServer(
  projectRoot: string,
  options: { port?: number; host?: string } = {}
): DashboardServer {
  const config: DashboardConfig = {
    projectRoot,
    port: options.port ?? 0, // 0 = random available port
    host: options.host ?? "127.0.0.1",
  }

  let server: ReturnType<typeof createServer> | null = null
  let serverUrl = ""

  return {
    get url() {
      return serverUrl
    },

    async start(): Promise<void> {
      // Ensure planning directory exists
      const paths = getPlanningPaths(projectRoot)
      if (!existsSync(paths.planningDir)) {
        throw new Error(
          `HiveMind not initialized. Run 'hivemind init' first.`
        )
      }

      // Setup logging
      const log = await createLogger(
        join(paths.planningDir, "logs"),
        "dashboard"
      )

      return new Promise((resolve, reject) => {
        server = createServer((req, res) => {
          route(config, req, res)
        })

        server.listen(config.port, config.host, () => {
          const address = server?.address()
          if (address && typeof address === "object") {
            serverUrl = `http://${config.host}:${address.port}`
            log.info(`Dashboard server started at ${serverUrl}`)
            resolve()
          } else {
            reject(new Error("Failed to get server address"))
          }
        })

        server.on("error", (err) => {
          reject(err)
        })
      })
    },

    async stop(): Promise<void> {
      return new Promise((resolve) => {
        if (server) {
          server.close(() => resolve())
          server = null
        } else {
          resolve()
        }
      })
    },
  }
}

// ─── CLI Entry Point ─────────────────────────────────────────────────

async function main(): Promise<void> {
  const projectRoot = process.cwd()
  const port = process.env.HIVEMIND_PORT
    ? parseInt(process.env.HIVEMIND_PORT, 10)
    : undefined

  const server = createDashboardServer(projectRoot, { port })

  try {
    await server.start()
    // eslint-disable-next-line no-console
    console.log(`HiveMind Dashboard running at ${server.url}`)
    // eslint-disable-next-line no-console
    console.log(`API endpoints:`)
    // eslint-disable-next-line no-console
    console.log(`  ${server.url}/api/state`)
    // eslint-disable-next-line no-console
    console.log(`  ${server.url}/api/metrics`)
    // eslint-disable-next-line no-console
    console.log(`  ${server.url}/api/active`)
    // eslint-disable-next-line no-console
    console.log(`  ${server.url}/api/archives`)
    // eslint-disable-next-line no-console
    console.log(`\nPress Ctrl+C to stop`)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to start dashboard:", err)
    process.exit(1)
  }

  // Graceful shutdown
  process.on("SIGINT", async () => {
    // eslint-disable-next-line no-console
    console.log("\nShutting down...")
    await server.stop()
    process.exit(0)
  })
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
