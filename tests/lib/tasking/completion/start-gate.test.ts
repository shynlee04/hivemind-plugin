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
    it("passes when assistant has usable text content even without tool calls", async () => {
      // WHY: Cycle 2 treats real assistant output as sufficient proof that meaningful work started
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "text", text: "I inspected the runtime contract and started fixing the observer." },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(0)
      expect(evidence.assistantMessages).toBe(1)
    })

    it("passes when a normalized real-shape tool part is present", async () => {
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          {
            type: "tool",
            tool: "Read",
            state: {
              status: "completed",
              input: { filePath: "/tmp/runtime.ts" },
              output: "source contents",
            },
          },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.assistantMessages).toBe(1)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(1)
    })

    it("fails when tool-like parts are hollow legacy shells with no normalized activity", async () => {
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "tool-call", name: "read" },
          { type: "tool_call", name: "write" },
          { type: "tool", name: "edit" },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(false)
      expect(evidence.assistantMessages).toBe(1)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(0)
    })

    it("fails when a tool part only provides the tool label with no meaningful state", async () => {
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [{ type: "tool-call", tool: "Read" }],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(false)
      expect(evidence.assistantMessages).toBe(1)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(0)
    })

    it("passes when a tool label is paired with meaningful normalized state", async () => {
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          {
            type: "tool-call",
            tool: "Read",
            state: { input: { filePath: "/tmp/runtime.ts" } },
          },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.assistantMessages).toBe(1)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(1)
    })

    it("recognizes assistant messages when SDK stores role under info.role", async () => {
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        info: { role: "assistant" },
        parts: [
          { type: "text", text: "I started analyzing the delegated child state." },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.assistantMessages).toBe(1)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(0)
    })

    it("fails when there is only reasoning and no usable assistant text or real tool activity", async () => {
      // WHY: Hidden reasoning alone is not authoritative runtime evidence of substantive work
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "reasoning", text: "Let me check..." },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(false)
      expect(evidence.thinkingBlocks).toBe(1)
      expect(evidence.toolCalls).toBe(0)
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
        parts: [{ type: "text", text: "Step 1 complete." }],
      })
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          {
            type: "tool",
            tool: "Edit",
            state: { status: "completed", input: { filePath: "/tmp/a.ts" }, output: "patched" },
          },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.thinkingBlocks).toBe(0)
      expect(evidence.toolCalls).toBe(1)
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

    it("counts tool_call and tool variants when they include normalized tool fields", async () => {
      // WHY: SDK may return variant type strings, but only normalized tool activity is substantive
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          {
            type: "tool-call",
            tool: "Read",
            state: { status: "completed" },
          },
          {
            type: "tool_call",
            tool: "Write",
            state: { input: { filePath: "/tmp/write.ts" } },
          },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.toolCalls).toBe(2)
    })

    it("counts 'tool' type variant when it carries normalized activity", async () => {
      // WHY: Another SDK variant that must be recognized once it has real normalized fields
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          {
            type: "tool",
            tool: "Bash",
            state: { output: "listed files" },
          },
          {
            type: "tool",
            tool: "Edit",
            state: { status: "completed" },
          },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.passed).toBe(true)
      expect(evidence.toolCalls).toBe(2)
      expect(evidence.thinkingBlocks).toBe(0)
    })

    it("passes with redacted_thinking compatibility alias when usable assistant text also exists", async () => {
      // WHY: Compatibility aliases still count, but Cycle 2 start proof comes from usable assistant output
      const client = createInMemoryClient()
      client._addMessage("ses_1", {
        role: "assistant",
        parts: [
          { type: "redacted_thinking", text: "[redacted]" },
          { type: "text", text: "I have started processing the delegated task." },
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
          { type: "text", text: "Investigating the failure mode now." },
        ],
      })

      const evidence = await verifyStartGate(client, "ses_1")
      expect(evidence.assistantMessages).toBe(1)
      expect(evidence.passed).toBe(true)
    })
  })
})
