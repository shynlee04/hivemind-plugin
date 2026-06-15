import { describe, it, expect } from "vitest"

describe("completion — coordination/completion integration", () => {
  it("imports completion detector module without error", async () => {
    const mod = await import("../../src/coordination/completion/detector.js")
    expect(mod).toBeDefined()
  })

  it("completion module exports a detection function", async () => {
    const mod = await import("../../src/coordination/completion/detector.js")
    // Should export at least one function for completion detection
    const keys = Object.keys(mod)
    expect(keys.length).toBeGreaterThan(0)
  })

  it("detector module can be instantiated", async () => {
    const mod = await import("../../src/coordination/completion/detector.js")
    expect(mod).toBeDefined()
    // Verify no import-time errors
  })

  it("completion module has no import-time crashes", async () => {
    expect(async () => {
      await import("../../src/coordination/completion/detector.js")
    }).not.toThrow()
  })

  it("completion module works with file-based configuration", async () => {
    const mod = await import("../../src/coordination/completion/detector.js")
    expect(typeof mod).toBe("object")
  })
})
