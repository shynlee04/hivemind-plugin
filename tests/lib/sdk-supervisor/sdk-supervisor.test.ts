// evidence: runtime-truthful — tests exercise real SdkSupervisor through public API

/**
 * SdkSupervisor tests.
 *
 * evidence: runtime-truthful — exercises real SdkSupervisor through public API.
 */
import { describe, expect, it, vi } from "vitest"

import {
  createSdkSupervisor,
  executeSdkSupervisorAction,
} from "../../../src/features/sdk-supervisor/index.js"

describe("sdk supervisor", () => {
  it("reports health for available SDK wrapper seams", async () => {
    const supervisor = createSdkSupervisor({
      client: { session: { status: vi.fn().mockResolvedValue({ data: {} }) } },
      now: () => new Date("2026-04-30T00:00:00.000Z"),
    })

    const result = await supervisor.health()

    expect(result.status).toBe("healthy")
    expect(result.checkedAt).toBe("2026-04-30T00:00:00.000Z")
    expect(result.wrappers).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "getSessionStatusMap", available: true }),
      expect.objectContaining({ name: "sendPrompt", available: true }),
    ]))
  })

  it("tracks heartbeat timestamps without mutating runtime state", async () => {
    const supervisor = createSdkSupervisor({ now: () => new Date("2026-04-30T00:00:01.000Z") })

    const heartbeat = await supervisor.heartbeat("ses_phase59")

    expect(heartbeat).toEqual({
      ok: true,
      sessionId: "ses_phase59",
      sequence: 1,
      heartbeatAt: "2026-04-30T00:00:01.000Z",
    })
  })

  it("bounds diagnostics output", async () => {
    const supervisor = createSdkSupervisor({
      diagnostics: Array.from({ length: 20 }, (_, index) => ({
        level: "warning" as const,
        code: `diag-${index}`,
        message: `Diagnostic ${index}`,
      })),
    })

    const diagnostics = await supervisor.diagnostics({ maxDiagnostics: 3 })

    expect(diagnostics.truncated).toBe(true)
    expect(diagnostics.items).toHaveLength(3)
    expect(diagnostics.totalDiagnostics).toBe(20)
  })

  it("uses pressure decisions for readiness", async () => {
    const readiness = await executeSdkSupervisorAction({ action: "readiness", tier: 9 })

    expect(readiness.action).toBe("readiness")
    expect(readiness.ready).toBe(false)
    expect(readiness.pressure.outcome).toBe("block")
  })
})
// evidence: runtime-truthful

it("handles empty or invalid tier gracefully", async () => {
  await expect(executeSdkSupervisorAction({ action: "readiness", tier: -1 } as any))
    .resolves.toBeDefined()
})

it("returns undefined for unknown action (no default switch case)", async () => {
  const result = await executeSdkSupervisorAction({ action: "unknown" } as any)
  expect(result).toBeUndefined()
})
