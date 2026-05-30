/**
 * End-to-end integration test covering ALL P21 fixes.
 *
 * Tests 6 plans in a single production-like scenario using real temp
 * directories and the full SessionTracker persistence initialization chain.
 *
 * Phases covered:
 *   1. F-01: Temp file cleanup — 100 atomic writes leave 0 .tmp files
 *   2. REQ-21-10/11 (F-19): childCount and totalDelegationDepth in manifest
 *   3. REQ-21-08 (F-18): Child metadata not anonymous
 *   4. REQ-21-05/06 (F-07): childToRootMain survives rebuild
 *   5. REQ-21-12 (G-3): Status not overwritten by repeated addSession calls
 *
 * @module tests/features/session-tracker/integration/phase-21
 */

import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { atomicWriteJson } from "../../../../src/features/session-tracker/persistence/atomic-write.js"
import { HierarchyIndex } from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"
import { ProjectIndexWriter } from "../../../../src/features/session-tracker/persistence/project-index-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"

// -------------------------------------------------------------------------
// P21 End-to-End Integration Test
// -------------------------------------------------------------------------

describe("Phase 21 Integration — all fixes", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "st-p21-int-"))
    // Create minimal session-tracker directory
    mkdirSync(join(tmpDir, ".hivemind", "session-tracker"), { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  // --- Phase 1: Temp file cleanup (F-01) ---
  it("Phase 1: 100 atomic writes leave 0 .tmp files", async () => {
    const filePath = join(tmpDir, ".hivemind", "session-tracker", "test-writes.json")
    for (let i = 0; i < 100; i++) {
      await atomicWriteJson(filePath, { iteration: i })
    }
    // Check the parent directory for temp files
    const parentDir = join(tmpDir, ".hivemind", "session-tracker")
    const allFiles: string[] = []
    const collect = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) collect(join(dir, entry.name))
        else allFiles.push(join(dir, entry.name))
      }
    }
    collect(parentDir)
    const tmpFiles = allFiles.filter((f) => f.includes(".tmp."))
    expect(tmpFiles.length).toBe(0)
  })

  // --- Phase 2: childCount and manifest (F-19, REQ-21-10/11, REQ-21-03/04) ---
  it("Phase 2: hierarchy with children produces correct childCount and manifest", async () => {
    const client = {} as any
    const hIndex = new HierarchyIndex({ projectRoot: tmpDir })

    // Register children
    hIndex.registerChild("root-session", "child-a")
    hIndex.registerChild("root-session", "child-b")
    hIndex.registerChild("root-session", "child-c")
    hIndex.registerChild("child-a", "child-a1")

    // Test childCount from hierarchy index (REQ-21-10)
    expect(hIndex.getChildCountForSession("root-session")).toBe(3)
    expect(hIndex.getChildCountForSession("child-a")).toBe(1)
    expect(hIndex.getChildCountForSession("child-a1")).toBe(0)

    // Test max depth (REQ-21-11)
    expect(hIndex.getMaxDepthForSession("root-session")).toBe(2)
    expect(hIndex.getMaxDepthForSession("child-a")).toBe(1)

    // Test ProjectIndexWriter wire with hierarchyIndex
    const piw = new ProjectIndexWriter({ client, projectRoot: tmpDir, hierarchyIndex: hIndex })

    // Write initial root session
    await piw.addSession("root-session", "root-session/", "root-session.md")

    // Update with childCount computation
    await piw.updateSession("root-session", { lastMessage: "test" })

    // Read project-continuity.json and verify
    const indexPath = join(tmpDir, ".hivemind", "session-tracker", "project-continuity.json")
    const raw = readFileSync(indexPath, "utf-8")
    const index = JSON.parse(raw)
    expect(index.sessions["root-session"].childCount).toBe(3)
    expect(index.sessions["root-session"].totalDelegationDepth).toBe(2)
  })

  // --- Phase 3: Child metadata not anonymous (F-18) ---
  it("Phase 3: child written with real agent name", async () => {
    const childWriter = new ChildWriter({ projectRoot: tmpDir })

    // Create child with real metadata (not "pending"/"unknown")
    await childWriter.createChildFile("root-session", "child-researcher", {
      sessionID: "child-researcher",
      parentSessionID: "root-session",
      delegationDepth: 1,
      delegatedBy: { agentName: "hm-l2-researcher", model: "claude-3", tool: "task", description: "Test task", subagentType: "hm-l2-researcher" },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "hm-l2-researcher", model: "claude-3" },
      turns: [],
      children: [],
    })

    // Read child file and verify metadata (REQ-21-08)
    const childPath = join(tmpDir, ".hivemind", "session-tracker", "root-session", "child-researcher.json")
    const raw = readFileSync(childPath, "utf-8")
    const record = JSON.parse(raw)
    expect(record.mainAgent.name).toBe("hm-l2-researcher")
    expect(record.mainAgent.model).toBe("claude-3")
    expect(record.delegatedBy.agentName).toBe("hm-l2-researcher")
  })

  // --- Phase 4: childToRootMain survives rebuild (F-07, REQ-21-05/06) ---
  it("Phase 4: rebuildChildToRootMain resolves all children after buildFromDisk", async () => {
    // Create continuity fixture on disk
    const continuity = {
      version: "2.0", projectRoot: tmpDir, lastUpdated: new Date().toISOString(),
      sessions: {},
      hierarchy: {
        children: {
          "l1-child": {
            file: "l1-child.json", depth: 1, status: "active",
            parentSessionID: "root-session", subagentType: "test", delegatedBy: "test",
            children: {
              "l2-child": {
                file: "l2-child.json", depth: 2, status: "active",
                parentSessionID: "l1-child", subagentType: "test", delegatedBy: "test",
              },
            },
          },
        },
      },
    }
    const sessionDir = join(tmpDir, ".hivemind", "session-tracker", "root-session")
    mkdirSync(sessionDir, { recursive: true })
    writeFileSync(
      join(sessionDir, "session-continuity.json"),
      JSON.stringify(continuity, null, 2),
      "utf-8",
    )

    // Initialize hierarchy index — this calls buildFromDisk
    const hIndex = new HierarchyIndex({ projectRoot: tmpDir })
    await hIndex.buildFromDisk()

    // Verify all children have rootMain (REQ-21-05)
    expect(hIndex.getRootMain("l1-child")).toBe("root-session")
    expect(hIndex.getRootMain("l2-child")).toBe("root-session")
    expect(hIndex.size).toBeGreaterThanOrEqual(2)
  })

  // --- Phase 5: Status not overwritten (G-3, REQ-21-12) ---
  it("Phase 5: session status preserved across multiple addSession calls", async () => {
    const client = {} as any
    const piw = new ProjectIndexWriter({ client, projectRoot: tmpDir })

    await piw.addSession("test-session", "test/", "test.md")

    // Simulate 5 hook callbacks
    for (let i = 0; i < 5; i++) {
      await piw.addSession("test-session", "test/", "test.md")
    }

    const indexPath = join(tmpDir, ".hivemind", "session-tracker", "project-continuity.json")
    const raw = readFileSync(indexPath, "utf-8")
    const index = JSON.parse(raw)
    expect(index.sessions["test-session"].status).toBe("active")
    expect(index.sessions["test-session"].status).not.toBeUndefined()
  })
})
