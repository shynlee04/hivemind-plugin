/**
 * SC-02 Handler 17-endpoint smoke matrix.
 *
 * Per plan-0 line 70: verifies all 17 HTTP endpoints via a live
 * HTTP server bound to 127.0.0.1. Each endpoint must return the
 * documented status code and body shape.
 *
 * Endpoint inventory (verified from 02-SPEC.md):
 *  State (4):  snapshot, sessions, sessions/{id}/children|context|delegations|docs
 *  Tools (7):  delegate-task, delegation-status, execute-slash-command,
 *              hivemind-trajectory, hivemind-session-view, session-patch,
 *              hivemind-command-engine
 *  Realtime:   /api/events (SSE), /ws/delegation (WS upgrade)
 *  Catalog:    /api/catalog, /api/catalog/tools
 *
 * Pattern reference: tests/sidecar/server/factory.test.ts
 *  - Import real SC-01 sources WITHOUT .js extension for types
 *  - Import real SC-01 sources WITH .js extension for values
 *  - Import non-existent SC-02 sources via `// @ts-ignore` directive
 *  - Bind 127.0.0.1:0 (localhost only)
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { createServer } from "../../../src/sidecar/server/handler.js"
import { createMockRegistry } from "../__mocks__/registry.js"
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import type { Route } from "../../../src/sidecar/server/handler.js"
import type { SidecarDependencyRegistry } from "../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import http from "node:http"

type ServerHandle = {
  port: number
  close: () => Promise<void>
}

function get(server: ServerHandle, path: string, headers: Record<string, string> = {}): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: server.port, path, method: "GET", headers },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (c) => chunks.push(c))
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8"), headers: res.headers }))
      },
    )
    req.on("error", reject)
    req.end()
  })
}

function post(server: ServerHandle, path: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = http.request(
      { host: "127.0.0.1", port: server.port, path, method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(data).toString(), ...headers } },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (c) => chunks.push(c))
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8"), headers: res.headers }))
      },
    )
    req.on("error", reject)
    req.write(data)
    req.end()
  })
}

describe("SC-02 handler — 17-endpoint smoke matrix", () => {
  let server: ServerHandle
  let registry: SidecarDependencyRegistry

  beforeEach(async () => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
    server = await createServer({ registry })
  })

  afterEach(async () => {
    if (server) await server.close()
  })

  // --- 4 state read endpoints ---
  it("GET /api/state/snapshot → 200 with 4-prefix aggregated body", async () => {
    const res = await get(server, "/api/state/snapshot")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { snapshot: Record<string, unknown> } }
    expect(body.ok).toBe(true)
    expect(body.data).toBeDefined()
  })

  it("GET /api/state/sessions → 200 with sessions array", async () => {
    const res = await get(server, "/api/state/sessions")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { sessions: unknown[] } }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data.sessions)).toBe(true)
  })

  it("GET /api/state/sessions/{id}/children → 200 with children array", async () => {
    const res = await get(server, "/api/state/sessions/sess-1/children")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { children: unknown[] } }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data.children)).toBe(true)
  })

  it("GET /api/state/sessions/{id}/context → 200 with context payload", async () => {
    const res = await get(server, "/api/state/sessions/sess-1/context")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { context: unknown } }
    expect(body.ok).toBe(true)
  })

  it("GET /api/state/sessions/{id}/delegations → 200 with delegations array", async () => {
    const res = await get(server, "/api/state/sessions/sess-1/delegations")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { delegations: unknown[] } }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data.delegations)).toBe(true)
  })

  it("GET /api/state/sessions/{id}/docs → 200 with docs array", async () => {
    const res = await get(server, "/api/state/sessions/sess-1/docs")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { docs: unknown[] } }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data.docs)).toBe(true)
  })

  // --- 7 write tool proxy endpoints ---
  it.each([
    "delegate-task",
    "delegation-status",
    "execute-slash-command",
    "hivemind-trajectory",
    "hivemind-session-view",
    "session-patch",
    "hivemind-command-engine",
  ])("POST /api/tools/%s → 200 with ToolResponse envelope", async (tool) => {
    // GAP-01 fix: sessionTracker.get must return a real session for the
    // hivemind-session-view handler to capture and return `data.session`.
    // The mock returns `undefined` by default — configure it to return a
    // real session record before the POST.
    const mock = createMockRegistry()
    ;(mock.sessionTracker.get as ReturnType<typeof import("vitest").vi.fn>).mockReturnValue({
      id: "sess-1",
      name: "Smoke Test Session",
    })
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    const localServer = await createServer({ registry: reg })
    try {
      const res = await post(localServer, `/api/tools/${tool}`, { args: { sessionId: "sess-1" } })
      expect(res.status).toBe(200)
      const body = JSON.parse(res.body) as { ok: boolean; data: unknown }
      expect(body.ok).toBe(true)
    } finally {
      await localServer.close()
    }
  })

  // --- Realtime endpoints ---
  it("GET /api/events → 200 (SSE headers)", async () => {
    const res = await get(server, "/api/events", { accept: "text/event-stream" })
    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("text/event-stream")
  })

  it("WS upgrade on /ws/delegation → 101 Switching Protocols", async () => {
    // WebSocket upgrade tested in detail in tests/sidecar/server/ws/delegation.test.ts
    // Handler test verifies the upgrade request reaches the WS handler
    const crypto = await import("node:crypto")
    const key = crypto.randomBytes(16).toString("base64")
    const res = await new Promise<number>((resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port: server.port,
          path: "/ws/delegation",
          method: "GET",
          headers: {
            upgrade: "websocket",
            connection: "Upgrade",
            "sec-websocket-version": "13",
            "sec-websocket-key": key,
          },
        },
        (response) => resolve(response.statusCode ?? 0),
      )
      req.on("upgrade", (_client, _socket, _head) => resolve(101))
      req.on("error", reject)
      req.end()
    })
    expect(res).toBe(101)
  })

  // --- 2 catalog endpoints ---
  it("GET /api/catalog → 200 with catalog array", async () => {
    const res = await get(server, "/api/catalog")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { catalog: unknown[] } }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data.catalog)).toBe(true)
  })

  it("GET /api/catalog/tools → 200 with tool catalog array", async () => {
    const res = await get(server, "/api/catalog/tools")
    expect(res.status).toBe(200)
    const body = JSON.parse(res.body) as { ok: boolean; data: { tools: unknown[] } }
    expect(body.ok).toBe(true)
    expect(Array.isArray(body.data.tools)).toBe(true)
  })

  // --- 404 path ---
  it("Unknown path → 404 with error envelope", async () => {
    const res = await get(server, "/api/unknown")
    expect(res.status).toBe(404)
    const body = JSON.parse(res.body) as { ok: boolean; error: { code: string } }
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe("NOT_FOUND")
  })

  // --- 405 method-not-allowed ---
  it("POST /api/state/snapshot → 405 (state is GET-only)", async () => {
    const res = await post(server, "/api/state/snapshot", {})
    expect(res.status).toBe(405)
  })
})
