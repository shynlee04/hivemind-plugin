import { describe, it, expect } from "vitest"

describe("integration — delegation tools", () => {
  it("imports delegate-task tool without error", async () => {
    const mod = await import("../../src/tools/delegation/delegate-task.js")
    expect(mod).toBeDefined()
  })

  it("imports delegation-status tool without error", async () => {
    const mod = await import("../../src/tools/delegation/delegation-status.js")
    expect(mod).toBeDefined()
  })

  it("imports delegation types without error", async () => {
    const mod = await import("../../src/tools/delegation/types.js")
    expect(mod).toBeDefined()
  })

  it("imports delegation readers — legacy-reader without error", async () => {
    const mod = await import("../../src/tools/delegation/readers/legacy-reader.js")
    expect(mod).toBeDefined()
  })

  it("imports session-tracker-reader without error", async () => {
    const mod = await import("../../src/tools/delegation/readers/session-tracker-reader.js")
    expect(mod).toBeDefined()
  })

  it("imports reader types without error", async () => {
    const mod = await import("../../src/tools/delegation/readers/types.js")
    expect(mod).toBeDefined()
  })

  it("delegate-task exports schema and handler", async () => {
    const mod = await import("../../src/tools/delegation/delegate-task.js")
    expect(typeof mod).toBe("object")
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
