import { describe, it, expect, vi } from "vitest"

describe("LIF-006: SSE-based completion detection", () => {
  it("waitForSessionCompletionViaSSE resolves on idle status event", async () => {
    const { waitForSessionCompletionViaSSE } = await import(
      "../../src/lib/session-api.js"
    )

    const mockUnsubscribe = vi.fn()
    const mockSubscribe = vi.fn().mockImplementation((handler: any) => {
      setTimeout(() => {
        handler({
          type: "session.updated",
          properties: {
            sessionID: "session-sse-test",
          },
          data: {
            session: {
              id: "session-sse-test",
              status: { type: "idle" },
            },
          },
        })
      }, 10)
      return { unsubscribe: mockUnsubscribe }
    })

    const client = {
      event: { subscribe: mockSubscribe },
    }

    const result = await waitForSessionCompletionViaSSE(
      client,
      "session-sse-test",
      5000
    )

    expect(mockSubscribe).toHaveBeenCalled()
    expect(result.completionSignal).toBe("sse:idle")
  })

  it("waitForSessionCompletionViaSSE resolves on session.deleted event", async () => {
    const { waitForSessionCompletionViaSSE } = await import(
      "../../src/lib/session-api.js"
    )

    const mockUnsubscribe = vi.fn()
    const mockSubscribe = vi.fn().mockImplementation((handler: any) => {
      setTimeout(() => {
        handler({
          type: "session.deleted",
          properties: {
            sessionID: "session-del-test",
          },
        })
      }, 10)
      return { unsubscribe: mockUnsubscribe }
    })

    const client = {
      event: { subscribe: mockSubscribe },
    }

    const result = await waitForSessionCompletionViaSSE(
      client,
      "session-del-test",
      5000
    )

    expect(result.completionSignal).toBe("sse:deleted")
  })

  it("waitForSessionCompletionViaSSE ignores events for other sessions", async () => {
    const { waitForSessionCompletionViaSSE } = await import(
      "../../src/lib/session-api.js"
    )

    const mockUnsubscribe = vi.fn()
    let callCount = 0
    const mockSubscribe = vi.fn().mockImplementation((handler: any) => {
      setTimeout(() => {
        handler({
          type: "session.updated",
          properties: {
            sessionID: "other-session",
          },
          data: {
            session: {
              id: "other-session",
              status: { type: "idle" },
            },
          },
        })
      }, 10)
      return { unsubscribe: mockUnsubscribe }
    })

    const client = {
      event: { subscribe: mockSubscribe },
    }

    await expect(
      waitForSessionCompletionViaSSE(client, "target-session", 200)
    ).rejects.toThrow(/timed out/)
  })

  it("waitForSessionCompletionViaSSE rejects when SSE is unavailable", async () => {
    const { waitForSessionCompletionViaSSE } = await import(
      "../../src/lib/session-api.js"
    )

    const client = {
      event: {},
    }

    await expect(
      waitForSessionCompletionViaSSE(client, "session-no-sse", 500)
    ).rejects.toThrow()
  })

  it("waitForSessionCompletionWithFallback tries SSE then polling", async () => {
    const { waitForSessionCompletionWithFallback } = await import(
      "../../src/lib/session-api.js"
    )

    const client = {
      session: {
        get: vi.fn().mockResolvedValue({
          data: { id: "session-fallback", status: { type: "idle" } },
        }),
        messages: vi.fn().mockResolvedValue({ data: [] }),
      },
      event: {
        subscribe: vi.fn().mockImplementation(() => {
          throw new Error("SSE broken")
        }),
      },
    }

    const result = await waitForSessionCompletionWithFallback(
      client,
      "session-fallback",
      100,
      2000
    )

    expect(result).toBeDefined()
    expect(result.completionSignal).toBeDefined()
  })
})
