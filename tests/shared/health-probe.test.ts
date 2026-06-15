// Evidence label: transport-mocked
// Phase AUDIT-04.02.4 REQ-02: Health probe implementation (D-37/D-38/D-39)
// 7 test cases per D-39: sidecar/server/refused/unknown/timeout/type-guard-ok/type-guard-sidecar

import { describe, it, expect, vi, afterEach } from "vitest"
import {
  probeHealth,
  isOpenCodeHealthResponse,
} from "../../src/shared/session-api.js"

interface MockResponse {
  status?: number
  body?: unknown
  throw?: Error
  delayMs?: number
}

function makeMockFetch(responses: MockResponse[]) {
  return vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const r = responses.shift()
      if (!r) {
        return Promise.reject(new Error("Unexpected fetch call"))
      }
      if (r.throw) {
        return Promise.reject(r.throw)
      }
      const promise = (async () => {
        if (r.delayMs) {
          // Respect the abort signal: reject with AbortError if signal aborts before delay
          const signal = init?.signal
          await new Promise<void>((resolve, reject) => {
            const timer = setTimeout(() => resolve(), r.delayMs)
            if (signal) {
              const onAbort = () => {
                clearTimeout(timer)
                const err = new Error("The operation was aborted")
                err.name = "AbortError"
                reject(err)
              }
              if (signal.aborted) {
                onAbort()
              } else {
                signal.addEventListener("abort", onAbort, { once: true })
              }
            }
          })
        }
        return new Response(JSON.stringify(r.body ?? {}), {
          status: r.status ?? 200,
        })
      })()
      return promise
    }) as unknown as typeof fetch)
}

describe("REQ-02: probeHealth() + isOpenCodeHealthResponse() per D-37/D-38", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("[1/7] [sidecar response] probeHealth() returns 'sidecar'", async () => {
    makeMockFetch([{ status: 200, body: { status: "ok", uptime: 456 } }])
    const result = await probeHealth("http://localhost:4106")
    expect(result).toBe("sidecar")
  })

  it("[2/7] [OpenCode server response] probeHealth() returns 'opencode-server'", async () => {
    makeMockFetch([{ status: 200, body: { healthy: true, version: "1.17.7" } }])
    const result = await probeHealth("http://localhost:14096")
    expect(result).toBe("opencode-server")
  })

  it("[3/7] [connection refused] probeHealth() returns 'unreachable'", async () => {
    makeMockFetch([{ throw: new TypeError("fetch failed") }])
    const result = await probeHealth("http://localhost:1")
    expect(result).toBe("unreachable")
  })

  it("[4/7] [unknown response shape] probeHealth() returns 'sidecar' (fail-secure per D-38)", async () => {
    makeMockFetch([{ status: 200, body: { ok: true } }])
    const result = await probeHealth("http://localhost:14096")
    expect(result).toBe("sidecar")
  })

  it("[5/7] [timeout > 2000ms] probeHealth() returns 'unreachable'", async () => {
    makeMockFetch([{ delayMs: 3000 }])
    const result = await probeHealth("http://localhost:14096")
    expect(result).toBe("unreachable")
  }, 10_000)

  it("[6/7] isOpenCodeHealthResponse({healthy:true, version:'1.17.7'}) returns true", () => {
    expect(isOpenCodeHealthResponse({ healthy: true, version: "1.17.7" })).toBe(true)
  })

  it("[7/7] isOpenCodeHealthResponse({status:'ok', uptime:456}) returns false", () => {
    expect(isOpenCodeHealthResponse({ status: "ok", uptime: 456 })).toBe(false)
  })
})
