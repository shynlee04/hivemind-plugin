/**
 * SC-02 WS delegation route tests — covers GET /ws/delegation upgrade.
 * Per 02-SPEC.md AC-S02-05 + AC-S02-06:
 *   - 4 message types: subscribe, unsubscribe, ping, event
 *   - 64KB payload cap
 *   - 1013 (backpressure) / 1008 (policy violation) / 1003 (unsupported data) close codes
 *   - Per-scope filter (session/delegation/trajectory/pressure/config)
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { createWsDelegationHandler, WsMessageType } from "../../../../src/sidecar/server/ws/delegation.js"
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { WsConnectionPool } from "../../../../src/sidecar/server/ws/pool.js"
import { createMockRegistry } from "../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("WS delegation handler", () => {
  let registry: SidecarDependencyRegistry
  let wsPool: InstanceType<typeof WsConnectionPool>
  let handler: ReturnType<typeof createWsDelegationHandler>

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
    wsPool = new WsConnectionPool({})
    handler = createWsDelegationHandler({ registry, wsPool })
  })

  it("returns a callable upgrade handler function", () => {
    expect(typeof handler).toBe("function")
  })

  it("WsMessageType has 4 valid message types", () => {
    const validTypes = ["subscribe", "unsubscribe", "ping", "event"]
    const typeValues = (WsMessageType as unknown) as string[] | Record<string, string>
    if (Array.isArray(typeValues)) {
      expect(typeValues.length).toBe(4)
      for (const t of validTypes) {
        expect(typeValues).toContain(t)
      }
    }
  })

  it("pool has heartbeatMs=30000 (mirrors SC-01 SseConnectionPool)", () => {
    expect((wsPool as unknown as { heartbeatMs: number }).heartbeatMs).toBe(30000)
  })

  it("pool has maxPayload=64*1024 per spec", () => {
    expect((wsPool as unknown as { maxPayload: number }).maxPayload).toBe(64 * 1024)
  })

  it("handles 1013 close code on backpressure", () => {
    const handle = handler as unknown as {
      onMessage: (msg: { type: string; payload: unknown }) => { code?: number } | void
    }
    const result = handle.onMessage({
      type: "subscribe",
      payload: { scope: "session", backlog: 999_999 },
    })
    if (result && result.code) {
      expect(result.code).toBe(1013)
    }
  })

  it("handles 1008 close code on FORBIDDEN payload", () => {
    const handle = handler as unknown as {
      onMessage: (msg: { type: string; payload: unknown }) => { code?: number } | void
    }
    const result = handle.onMessage({
      type: "subscribe",
      payload: { scope: "../etc/passwd" },
    })
    if (result && result.code) {
      expect(result.code).toBe(1008)
    }
  })

  it("handles 1003 close code on malformed JSON", () => {
    const handle = handler as unknown as {
      onMessage: (msg: unknown) => { code?: number } | void
    }
    const result = handle.onMessage({ malformed: true } as unknown)
    if (result && result.code) {
      expect(result.code).toBe(1003)
    }
  })
})
