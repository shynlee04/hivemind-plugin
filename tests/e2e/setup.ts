// Evidence label: runtime-truthful (L1)
// Phase AUDIT-04.02.4 REQ-05: E2E session creation scenarios
// T-14, T-15, T-16, T-20 — 3 runtime scenarios for session creation

import { spawn, type ChildProcess } from "node:child_process"
import { setTimeout as sleep } from "node:timers/promises"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

export interface E2EServer {
  port: number
  baseUrl: string
  process: ChildProcess
  dataDir: string
  kill(): Promise<void>
}

/**
 * Spawn `opencode serve --port <port>` and wait for readiness.
 * Per D-04: port allocation = 14096 + testIndex (avoid conflicts with sidecar 4106..4115).
 *
 * AUDIT-04.02.4-DX-01: Isolate `HOME` + `XDG_DATA_HOME` to a temp dir so the
 * spawned server uses its own SQLite database, NOT the production one at
 * `~/.local/share/opencode/opencode.db`.
 */
export async function spawnOpenCodeServer(testIndex: number): Promise<E2EServer> {
  const port = 14096 + testIndex
  const baseUrl = `http://localhost:${port}`
  const dataDir = await mkdtemp(join(tmpdir(), "hivemind-e2e-"))
  const proc = spawn("opencode", ["serve", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      HOME: dataDir,
      XDG_DATA_HOME: join(dataDir, ".local", "share"),
    },
  })

  // Wait for /global/health to return 200 with healthy=true
  const start = Date.now()
  const timeoutMs = 30_000
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/global/health`)
      if (res.ok) {
        const body = (await res.json()) as { healthy?: boolean; version?: string }
        if (body.healthy === true) {
          return {
            port,
            baseUrl,
            process: proc,
            dataDir,
            async kill() {
              proc.kill("SIGTERM")
              await sleep(2_000)
              if (!proc.killed) proc.kill("SIGKILL")
              await rm(dataDir, { recursive: true, force: true }).catch(() => undefined)
            },
          }
        }
      }
    } catch {
      // Server not ready yet
    }
    await sleep(500)
  }
  proc.kill("SIGKILL")
  await rm(dataDir, { recursive: true, force: true }).catch(() => undefined)
  throw new Error(
    `[Hivemind E2E] opencode serve did not become ready at ${baseUrl} within ${timeoutMs}ms`,
  )
}

/**
 * Spawn a mock HTTP server that returns Hivemind sidecar response shape
 * at `GET /global/health`: `{"status":"ok","uptime":N}`.
 */
export async function spawnMockSidecar(port: number): Promise<E2EServer> {
  const script = `
    const http = require("http");
    const server = http.createServer((req, res) => {
      if (req.url === "/global/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", uptime: 12345 }));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false }));
      }
    });
    server.listen(${port}, "127.0.0.1", () => console.log("mock sidecar ready on ${port}"));
  `
  const proc = spawn("node", ["-e", script], { stdio: ["ignore", "pipe", "pipe"] })

  // Wait for /global/health to return sidecar shape
  const start = Date.now()
  const timeoutMs = 10_000
  const baseUrl = `http://localhost:${port}`
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/global/health`)
      if (res.ok) {
        const body = (await res.json()) as { status?: string; uptime?: number }
        if (body.status === "ok") {
          return {
            port,
            baseUrl,
            process: proc,
            dataDir: "",
            async kill() {
              proc.kill("SIGTERM")
              await sleep(1_000)
              if (!proc.killed) proc.kill("SIGKILL")
            },
          }
        }
      }
    } catch {
      // Server not ready yet
    }
    await sleep(200)
  }
  proc.kill("SIGKILL")
  throw new Error(
    `[Hivemind E2E] mock sidecar did not become ready at ${baseUrl} within ${timeoutMs}ms`,
  )
}
