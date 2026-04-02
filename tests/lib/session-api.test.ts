import { describe, it, expect, vi } from "vitest"

function mockClient() {
  return {
    session: {
      create: vi.fn(),
      get: vi.fn(),
      abort: vi.fn(),
      messages: vi.fn(),
      prompt: vi.fn(),
      promptAsync: vi.fn(),
      children: vi.fn(),
    },
  } as any
}

describe("session-api typed wrappers", () => {
  describe("createSession", () => {
    it("calls client.session.create with correct body shape", async () => {
      const client = mockClient()
      client.session.create.mockResolvedValue({ data: { id: "s1", title: "test" } })

      const { createSession } = await import("../../src/lib/session-api.js")
      const result = await createSession(client, {
        parentID: "parent-1",
        title: "builder: fix bug",
      })

      expect(client.session.create).toHaveBeenCalledWith({
        body: { parentID: "parent-1", title: "builder: fix bug" },
      })
    })

    it("passes directory as query param when provided", async () => {
      const client = mockClient()
      client.session.create.mockResolvedValue({ data: { id: "s2" } })

      const { createSession } = await import("../../src/lib/session-api.js")
      await createSession(client, { title: "test", directory: "/tmp" })

      expect(client.session.create).toHaveBeenCalledWith({
        body: { title: "test" },
        query: { directory: "/tmp" },
      })
    })
  })

  describe("getSession", () => {
    it("calls client.session.get with { path: { id } }", async () => {
      const client = mockClient()
      client.session.get.mockResolvedValue({ data: { id: "s1" } })

      const { getSession } = await import("../../src/lib/session-api.js")
      await getSession(client, "s1")

      expect(client.session.get).toHaveBeenCalledWith({ path: { id: "s1" } })
    })
  })

  describe("abortSession", () => {
    it("calls client.session.abort with { path: { id } }", async () => {
      const client = mockClient()
      client.session.abort.mockResolvedValue({ data: true })

      const { abortSession } = await import("../../src/lib/session-api.js")
      await abortSession(client, "s1")

      expect(client.session.abort).toHaveBeenCalledWith({ path: { id: "s1" } })
    })
  })

  describe("getSessionMessages", () => {
    it("calls client.session.messages with { path: { id } }", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [] })

      const { getSessionMessages } = await import("../../src/lib/session-api.js")
      await getSessionMessages(client, "s1")

      expect(client.session.messages).toHaveBeenCalledWith({ path: { id: "s1" } })
    })

    it("passes limit as query param", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [] })

      const { getSessionMessages } = await import("../../src/lib/session-api.js")
      await getSessionMessages(client, "s1", { limit: 5 })

      expect(client.session.messages).toHaveBeenCalledWith({
        path: { id: "s1" },
        query: { limit: 5 },
      })
    })
  })

  describe("sendPrompt", () => {
    it("calls client.session.prompt with correct shape", async () => {
      const client = mockClient()
      client.session.prompt.mockResolvedValue({ data: { info: {}, parts: [] } })

      const { sendPrompt } = await import("../../src/lib/session-api.js")
      await sendPrompt(client, "s1", {
        parts: [{ type: "text", text: "hello" }],
        agent: "builder",
      })

      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "s1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
          agent: "builder",
        },
      })
    })
  })

  describe("sendPromptAsync", () => {
    it("calls promptAsync when available", async () => {
      const client = mockClient()
      client.session.promptAsync.mockResolvedValue({ data: undefined })

      const { sendPromptAsync } = await import("../../src/lib/session-api.js")
      await sendPromptAsync(client, "s1", {
        parts: [{ type: "text", text: "async task" }],
      })

      expect(client.session.promptAsync).toHaveBeenCalled()
    })

    it("falls back to sendPrompt when promptAsync is missing", async () => {
      const client = mockClient()
      delete client.session.promptAsync
      client.session.prompt.mockResolvedValue({ data: {} })

      const { sendPromptAsync } = await import("../../src/lib/session-api.js")
      await sendPromptAsync(client, "s1", {
        parts: [{ type: "text", text: "fallback" }],
      })

      expect(client.session.prompt).toHaveBeenCalled()
    })
  })
})

