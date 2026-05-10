/**
 * SchemaNormalizer tests — camelCase normalization and record transforms.
 *
 * @module tests/features/session-tracker/transform/schema-normalizer
 */

import { describe, it, expect } from "vitest"
import {
  toCamelCase,
  normalizeSessionRecord,
  normalizeChildRecord,
} from "../../../../src/features/session-tracker/transform/schema-normalizer.js"

describe("SchemaNormalizer", () => {
  describe("toCamelCase", () => {
    it("should convert simple snake_case to camelCase", () => {
      expect(toCamelCase("session_id")).toBe("sessionId")
      expect(toCamelCase("parent_id")).toBe("parentId")
      expect(toCamelCase("created_at")).toBe("createdAt")
    })

    it("should convert multi-segment snake_case", () => {
      expect(toCamelCase("parent_session_id")).toBe("parentSessionId")
      expect(toCamelCase("delegation_depth")).toBe("delegationDepth")
      expect(toCamelCase("thinking_duration")).toBe("thinkingDuration")
      expect(toCamelCase("turn_count")).toBe("turnCount")
    })

    it("should leave already-camelCase strings unchanged", () => {
      expect(toCamelCase("sessionID")).toBe("sessionId")
      expect(toCamelCase("ID")).toBe("id")
    })

    it("should handle single-word strings", () => {
      expect(toCamelCase("name")).toBe("name")
      expect(toCamelCase("status")).toBe("status")
    })

    it("should handle empty strings", () => {
      expect(toCamelCase("")).toBe("")
    })
  })

  describe("normalizeSessionRecord", () => {
    it("should convert snake_case keys to camelCase", () => {
      const input = {
        session_id: "ses_test12345abcdefg0",
        created_at: "2026-01-01T00:00:00Z",
        parent_session_id: null,
        delegation_depth: 0,
        children: [],
        continuity_index: "session-continuity.json",
        status: "active",
      }

      const result = normalizeSessionRecord(input)

      expect(result.sessionID).toBe("ses_test12345abcdefg0")
      expect((result as any).session_id).toBeUndefined()
      expect(result.created).toBe("2026-01-01T00:00:00Z")
      expect(result.parentSessionID).toBeNull()
      expect(result.delegationDepth).toBe(0)
    })

    it("should handle already-camelCase keys", () => {
      const input: Record<string, unknown> = {
        sessionID: "ses_test12345abcdefg0",
        created: "2026-01-01T00:00:00Z",
        updated: "2026-01-01T00:00:00Z",
        parentSessionID: null,
        delegationDepth: 0,
        children: [],
        continuityIndex: "session-continuity.json",
        status: "active",
      }

      const result = normalizeSessionRecord(input)

      expect(result.sessionID).toBe("ses_test12345abcdefg0")
      expect(result.created).toBe("2026-01-01T00:00:00Z")
    })

    it("should fill in default values for missing fields", () => {
      const result = normalizeSessionRecord({
        session_id: "ses_minimal567890ab",
      })

      expect(result.sessionID).toBe("ses_minimal567890ab")
      expect(result.created).toBeDefined()
      expect(result.updated).toBeDefined()
      expect(result.parentSessionID).toBeNull()
      expect(result.delegationDepth).toBe(0)
      expect(result.children).toEqual([])
      expect(result.continuityIndex).toBe("session-continuity.json")
      expect(result.status).toBe("active")
    })
  })

  describe("normalizeChildRecord", () => {
    it("should convert snake_case keys to camelCase for child records", () => {
      const input = {
        session_id: "ses_child12345abcdefg",
        parent_session_id: "ses_parent987654321xy",
        delegation_depth: 1,
        delegated_by: {
          agent_name: "Hm-L0-Orchestrator",
          tool: "task",
          description: "Investigate",
          subagent_type: "hm-l2-investigator",
        },
        created: "2026-01-01T00:00:00Z",
        updated: "2026-01-01T00:00:00Z",
        status: "active",
        main_agent: { name: "Hm-L2-Investigator", model: "DeepSeek V4 Pro" },
        turns: [],
        children: [],
      }

      const result = normalizeChildRecord(input)

      expect(result.sessionID).toBe("ses_child12345abcdefg")
      expect(result.parentSessionID).toBe("ses_parent987654321xy")
      expect(result.delegationDepth).toBe(1)
      expect(result.delegatedBy.agentName).toBe("Hm-L0-Orchestrator")
      expect(result.delegatedBy.subagentType).toBe("hm-l2-investigator")
      expect(result.mainAgent.name).toBe("Hm-L2-Investigator")
    })

    it("should fill in default values for missing fields", () => {
      const result = normalizeChildRecord({
        session_id: "ses_minchild4567890c",
      })

      expect(result.sessionID).toBe("ses_minchild4567890c")
      expect(result.parentSessionID).toBe("")
      expect(result.delegatedBy.agentName).toBe("unknown")
      expect(result.mainAgent.name).toBe("unknown")
      expect(result.turns).toEqual([])
      expect(result.children).toEqual([])
    })

    it("should handle nested delegation depth", () => {
      const result = normalizeChildRecord({
        session_id: "ses_grandchild12345a",
        parent_session_id: "ses_child12345abcdefg",
        delegation_depth: 2,
      })

      expect(result.delegationDepth).toBe(2)
    })
  })
})
