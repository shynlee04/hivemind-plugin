import { describe, expect, it, vi } from "vitest"

const buildDelegationQueueKey = vi.fn((args: unknown) => JSON.stringify(args))

vi.mock("../../../src/coordination/concurrency/queue.js", () => ({
  buildDelegationQueueKey,
}))

describe("resolveDelegationConcurrencyKey", () => {
  it("delegates the exact inputs to the canonical concurrency builder", async () => {
    const { resolveDelegationConcurrencyKey } = await import("../../../src/coordination/spawner/concurrency-key.js")

    const args = {
      provider: "openai",
      model: "gpt-5.4",
      agent: "builder",
      category: "implementation",
    }

    const result = resolveDelegationConcurrencyKey(args)

    expect(buildDelegationQueueKey).toHaveBeenCalledWith(args)
    expect(result).toBe(JSON.stringify(args))
  })

  it("never invents a second formatting policy for the spawner layer", async () => {
    buildDelegationQueueKey.mockReturnValueOnce("provider:openai:model:gpt-5.4")
    const { resolveDelegationConcurrencyKey } = await import("../../../src/coordination/spawner/concurrency-key.js")

    const result = resolveDelegationConcurrencyKey({
      provider: "openai",
      model: "gpt-5.4",
      agent: "builder",
      category: "implementation",
    })

    expect(result).toBe("provider:openai:model:gpt-5.4")
    expect(result).not.toBe("model:gpt-5.4:agent:builder:category:implementation")
  })
})
