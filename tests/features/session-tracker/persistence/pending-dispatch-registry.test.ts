/**
 * PendingDispatchRegistry tests — parent-indexed reverse lookup (D-04).
 *
 * Validates that has() returns true for child sessions when ANY parent has
 * pending dispatch entries (broad classification). False positives are safe;
 * false negatives create orphan directories (the bug being fixed).
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
    it("should index entry by parentSessionID in the byParent reverse map", () => {
      const entry = {
        parentSessionID: "ses_parent123",
        callID: "call_abc",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
      }

      registry.add(entry)

      // Entry should be stored by callID key
      expect(registry.get("call:call_abc")).toEqual(entry)

      // byParent reverse index should exist (exposed via has() behavior)
      // Since ANY pending entry means has() should return true for all sessions,
      // we verify via the observable behavior: has() on any session returns true
      expect(registry.has("ses_any_session")).toBe(true)
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

      // Both entries should be present — has() returns true for any session
      expect(registry.has("ses_child_unknown")).toBe(true)
    })
  })

  describe("has() — Gate 3 classification", () => {
    it("should return true for any childSessionID when ANY pending dispatch exists", () => {
      registry.add({
        parentSessionID: "ses_parent_main",
        callID: "call_xyz",
        subagentType: "hm-l2-build",
        timestamp: Date.now(),
      })

      // The child session ID is unknown at add() time — that's the whole point.
      // When session.created fires, we get ses_child_12345 but the registry
      // was keyed by call:call_xyz. The fixed has() should still return true.
      expect(registry.has("ses_child_12345")).toBe(true)
      expect(registry.has("ses_another_child")).toBe(true)
      expect(registry.has("ses_random_session")).toBe(true)
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
      expect(registry.has("ses_any_child")).toBe(false)
    })

    it("should return true when mix of stale and fresh entries exist", () => {
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

      // One fresh entry → has() returns true
      expect(registry.has("ses_child_unknown")).toBe(true)
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

      // Now has() should work via direct childID lookup too
      expect(registry.has("ses_child_456")).toBe(true)
    })
  })

  describe("removeByCallID() — byParent cleanup", () => {
    it("should remove entry from byParent index when callID is removed", () => {
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

      // Before removal: has() returns true (entries exist)
      expect(registry.has("ses_any")).toBe(true)

      registry.removeByCallID("call_to_remove")

      // After removal: still true (one entry remains)
      expect(registry.has("ses_any")).toBe(true)

      registry.removeByCallID("call_keep")

      // After all removed: false (no entries)
      expect(registry.has("ses_any")).toBe(false)
    })

    it("should handle removing a non-existent callID gracefully", () => {
      // Should NOT throw
      registry.removeByCallID("call_nonexistent")

      // Registry should still be empty
      expect(registry.has("ses_any")).toBe(false)
    })
  })

  describe("updateWithChildID() — preserves parent in byParent index", () => {
    it("should preserve byParent entry after re-keying from callID to childID", () => {
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

      // And the child's parent still has pending entries — has() is broad
    })
  })

  describe("cleanupStale() — byParent cleanup", () => {
    it("should remove stale entries from byParent index", () => {
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
      expect(registry.has("ses_any")).toBe(false)
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

      expect(registry.has("ses_any")).toBe(true)

      registry.clear()

      expect(registry.has("ses_any")).toBe(false)
      expect(registry.size).toBe(0)
    })
  })
})
