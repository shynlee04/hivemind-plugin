import { describe, expect, it } from "vitest"
import { buildDelegationQueueKey } from "../../../../src/coordination/concurrency/queue.js"

describe("buildDelegationQueueKey — deprecated category removal", () => {
  it("ignores category when building agent-only keys", () => {
    // After cleanup, category should be ignored — only agent matters
    const keyWithCategory = buildDelegationQueueKey({ agent: "builder", category: "implementation" })
    const keyWithoutCategory = buildDelegationQueueKey({ agent: "builder" })

    // Both should produce the same key: category is deprecated
    expect(keyWithCategory).toBe(keyWithoutCategory)
    expect(keyWithCategory).toBe("agent:builder")
  })

  it("produces agent-only key when only agent is provided", () => {
    const key = buildDelegationQueueKey({ agent: "hm-l2-build" })
    expect(key).toBe("agent:hm-l2-build")
  })

  it("falls back to default when no dimensions are provided", () => {
    const key = buildDelegationQueueKey({})
    expect(key).toBe("default")
  })

  it("still supports provider+model dimension", () => {
    const key = buildDelegationQueueKey({ provider: "openai", model: "gpt-4" })
    expect(key).toBe("provider:openai:model:gpt-4")
  })

  it("still supports model-only dimension", () => {
    const key = buildDelegationQueueKey({ model: "claude-4" })
    expect(key).toBe("model:claude-4")
  })
})
