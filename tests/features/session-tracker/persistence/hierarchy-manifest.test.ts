/**
 * HierarchyManifestWriter tests — hierarchy-manifest.json management (D-07).
 *
 * Validates that the HierarchyManifestWriter:
 * - Adds child entries with correct metadata
 * - Writes to the correct path (next to session-continuity.json)
 * - Updates child statuses
 * - Returns all children or a single child
 * - Uses atomic write (write-tmp → rename) pattern
 * - Tracks children at multiple delegation depths
 *
 * @module tests/features/session-tracker/persistence/hierarchy-manifest
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdir, readFile, readdir } from "node:fs/promises"
import { resolve, dirname, join } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"
import { unlinkSync, rmSync, existsSync } from "node:fs"
import { HierarchyManifestWriter } from "../../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
import { safeSessionPath } from "../../../../src/features/session-tracker/persistence/atomic-write.js"
import type { HierarchyManifest } from "../../../../src/features/session-tracker/types.js"

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

let projectRoot: string
let writer: HierarchyManifestWriter

function makeTempDir(): string {
  const dir = resolve(tmpdir(), `hm-test-${randomBytes(4).toString("hex")}`)
  rmSync(dir, { recursive: true, force: true })
  return dir
}

beforeEach(() => {
  projectRoot = makeTempDir()
  // Ensure the .hivemind/session-tracker root exists
  mkdir(resolve(projectRoot, ".hivemind", "session-tracker"), { recursive: true }).catch(() => {})
  writer = new HierarchyManifestWriter({ projectRoot })
})

afterEach(() => {
  try { rmSync(projectRoot, { recursive: true, force: true }) } catch { /* best-effort */ }
})

// ---------------------------------------------------------------------------
// Test 1: addChild adds a child entry with correct fields
// ---------------------------------------------------------------------------

