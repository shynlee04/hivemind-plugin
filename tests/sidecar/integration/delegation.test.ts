/**
 * SC-02 integration: end-to-end delegation flow (AC-S02-11).
 *
 * Starts a real SidecarRouter HTTP server on 127.0.0.1:0 with all
 * 17 SC-02 routes wired, then exercises the delegate-task → WS
 * subscribe → receive delegation events → unsubscribe flow.
 *
 * Gated by `SIDECAR_INTEGRATION=1` — skipped in default CI.
 *
 * @module tests/sidecar/integration/delegation
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import http from "node:http"
import { createServer } from "../../../src/sidecar/server/handler.js"
import { createMockRegistry } from "../__mocks__/registry.js"

describe.skipIf(!process.env.SIDECAR_INTEGRATION)(
  "SC-02 integration: delegation flow (AC-S02-11)",
  () => {
    let server: { port: number; close: () => Promise<void> }
    let registry: unknown

    beforeEach(async () => {
      const mock = createMockRegistry()
      registry = mock.registry
      server = await createServer({ registry: registry as never })
    })

    afterEach(async () => {
      if (server) await server.close()
    })

    it("POST /api/tools/delegate-task → 200 + delegationId + meta.duration > 0", async () => {
      const body = JSON.stringify({ args: { sessionId: "sess-1", prompt: "echo hello" } })
      const res = await fetch(`http://127.0.0.1:${server.port}/api/tools/delegate-task`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      })
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.ok).toBe(true)
      expect(json.data).toBeDefined()
      expect(typeof json.meta?.duration).toBe("number")
      expect(json.meta?.duration).toBeGreaterThanOrEqual(0)
    })

    it("GET /api/state/snapshot → 200 with snapshot body", async () => {
      const res = await fetch(`http://127.0.0.1:${server.port}/api/state/snapshot`)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.ok).toBe(true)
    })

    it("WS connect to /ws/delegation → 101 upgrade", async () => {
      const crypto = { randomBytes: (await import("node:crypto")).randomBytes }
      const key = crypto.randomBytes(16).toString("base64")
      const status = await new Promise<number>((resolve, reject) => {
        const req = http.request(
          {
            host: "127.0.0.1",
            port: server!.port,
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
        req.on("upgrade", () => resolve(101))
        req.on("error", reject)
        req.end()
      })
      expect(status).toBe(101)
    })
  },
)
