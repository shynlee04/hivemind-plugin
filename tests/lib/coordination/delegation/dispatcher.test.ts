import { vi } from "vitest"

import { DelegationDispatcher } from "../../../../src/coordination/delegation/dispatcher.js"

describe("DelegationDispatcher", () => {
  it("does not run removed category gate denial hooks during preflight", async () => {
    const recordCategoryGateask = vi.fn()
    const slotManager = { acquire: vi.fn() }
    const agentResolver = { resolve: vi.fn() }
    const dispatcher = new DelegationDispatcher({
      resolveCategoryGateDecision: () => ({
        allowed: false,
        reason: "unknown delegation category",
        category: "unsafe",
        audit: { gate: "category", askReason: "unknown delegation category" },
      }),
      recordCategoryGateask,
      slotManager,
      agentResolver,
    })

    await expect(dispatcher.preflightCheck({
      agent: "gsd-executor",
      category: "unsafe",
      currentDepth: 0,
      parentSessionId: "parent-1",
      queueKey: "agent:gsd-executor:category:unsafe",
      surface: "agent-delegation",
    })).resolves.toEqual({
      queueKey: "agent:gsd-executor:category:unsafe",
      slotHandle: undefined,
      validatedAgent: undefined,
    })

    expect(recordCategoryGateask).not.toHaveBeenCalled()
    expect(slotManager.acquire).toHaveBeenCalledWith("parent-1", "agent:gsd-executor:category:unsafe", undefined)
    expect(agentResolver.resolve).toHaveBeenCalledWith("gsd-executor")
  })

  it("continues to concurrency and agent validation when category gate allows", async () => {
    const slotHandle = { queueKey: "agent:gsd-executor", release: vi.fn(), sessionId: "parent-1" }
    const validatedAgent = { name: "gsd-executor", tools: { read: true } }
    const slotManager = { acquire: vi.fn().mockResolvedValue(slotHandle) }
    const agentResolver = { resolve: vi.fn().mockResolvedValue(validatedAgent) }
    const dispatcher = new DelegationDispatcher({
      resolveCategoryGateDecision: () => ({ allowed: true, reason: "allowed", audit: { gate: "category" } }),
      recordCategoryGateask: vi.fn(),
      slotManager,
      agentResolver,
    })

    await expect(dispatcher.preflightCheck({
      agent: "gsd-executor",
      category: "implementation",
      currentDepth: 1,
      parentSessionId: "parent-1",
      queueKey: "agent:gsd-executor:category:implementation",
      surface: "agent-delegation",
    })).resolves.toEqual({
      queueKey: "agent:gsd-executor:category:implementation",
      slotHandle,
      validatedAgent,
    })

    expect(slotManager.acquire).toHaveBeenCalledWith("parent-1", "agent:gsd-executor:category:implementation", undefined)
    expect(agentResolver.resolve).toHaveBeenCalledWith("gsd-executor")
  })

  it("rejects delegation at the configured maximum depth", async () => {
    const slotHandle = { queueKey: "agent:gsd-executor", release: vi.fn(), sessionId: "parent-1" }
    const dispatcher = new DelegationDispatcher({
      resolveCategoryGateDecision: () => ({ allowed: true, reason: "allowed", audit: { gate: "category" } }),
      recordCategoryGateask: vi.fn(),
      slotManager: { acquire: vi.fn().mockResolvedValue(slotHandle), release: vi.fn() },
      agentResolver: { resolve: vi.fn() },
    })

    await expect(dispatcher.preflightCheck({
      agent: "gsd-executor",
      currentDepth: 3,
      parentSessionId: "parent-1",
      queueKey: "agent:gsd-executor",
      surface: "agent-delegation",
    })).rejects.toThrow("[Hivemind] Max delegation depth (3) reached at current depth 3.")

    expect(slotHandle.release).toHaveBeenCalledOnce()
  })
})
