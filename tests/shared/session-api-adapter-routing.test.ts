// Evidence label: transport-mocked
// Phase AUDIT-04.02.4 REQ-03/REQ-04: SessionClientAdapter routing behavior
// T-15: sidecar/refused → adapter.v2 === null → all methods route to v1
// T-16: server detected → adapter.v2 !== null → all methods route to v2
// T-11: mode=v1 explicit → no probe issued

import { describe, it, expect, vi, afterEach } from "vitest"
import { SessionClientAdapter } from "../../src/shared/session-api.js"
import type { HealthProbeResult } from "../../src/shared/session-api.js"

function makeV1Stub() {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "v1_session" } }),
      get: vi.fn().mockResolvedValue({ data: { id: "v1_session" } }),
      abort: vi.fn().mockResolvedValue({ data: { ok: true } }),
      messages: vi.fn().mockResolvedValue({ data: [] }),
      prompt: vi.fn().mockResolvedValue({ data: { ok: true } }),
      promptAsync: vi.fn().mockResolvedValue(undefined),
    },
  }
}

describe("REQ-03/REQ-04: SessionClientAdapter routing after probe", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("[sidecar probe] adapter.v2 === null (auto-degrade to v1)", () => {
    const v1Stub = makeV1Stub()
    const adapter = SessionClientAdapter.create(v1Stub as never, {
      mode: "auto",
      baseUrl: "http://localhost:4106",
      probeResult: "sidecar" as HealthProbeResult,
    })
    expect((adapter as unknown as { v2: unknown }).v2).toBeNull()
  })

  it("[server probe] adapter.v2 !== null (auto-activate v2)", () => {
    const v1Stub = makeV1Stub()
    const adapter = SessionClientAdapter.create(v1Stub as never, {
      mode: "auto",
      baseUrl: "http://localhost:14096",
      probeResult: "opencode-server" as HealthProbeResult,
    })
    expect((adapter as unknown as { v2: unknown }).v2).not.toBeNull()
  })

  it("[refused probe] adapter.v2 === null (force v1)", () => {
    const v1Stub = makeV1Stub()
    const adapter = SessionClientAdapter.create(v1Stub as never, {
      mode: "auto",
      baseUrl: "http://localhost:1",
      probeResult: "unreachable" as HealthProbeResult,
    })
    expect((adapter as unknown as { v2: unknown }).v2).toBeNull()
  })

  it("[mode=v1 explicit + baseUrl] adapter.v2 === null (no probe)", () => {
    const v1Stub = makeV1Stub()
    const adapter = SessionClientAdapter.create(v1Stub as never, {
      mode: "v1",
      baseUrl: "http://localhost:14096",
    })
    expect((adapter as unknown as { v2: unknown }).v2).toBeNull()
  })
})
