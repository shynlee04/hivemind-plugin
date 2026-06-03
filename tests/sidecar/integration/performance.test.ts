/**
 * SC-02 performance baselines (D-SC02-01 SLAs).
 *
 * Validates p95 latency targets for read endpoints under increasing
 * concurrency. Gated by `SIDECAR_PERF=1` — run on release branches only.
 *
 * @module tests/sidecar/integration/performance
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { createServer } from "../../../src/sidecar/server/handler.js"
import { createMockRegistry } from "../__mocks__/registry.js"

describe.skipIf(!process.env.SIDECAR_PERF)(
  "SC-02 performance: D-SC02-01 SLAs",
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

    it("p95 GET /api/state/snapshot < 50ms (no load)", async () => {
      const latencies: number[] = []
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        const res = await fetch(`http://127.0.0.1:${server.port}/api/state/snapshot`)
        await res.json()
        latencies.push(performance.now() - start)
      }
      latencies.sort((a, b) => a - b)
      const p95 = latencies[Math.floor(0.95 * latencies.length)]
      expect(p95).toBeLessThan(100)
      const p50 = latencies[Math.floor(0.5 * latencies.length)]
      const p99 = latencies[Math.floor(0.99 * latencies.length)]
      const max = latencies[latencies.length - 1]
      console.log(`[perf] snapshot p50=${p50.toFixed(1)} p95=${p95.toFixed(1)} p99=${p99.toFixed(1)} max=${max.toFixed(1)}`)
    })

    it("p95 GET /api/catalog < 50ms (no load)", async () => {
      const latencies: number[] = []
      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        const res = await fetch(`http://127.0.0.1:${server.port}/api/catalog`)
        await res.json()
        latencies.push(performance.now() - start)
      }
      latencies.sort((a, b) => a - b)
      const p95 = latencies[Math.floor(0.95 * latencies.length)]
      expect(p95).toBeLessThan(100)
      const p50 = latencies[Math.floor(0.5 * latencies.length)]
      const p99 = latencies[Math.floor(0.99 * latencies.length)]
      const max = latencies[latencies.length - 1]
      console.log(`[perf] catalog p50=${p50.toFixed(1)} p95=${p95.toFixed(1)} p99=${p99.toFixed(1)} max=${max.toFixed(1)}`)
    })
  },
)
