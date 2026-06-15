import { describe, it, expect } from "vitest"

describe("integration — session tracker lifecycle", () => {
  it("imports session-tracker index without error", async () => {
    const mod = await import("../../src/features/session-tracker/index.js")
    expect(mod).toBeDefined()
    expect(typeof mod).toBe("object")
  }, 15000)

  it("imports session-tracker bootstrap module", async () => {
    const mod = await import("../../src/features/session-tracker/bootstrap.js")
    expect(mod).toBeDefined()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })

  it("imports session-tracker classification module", async () => {
    const mod = await import("../../src/features/session-tracker/classification.js")
    expect(mod).toBeDefined()
  })

  it("imports child-recorder module", async () => {
    const mod = await import("../../src/features/session-tracker/child-recorder.js")
    expect(mod).toBeDefined()
  })

  it("imports tool-delegation module", async () => {
    const mod = await import("../../src/features/session-tracker/tool-delegation.js")
    expect(mod).toBeDefined()
  })

  it("imports capture submodule index", async () => {
    const mod = await import("../../src/features/session-tracker/capture/event-capture.js")
    expect(mod).toBeDefined()
  })

  it("imports child-backfiller module", async () => {
    const mod = await import("../../src/features/session-tracker/capture/child-backfiller.js")
    expect(mod).toBeDefined()
  })

  it("imports message-capture module", async () => {
    const mod = await import("../../src/features/session-tracker/capture/message-capture.js")
    expect(mod).toBeDefined()
  })

  it("imports tool-capture module", async () => {
    const mod = await import("../../src/features/session-tracker/capture/tool-capture.js")
    expect(mod).toBeDefined()
  })

  it("imports last-message-capture module", async () => {
    const mod = await import("../../src/features/session-tracker/capture/last-message-capture.js")
    expect(mod).toBeDefined()
  })
})
