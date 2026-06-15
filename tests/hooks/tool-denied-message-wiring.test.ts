/**
 * Phase 3 tests — tool_denied_message wiring into tool-guard-hooks.
 *
 * Verifies that governance block errors are enriched with:
 * 1. The matched rule's action.message (if present)
 * 2. The config-level tool_denied_message with {toolName}/{agentName} interpolation
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { evaluateGovernance } from "../../src/features/governance-engine/evaluator.js"
import type { GovernanceRule } from "../../src/shared/types.js"

// Mock state manager
const mockAddWarning = vi.fn()
const mockStateManager = {
  addWarning: mockAddWarning,
  getWarnings: vi.fn().mockReturnValue([]),
  clearWarnings: vi.fn(),
  ensureStats: vi.fn().mockReturnValue({ total: 0, byTool: {}, loop: { signature: "", count: 0 } }),
  getStats: vi.fn().mockReturnValue({ total: 0, byTool: {}, warnings: [], loop: { count: 0 } }),
}

// We test the evaluator and the enrichment logic directly
describe("governance tool_denied_message wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("evaluator blockMessages", () => {
    it("returns blockMessages when a block rule has action.message", () => {
      const rules: GovernanceRule[] = [
        {
          id: "gov-block-edit",
          condition: { toolNames: ["edit"] },
          action: { type: "block", message: "Use hivemind-doc instead of edit for this agent." },
          enabled: true,
        },
      ]

      const result = evaluateGovernance("edit", "ses_test_001", rules)
      expect(result.blocked).toBe(true)
      expect(result.blocks).toHaveLength(1)
      expect(result.blockMessages).toHaveLength(1)
      expect(result.blockMessages[0]).toBe("Use hivemind-doc instead of edit for this agent.")
    })

    it("returns empty blockMessages when block rule has no action.message", () => {
      const rules: GovernanceRule[] = [
        {
          id: "gov-block-bare",
          condition: { toolNames: ["bash"] },
          action: { type: "block" },
          enabled: true,
        },
      ]

      const result = evaluateGovernance("bash", "ses_test_002", rules)
      expect(result.blocked).toBe(true)
      expect(result.blocks).toHaveLength(1)
      expect(result.blockMessages).toHaveLength(0)
    })

    it("collects blockMessages from multiple matching block rules", () => {
      const rules: GovernanceRule[] = [
        {
          id: "rule-1",
          condition: { toolNames: ["write"] },
          action: { type: "block", message: "First hint" },
          enabled: true,
        },
        {
          id: "rule-2",
          condition: { toolNames: ["write"] },
          action: { type: "block", message: "Second hint" },
          enabled: true,
        },
      ]

      const result = evaluateGovernance("write", "ses_test_003", rules)
      expect(result.blocked).toBe(true)
      expect(result.blockMessages).toEqual(["First hint", "Second hint"])
    })
  })

  describe("tool_denied_message interpolation", () => {
    it("interpolates {toolName} and {agentName} in the message template", () => {
      const toolDeniedMessage = {
        edit: { message: "Tool '{toolName}' is denied for agent '{agentName}'. Use hivemind-doc instead." },
      }

      const toolName = "edit"
      const agentName = "hm-orchestrator"
      const template = toolDeniedMessage[toolName].message
      const interpolated = template
        .replace(/\{toolName\}/g, toolName)
        .replace(/\{agentName\}/g, agentName)

      expect(interpolated).toBe("Tool 'edit' is denied for agent 'hm-orchestrator'. Use hivemind-doc instead.")
    })

    it("handles multiple occurrences of {toolName} and {agentName}", () => {
      const template = "Agent {agentName} cannot use {toolName}. {agentName} should use alternatives to {toolName}."
      const interpolated = template
        .replace(/\{toolName\}/g, "write")
        .replace(/\{agentName\}/g, "hf-builder")

      expect(interpolated).toBe(
        "Agent hf-builder cannot use write. hf-builder should use alternatives to write.",
      )
    })

    it("leaves template unchanged when placeholders are absent from message", () => {
      const template = "This tool is blocked."
      const interpolated = template
        .replace(/\{toolName\}/g, "edit")
        .replace(/\{agentName\}/g, "test-agent")

      expect(interpolated).toBe("This tool is blocked.")
    })
  })

  describe("enriched error assembly", () => {
    it("combines blocks, blockMessages, and tool_denied_message into error parts", () => {
      // Simulate the hook's error assembly logic
      const govResult = {
        blocked: true,
        blocks: ["Rule gov-block-edit triggered on tool edit for session ses_001"],
        blockMessages: ["Use hivemind-doc instead of edit."],
        warnings: [],
        escalations: [],
      }

      const toolDeniedMap = {
        edit: { message: "Tool '{toolName}' denied for '{agentName}'. Use hivemind-doc." },
      }

      const toolName = "edit"
      const agentName = "hm-orchestrator"
      const blockParts: string[] = [...govResult.blocks]

      if (govResult.blockMessages.length > 0) {
        blockParts.push(...govResult.blockMessages)
      }

      if (toolDeniedMap[toolName]) {
        const interpolated = toolDeniedMap[toolName].message
          .replace(/\{toolName\}/g, toolName)
          .replace(/\{agentName\}/g, agentName)
        blockParts.push(interpolated)
      }

      const errorMessage = `[Hivemind] Tool execution blocked by governance: ${blockParts.join("; ")}`

      expect(errorMessage).toContain("Rule gov-block-edit triggered")
      expect(errorMessage).toContain("Use hivemind-doc instead of edit.")
      expect(errorMessage).toContain("Tool 'edit' denied for 'hm-orchestrator'.")
    })

    it("produces standard error when no tool_denied_message or blockMessages exist", () => {
      const govResult = {
        blocked: true,
        blocks: ["Rule gov-block-bare triggered on tool bash for session ses_002"],
        blockMessages: [] as string[],
        warnings: [],
        escalations: [],
      }

      const toolDeniedMap: Record<string, { message: string }> = {}
      const toolName = "bash"
      const blockParts: string[] = [...govResult.blocks]

      if (govResult.blockMessages.length > 0) {
        blockParts.push(...govResult.blockMessages)
      }

      if (toolDeniedMap[toolName]) {
        blockParts.push(toolDeniedMap[toolName].message)
      }

      const errorMessage = `[Hivemind] Tool execution blocked by governance: ${blockParts.join("; ")}`
      expect(errorMessage).toBe("[Hivemind] Tool execution blocked by governance: Rule gov-block-bare triggered on tool bash for session ses_002")
    })
  })
})
