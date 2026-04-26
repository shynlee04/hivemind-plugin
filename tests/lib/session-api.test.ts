import { describe, it, expect, vi } from "vitest"

function mockClient() {
  return {
    session: {
      create: vi.fn(),
      get: vi.fn(),
      status: vi.fn(),
      abort: vi.fn(),
      messages: vi.fn(),
      prompt: vi.fn(),
      promptAsync: vi.fn(),
    },
  } as any
}

describe("session-api typed wrappers", () => {
  describe("createSession", () => {
    it("calls client.session.create with correct body shape", async () => {
      const client = mockClient()
      client.session.create.mockResolvedValue({ data: { id: "ses_1", title: "test" } })

      const { createSession } = await import("../../src/lib/session-api.js")
      const result = await createSession(client, {
        parentID: "ses_parent_1",
        title: "builder: fix bug",
      })

      expect(client.session.create).toHaveBeenCalledWith({
        body: { parentID: "ses_parent_1", title: "builder: fix bug" },
      })
      expect(result).toEqual({ id: "ses_1", title: "test" })
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

    it("does not forward unsupported permission fields to session.create", async () => {
      const client = mockClient()
      client.session.create.mockResolvedValue({ data: { id: "s3" } })

      const { createSession } = await import("../../src/lib/session-api.js")
      await createSession(client, {
        title: "test",
      })

      expect(client.session.create).toHaveBeenCalledWith({
        body: { title: "test" },
      })
    })

    it("rejects invalid parent session IDs before calling the SDK", async () => {
      const client = mockClient()

      const { createSession } = await import("../../src/lib/session-api.js")

      await expect(createSession(client, { title: "test", parentID: "   " })).rejects.toThrow(
        "[Harness] Invalid parent session ID '   '. Expected an OpenCode session ID starting with 'ses'.",
      )

      expect(client.session.create).not.toHaveBeenCalled()
    })
  })

  describe("getSession", () => {
    it("calls client.session.get with { path: { id } }", async () => {
      const client = mockClient()
      client.session.get.mockResolvedValue({ data: { id: "ses_1" } })

      const { getSession } = await import("../../src/lib/session-api.js")
      const result = await getSession(client, "ses_1")

      expect(client.session.get).toHaveBeenCalledWith({ path: { id: "ses_1" } })
      expect(result).toEqual({ id: "ses_1" })
    })

    it("rejects invalid session IDs before calling the SDK", async () => {
      const client = mockClient()

      const { getSession } = await import("../../src/lib/session-api.js")

      await expect(getSession(client, "not-a-session")).rejects.toThrow(
        "[Harness] Invalid session ID 'not-a-session'. Expected an OpenCode session ID starting with 'ses'.",
      )

      expect(client.session.get).not.toHaveBeenCalled()
    })
  })

  describe("abortSession", () => {
    it("calls client.session.abort with { path: { id } }", async () => {
      const client = mockClient()
      client.session.abort.mockResolvedValue({ data: true })

      const { abortSession } = await import("../../src/lib/session-api.js")
      await abortSession(client, "ses_1")

      expect(client.session.abort).toHaveBeenCalledWith({ path: { id: "ses_1" } })
    })

    it("rejects invalid session IDs before calling the SDK", async () => {
      const client = mockClient()

      const { abortSession } = await import("../../src/lib/session-api.js")

      await expect(abortSession(client, "bad-session")).rejects.toThrow(
        "[Harness] Invalid session ID 'bad-session'. Expected an OpenCode session ID starting with 'ses'.",
      )

      expect(client.session.abort).not.toHaveBeenCalled()
    })
  })

  describe("getSessionMessages", () => {
    it("calls client.session.messages with { path: { id } }", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [] })

      const { getSessionMessages } = await import("../../src/lib/session-api.js")
      const result = await getSessionMessages(client, "ses_1")

      expect(client.session.messages).toHaveBeenCalledWith({ path: { id: "ses_1" } })
      expect(result).toEqual([])
    })

    it("passes limit as query param", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [] })

      const { getSessionMessages } = await import("../../src/lib/session-api.js")
      await getSessionMessages(client, "ses_1", { limit: 5 })

      expect(client.session.messages).toHaveBeenCalledWith({
        path: { id: "ses_1" },
        query: { limit: 5 },
      })
    })

    it("returns empty array when response is not an array", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: "not-an-array" })

      const { getSessionMessages } = await import("../../src/lib/session-api.js")
      const result = await getSessionMessages(client, "ses_1")

      expect(result).toEqual([])
    })

    it("rejects blank session IDs before calling the SDK", async () => {
      const client = mockClient()

      const { getSessionMessages } = await import("../../src/lib/session-api.js")

      await expect(getSessionMessages(client, "   ")).rejects.toThrow(
        "[Harness] Invalid session ID '   '. Expected an OpenCode session ID starting with 'ses'.",
      )

      expect(client.session.messages).not.toHaveBeenCalled()
    })
  })

  describe("getSessionMessageCount", () => {
    it("returns the current child-session message count through the SDK wrapper", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [{ id: "m1" }, { id: "m2" }] })

      const { getSessionMessageCount } = await import("../../src/lib/session-api.js")
      const result = await getSessionMessageCount(client, "ses_1")

      expect(client.session.messages).toHaveBeenCalledWith({ path: { id: "ses_1" } })
      expect(result).toBe(2)
    })

    it("returns null when the message-count fetch fails transiently", async () => {
      const client = mockClient()
      client.session.messages.mockRejectedValue(new Error("temporary failure"))

      const { getSessionMessageCount } = await import("../../src/lib/session-api.js")
      const result = await getSessionMessageCount(client, "ses_1")

      expect(result).toBeNull()
    })
  })

  describe("sendPrompt", () => {
    it("calls client.session.prompt with correct shape", async () => {
      const client = mockClient()
      client.session.prompt.mockResolvedValue({ data: { info: {}, parts: [] } })
      client.session.messages.mockResolvedValue({ data: [] })

      const { sendPrompt } = await import("../../src/lib/session-api.js")
      await sendPrompt(client, "ses_1", {
        parts: [{ type: "text", text: "hello" }],
      })

      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "ses_1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
        },
      })
    })

    it("rejects invalid session IDs before reading messages or prompting", async () => {
      const client = mockClient()

      const { sendPrompt } = await import("../../src/lib/session-api.js")

      await expect(sendPrompt(client, "bad-session", { parts: [] })).rejects.toThrow(
        "[Harness] Invalid session ID 'bad-session'. Expected an OpenCode session ID starting with 'ses'.",
      )

      expect(client.session.messages).not.toHaveBeenCalled()
      expect(client.session.prompt).not.toHaveBeenCalled()
    })

    it("returns unwrapped data from prompt response", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [] })
      client.session.prompt.mockResolvedValue({ data: { info: { id: "msg-1" }, parts: [] } })

      const { sendPrompt } = await import("../../src/lib/session-api.js")
      const result = await sendPrompt(client, "ses_1", { parts: [] })

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
      const result = await sendPrompt(client, "ses_1", { parts: [{ type: "text", text: "hello" }] })

      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "ses_1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
        },
      })
      expect(result).toEqual({
        info: { role: "assistant", id: "msg-2" },
        parts: [{ type: "text", text: "OK" }],
      })
    })

    it("returns structured prompt responses directly without text-forcing", async () => {
      const client = mockClient()
      client.session.messages.mockResolvedValue({ data: [] })
      client.session.prompt.mockResolvedValue({
        data: {
          info: { id: "msg-structured", role: "assistant" },
          parts: [
            { type: "text", text: "ready" },
            {
              type: "tool",
              tool: "Bash",
              state: {
                input: { command: "pwd" },
                output: "/tmp/project",
                status: "completed",
              },
            },
          ],
        },
      })

      const { sendPrompt } = await import("../../src/lib/session-api.js")
      const result = await sendPrompt(client, "ses_1", { parts: [{ type: "text", text: "hello" }] })

      expect(client.session.prompt).toHaveBeenCalledWith({
        path: { id: "ses_1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
        },
      })
      expect(result).toEqual({
        info: { id: "msg-structured", role: "assistant" },
        parts: [
          { type: "text", text: "ready" },
          {
            type: "tool",
            tool: "Bash",
            state: {
              input: { command: "pwd" },
              output: "/tmp/project",
              status: "completed",
            },
          },
        ],
      })
    })
  })

  describe("sendPromptAsync", () => {
    it("calls client.session.promptAsync with correct shape", async () => {
      const client = mockClient()
      client.session.promptAsync.mockResolvedValue(undefined)

      const { sendPromptAsync } = await import("../../src/lib/session-api.js")
      await sendPromptAsync(client, "ses_1", {
        parts: [{ type: "text", text: "hello" }],
      })

      expect(client.session.promptAsync).toHaveBeenCalledWith({
        path: { id: "ses_1" },
        body: {
          parts: [{ type: "text", text: "hello" }],
        },
      })
    })

    it("rejects blank session IDs before calling the SDK", async () => {
      const client = mockClient()

      const { sendPromptAsync } = await import("../../src/lib/session-api.js")

      await expect(sendPromptAsync(client, "\n\t ", { parts: [] })).rejects.toThrow(
        "[Harness] Invalid session ID '\n\t '. Expected an OpenCode session ID starting with 'ses'.",
      )

      expect(client.session.promptAsync).not.toHaveBeenCalled()
    })
  })

  describe("getSessionStatusMap", () => {
    it("uses session.status as the authoritative runtime status source", async () => {
      const client = mockClient()
      client.session.status.mockResolvedValue({
        data: {
          s1: { type: "busy" },
          s2: { type: "idle" },
        },
      })

      const { getSessionStatusMap } = await import("../../src/lib/session-api.js")
      const result = await getSessionStatusMap(client)

      expect(client.session.status).toHaveBeenCalledWith()
      expect(client.session.get).not.toHaveBeenCalled()
      expect(result).toEqual({
        s1: { type: "busy" },
        s2: { type: "idle" },
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

    it("does not treat message.updated info.id as a session root", async () => {
      const { getEventSessionID } = await import("../../src/lib/session-api.js")
      const event = { type: "message.updated", properties: { info: { id: "msg_dc683580e001KJ4Am2DWo63Yqs" } } }

      expect(getEventSessionID(event)).toBeUndefined()
    })

    it("does not treat message.part delta/update info.id values as root sessions", async () => {
      const { getEventSessionID } = await import("../../src/lib/session-api.js")
      const deltaEvent = { type: "message.part.delta", properties: { info: { id: "ses_2397d5cf7ffeF57rGCsLddMRvN" } } }
      const updatedEvent = { type: "message.part.updated", properties: { info: { id: "ses_2397d5cf7ffeF57rGCsLddMRvN" } } }

      expect(getEventSessionID(deltaEvent)).toBeUndefined()
      expect(getEventSessionID(updatedEvent)).toBeUndefined()
    })

    it("uses explicit message event sessionID instead of message info.id", async () => {
      const { getEventSessionID } = await import("../../src/lib/session-api.js")
      const event = {
        type: "message.updated",
        properties: { info: { id: "msg_dc683580e001KJ4Am2DWo63Yqs" }, sessionID: "ses_23a0b5eabffeB413854W6gnUKC" },
      }

      expect(getEventSessionID(event)).toBe("ses_23a0b5eabffeB413854W6gnUKC")
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
        if (id === "ses_child") return Promise.resolve({ data: { id: "ses_child", parentID: "ses_parent" } })
        if (id === "ses_parent") return Promise.resolve({ data: { id: "ses_parent" } })
        return Promise.reject(new Error("not found"))
      })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      const chain = await walkParentChain(client, "ses_child")

      expect(chain).toHaveLength(2)
      expect(chain[0]).toEqual({ id: "ses_child", parentID: "ses_parent" })
      expect(chain[1]).toEqual({ id: "ses_parent" })
    })

    it("returns single element for session without parent", async () => {
      const client = mockClient()
      client.session.get.mockResolvedValue({ data: { id: "ses_root" } })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      const chain = await walkParentChain(client, "ses_root")

      expect(chain).toHaveLength(1)
      expect(chain[0]).toEqual({ id: "ses_root" })
    })

    it("detects cyclic chains", async () => {
      const client = mockClient()
      client.session.get.mockImplementation(({ path: { id } }: any) => {
        if (id === "ses_a") return Promise.resolve({ data: { id: "ses_a", parentID: "ses_b" } })
        if (id === "ses_b") return Promise.resolve({ data: { id: "ses_b", parentID: "ses_a" } })
        return Promise.reject(new Error("not found"))
      })

      const { walkParentChain } = await import("../../src/lib/session-api.js")
      await expect(walkParentChain(client, "ses_a")).rejects.toThrow(/\[Harness\].*cyclic/)
    })

    it("rejects invalid starting session IDs before calling the SDK", async () => {
      const client = mockClient()

      const { walkParentChain } = await import("../../src/lib/session-api.js")

      await expect(walkParentChain(client, "root-123")).rejects.toThrow(
        "[Harness] Invalid session ID 'root-123'. Expected an OpenCode session ID starting with 'ses'.",
      )

      expect(client.session.get).not.toHaveBeenCalled()
    })
  })
})
