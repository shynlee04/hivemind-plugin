import { describe, it, expect, vi, beforeEach } from "vitest"
import { V2SessionClient } from "../../../../src/shared/session-api.js"
import type { OpencodeClient } from "@opencode-ai/sdk/v2/client"

function createMockV2Client(): OpencodeClient {
  return {
    session: {
      summarize: vi.fn().mockResolvedValue({ data: { summary: "Test session summary" } }),
      diff: vi.fn().mockResolvedValue({ data: { diffs: [{ file: "src/test.ts", status: "modified", additions: 5, deletions: 2 }] } }),
      messages: vi.fn().mockResolvedValue({ data: [{ role: "assistant", content: "Hello" }] }),
      abort: vi.fn().mockResolvedValue({ data: {} }),
      update: vi.fn().mockResolvedValue({ data: { id: "ses_test" } }),
      prompt: vi.fn().mockResolvedValue({ data: { status: "ok" } }),
      create: vi.fn().mockResolvedValue({ data: { id: "ses_new" } }),
      get: vi.fn().mockResolvedValue({ data: { id: "ses_test" } }),
      list: vi.fn().mockResolvedValue({ data: [] }),
      status: vi.fn().mockResolvedValue({ data: {} }),
      delete: vi.fn().mockResolvedValue({ data: {} }),
      children: vi.fn().mockResolvedValue({ data: [] }),
      todo: vi.fn().mockResolvedValue({ data: [] }),
      deleteMessage: vi.fn().mockResolvedValue({ data: {} }),
      message: vi.fn().mockResolvedValue({ data: {} }),
      fork: vi.fn().mockResolvedValue({ data: {} }),
      init: vi.fn().mockResolvedValue({ data: {} }),
      unshare: vi.fn().mockResolvedValue({ data: {} }),
      share: vi.fn().mockResolvedValue({ data: {} }),
      promptAsync: vi.fn().mockResolvedValue({ data: {} }),
    },
  } as unknown as OpencodeClient
}

describe("V2SessionClient", () => {
  let mockClient: OpencodeClient
  let client: V2SessionClient

  beforeEach(() => {
    mockClient = createMockV2Client()
    client = new V2SessionClient(mockClient)
  })

  describe("summarize", () => {
    it("returns summary text from v2 SDK", async () => {
      const result = await client.summarize("ses_test123")
      expect(result).toBe("Test session summary")
      expect(mockClient.session.summarize).toHaveBeenCalledWith(
        expect.objectContaining({ sessionID: "ses_test123" }),
      )
    })

    it("passes optional model parameters", async () => {
      await client.summarize("ses_test123", { providerID: "openai", modelID: "gpt-4" })
      expect(mockClient.session.summarize).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          providerID: "openai",
          modelID: "gpt-4",
        }),
      )
    })

    it("returns empty string when no summary in response", async () => {
      vi.mocked(mockClient.session.summarize).mockResolvedValue({ data: {} })
      const result = await client.summarize("ses_test123")
      expect(result).toBe("")
    })
  })

  describe("diff", () => {
    it("returns file diffs from v2 SDK", async () => {
      const result = await client.diff("ses_test123", "msg_abc")
      expect(result).toHaveLength(1)
      expect(result[0].file).toBe("src/test.ts")
      expect(mockClient.session.diff).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          messageID: "msg_abc",
        }),
      )
    })

    it("works without messageID", async () => {
      await client.diff("ses_test123")
      expect(mockClient.session.diff).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          messageID: undefined,
        }),
      )
    })

    it("returns empty array when no diffs", async () => {
      vi.mocked(mockClient.session.diff).mockResolvedValue({ data: {} })
      const result = await client.diff("ses_test123")
      expect(result).toEqual([])
    })
  })

  describe("messages", () => {
    it("returns messages array from v2 SDK", async () => {
      const result = await client.messages("ses_test123", { limit: 10 })
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(1)
      expect(mockClient.session.messages).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          limit: 10,
        }),
      )
    })

    it("supports before cursor pagination", async () => {
      await client.messages("ses_test123", { before: "msg_prev" })
      expect(mockClient.session.messages).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          before: "msg_prev",
        }),
      )
    })
  })

  describe("abort", () => {
    it("aborts session via v2 SDK", async () => {
      await client.abort("ses_test123")
      expect(mockClient.session.abort).toHaveBeenCalledWith(
        expect.objectContaining({ sessionID: "ses_test123" }),
      )
    })
  })

  describe("update", () => {
    it("updates session title", async () => {
      await client.update("ses_test123", { title: "New Title" })
      expect(mockClient.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          title: "New Title",
        }),
      )
    })

    it("updates with archive time", async () => {
      const now = Date.now()
      await client.update("ses_test123", { archived: now })
      expect(mockClient.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          time: { archived: now },
        }),
      )
    })
  })

  describe("prompt", () => {
    it("sends prompt with parts", async () => {
      await client.prompt("ses_test123", {
        parts: [{ type: "text", text: "Hello" }],
        agent: "test-agent",
      })
      expect(mockClient.session.prompt).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          parts: [{ type: "text", text: "Hello" }],
          agent: "test-agent",
        }),
      )
    })

    it("supports noReply mode", async () => {
      await client.prompt("ses_test123", {
        parts: [{ type: "text", text: "System message" }],
        noReply: true,
      })
      expect(mockClient.session.prompt).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionID: "ses_test123",
          noReply: true,
        }),
      )
    })
  })

  describe("create", () => {
    it("creates child session with parentID", async () => {
      const result = await client.create("ses_parent123", {
        title: "Delegation: test-agent",
        agent: "test-agent",
      })
      expect(mockClient.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentID: "ses_parent123",
          title: "Delegation: test-agent",
          agent: "test-agent",
        }),
      )
      expect((result as { id?: string }).id).toBe("ses_new")
    })

    it("creates with PermissionRuleset", async () => {
      const permissions = [
        { permission: "bash", pattern: "*", action: "allow" as const },
        { permission: "edit", pattern: "src/**", action: "allow" as const },
      ]
      await client.create("ses_parent123", { title: "Test", permissions })
      expect(mockClient.session.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentID: "ses_parent123",
          permission: permissions,
        }),
      )
    })
  })
})
