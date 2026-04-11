import { describe, it, expect } from "vitest"

import { verifyStartGate, countThinkingBlocks } from "../../../../src/lib/tasking/completion/start-gate.js"
import { createInMemoryClient } from "../../helpers/in-memory-client.js"

describe("start-gate", () => {
  describe("countThinkingBlocks", () => {
    it("counts canonical 'reasoning' type parts", () => {
      // WHY: 'reasoning' is the canonical type per D-10 design
      const message = {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Let me think about this..." },
          { type: "tool-call", name: "read" },
        ],
      }
      expect(countThinkingBlocks(message)).toBe(1)
    })

    it("counts compatibility alias 'thinking' as thinking block", () => {
      // WHY: 'thinking' is a compatibility alias that must still be counted
      const message = {
        role: "assistant",
        parts: [{ type: "thinking", text: "Analyzing..." }],
      }
      expect(countThinkingBlocks(message)).toBe(1)
    })

    it("counts compatibility alias 'redacted_thinking' as thinking block", () => {
      // WHY: 'redacted_thinking' is another compatibility alias per the plan
      const message = {
        role: "assistant",
        parts: [{ type: "redacted_thinking", text: "..." }],
      }
      expect(countThinkingBlocks(message)).toBe(1)
    })

    it("counts multiple thinking blocks across parts", () => {
      const message = {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "step 1" },
          { type: "reasoning", text: "step 2" },
          { type: "thinking", text: "step 3" },
        ],
      }
      expect(countThinkingBlocks(message)).toBe(3)
    })

    it("returns 0 for message with no thinking parts", () => {
      const message = {
        role: "assistant",
        parts: [{ type: "tool-call" }, { type: "text", text: "hello" }],
      }
      expect(countThinkingBlocks(message)).toBe(0)
    })

    it("returns 0 for null/undefined message", () => {
      expect(countThinkingBlocks(null)).toBe(0)
      expect(countThinkingBlocks(undefined)).toBe(0)
    })

    it("returns 0 for message without parts array", () => {
      expect(countThinkingBlocks({ role: "assistant" })).toBe(0)
      expect(countThinkingBlocks({ role: "assistant", parts: null })).toBe(0)
    })

    it("returns 0 for message with non-array parts", () => {
      expect(countThinkingBlocks({ role: "assistant", parts: "bad" })).toBe(0)
    })

    it("handles malformed parts gracefully", () => {
      const message = {
        role: "assistant",
        parts: [null, undefined, 42, "string", { noType: true }],
      }
      expect(countThinkingBlocks(message)).toBe(0)
    })
  })

  describe("verifyStartGate", () => {
    it("passes when assistant has ≥1 reasoning block AND ≥2 tool calls", async () => {
      // WHY: This is the core D-10 requirement — both signals present means real work started
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "I need to investigate..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.thinkingBlocks).toBe(1)
      expect(evidence.toolCalls).toBe(2)
      expect(evidence.assistantMessages).toBe(1)
    })

    it("fails when there are zero reasoning/thinking blocks even if tool calls ≥ 2", async () => {
      // WHY: Prevents false positive from rapid tool calls without any deliberation
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(false)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(2)
    })

    it("fails when tool calls < 2 even if thinking blocks ≥ 1", async () => {
      // WHY: Single tool call could be a ping/status check, not substantive work
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Let me check..." },
          { type: "tool-call", name: "status" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(false)
      expect(evidence.thinkingBlocks).toBe(1)
      expect(evidence.toolCalls).toBe(1)
    })

    it("fails when there are no assistant messages at all", async () => {
      // WHY: Empty session or only user messages means no agent work has started
      const client = createInMemoryClient()
      client._addMessage("ses_1", { role: "user", content: "do something" })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(false)
      expect(evidence.assistantMessages).toBe(0)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(0)
    })

    it("counts evidence from ALL assistant messages, not just the last one", async () => {
      // WHY: Agent might spread work across multiple turns; summing captures total effort
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [{ type: "reasoning", text: "Step 1" }],
      })
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "write" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.thinkingBlocks).toBe(1)
      expect(evidence.toolCalls).toBe(2)
      expect(evidence.assistantMessages).toBe(2)
    })

    it("handles malformed/missing message parts gracefully — returns 0 counts, gate fails", async () => {
      // WHY: Malformed SDK data should never crash — graceful degradation per T-09.2-01
      const client = createInMemoryClient()
      client._addMessage("ses_1", { role: "assistant" }) // no parts
      client._addMessage("ses_1", { role: "assistant", parts: null }) // null parts
      client._addMessage("ses_1", { role: "assistant", parts: [null, 42] }) // bad parts

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(false)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(0)
      expect(evidence.assistantMessages).toBe(3)
    })

    it("counts tool_call and tool variants alongside tool-call", async () => {
      // WHY: SDK may return variant type strings — all must be counted
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Working..." },
          { type: "tool-call", name: "read" },
          { type: "tool_call", name: "write" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.toolCalls).toBe(2)
    })

    it("counts 'tool' type variant as tool call", async () => {
      // WHY: Another SDK variant that must be recognized
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "thinking", text: "Analyzing..." },
          { type: "tool", name: "bash" },
          { type: "tool", name: "edit" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.toolCalls).toBe(2)
      expect(evidence.thinkingBlocks).toBe(1)
    })

    it("passes with redacted_thinking compatibility alias + tool calls", async () => {
      // WHY: Proves compatibility alias 'redacted_thinking' counts as thinking block
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "redacted_thinking", text: "[redacted]" },
          { type: "tool-call", name: "grep" },
          { type: "tool-call", name: "edit" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.thinkingBlocks).toBe(1)
    })

    it("ignores non-assistant messages when counting evidence", async () => {
      // WHY: Prevents user prompt from being counted as evidence, per D-10 root cause
      const client = createInMemoryClient()
      client._addMessage("ses_1", { role: "user", content: "fix the bug" })
      client._addMessage("ses_1", { role: "system", content: "instructions" })
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Investigating..." },
          { type: "tool-call", name: "read" },
          { type: "tool-call", name: "edit" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.assistantMessages).toBe(1)
      expect(evidence.passed).toBe(true)
    })
  })
})
