/**
 * Tests for LegacyPersistenceStatusReader — reads delegations.json.
 *
 * REQ-C6-02: Validates delegations.json entries with Zod schemas.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { LegacyPersistenceStatusReader } from "../../../../src/tools/delegation/readers/legacy-reader.js"
import { LegacyDelegationRecordSchema } from "../../../../src/tools/delegation/readers/types.js"

describe("LegacyPersistenceStatusReader", () => {
  let reader: LegacyPersistenceStatusReader

  beforeEach(() => {
    reader = new LegacyPersistenceStatusReader()
  })

  describe("readChildren", () => {
    it("should return empty array when delegations.json does not exist", async () => {
      const children = await reader.readChildren("parent-1", "/nonexistent/path")
      expect(children).toEqual([])
    })

    it("should parse valid delegations.json entries", async () => {
      const validRecord = {
        id: "delegation-1",
        parentSessionId: "parent-1",
        childSessionId: "child-1",
        agent: "hm-executor",
        status: "completed",
        createdAt: Date.now(),
        completedAt: Date.now(),
      }

      const parsed = LegacyDelegationRecordSchema.safeParse(validRecord)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.id).toBe("delegation-1")
        expect(parsed.data.status).toBe("completed")
      }
    })

    it("should reject invalid delegations.json entries", () => {
      const invalidRecord = {
        id: 123, // wrong type
        status: "invalid-status",
      }

      const parsed = LegacyDelegationRecordSchema.safeParse(invalidRecord)
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
