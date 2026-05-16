/**
 * Integration tests for default→sub (child) session classification.
 *
 * RC-3: Verifies the three-gate classification chain correctly identifies
 * child sessions and falls back to main when no gate triggers.
 *
 * These tests assert behavior that requires source fixes (TDD RED):
 * - Gate 1 (SDK parentID) should detect child when SDK reports parentID
 * - Gate 2 (HierarchyIndex) should detect child when registered in hierarchy
 * - Gate 3 (PendingDispatchRegistry) should detect child when pending entry exists
 * - All gates fail → classification result is main (gate: "none")
 *
 * @module tests/features/session-tracker/integration/default-sub
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdir, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"

import { SessionClassifier } from "../../../../src/features/session-tracker/classification.js"
import { HierarchyIndex } from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"
import { PendingDispatchRegistry } from "../../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a temporary project root for real filesystem tests.
 */
async function tempProjectRoot(): Promise<string> {
  const dir = resolve(tmpdir(), `st-default-sub-${randomBytes(4).toString("hex")}`)
  await mkdir(dir, { recursive: true })
  return dir
}

/**
 * Mock SDK session fetcher that returns a session with optional parentID.
 */
function mockGetSessionSafely(parentID: string | null) {
  return async (_id: string) => ({
    id: "ses_mock",
    parentID,
    title: "Mock Session",
    time: { created: Date.now(), updated: Date.now() },
  })
}

/**
 * Mock SDK that always throws (simulates SDK failure).
 */
function mockGetSessionFails() {
  return async (_id: string) => {
    throw new Error("SDK unavailable")
  }
}

// ---------------------------------------------------------------------------
// Tests — TDD RED (expect failures until source is fixed)
// ---------------------------------------------------------------------------

describe("Default→Sub classification (RC-3)", () => {
  let testRoot: string

  beforeEach(async () => {
    testRoot = await tempProjectRoot()
  })

  afterEach(async () => {
    try {
      await rm(testRoot, { recursive: true, force: true })
    } catch {
      /* cleanup best-effort */
    }
  })

  describe("Gate 1: SDK parentID detection", () => {
    it("classifies session as child when SDK reports parentID", async () => {
      const classifier = new SessionClassifier({
        hierarchyIndex: undefined,
        pendingRegistry: undefined,
      })

      const result = await classifier.classify(
        "ses_child_001",
        mockGetSessionSafely("ses_parent_001"),
      )

      expect(result.parentID).toBe("ses_parent_001")
      expect(result.gate).toBe("sdk")
    })

    it("falls through to next gate when SDK reports null parentID", async () => {
      const classifier = new SessionClassifier({
        hierarchyIndex: undefined,
        pendingRegistry: undefined,
      })

      const result = await classifier.classify(
        "ses_main_001",
        mockGetSessionSafely(null),
      )

      // No hierarchy or pending → should be "none" (main)
      expect(result.parentID).toBeUndefined()
      expect(result.gate).toBe("none")
    })
  })

  describe("Gate 2: HierarchyIndex detection", () => {
    it("classifies session as child when HierarchyIndex has parent mapping", async () => {
      const hierarchyIndex = new HierarchyIndex({ projectRoot: testRoot })
      // Register child→parent in hierarchy
      hierarchyIndex.registerChild("ses_parent_002", "ses_child_002")

      const classifier = new SessionClassifier({
        hierarchyIndex,
        pendingRegistry: undefined,
      })

      const result = await classifier.classify(
        "ses_child_002",
        mockGetSessionSafely(null), // SDK says no parent
      )

      expect(result.parentID).toBe("ses_parent_002")
      expect(result.gate).toBe("hierarchy")
    })

    it("falls through to Gate 3 when HierarchyIndex has no entry", async () => {
      const hierarchyIndex = new HierarchyIndex({ projectRoot: testRoot })
      // Empty hierarchy — no children registered

      const classifier = new SessionClassifier({
        hierarchyIndex,
        pendingRegistry: undefined,
      })

      const result = await classifier.classify(
        "ses_unknown_001",
        mockGetSessionSafely(null),
      )

      expect(result.parentID).toBeUndefined()
      expect(result.gate).toBe("none")
    })
  })

  describe("Gate 3: PendingDispatchRegistry detection", () => {
    it("classifies session as child when PendingDispatchRegistry has entry", async () => {
      const pendingRegistry = new PendingDispatchRegistry()
      // Simulate a pending dispatch with known parent
      pendingRegistry.add({
        parentSessionID: "ses_parent_003",
        callID: "call_001",
        subagentType: "test-skill",
        timestamp: Date.now(),
      })
      // Update with real child ID
      pendingRegistry.updateWithChildID("call_001", "ses_child_003")

      const classifier = new SessionClassifier({
        hierarchyIndex: undefined,
        pendingRegistry,
      })

      const result = await classifier.classify(
        "ses_child_003",
        mockGetSessionSafely(null), // SDK says no parent
      )

      expect(result.parentID).toBe("ses_parent_003")
      expect(result.gate).toBe("pending")
    })

    it("returns main when pending registry has entry but no childID yet", async () => {
      const pendingRegistry = new PendingDispatchRegistry()
      // Register a call but don't resolve to child yet
      pendingRegistry.add({
        parentSessionID: "ses_parent_004",
        callID: "call_002",
        subagentType: "test-skill",
        timestamp: Date.now(),
      })

      const classifier = new SessionClassifier({
        hierarchyIndex: undefined,
        pendingRegistry,
      })

      // The session ID won't match any resolved child
      const result = await classifier.classify(
        "ses_unresolved_001",
        mockGetSessionSafely(null),
      )

      expect(result.parentID).toBeUndefined()
      expect(result.gate).toBe("none")
    })
  })

  describe("SDK failure conservative fallback", () => {
    it("falls through all gates gracefully when SDK throws", async () => {
      const classifier = new SessionClassifier({
        hierarchyIndex: undefined,
        pendingRegistry: undefined,
      })

      const result = await classifier.classify(
        "ses_sdkfail_001",
        mockGetSessionFails(),
      )

      // Conservative: SDK fail → skip Gate 1 → no other gates → main
      expect(result.parentID).toBeUndefined()
      expect(result.gate).toBe("none")
    })

    it("still detects child via hierarchy when SDK fails", async () => {
      const hierarchyIndex = new HierarchyIndex({ projectRoot: testRoot })
      hierarchyIndex.registerChild("ses_parent_005", "ses_child_005")

      const classifier = new SessionClassifier({
        hierarchyIndex,
        pendingRegistry: undefined,
      })

      const result = await classifier.classify(
        "ses_child_005",
        mockGetSessionFails(),
      )

      // Gate 1 fails, but Gate 2 catches it
      expect(result.parentID).toBe("ses_parent_005")
      expect(result.gate).toBe("hierarchy")
    })
  })
})