describe("session-api helpers", () => {
  describe("extractAssistantText", () => {
    it("returns last assistant message text", async () => {
      const { extractAssistantText } = await import("../../src/lib/session-api.js")
      const messages = [
        { info: { role: "user" }, parts: [{ type: "text", text: "do thing" }] },
        { info: { role: "assistant" }, parts: [{ type: "text", text: "done" }] },
      ]

      expect(extractAssistantText(messages)).toBe("done")
    })

    it("returns empty string when no assistant messages", async () => {
      const { extractAssistantText } = await import("../../src/lib/session-api.js")
      expect(extractAssistantText([])).toBe("")
    })

    it("concatenates multiple text parts", async () => {
      const { extractAssistantText } = await import("../../src/lib/session-api.js")
      const messages = [
        { info: { role: "assistant" }, parts: [{ type: "text", text: "hello " }, { type: "text", text: "world" }] },
      ]

      expect(extractAssistantText(messages)).toBe("hello world")
    })
  })

  describe("getEventSessionID", () => {
    it("extracts from properties.info.id for lifecycle events", async () => {
      const { getEventSessionID } = await import("../../src/lib/session-api.js")
      const event = { properties: { info: { id: "sess-123" } } }
      expect(getEventSessionID(event)).toBe("sess-123")
    })

    it("extracts from properties.sessionID for status events", async () => {
      const { getEventSessionID } = await import("../../src/lib/session-api.js")
      const event = { properties: { sessionID: "sess-456" } }
      expect(getEventSessionID(event)).toBe("sess-456")
    })

    it("prefers properties.info.id over properties.sessionID", async () => {
      const { getEventSessionID } = await import("../../src/lib/session-api.js")
      const event = { properties: { info: { id: "from-info" }, sessionID: "from-session" } }
      expect(getEventSessionID(event)).toBe("from-info")
    })
  })

  describe("waitForAssistantText (tracker-based)", () => {
    it.skip("returns assistant text when tracker resolves idle — TODO: activate after session-api rewrite", async () => {
      const { SessionCompletionTracker } = await import("../../src/lib/session-completion-tracker.js")
      const { waitForAssistantText } = await import("../../src/lib/session-api.js")

      const tracker = new SessionCompletionTracker()
      const client = mockClient()
      client.session.messages.mockResolvedValue({
        data: [{ info: { role: "assistant" }, parts: [{ type: "text", text: "result text" }] }],
      })

      const resultPromise = waitForAssistantText(client, tracker, "sess-1", 5000)

      // Feed idle event to resolve the tracker
      tracker.feed("session.idle", "sess-1")

      const text = await resultPromise
      expect(text).toBe("result text")
    })

    it.skip("throws on error signal — TODO: activate after session-api rewrite", async () => {
      const { SessionCompletionTracker } = await import("../../src/lib/session-completion-tracker.js")
      const { waitForAssistantText } = await import("../../src/lib/session-api.js")

      const tracker = new SessionCompletionTracker()
      const client = mockClient()

      const resultPromise = waitForAssistantText(client, tracker, "sess-err", 5000)

      tracker.feed("session.error", "sess-err", "API rate limit")

      await expect(resultPromise).rejects.toThrow(/\[Harness\].*API rate limit/)
    })
  })

  describe("walkParentChain", () => {
    it("walks up parent chain", async () => {
      const client = mockClient()
      client.session.get.mockImplementation(({ path: { id } }) => {
        if (id === "child") return Promise.resolve({ data: { id: "child", parentID: "parent" } })
        if (id === "parent") return Promise.resolve({ data: { id: "parent" } })
        return Promise.reject(new Error("not found"))
      })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      const chain = await walkParentChain(client, "child")

      expect(chain).toHaveLength(2)
    })

    it("detects cyclic chains", async () => {
      const client = mockClient()
      client.session.get.mockImplementation(({ path: { id } }) => {
        if (id === "a") return Promise.resolve({ data: { id: "a", parentID: "b" } })
        if (id === "b") return Promise.resolve({ data: { id: "b", parentID: "a" } })
        return Promise.reject(new Error("not found"))
      })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      await expect(walkParentChain(client, "a")).rejects.toThrow(/\[Harness\].*cyclic/)
    })
  })
})
