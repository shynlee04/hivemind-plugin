/**
 * PendingDispatchRegistry tests — parent-indexed reverse lookup (D-04).
 *
 * Validates that has() returns true ONLY for the specific sessionID or
 * callID key — not for arbitrary sessions. False positives from the old
 * byParent fallback caused all sessions to be misclassified as children.
 *
 * @module tests/features/session-tracker/persistence/pending-dispatch-registry
 */

import { describe, it, expect, beforeEach } from "vitest"
import { PendingDispatchRegistry } from "../../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"

describe("PendingDispatchRegistry — parent-indexed reverse lookup (D-04)", () => {
  let registry: PendingDispatchRegistry

  beforeEach(() => {
    registry = new PendingDispatchRegistry()
  })

  describe("add() with parent-indexed byParent map", () => {
    it("should index entry by callID key in the dispatches map", () => {
      const entry = {
        parentSessionID: "ses_parent123",
        callID: "call_abc",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
      }

      registry.add(entry)

      // Entry should be stored by callID key
      expect(registry.get("call:call_abc")).toEqual(entry)

      // has() should return true for the callID key
      expect(registry.has("call:call_abc")).toBe(true)

      // has() should return false for unrelated session IDs (CR-02 fix)
      expect(registry.has("ses_any_session")).toBe(false)

      // But size reflects the entry
      expect(registry.size).toBe(1)
    })

    it("should index multiple entries under different parents independently", () => {
      registry.add({
        parentSessionID: "ses_parentA",
        callID: "call_1",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
      })

      registry.add({
        parentSessionID: "ses_parentB",
        callID: "call_2",
        subagentType: "hm-l2-investigator",
        timestamp: Date.now(),
      })

      // Each callID key should be findable
      expect(registry.has("call:call_1")).toBe(true)
      expect(registry.has("call:call_2")).toBe(true)

      // Unknown session IDs should NOT match (CR-02 fix)
      expect(registry.has("ses_child_unknown")).toBe(false)

      // Size reflects both entries
      expect(registry.size).toBe(2)
    })
  })

  describe("has() — Gate 3 classification", () => {
    it("should return false for unknown childSessionID when only callID entries exist", () => {
      registry.add({
        parentSessionID: "ses_parent_main",
        callID: "call_xyz",
        subagentType: "hm-l2-build",
        timestamp: Date.now(),
      })

      // The child session ID is unknown at add() time.
      // has() should NOT return true for arbitrary sessions (CR-02 fix).
      expect(registry.has("ses_child_12345")).toBe(false)
      expect(registry.has("ses_another_child")).toBe(false)
      expect(registry.has("ses_random_session")).toBe(false)

      // But the callID key should work
      expect(registry.has("call:call_xyz")).toBe(true)
    })

    it("should return false when no pending dispatches exist (registry empty)", () => {
      expect(registry.has("ses_any_session")).toBe(false)
    })

    it("should return false when all entries are stale (>30s)", () => {
      const staleEntry = {
        parentSessionID: "ses_parent_old",
        callID: "call_stale",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now() - 31_000, // Just over STALE_THRESHOLD_MS
      }

      registry.add(staleEntry)

      // has() auto-cleans stale entries before checking
      expect(registry.has("call:call_stale")).toBe(false)
      expect(registry.has("ses_any_child")).toBe(false)
    })

    it("should return true for callID key when fresh entries exist", () => {
      registry.add({
        parentSessionID: "ses_parent_old",
        callID: "call_stale",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now() - 31_000,
      })

      registry.add({
        parentSessionID: "ses_parent_new",
        callID: "call_fresh",
        subagentType: "hm-l2-investigator",
        timestamp: Date.now(),
      })

      // Fresh callID key should be findable
      expect(registry.has("call:call_fresh")).toBe(true)
      // Stale callID key should be cleaned
      expect(registry.has("call:call_stale")).toBe(false)
      // Unknown session should NOT match
      expect(registry.has("ses_child_unknown")).toBe(false)
      // Size should reflect only the fresh entry
      expect(registry.size).toBe(1)
    })

    it("should return true for direct childID key (after updateWithChildID bridges)", () => {
      const entry = {
        parentSessionID: "ses_parent",
        callID: "call_bridge",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
      }
      registry.add(entry)
      registry.updateWithChildID("call_bridge", "ses_child_456")

      // has() should work via direct childID lookup
      expect(registry.has("ses_child_456")).toBe(true)
      // callID key is deleted by updateWithChildID (re-keyed to childID)
      expect(registry.has("call:call_bridge")).toBe(false)
    })
  })

  describe("removeByCallID() — byParent cleanup", () => {
    it("should remove entry from dispatches when callID is removed", () => {
      registry.add({
        parentSessionID: "ses_parent",
        callID: "call_to_remove",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
      })

      registry.add({
        parentSessionID: "ses_parent2",
        callID: "call_keep",
        subagentType: "hm-l2-investigator",
        timestamp: Date.now(),
      })

      // Before removal: both callIDs exist
      expect(registry.has("call:call_to_remove")).toBe(true)
      expect(registry.has("call:call_keep")).toBe(true)
      expect(registry.size).toBe(2)

      registry.removeByCallID("call_to_remove", "completed")

      // After removal: only one remains
      expect(registry.has("call:call_to_remove")).toBe(false)
      expect(registry.has("call:call_keep")).toBe(true)
      expect(registry.size).toBe(1)

      registry.removeByCallID("call_keep", "completed")

      // After all removed: empty
      expect(registry.has("call:call_keep")).toBe(false)
      expect(registry.size).toBe(0)
    })

    it("should handle removing a non-existent callID gracefully", () => {
      // Should NOT throw
      registry.removeByCallID("call_nonexistent", "completed")

      // Registry should still be empty
      expect(registry.size).toBe(0)
    })
  })

  describe("updateWithChildID() — preserves parent in byParent index", () => {
    it("should preserve entry after re-keying from callID to childID", () => {
      const entry = {
        parentSessionID: "ses_parent_rekey",
        callID: "call_rekey",
        subagentType: "hm-l2-build",
        timestamp: Date.now(),
      }

      registry.add(entry)
      registry.updateWithChildID("call_rekey", "ses_child_999")

      // The child session should be directly findable
      expect(registry.has("ses_child_999")).toBe(true)
    })
  })

  describe("cleanupStale() — byParent cleanup", () => {
    it("should remove stale entries from dispatches map", () => {
      registry.add({
        parentSessionID: "ses_parent_stale",
        callID: "call_old1",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now() - 31_000,
      })

      registry.add({
        parentSessionID: "ses_parent_stale",
        callID: "call_old2",
        subagentType: "hm-l2-investigator",
        timestamp: Date.now() - 32_000,
      })

      // Both entries stale → has() should return false (all cleaned up)
      expect(registry.has("call:call_old1")).toBe(false)
      expect(registry.has("call:call_old2")).toBe(false)
      expect(registry.size).toBe(0)
    })
  })

  describe("clear() — full reset", () => {
    it("should clear both dispatches and byParent maps", () => {
      registry.add({
        parentSessionID: "ses_parent_clear",
        callID: "call_clear",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
      })

      expect(registry.has("call:call_clear")).toBe(true)
      expect(registry.size).toBe(1)

      registry.clear()

      expect(registry.has("call:call_clear")).toBe(false)
      expect(registry.size).toBe(0)
    })
  })

  describe("getAnyActiveEntry() — byParent-based retrieval", () => {
    it("should return an active entry when byParent has entries", () => {
      registry.add({
        parentSessionID: "ses_parent_active",
        callID: "call_active",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
      })

      const entry = registry.getAnyActiveEntry()
      expect(entry).toBeDefined()
      expect(entry?.subagentType).toBe("hm-l2-researcher")
    })

    it("should return undefined when byParent is empty", () => {
      expect(registry.getAnyActiveEntry()).toBeUndefined()
    })

    it("should return undefined when all entries are stale", () => {
      registry.add({
        parentSessionID: "ses_parent_stale",
        callID: "call_stale_any",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now() - 31_000,
      })

      expect(registry.getAnyActiveEntry()).toBeUndefined()
    })
  })
})
