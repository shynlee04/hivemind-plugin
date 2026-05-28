import { describe, it, expect, vi } from "vitest"
import { createDelegationConsumer } from "../../src/hooks/observers/delegation-consumer.js"
import type { DelegationConsumerDeps } from "../../src/hooks/observers/delegation-consumer.js"

describe("delegation — delegation-consumer", () => {
  it("deliberately fails — RED phase placeholder", () => {
    const deps: DelegationConsumerDeps = {
      observer: vi.fn(),
      handleSessionIdle: vi.fn(),
      handleSessionDeleted: vi.fn(),
    }
    const handler = createDelegationConsumer(deps)
    expect(handler).toBeDefined()
    // Deliberately failing assertion
    expect(false).toBe(true)
  })
})
