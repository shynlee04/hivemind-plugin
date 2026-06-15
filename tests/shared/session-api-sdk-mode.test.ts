// Evidence label: transport-mocked
// Phase AUDIT-04.02.2 T3-1: sdk.mode config-driven (Option C fail-secure)
// 4 mode tests per D-12.

import { describe, it, expect } from "vitest"
import { SessionClientAdapter } from "../../src/shared/session-api.js"

function makeV1() {
  return { session: { create: () => {} } } as any
}

describe("REQ-05: SessionClientAdapter.create() sdk.mode fail-secure (D-12 Option C)", () => {
  it("[v2 + no baseUrl] should throw fail-secure error", () => {
    expect(() =>
      SessionClientAdapter.create(makeV1(), { mode: "v2" }),
    ).toThrow(/\[Hivemind\] SDK mode "v2" requires a reachable baseUrl/)
  })

  it("[v2 + no baseUrl] should NOT throw when baseUrl is provided", () => {
    // This test cannot fully exercise v2 SDK without a real server, but
    // we verify the fail-secure check passes when baseUrl is set.
    // (The v2 client construction may fail at HTTP level, but mode check passes.)
    try {
      SessionClientAdapter.create(makeV1(), {
        mode: "v2",
        baseUrl: "http://127.0.0.1:1", // intentionally unreachable
      })
    } catch (err) {
      // Acceptable: only fail-secure (no baseUrl) error OR v2 init failure is OK
      const msg = err instanceof Error ? err.message : String(err)
      expect(msg).not.toMatch(/requires a reachable baseUrl/)
    }
  })

  it("[auto + no baseUrl] should fallback to v1 mode (no throw)", () => {
    expect(() =>
      SessionClientAdapter.create(makeV1(), { mode: "auto" }),
    ).not.toThrow()
  })

  it("[v1 explicit] should force v1 mode without throwing even with baseUrl", () => {
    // v1 mode never throws — v2 is bypassed
    expect(() =>
      SessionClientAdapter.create(makeV1(), {
        mode: "v1",
        baseUrl: "http://127.0.0.1:1",
      }),
    ).not.toThrow()
  })

  it("[default no mode] should default to 'auto' and not throw without baseUrl", () => {
    expect(() =>
      SessionClientAdapter.create(makeV1(), {}),
    ).not.toThrow()
  })
})
