import { describe, it, expect } from "vitest"

describe("integration — completion notification handler", () => {
  it("imports notification-handler module without error", async () => {
    const mod = await import("../../src/coordination/completion/notification-handler.js")
    expect(mod).toBeDefined()
  })

  it("exports buildNotificationMessage function", async () => {
    const mod = await import("../../src/coordination/completion/notification-handler.js")
    expect(typeof mod.buildNotificationMessage).toBe("function")
  })

  it("exports formatToastMessage helper", async () => {
    const mod = await import("../../src/coordination/completion/notification-handler.js")
    expect(typeof mod.formatToastMessage).toBe("function")
  })

  it("buildNotificationMessage returns a string for completed task", async () => {
    const mod = await import("../../src/coordination/completion/notification-handler.js")
    const result = mod.buildNotificationMessage({
      id: "task_001",
      parentSessionId: "ses_parent",
      childSessionId: "ses_child",
      status: "completed",
      delegationId: "del_001",
      agent: "test-agent",
      prompt: "do work",
      createdAt: Date.now(),
    })
    expect(typeof result).toBe("string")
  })

  it("exports notifyDelegationTerminal function", async () => {
    const mod = await import("../../src/coordination/completion/notification-handler.js")
    expect(typeof mod.notifyDelegationTerminal).toBe("function")
  })

  it("exports reactivateSessionStream function", async () => {
    const mod = await import("../../src/coordination/completion/notification-handler.js")
    expect(typeof mod.reactivateSessionStream).toBe("function")
  })

  it("exports replayPendingNotifications function", async () => {
    const mod = await import("../../src/coordination/completion/notification-handler.js")
    expect(typeof mod.replayPendingNotifications).toBe("function")
  })
})
