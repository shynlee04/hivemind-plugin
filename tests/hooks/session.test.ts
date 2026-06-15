import { describe, it, expect, vi } from "vitest"
import { createSessionEntryConsumer } from "../../src/hooks/observers/session-entry-consumer.js"
import { createSessionMainConsumer } from "../../src/hooks/observers/session-main-consumer.js"
import type { SessionEntryEventFact } from "../../src/hooks/observers/event-observers.js"

describe("session — session-entry-consumer", () => {
  it("creates a handler function", () => {
    const observer = vi.fn().mockResolvedValue({ kind: "ignored" } satisfies SessionEntryEventFact)
    const handler = createSessionEntryConsumer(observer)
    expect(handler).toBeInstanceOf(Function)
  })

  it("forwards events to the observer", async () => {
    const observer = vi.fn().mockResolvedValue({ kind: "ignored" } satisfies SessionEntryEventFact)
    const handler = createSessionEntryConsumer(observer)

    await handler({ event: { type: "session.created", sessionID: "ses_001" } })

    expect(observer).toHaveBeenCalledWith({ event: { type: "session.created", sessionID: "ses_001" } })
  })

  it("does not throw when observer throws (best-effort)", async () => {
    const observer = vi.fn().mockRejectedValue(new Error("observer failed"))
    const handler = createSessionEntryConsumer(observer)

    await expect(
      handler({ event: { type: "session.created", sessionID: "ses_002" } }),
    ).resolves.toBeUndefined()
  })

  it("handles empty event gracefully", async () => {
    const observer = vi.fn().mockResolvedValue({ kind: "ignored" } satisfies SessionEntryEventFact)
    const handler = createSessionEntryConsumer(observer)

    await expect(handler({ event: {} })).resolves.toBeUndefined()
  })

  it("handles undefined event gracefully", async () => {
    const observer = vi.fn().mockResolvedValue({ kind: "ignored" } satisfies SessionEntryEventFact)
    const handler = createSessionEntryConsumer(observer)

    await expect(handler({})).resolves.toBeUndefined()
  })
})

describe("session — session-main-consumer", () => {
  it("creates a handler function", () => {
    const observer = vi.fn().mockResolvedValue(undefined)
    const handler = createSessionMainConsumer(observer)
    expect(handler).toBeInstanceOf(Function)
  })

  it("forwards events to the observer", async () => {
    const observer = vi.fn().mockResolvedValue(undefined)
    const handler = createSessionMainConsumer(observer)

    await handler({ event: { type: "session.created", sessionID: "ses_main_001" } })

    expect(observer).toHaveBeenCalledWith({ event: { type: "session.created", sessionID: "ses_main_001" } })
  })

  it("does not throw when observer throws (best-effort)", async () => {
    const observer = vi.fn().mockRejectedValue(new Error("main observer failed"))
    const handler = createSessionMainConsumer(observer)

    await expect(
      handler({ event: { type: "session.created", sessionID: "ses_main_002" } }),
    ).resolves.toBeUndefined()
  })

  it("handles empty event gracefully", async () => {
    const observer = vi.fn().mockResolvedValue(undefined)
    const handler = createSessionMainConsumer(observer)

    await expect(handler({ event: {} })).resolves.toBeUndefined()
  })

  it("handles undefined event gracefully", async () => {
    const observer = vi.fn().mockResolvedValue(undefined)
    const handler = createSessionMainConsumer(observer)

    await expect(handler({})).resolves.toBeUndefined()
  })
})
