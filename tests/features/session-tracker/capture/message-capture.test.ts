/**
 * MessageCapture tests — user/assistant message capture.
 *
 * @module tests/features/session-tracker/capture/message-capture
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { MessageCapture } from "../../../../src/features/session-tracker/capture/message-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { AgentTransform } from "../../../../src/features/session-tracker/transform/agent-transform.js"

describe("MessageCapture", () => {
  let messageCapture: MessageCapture
  let sessionWriter: SessionWriter
  let agentTransform: AgentTransform
  let mockAppendUserTurn: ReturnType<typeof vi.fn>
  let mockAppendAgentBlock: ReturnType<typeof vi.fn>
  let mockExtractAssistantMetadata: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockAppendUserTurn = vi.fn().mockResolvedValue(undefined)
    mockAppendAgentBlock = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      appendUserTurn: mockAppendUserTurn,
      appendAgentBlock: mockAppendAgentBlock,
      createSessionDir: vi.fn(),
      initializeSessionFile: vi.fn(),
      appendToolBlock: vi.fn(),
      updateFrontmatter: vi.fn(),
    } as unknown as SessionWriter

    mockExtractAssistantMetadata = vi.fn().mockReturnValue({
      name: "Hm-L0-Orchestrator",
      model: "DeepSeek V4 Pro",
      thinkingDuration: "19.7s",
    })

    agentTransform = {
      extractAssistantMetadata: mockExtractAssistantMetadata,
      transformChildUserMessage: vi.fn(),
    } as unknown as AgentTransform

    messageCapture = new MessageCapture({ sessionWriter, agentTransform, client: { app: { log: vi.fn() } } as any, projectRoot: "/tmp" })
  })

  describe("user messages", () => {
    it("should capture user message with turn counter (turn 1)", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Hello, please investigate" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "Hello, please investigate",
      )
    })

    it("should increment turn counter for subsequent messages", async () => {
      // First turn
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "First message" }],
        },
      )

      // Second turn
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Second message" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenNthCalledWith(
        1,
        "ses_test12345abcdefg0",
        1,
        "First message",
      )
      expect(mockAppendUserTurn).toHaveBeenNthCalledWith(
        2,
        "ses_test12345abcdefg0",
        2,
        "Second message",
      )
    })

    it("should maintain separate turn counters for different sessions", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_aaaaa1234567890a" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Session A msg 1" }],
        },
      )
      await messageCapture.handleChatMessage(
        { sessionID: "ses_bbbbb1234567890b" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Session B msg 1" }],
        },
      )
      await messageCapture.handleChatMessage(
        { sessionID: "ses_aaaaa1234567890a" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Session A msg 2" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenNthCalledWith(
        1,
        "ses_aaaaa1234567890a",
        1,
        "Session A msg 1",
      )
      expect(mockAppendUserTurn).toHaveBeenNthCalledWith(
        2,
        "ses_bbbbb1234567890b",
        1,
        "Session B msg 1",
      )
      expect(mockAppendUserTurn).toHaveBeenNthCalledWith(
        3,
        "ses_aaaaa1234567890a",
        2,
        "Session A msg 2",
      )
    })

    it("should handle user messages with no text content", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "file" }],
        },
      )

      // Should still call but with empty content
      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "",
      )
    })
  })

  describe("assistant messages", () => {
    it("should transform assistant metadata via agentTransform", async () => {
      await messageCapture.handleChatMessage(
        {
          sessionID: "ses_test12345abcdefg0",
          agent: "Hm-L0-Orchestrator",
          model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" },
        },
        {
          message: { role: "assistant" },
          parts: [{ type: "text", text: "I will investigate." }],
        },
      )

      expect(mockExtractAssistantMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: "Hm-L0-Orchestrator",
          model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" },
        }),
        expect.objectContaining({
          parts: [{ type: "text", text: "I will investigate." }],
        }),
      )

      expect(mockAppendAgentBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "Hm-L0-Orchestrator",
        "DeepSeek V4 Pro",
        "19.7s",
      )
    })

    it("should skip thinking blocks in parts", async () => {
      const parts = [
        { type: "thinking", text: "Let me think..." },
        { type: "text", text: "Here is my response." },
        { type: "thinking", text: "More thinking..." },
      ]

      await messageCapture.handleChatMessage(
        {
          sessionID: "ses_test12345abcdefg0",
          agent: "Hm-L0-Orchestrator",
          model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" },
        },
        {
          message: { role: "assistant" },
          parts,
        },
      )

      // extractAssistantMetadata should still be called, but with thinking blocks filtered
      expect(mockExtractAssistantMetadata).toHaveBeenCalled()
    })

    it("should handle missing agent/metadata gracefully", async () => {
      mockExtractAssistantMetadata.mockReturnValue({
        name: "unknown",
        model: "unknown",
      })

      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "assistant" },
          parts: [{ type: "text", text: "Response" }],
        },
      )

      expect(mockAppendAgentBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "unknown",
        "unknown",
        undefined,
      )
    })
  })

  describe("graceful failure", () => {
    it("should not throw on malformed input", async () => {
      await expect(
        messageCapture.handleChatMessage(
          { sessionID: "" },
          { message: {} as any, parts: [] },
        ),
      ).resolves.toBeUndefined()
    })

    it("should not throw when sessionWriter fails", async () => {
      mockAppendUserTurn.mockRejectedValue(new Error("Write error"))

      await expect(
        messageCapture.handleChatMessage(
          { sessionID: "ses_test12345abcdefg0" },
          {
            message: { role: "user" },
            parts: [{ type: "text", text: "Hello" }],
          },
        ),
      ).resolves.toBeUndefined()
    })

    it("should handle null parts gracefully", async () => {
      await expect(
        messageCapture.handleChatMessage(
          { sessionID: "ses_test12345abcdefg0" },
          {
            message: { role: "user" },
            parts: null as any,
          },
        ),
      ).resolves.toBeUndefined()
    })
  })
})
