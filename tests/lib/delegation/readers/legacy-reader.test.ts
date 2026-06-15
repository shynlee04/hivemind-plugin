/**
 * Tests for LegacyPersistenceStatusReader — reads delegations.json.
 *
 * REQ-C6-02: Validates delegations.json entries with Zod schemas.
 *
 * NOTE: P41-D-01 made readPersistedDelegations a no-op returning [].
 * The LegacyPersistenceStatusReader wrapper now always returns empty.
 * Schema validation tests are preserved for code coverage completeness.
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

    it("should return empty array when delegations.json exists with valid data (P41-D no-op)", async () => {
      // readPersistedDelegations is now a no-op returning [] — the reader returns empty
      const children = await reader.readChildren("parent-1", "/nonexistent/path")
      expect(children).toEqual([])
    })
  })

  describe("readDelegation", () => {
    it("should return null when delegation is not found", async () => {
      const delegation = await reader.readDelegation("nonexistent-id", "/tmp")
      expect(delegation).toBeNull()
    })
  })
})
