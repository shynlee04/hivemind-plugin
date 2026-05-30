import { describe, it, expect } from "vitest"

describe("integration — continuity store", () => {
  it("imports continuity module without error", async () => {
    const mod = await import("../../src/task-management/continuity/index.js")
    expect(mod).toBeDefined()
    expect(typeof mod.getSessionContinuity).toBe("function")
    expect(typeof mod.recordSessionContinuity).toBe("function")
    expect(typeof mod.patchSessionContinuity).toBe("function")
  })

  it("imports delegation persistence module without error", async () => {
    const mod = await import("../../src/task-management/continuity/delegation-persistence.js")
    expect(mod).toBeDefined()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })

  it("imports store-cache without error", async () => {
    const mod = await import("../../src/task-management/continuity/store-cache.js")
    expect(mod).toBeDefined()
  })

  it("continuity module exports expected public API surface", async () => {
    const mod = await import("../../src/task-management/continuity/index.js")
    const expected = ["getSessionContinuity", "patchSessionContinuity", "recordSessionContinuity"]
    for (const name of expected) {
      expect(typeof (mod as Record<string, unknown>)[name]).toBe("function")
    }
  })
})
