import { describe, it, expect, vi } from "vitest"

function mockClient() {
  return {
    session: {
      create: vi.fn(),
      get: vi.fn(),
      abort: vi.fn(),
      messages: vi.fn(),
      prompt: vi.fn(),
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
      expect(result).toEqual({ id: "s1", title: "test" })
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
      const result = await getSession(client, "s1")

      expect(client.session.get).toHaveBeenCalledWith({ path: { id: "s1" } })
      expect(result).toEqual({ id: "s1" })
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
      const result = await getSessionMessages(client, "s1")

      expect(client.session.messages).toHaveBeenCalledWith({ path: { id: "s1" } })
      expect(result).toEqual([])
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

    it("returns empty array when response is not an array", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: "not-an-array" })

      const { getSessionMessages } = await import("../../src/lib/session-api.js")
      const result = await getSessionMessages(client, "s1")

      expect(result).toEqual([])
    })
  })

  describe("sendPrompt", () => {
    it("calls client.session.prompt with correct shape", async () => {
      const client = mockClient()
      client.session.prompt.mockResolvedValue({ data: { info: {}, parts: [] } })
      client.session.messages.mockResolvedValue({ data: [] })

      const { sendPrompt } = await import("../../src/lib/session-api.js")
      await sendPrompt(client, "s1", {
        parts: [{ type: "text", text: "hello" }],
      })

      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "s1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
        },
        parseAs: "text",
      })
    })

    it("returns unwrapped data from prompt response", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [] })
      client.session.prompt.mockResolvedValue({ data: { info: { id: "msg-1" }, parts: [] } })

      const { sendPrompt } = await import("../../src/lib/session-api.js")
      const result = await sendPrompt(client, "s1", { parts: [] })

      expect(result).toEqual({ info: { id: "msg-1" }, parts: [] })
    })

    it("recovers from empty-body prompt responses by reading the resulting assistant message", async () => {
      const client = mockClient()
      client.session.prompt.mockResolvedValue({ data: "" })
      client.session.messages
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({
          data: [
            { info: { role: "assistant", id: "msg-2" }, parts: [{ type: "text", text: "OK" }] },
          ],
        })

      const { sendPrompt } = await import("../../src/lib/session-api.js")
      const result = await sendPrompt(client, "s1", { parts: [{ type: "text", text: "hello" }] })

      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "s1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
        },
        parseAs: "text",
      })
      expect(result).toEqual({
        info: { role: "assistant", id: "msg-2" },
        parts: [{ type: "text", text: "OK" }],
      })
    })
  })
})

describe("session-api helpers", () => {
  describe("getSessionID", () => {
    it("extracts id from plain object", async () => {
      const { getSessionID } = await import("../../src/lib/session-api.js")
      expect(getSessionID({ id: "s1" })).toBe("s1")
    })

    it("extracts sessionID from plain object", async () => {
      const { getSessionID } = await import("../../src/lib/session-api.js")
      expect(getSessionID({ sessionID: "s2" })).toBe("s2")
    })

    it("extracts from nested info.id", async () => {
      const { getSessionID } = await import("../../src/lib/session-api.js")
      expect(getSessionID({ info: { id: "s3" } })).toBe("s3")
    })

    it("extracts from nested info.sessionID", async () => {
      const { getSessionID } = await import("../../src/lib/session-api.js")
      expect(getSessionID({ info: { sessionID: "s4" } })).toBe("s4")
    })

    it("returns undefined for non-object input", async () => {
      const { getSessionID } = await import("../../src/lib/session-api.js")
      expect(getSessionID(null)).toBeUndefined()
      expect(getSessionID(undefined)).toBeUndefined()
      expect(getSessionID(42)).toBeUndefined()
    })

    it("prefers top-level id over nested info.id", async () => {
      const { getSessionID } = await import("../../src/lib/session-api.js")
      expect(getSessionID({ id: "top", info: { id: "nested" } })).toBe("top")
    })
  })

  describe("getParentID", () => {
    it("extracts parentID from plain object", async () => {
      const { getParentID } = await import("../../src/lib/session-api.js")
      expect(getParentID({ parentID: "p1" })).toBe("p1")
    })

    it("extracts parentId (camelCase) from plain object", async () => {
      const { getParentID } = await import("../../src/lib/session-api.js")
      expect(getParentID({ parentId: "p2" })).toBe("p2")
    })

    it("extracts from nested info.parentID", async () => {
      const { getParentID } = await import("../../src/lib/session-api.js")
      expect(getParentID({ info: { parentID: "p3" } })).toBe("p3")
    })

    it("returns undefined when no parent fields exist", async () => {
      const { getParentID } = await import("../../src/lib/session-api.js")
      expect(getParentID({ id: "s1" })).toBeUndefined()
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

    it("falls back to top-level event.sessionID", async () => {
      const { getEventSessionID } = await import("../../src/lib/session-api.js")
      const event = { sessionID: "top-level" }
      expect(getEventSessionID(event)).toBe("top-level")
    })
  })

  describe("getEventParentID", () => {
    it("extracts parentID from properties.info", async () => {
      const { getEventParentID } = await import("../../src/lib/session-api.js")
      const event = { properties: { info: { parentID: "parent-1" } } }
      expect(getEventParentID(event)).toBe("parent-1")
    })

    it("returns undefined when no parent info exists", async () => {
      const { getEventParentID } = await import("../../src/lib/session-api.js")
      const event = { properties: { info: { id: "sess-1" } } }
      expect(getEventParentID(event)).toBeUndefined()
    })
  })

  describe("walkParentChain", () => {
    it("walks up parent chain", async () => {
      const client = mockClient()
      client.session.get.mockImplementation(({ path: { id } }: any) => {
        if (id === "child") return Promise.resolve({ data: { id: "child", parentID: "parent" } })
        if (id === "parent") return Promise.resolve({ data: { id: "parent" } })
        return Promise.reject(new Error("not found"))
      })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      const chain = await walkParentChain(client, "child")

      expect(chain).toHaveLength(2)
      expect(chain[0]).toEqual({ id: "child", parentID: "parent" })
      expect(chain[1]).toEqual({ id: "parent" })
    })

    it("returns single element for session without parent", async () => {
      const client = mockClient()
      client.session.get.mockResolvedValue({ data: { id: "root" } })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      const chain = await walkParentChain(client, "root")

      expect(chain).toHaveLength(1)
      expect(chain[0]).toEqual({ id: "root" })
    })

    it("detects cyclic chains", async () => {
      const client = mockClient()
      client.session.get.mockImplementation(({ path: { id } }: any) => {
        if (id === "a") return Promise.resolve({ data: { id: "a", parentID: "b" } })
        if (id === "b") return Promise.resolve({ data: { id: "b", parentID: "a" } })
        return Promise.reject(new Error("not found"))
      })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      await expect(walkParentChain(client, "a")).rejects.toThrow(/\[Harness\].*cyclic/)
    })
  })
})
