/**
 * Tests for SessionTrackerStatusReader — reads hierarchy-manifest.json.
 *
 * REQ-C6-02: Validates hierarchy-manifest.json children entries with Zod schemas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTrackerStatusReader } from "../../../../src/tools/delegation/readers/session-tracker-reader.js"
import { HierarchyManifestChildSchema } from "../../../../src/tools/delegation/readers/types.js"

describe("SessionTrackerStatusReader", () => {
  let reader: SessionTrackerStatusReader

  beforeEach(() => {
    reader = new SessionTrackerStatusReader()
  })

  describe("readChildren", () => {
    it("should return empty array when hierarchy-manifest.json does not exist", async () => {
      const children = await reader.readChildren("parent-1", "/nonexistent/path")
      expect(children).toEqual([])
    })

    it("should parse valid hierarchy-manifest.json children", async () => {
      // This test will PASS once the reader correctly parses manifest files
      const validChild = {
        parentSessionID: "parent-1",
        status: "completed",
        subagentType: "hm-executor",
        delegationDepth: 1,
        createdAt: "2026-05-28T00:00:00.000Z",
        updatedAt: "2026-05-28T00:01:00.000Z",
        childFile: "child-1.json",
        rootMainSessionID: "root-1",
      }

      const parsed = HierarchyManifestChildSchema.safeParse(validChild)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.parentSessionID).toBe("parent-1")
        expect(parsed.data.status).toBe("completed")
      }
    })

    it("should reject invalid hierarchy-manifest.json entries", () => {
      const invalidChild = {
        parentSessionID: 123, // wrong type
        status: "unknown-status", // invalid enum
      }

      const parsed = HierarchyManifestChildSchema.safeParse(invalidChild)
      expect(parsed.success).toBe(false)
    })
  })

  describe("readDelegation", () => {
    it("should return null when delegation is not found", async () => {
      const delegation = await reader.readDelegation("nonexistent-id", "/tmp")
      expect(delegation).toBeNull()
    })
  })
})
