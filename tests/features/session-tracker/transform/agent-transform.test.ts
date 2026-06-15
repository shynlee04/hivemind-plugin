/**
 * AgentTransform tests — assistant metadata extraction and child user transform.
 *
 * @module tests/features/session-tracker/transform/agent-transform
 */

import { describe, it, expect } from "vitest"
import { AgentTransform } from "../../../../src/features/session-tracker/transform/agent-transform.js"

describe("AgentTransform", () => {
  const transform = new AgentTransform()

  describe("extractAssistantMetadata", () => {
    it("should extract agent name, model, and thinking duration from full input", () => {
      const result = transform.extractAssistantMetadata(
        {
          agent: "Hm-L0-Orchestrator",
          model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" },
        },
        {
          parts: [
            { type: "text", text: "Response" },
            { type: "thinking", text: "Let me think..." },
          ],
        },
      )

      expect(result.name).toBe("Hm-L0-Orchestrator")
      expect(result.model).toBe("DeepSeek V4 Pro")
      // F-10: thinkingDuration is undefined — timing data not available from hook metadata
      expect(result.thinkingDuration).toBeUndefined()
    })

    it("should default to 'unknown' when agent name is missing", () => {
      const result = transform.extractAssistantMetadata(
        {},
        { parts: [{ type: "text", text: "Response" }] },
      )

      expect(result.name).toBe("unknown")
      expect(result.model).toBe("unknown")
    })

    it("should use providerID when modelID is missing", () => {
      const result = transform.extractAssistantMetadata(
        {
          agent: "TestAgent",
          model: { providerID: "deepseek", modelID: "" } as any,
        },
        { parts: [{ type: "text", text: "Response" }] },
      )

      expect(result.model).toBe("deepseek")
    })

    it("should compute thinking duration from parts with thinking type", () => {
      const result = transform.extractAssistantMetadata(
        {
          agent: "TestAgent",
          model: { providerID: "openai", modelID: "gpt-4" },
        },
        {
          parts: [
            { type: "thinking", text: "Let me think..." },
            { type: "text", text: "Response" },
          ],
        },
      )

      // DEFECT-11 / F-10: thinkingDuration returns undefined — timing data not
      // available from hook metadata. computeThinkingDuration() honestly returns
      // undefined rather than fabricating a value.
      expect(result.thinkingDuration).toBeUndefined()
    })

    it("should return undefined thinkingDuration when no thinking parts exist", () => {
      const result = transform.extractAssistantMetadata(
        {
          agent: "TestAgent",
          model: { providerID: "openai", modelID: "gpt-4" },
        },
        { parts: [{ type: "text", text: "Just text, no thinking" }] },
      )

      expect(result.thinkingDuration).toBeUndefined()
    })

    it("should use modelID when available over providerID", () => {
      const result = transform.extractAssistantMetadata(
        {
          agent: "TestAgent",
          model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" },
        },
        { parts: [] },
      )

      expect(result.model).toBe("DeepSeek V4 Pro")
    })
  })

  describe("transformChildUserMessage", () => {
    it("should return parent agent info for child ##USER → main_l0_agent", () => {
      const result = transform.transformChildUserMessage(
        "Hm-L0-Orchestrator",
        "DeepSeek V4 Pro",
      )

      expect(result.name).toBe("Hm-L0-Orchestrator")
      expect(result.model).toBe("DeepSeek V4 Pro")
    })

    it("should work with missing model", () => {
      const result = transform.transformChildUserMessage(
        "Hm-L0-Orchestrator",
        "",
      )

      expect(result.name).toBe("Hm-L0-Orchestrator")
      expect(result.model).toBe("unknown")
    })
  })
})
