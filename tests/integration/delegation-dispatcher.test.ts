import { describe, it, expect, vi } from "vitest"
import { DelegationDispatcher } from "../../src/coordination/delegation/dispatcher.js"

describe("integration — delegation dispatcher", () => {
  it("creates DelegationDispatcher with agentResolver and slotManager", () => {
    const dispatcher = new DelegationDispatcher({
      agentResolver: { resolve: vi.fn() },
      slotManager: { acquire: vi.fn() },
    })
    expect(dispatcher).toBeInstanceOf(DelegationDispatcher)
  })

  it("preflightCheck calls slotManager.acquire and agentResolver.resolve", async () => {
    const acquire = vi.fn().mockResolvedValue({ release: vi.fn() })
    const resolve = vi.fn().mockResolvedValue({ name: "test-agent", tools: [] })
    const dispatcher = new DelegationDispatcher({
      agentResolver: { resolve },
      slotManager: { acquire },
    })

    const result = await dispatcher.preflightCheck({
      agent: "test-agent",
      currentDepth: 1,
      parentSessionId: "ses_parent",
      queueKey: "q_test",
    })

    expect(acquire).toHaveBeenCalledWith("ses_parent", "q_test", undefined)
    expect(result.validatedAgent.name).toBe("test-agent")
  })

  it("preflightCheck releases slot on agent resolution failure", async () => {
    const release = vi.fn()
    const acquire = vi.fn().mockResolvedValue({ release })
    const resolve = vi.fn().mockRejectedValue(new Error("unknown agent"))
    const dispatcher = new DelegationDispatcher({
      agentResolver: { resolve },
      slotManager: { acquire, release },
    })

    await expect(
      dispatcher.preflightCheck({
        agent: "unknown-agent",
        currentDepth: 1,
        parentSessionId: "ses_parent",
        queueKey: "q_unknown",
      }),
    ).rejects.toThrow("unknown agent")

    expect(release).toHaveBeenCalled()
  })
})
