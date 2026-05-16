/**
 * Parallel children safety integration tests (GA-5).
 *
 * Verifies that parallel child sessions writing simultaneously to different
 * paths under the same parent are safe by design — no data loss, no corruption,
 * correct hierarchy depth, and independent file locks.
 *
 * These tests exercise real filesystem I/O with temp directories.
 *
 * @module tests/features/session-tracker/integration/parallel-children
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdir, rm, readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"
import type { ChildSessionRecord } from "../../../../src/features/session-tracker/types.js"
import { HierarchyIndex } from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tempProjectRoot(): Promise<string> {
  const dir = resolve(tmpdir(), `st-parallel-${randomBytes(4).toString("hex")}`)
  await mkdir(dir, { recursive: true })
  return dir
}

const PARENT_SESSION = "ses_parent_parallel"
const CHILDREN = [
  "ses_child_p001",
  "ses_child_p002",
  "ses_child_p003",
  "ses_child_p004",
  "ses_child_p005",
]

function makeChildRecord(overrides: Partial<ChildSessionRecord> & { sessionID: string }): ChildSessionRecord {
  return {
    parentSessionID: PARENT_SESSION,
    delegationDepth: 1,
    delegatedBy: { type: "task", callID: `call_${overrides.sessionID}` },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    status: "active",
    mainAgent: { name: "test-agent", model: "test-model" },
    turns: [],
    children: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Parallel children safety (GA-5)", () => {
  let testRoot: string
  let hierarchyIndex: HierarchyIndex
  let childWriter: ChildWriter

  beforeEach(async () => {
    testRoot = await tempProjectRoot()
    hierarchyIndex = new HierarchyIndex({ projectRoot: testRoot })
    childWriter = new ChildWriter({ projectRoot: testRoot, hierarchyIndex })

    // Create the parent session directory
    const trackerDir = resolve(testRoot, ".hivemind", "session-tracker")
    await mkdir(resolve(trackerDir, PARENT_SESSION), { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testRoot, { recursive: true, force: true })
    } catch {
      /* cleanup best-effort */
    }
  })

  describe("concurrent child writes", () => {
    it("writes 5 children in parallel without data loss", async () => {
      // Register all children in hierarchy
      for (const childID of CHILDREN) {
        hierarchyIndex.registerChild(PARENT_SESSION, childID)
      }

      // Write all children concurrently
      await Promise.all(
        CHILDREN.map((childID, index) =>
          childWriter.createChildFile(PARENT_SESSION, childID, makeChildRecord({
            sessionID: childID,
            created: new Date(Date.now() + index).toISOString(),
          })),
        ),
      )

      // Verify all children exist on disk
      const trackerDir = resolve(testRoot, ".hivemind", "session-tracker", PARENT_SESSION)
      const files = await readdir(trackerDir)
      const childFiles = files.filter(
        (f) => f.startsWith("ses_child_p") && f.endsWith(".json"),
      )
      expect(childFiles).toHaveLength(5)

      // Verify each child's content
      for (const childID of CHILDREN) {
        const childPath = resolve(trackerDir, `${childID}.json`)
        const content = JSON.parse(await readFile(childPath, "utf-8"))
        expect(content.sessionID).toBe(childID)
        expect(content.status).toBe("active")
      }
    })

    it("concurrent turn appends to different children don't corrupt", async () => {
      // Setup: create all children first
      for (const childID of CHILDREN) {
        hierarchyIndex.registerChild(PARENT_SESSION, childID)
        await childWriter.createChildFile(PARENT_SESSION, childID, makeChildRecord({
          sessionID: childID,
        }))
      }

      // Concurrently append turns to each child
      await Promise.all(
        CHILDREN.map((childID, index) =>
          childWriter.appendChildTurn(PARENT_SESSION, childID, {
            actor: "assistant",
            content: `Turn for ${childID} #${index}`,
          }),
        ),
      )

      // Verify each child has exactly 1 turn
      const trackerDir = resolve(testRoot, ".hivemind", "session-tracker", PARENT_SESSION)
      for (const childID of CHILDREN) {
        const childPath = resolve(trackerDir, `${childID}.json`)
        const content = JSON.parse(await readFile(childPath, "utf-8"))
        expect(content.turns).toHaveLength(1)
        expect(content.turns[0].content).toContain(childID)
      }
    })
  })

  describe("hierarchy depth correctness", () => {
    it("parallel children all report correct depth under same parent", () => {
      for (const childID of CHILDREN) {
        hierarchyIndex.registerChild(PARENT_SESSION, childID)
      }

      // All children should have depth 1 (L1)
      for (const childID of CHILDREN) {
        expect(hierarchyIndex.getDepth(childID)).toBe(1)
      }

      // Parent should have depth 0 (L0 main)
      expect(hierarchyIndex.getDepth(PARENT_SESSION)).toBe(0)
    })

    it("grandchild (L2) under parallel children reports correct depth", () => {
      // Register children
      for (const childID of CHILDREN) {
        hierarchyIndex.registerChild(PARENT_SESSION, childID)
      }

      // Register grandchildren under first two children
      const grandchild1 = "ses_gc_001"
      const grandchild2 = "ses_gc_002"
      hierarchyIndex.registerChild(CHILDREN[0], grandchild1)
      hierarchyIndex.registerChild(CHILDREN[1], grandchild2)

      // Grandchildren should have depth 2 (L2)
      expect(hierarchyIndex.getDepth(grandchild1)).toBe(2)
      expect(hierarchyIndex.getDepth(grandchild2)).toBe(2)

      // Children still depth 1
      expect(hierarchyIndex.getDepth(CHILDREN[0])).toBe(1)
      expect(hierarchyIndex.getDepth(CHILDREN[1])).toBe(1)

      // Parent still depth 0
      expect(hierarchyIndex.getDepth(PARENT_SESSION)).toBe(0)
    })
  })

  describe("independent file locks", () => {
    it("writing to different children uses separate file paths", async () => {
      const trackerDir = resolve(testRoot, ".hivemind", "session-tracker", PARENT_SESSION)

      // Write children sequentially to verify path separation
      for (const childID of CHILDREN) {
        hierarchyIndex.registerChild(PARENT_SESSION, childID)
        await childWriter.createChildFile(PARENT_SESSION, childID, makeChildRecord({
          sessionID: childID,
        }))
      }

      const files = await readdir(trackerDir)
      // Each child gets its own .json file — no shared file
      const jsonFiles = files.filter((f) => f.endsWith(".json"))
      expect(jsonFiles).toHaveLength(5)

      // No shared lock file or merge file should exist
      const lockFiles = files.filter(
        (f) => f.includes(".lock") || f.includes(".tmp"),
      )
      expect(lockFiles).toHaveLength(0)
    })
  })

  describe("concurrent writes to same parent", () => {
    it("all children appear on disk after parallel writes", async () => {
      // Register and write all children concurrently
      const writePromises = CHILDREN.map((childID) => {
        hierarchyIndex.registerChild(PARENT_SESSION, childID)
        return childWriter.createChildFile(PARENT_SESSION, childID, makeChildRecord({
          sessionID: childID,
        }))
      })
      await Promise.all(writePromises)

      // Verify all children appear on disk
      const trackerDir = resolve(testRoot, ".hivemind", "session-tracker", PARENT_SESSION)
      const files = await readdir(trackerDir)
      const childJsonFiles = files.filter(
        (f) => f.startsWith("ses_child_p") && f.endsWith(".json"),
      )
      expect(childJsonFiles).toHaveLength(5)
    })
  })
})
