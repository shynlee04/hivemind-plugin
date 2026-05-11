import { describe, it, expect } from "vitest"
import type { HookDependencies } from "../../src/hooks/types.js"

// ===========================================================================
// HookDependencies — isMainSession (BOOT-09-01-T2)
// ===========================================================================

describe("HookDependencies — isMainSession", () => {
  it("includes isMainSession optional function type", () => {
    const deps: HookDependencies = {
      lifecycleManager: {} as any,
      client: {} as any,
      stateManager: {} as any,
      isMainSession: (sessionId: string) => sessionId === "main",
    }

    // Runtime checks (work in both RED and GREEN since we set the property)
    expect(deps.isMainSession).toBeTypeOf("function")
    expect(deps.isMainSession!("main")).toBe(true)
    expect(deps.isMainSession!("child-session")).toBe(false)
  })
})