describe("addChild", () => {
  it("adds a child entry to the manifest with correct fields (sessionID, parentSessionID, depth, status, delegatedBy, createdAt)", async () => {
    const rootMain = "ses_rootMain123456789"
    const child = "ses_child987654321"

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: child,
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: `${child}.json`,
    })

    const result = await writer.getChild(rootMain, child)
    expect(result).toBeDefined()
    expect(result!.sessionID).toBe(child)
    expect(result!.parentSessionID).toBe(rootMain)
    expect(result!.rootMainSessionID).toBe(rootMain)
    expect(result!.delegationDepth).toBe(1)
    expect(result!.delegatedBy).toBe("hm-l0-orchestrator")
    expect(result!.subagentType).toBe("hm-l2-researcher")
    expect(result!.status).toBe("active")
    expect(result!.turnCount).toBe(0)
    expect(result!.childFile).toBe(`${child}.json`)
    expect(result!.createdAt).toBeDefined()
    expect(result!.updatedAt).toBeDefined()
  })

  // -------------------------------------------------------------------------
  // Test 2: manifest writes to correct path (next to session-continuity.json)
  // -------------------------------------------------------------------------

  it("writes manifest to the correct path: {rootMainDir}/hierarchy-manifest.json (next to session-continuity.json)", async () => {
    const rootMain = "ses_rootMainWritePath"

    // First create session-continuity.json in the root main directory
    const sessionDir = dirname(safeSessionPath(projectRoot, rootMain, "session-continuity.json"))
    await mkdir(sessionDir, { recursive: true })

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_childWritePath",
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: "ses_childWritePath.json",
    })

    const manifestPath = safeSessionPath(projectRoot, rootMain, "hierarchy-manifest.json")
    expect(existsSync(manifestPath)).toBe(true)
    // Session continuity path should be in same directory
    const continuityPath = safeSessionPath(projectRoot, rootMain, "session-continuity.json")
    expect(dirname(manifestPath)).toBe(dirname(continuityPath))
  })

  // -------------------------------------------------------------------------
  // Test 3: updateChildStatus updates status of an existing child entry
  // -------------------------------------------------------------------------

  it("updateChildStatus updates status of an existing child entry", async () => {
    const rootMain = "ses_rootMainStatus123"
    const child = "ses_childStatus456"

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: child,
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: `${child}.json`,
    })

    await writer.updateChildStatus(rootMain, child, "completed")

    const result = await writer.getChild(rootMain, child)
    expect(result!.status).toBe("completed")
  })

  // -------------------------------------------------------------------------
  // Test 4: getChildren returns all child entries with their current statuses
  // -------------------------------------------------------------------------

  it("getChildren returns all child entries with their current statuses", async () => {
    const rootMain = "ses_rootMainChildren"

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_childA",
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: "ses_childA.json",
    })

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_childB",
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-investigator",
      childFile: "ses_childB.json",
    })

    await writer.updateChildStatus(rootMain, "ses_childB", "completed")

    const children = await writer.getChildren(rootMain)
    expect(Object.keys(children)).toHaveLength(2)
    expect(children["ses_childA"].status).toBe("active")
    expect(children["ses_childB"].status).toBe("completed")
  })

  // -------------------------------------------------------------------------
  // Test 5: manifest is written atomically (no .tmp files left behind)
  // -------------------------------------------------------------------------

  it("manifest is written atomically (write-to-tmp → rename pattern, no .tmp remnants)", async () => {
    const rootMain = "ses_rootMainAtomicWrite"

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_childAtomic",
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: "ses_childAtomic.json",
    })

    // Verify no .tmp files are left in the session directory
    const sessionDir = dirname(safeSessionPath(projectRoot, rootMain, "hierarchy-manifest.json"))
    const files = await readdir(sessionDir)
    const tmpFiles = files.filter((f: string) => f.includes(".tmp."))
    expect(tmpFiles).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // Test 6: getChild returns a single child entry by sessionID
  // -------------------------------------------------------------------------

  it("getChild returns a single child entry by sessionID", async () => {
    const rootMain = "ses_rootMainSingleChild"

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_loneChild",
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: "ses_loneChild.json",
    })

    const result = await writer.getChild(rootMain, "ses_loneChild")
    expect(result).toBeDefined()
    expect(result!.sessionID).toBe("ses_loneChild")

    // Non-existent child returns undefined
    const missing = await writer.getChild(rootMain, "ses_nonexistent")
    expect(missing).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // Test 7: Multiple children at different depths (L1, L2) tracked correctly
  // -------------------------------------------------------------------------

  it("tracks multiple children at different depths (L1, L2) with correct delegationDepth", async () => {
    const rootMain = "ses_rootMainMultiDepth"

    // L1 child
    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_l1Child",
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: "ses_l1Child.json",
    })

    // L2 grandchild (parent is the L1 child)
    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_l2Grandchild",
      parentSessionID: "ses_l1Child",
      delegationDepth: 2,
      delegatedBy: "hm-l2-researcher",
      subagentType: "hm-l2-investigator",
      childFile: "ses_l2Grandchild.json",
    })

    const children = await writer.getChildren(rootMain)
    expect(Object.keys(children)).toHaveLength(2)

    const l1 = await writer.getChild(rootMain, "ses_l1Child")
    expect(l1!.delegationDepth).toBe(1)
    expect(l1!.parentSessionID).toBe(rootMain)

    const l2 = await writer.getChild(rootMain, "ses_l2Grandchild")
    expect(l2!.delegationDepth).toBe(2)
    expect(l2!.parentSessionID).toBe("ses_l1Child")
    expect(l2!.rootMainSessionID).toBe(rootMain)
  })

  // -------------------------------------------------------------------------
  // Test: loadManifest returns empty default when no file exists
  // -------------------------------------------------------------------------

  it("returns an empty manifest when no file exists yet", async () => {
    const rootMain = "ses_rootMainNotYetCreated"

    const children = await writer.getChildren(rootMain)
    expect(children).toEqual({})

    const child = await writer.getChild(rootMain, "ses_any")
    expect(child).toBeUndefined()
  })

  // -------------------------------------------------------------------------
  // Test: updateChildStatus is a no-op for non-existent children
  // -------------------------------------------------------------------------

  it("updateChildStatus silently no-ops for non-existent children", async () => {
    const rootMain = "ses_rootMainNoopStatus"

    // Should not throw
    await writer.updateChildStatus(rootMain, "ses_ghostChild", "completed")

    const children = await writer.getChildren(rootMain)
    expect(Object.keys(children)).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // Test: totalChildren and maxDepth are correctly maintained
  // -------------------------------------------------------------------------

  it("correctly maintains totalChildren count and maxDepth", async () => {
    const rootMain = "ses_rootMainCounts"

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_countChild1",
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "hm-l0-orchestrator",
      subagentType: "hm-l2-researcher",
      childFile: "ses_countChild1.json",
    })

    await writer.addChild({
      rootMainSessionID: rootMain,
      childSessionID: "ses_countChild2",
      parentSessionID: rootMain,
      delegationDepth: 3,
      delegatedBy: "hm-l2-researcher",
      subagentType: "hm-l2-investigator",
      childFile: "ses_countChild2.json",
    })

    // Read the manifest file directly to verify counts
    const manifestPath = safeSessionPath(projectRoot, rootMain, "hierarchy-manifest.json")
    const raw = await readFile(manifestPath, "utf-8")
    const manifest = JSON.parse(raw) as HierarchyManifest

    expect(manifest.totalChildren).toBe(2)
    expect(manifest.maxDepth).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// F-01 temp leak in hierarchy-manifest
// ---------------------------------------------------------------------------

describe("F-01 temp leak in hierarchy-manifest", () => {
  let f01Dir: string
  let f01Writer: HierarchyManifestWriter

  beforeEach(() => {
    const { mkdtempSync } = require("node:fs") as typeof import("node:fs")
    f01Dir = mkdtempSync(join(tmpdir(), "st-hm-f01-"))
    f01Writer = new HierarchyManifestWriter({ projectRoot: f01Dir })
  })

  afterEach(() => {
    rmSync(f01Dir, { recursive: true, force: true })
  })

  it("writeManifest does not leave .tmp files", async () => {
    await f01Writer.addChild({
      rootMainSessionID: "root-ses-test",
      childSessionID: "child-ses-test",
      parentSessionID: "root-ses-test",
      delegationDepth: 1,
      delegatedBy: "test-agent",
      subagentType: "test",
      childFile: "child-ses-test.json",
    })
    // After addChild (which calls writeManifest), check for temp files
    const rootDir = join(f01Dir, ".hivemind", "session-tracker", "root-ses-test")
    const { readdirSync } = require("node:fs") as typeof import("node:fs")
    const files = readdirSync(rootDir)
    const tmpFiles = files.filter((f: string) => f.includes(".tmp."))
    expect(tmpFiles).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// generateFromContinuity — G-1 derivative cache tests
// ---------------------------------------------------------------------------

describe("generateFromContinuity", () => {
  let gfcDir: string
  let gfcWriter: HierarchyManifestWriter

  beforeEach(() => {
    const { mkdtempSync } = require("node:fs") as typeof import("node:fs")
    gfcDir = mkdtempSync(join(tmpdir(), "st-gfc-"))
    // Create session-tracker directory structure
    const { mkdirSync } = require("node:fs") as typeof import("node:fs")
    mkdirSync(join(gfcDir, ".hivemind", "session-tracker", "root-session"), { recursive: true })
    gfcWriter = new HierarchyManifestWriter({ projectRoot: gfcDir })
  })

  afterEach(() => {
    rmSync(gfcDir, { recursive: true, force: true })
  })

  it("generates empty manifest when no continuity file exists", async () => {
    const manifest = await gfcWriter.generateFromContinuity("root-session")
    expect(manifest.totalChildren).toBe(0)
    expect(manifest.children).toEqual({})
  })

  it("generates manifest with 3 children from continuity tree", async () => {
    const { writeFileSync } = require("node:fs") as typeof import("node:fs")

    // Write a fixture session-continuity.json
    const continuity = {
      version: "2.0",
      sessionID: "root-session",
      lastUpdated: new Date().toISOString(),
      hierarchy: {
        root: "root-session",
        children: {
          "child-1": {
            file: "child-1.json",
            depth: 1,
            status: "completed",
            delegatedBy: "test",
            children: {},
          },
          "child-2": {
            file: "child-2.json",
            depth: 1,
            status: "active",
            delegatedBy: "test",
            children: {},
          },
          "child-3": {
            file: "child-3.json",
            depth: 2,
            status: "active",
            delegatedBy: "child-1",
            children: {},
          },
        },
      },
      turnCount: 0,
      toolSummary: {},
    }
    const indexPath = join(gfcDir, ".hivemind", "session-tracker", "root-session", "session-continuity.json")
    writeFileSync(indexPath, JSON.stringify(continuity, null, 2), "utf-8")

    const manifest = await gfcWriter.generateFromContinuity("root-session")

    expect(manifest.totalChildren).toBe(3)
    expect(manifest.children["child-1"]).toBeDefined()
    expect(manifest.children["child-2"]).toBeDefined()
    expect(manifest.children["child-3"]).toBeDefined()
    expect(manifest.children["child-1"].delegationDepth).toBe(1)
    expect(manifest.children["child-3"].delegationDepth).toBe(2)
  })

  it("loadManifest regenerates from continuity when manifest file missing", async () => {
    const { writeFileSync } = require("node:fs") as typeof import("node:fs")

    // Write continuity but NO manifest file
    const continuity = {
      version: "2.0",
      sessionID: "root-session",
      lastUpdated: new Date().toISOString(),
      hierarchy: {
        root: "root-session",
        children: {
          "child-1": {
            file: "child-1.json",
            depth: 1,
            status: "active",
            delegatedBy: "test",
            children: {},
          },
        },
      },
      turnCount: 0,
      toolSummary: {},
    }
    const indexPath = join(gfcDir, ".hivemind", "session-tracker", "root-session", "session-continuity.json")
    writeFileSync(indexPath, JSON.stringify(continuity, null, 2), "utf-8")

    const children = await gfcWriter.getChildren("root-session")

    expect(Object.keys(children).length).toBe(1)
    expect(children["child-1"]).toBeDefined()
  })
})
