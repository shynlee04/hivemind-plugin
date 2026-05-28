import { describe, it, expect } from "vitest"

describe("integration — session tracker persistence", () => {
  it("imports child-writer module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/child-writer.js")
    expect(mod).toBeDefined()
  })

  it("imports hierarchy-index module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/hierarchy-index.js")
    expect(mod).toBeDefined()
  })

  it("imports hierarchy-manifest module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/hierarchy-manifest.js")
    expect(mod).toBeDefined()
  })

  it("imports retry-queue module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/retry-queue.js")
    expect(mod).toBeDefined()
  })

  it("imports session-writer module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/session-writer.js")
    expect(mod).toBeDefined()
  })

  it("imports project-index-writer module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/project-index-writer.js")
    expect(mod).toBeDefined()
  })

  it("imports session-index-writer module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/session-index-writer.js")
    expect(mod).toBeDefined()
  })

  it("imports atomic-write module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/atomic-write.js")
    expect(mod).toBeDefined()
  })

  it("imports orphan-quarantine module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/orphan-quarantine.js")
    expect(mod).toBeDefined()
  })

  it("imports pending-dispatch-registry module", async () => {
    const mod = await import("../../src/features/session-tracker/persistence/pending-dispatch-registry.js")
    expect(mod).toBeDefined()
  })
})
