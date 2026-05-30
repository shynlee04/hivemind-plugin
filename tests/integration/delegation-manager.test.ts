import { describe, it, expect, vi } from "vitest"
import { DelegationManager } from "../../src/coordination/delegation/manager.js"

describe("integration — delegation manager", () => {
  it("creates DelegationManager without client when v2 modules are injected", () => {
    const coordinator = {
      chain: vi.fn(),
      dispatch: vi.fn(),
    }
    const lifecycle = {
      getChildSessionId: vi.fn(),
      getStatus: vi.fn(),
      list: vi.fn(),
      markAborted: vi.fn(() => ({ id: "test", status: "cancelled" as const })),
      markCancelled: vi.fn(() => ({ id: "test", status: "cancelled" as const })),
    }
    const mgr = new DelegationManager(undefined as never, { coordinator, lifecycle })
    expect(mgr).toBeInstanceOf(DelegationManager)
  })

  it("throws when no client and no v2 modules are injected", () => {
    expect(() => new DelegationManager()).toThrow("[Harness]")
  })

  it("dispatches through coordinator when available", async () => {
    const dispatch = vi.fn().mockResolvedValue({ id: "del_001", status: "dispatched" })
    const coordinator = { chain: vi.fn(), dispatch }
    const lifecycle = {
      getChildSessionId: vi.fn(),
      getStatus: vi.fn(),
      list: vi.fn(),
      markAborted: vi.fn(() => ({ id: "test", status: "cancelled" as const })),
      markCancelled: vi.fn(() => ({ id: "test", status: "cancelled" as const })),
    }
    const mgr = new DelegationManager(undefined as never, { coordinator, lifecycle })
    const result = await mgr.dispatch({ agent: "test-agent", prompt: "do work" } as never)
    expect(dispatch).toHaveBeenCalled()
    expect(result.status).toBe("dispatched")
  })
})
