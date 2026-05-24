/**
 * MessageCapture tests — user/assistant message capture.
 *
 * @module tests/features/session-tracker/capture/message-capture
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { MessageCapture } from "../../../../src/features/session-tracker/capture/message-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { AgentTransform } from "../../../../src/features/session-tracker/transform/agent-transform.js"
import type { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"

// Mock node:fs/promises for seedTurnCounters tests
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}))
import { readFile } from "node:fs/promises"
const mockReadFile = vi.mocked(readFile)

describe("MessageCapture", () => {
  let messageCapture: MessageCapture
  let sessionWriter: SessionWriter
  let agentTransform: AgentTransform
  let sessionIndexWriter: SessionIndexWriter
  let mockAppendUserTurn: ReturnType<typeof vi.fn>
  let mockAppendAgentBlock: ReturnType<typeof vi.fn>
  let mockExtractAssistantMetadata: ReturnType<typeof vi.fn>
  let mockIncrementTurnCount: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockAppendUserTurn = vi.fn().mockResolvedValue(undefined)
    mockAppendAgentBlock = vi.fn().mockResolvedValue(undefined)
    mockIncrementTurnCount = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      appendUserTurn: mockAppendUserTurn,
      appendAgentBlock: mockAppendAgentBlock,
      createSessionDir: vi.fn(),
      initializeSessionFile: vi.fn(),
      appendToolBlock: vi.fn(),
      updateFrontmatter: vi.fn(),
    } as unknown as SessionWriter

    sessionIndexWriter = {
      incrementTurnCount: mockIncrementTurnCount,
    } as unknown as SessionIndexWriter

    mockExtractAssistantMetadata = vi.fn().mockReturnValue({
      name: "Hm-L0-Orchestrator",
      model: "DeepSeek V4 Pro",
      thinkingDuration: "19.7s",
    })

    agentTransform = {
      extractAssistantMetadata: mockExtractAssistantMetadata,
      transformChildUserMessage: vi.fn(),
    } as unknown as AgentTransform

    messageCapture = new MessageCapture({
      sessionWriter,
      agentTransform,
      client: { app: { log: vi.fn() } } as any,
      projectRoot: "/tmp",
      sessionIndexWriter,
    })
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
        "I will investigate.", // P-01: assistant text content MUST be captured
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
        "Response", // P-01: content captured even with unknown agent
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

  describe("turn count persistence", () => {
    it("should increment turnCount via sessionIndexWriter when user message is captured", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Hello" }],
        },
      )

      expect(mockIncrementTurnCount).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
      )
      expect(mockIncrementTurnCount).toHaveBeenCalledTimes(1)
    })

    it("should call incrementTurnCount for every user message (turn count tracks messages)", async () => {
      const sessionID = "ses_count123456789ab"

      await messageCapture.handleChatMessage(
        { sessionID },
        { message: { role: "user" }, parts: [{ type: "text", text: "Msg 1" }] },
      )
      await messageCapture.handleChatMessage(
        { sessionID },
        { message: { role: "user" }, parts: [{ type: "text", text: "Msg 2" }] },
      )
      await messageCapture.handleChatMessage(
        { sessionID },
        { message: { role: "user" }, parts: [{ type: "text", text: "Msg 3" }] },
      )

      expect(mockIncrementTurnCount).toHaveBeenCalledWith(sessionID)
      expect(mockIncrementTurnCount).toHaveBeenCalledTimes(3)
    })

    it("should NOT call incrementTurnCount for assistant messages", async () => {
      await messageCapture.handleChatMessage(
        {
          sessionID: "ses_test12345abcdefg0",
          agent: "Hm-L0-Orchestrator",
          model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" },
        },
        {
          message: { role: "assistant" },
          parts: [{ type: "text", text: "Response" }],
        },
      )

      expect(mockIncrementTurnCount).not.toHaveBeenCalled()
    })
  })

  // REQ-23.2-01: extractTextContent multi-field extraction
  describe("extractTextContent — multi-field and multi-type extraction (REQ-23.2-01)", () => {
    it("should extract text from parts with type 'text' and p.text field", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "hello" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "hello",
      )
    })

    it("should extract text from parts with p.content field (no .text)", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "text", content: "world" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "world",
      )
    })

    it("should extract text from mixed parts with both .text and .content", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [
            { type: "text", text: "a" },
            { type: "text", content: "b" },
          ],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "a\nb",
      )
    })

    it("should extract text from non-'text' types when they have .text field", async () => {
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "tool_result", text: "result data here" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "result data here",
      )
    })

    it("should return empty string and log diagnostic when no text-like fields found", async () => {
      const mockLog = vi.fn()
      const captureWithLog = new MessageCapture({
        sessionWriter,
        agentTransform,
        client: { app: { log: mockLog } } as any,
        projectRoot: "/tmp",
        sessionIndexWriter,
      })

      await captureWithLog.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "unknown" }],
        },
      )

      // Should call appendUserTurn with empty content
      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "",
      )

      // Should log a diagnostic warning about no text extracted
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            level: "debug",
            message: expect.stringContaining("extractTextContent found no text"),
          }),
        }),
      )
    })

    it("should return empty string for null parts without crash", async () => {
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

    it("should return empty string for empty array without diagnostic warning", async () => {
      const mockLog = vi.fn()
      const captureWithLog = new MessageCapture({
        sessionWriter,
        agentTransform,
        client: { app: { log: mockLog } } as any,
        projectRoot: "/tmp",
        sessionIndexWriter,
      })

      await captureWithLog.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        1,
        "",
      )

      // Should NOT log diagnostic for empty array
      expect(mockLog).not.toHaveBeenCalled()
    })
  })

  // F-06: seedTurnCounters wiring
  describe("seedTurnCounters — turn counter restoration on restart", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("should seed turn counter from existing .md file with 3 USER turns", async () => {
      // Arrange: .md file has 3 USER turn headers
      mockReadFile.mockResolvedValue(
        "---\n## USER (turn 1)\ncontent\n## USER (turn 2)\ncontent\n## USER (turn 3)\ncontent\n",
      )

      await messageCapture.seedTurnCounters("ses_test12345abcdefg0")

      // After seeding, next turn should be 4 (counter = 3)
      await messageCapture.handleChatMessage(
        { sessionID: "ses_test12345abcdefg0" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Next message" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        4, // seeded to 3 + 1 = 4
        "Next message",
      )
    })

    it("should start at turn 1 when .md file has no USER turns (new session)", async () => {
      // Arrange: .md file has no USER turn headers
      mockReadFile.mockResolvedValue("---\ntitle: Test\n---\n\nNo turns yet\n")

      await messageCapture.seedTurnCounters("ses_new1234567890z")

      // After seeding, next turn should be 1
      await messageCapture.handleChatMessage(
        { sessionID: "ses_new1234567890z" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "First message" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_new1234567890z",
        1, // seeded to 0 + 1 = 1
        "First message",
      )
    })

    it("should start at turn 1 when .md file doesn't exist (ENOENT)", async () => {
      // Arrange: readFile throws ENOENT
      mockReadFile.mockRejectedValue(Object.assign(new Error("ENOENT: no such file"), { code: "ENOENT" }))

      await messageCapture.seedTurnCounters("ses_nofile876543210x")

      // After seeding (graceful fallback), next turn should be 1
      await messageCapture.handleChatMessage(
        { sessionID: "ses_nofile876543210x" },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "First message" }],
        },
      )

      expect(mockAppendUserTurn).toHaveBeenCalledWith(
        "ses_nofile876543210x",
        1,
        "First message",
      )
    })
  })
})
