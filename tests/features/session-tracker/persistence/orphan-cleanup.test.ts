/**
 * Tests for OrphanCleanup — G-6 guardrail (REQ-21-14).
 *
 * Validates the checkContinuityTree() guardrail that prevents quarantining
 * legitimate children with valid continuity tree entries.
 *
 * @module tests/features/session-tracker/persistence/orphan-cleanup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, mkdtemp, rm, writeFile, access } from "node:fs/promises"
import { mkdirSync, mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { OrphanCleanup } from "../../../../src/features/session-tracker/orphan-cleanup.js"
import { OrphanQuarantine } from "../../../../src/features/session-tracker/persistence/orphan-quarantine.js"
import { HierarchyIndex } from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"
import { sessionTrackerRoot } from "../../../../src/features/session-tracker/persistence/atomic-write.js"

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/**
 * Creates a temporary project root with session-tracker subdirectory.
 */
async function createTempProjectRoot(): Promise<string> {
  const root = join(tmpdir(), `orphan-cleanup-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  await mkdir(sessionTrackerRoot(root), { recursive: true })
  return root
}

/**
 * Creates a session directory with an optional session-continuity.json file.
 */
async function createSessionDir(
  projectRoot: string,
  sessionID: string,
  hasContinuity: boolean,
): Promise<void> {
  const sessionDir = join(sessionTrackerRoot(projectRoot), sessionID)
  await mkdir(sessionDir, { recursive: true })

  if (hasContinuity) {
    const continuity = {
      version: "2.0",
      sessionID,
      lastUpdated: new Date().toISOString(),
      hierarchy: { root: sessionID, children: {} },
      turnCount: 0,
      toolSummary: {},
    }
    await writeFile(
      join(sessionDir, "session-continuity.json"),
      JSON.stringify(continuity, null, 2),
    )
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OrphanCleanup — G-6 guardrail (REQ-21-14)", () => {
  // ── Test 1: checkContinuityTree returns true when continuity file exists ──

  describe("checkContinuityTree", () => {
    let projectRoot: string
    let cleanup: OrphanCleanup

    beforeEach(async () => {
      projectRoot = await createTempProjectRoot()
      const quarantine = new OrphanQuarantine({
        trackerRoot: sessionTrackerRoot(projectRoot),
      })
      cleanup = new OrphanCleanup({
        client: { app: { log: vi.fn() } } as any,
        projectRoot,
        sessionRouter: { route: vi.fn().mockResolvedValue({ route: "main" }) },
        quarantine,
      })
    })

    afterEach(async () => {
      await rm(projectRoot, { recursive: true, force: true }).catch(() => {})
    })

    it("should return true when session-continuity.json exists", async () => {
      await createSessionDir(projectRoot, "ses_has_continuity", true)
      const result = await (cleanup as any).checkContinuityTree("ses_has_continuity")
      expect(result).toBe(true)
    })

    it("should return false when session-continuity.json does not exist", async () => {
      await createSessionDir(projectRoot, "ses_no_continuity", false)
      const result = await (cleanup as any).checkContinuityTree("ses_no_continuity")
      expect(result).toBe(false)
    })

    it("should return false for non-existent session directory", async () => {
      const result = await (cleanup as any).checkContinuityTree("ses_nonexistent")
      expect(result).toBe(false)
    })
  })

  // ── Test 2: Warning emitted before quarantining a session with continuity entry ──

  describe("cleanupOrphanDirectories — warning on continuity presence", () => {
    let projectRoot: string

    beforeEach(async () => {
      projectRoot = await createTempProjectRoot()
    })

    afterEach(async () => {
      await rm(projectRoot, { recursive: true, force: true }).catch(() => {})
    })

    it("should emit warning when quarantining a session that has a continuity tree entry", async () => {
      const mockLog = vi.fn()
      const quarantine = new OrphanQuarantine({
        trackerRoot: sessionTrackerRoot(projectRoot),
      })

      // Create a HierarchyIndex that classifies our session as a child
      const hierarchyIndex = new HierarchyIndex({ projectRoot })
      hierarchyIndex.registerChild("ses_main", "ses_orphan_child")

      // Create the orphan session directory WITH a continuity file
      await createSessionDir(projectRoot, "ses_orphan_child", true)

      const cleanup = new OrphanCleanup({
        client: { app: { log: mockLog } } as any,
        projectRoot,
        hierarchyIndex,
        sessionRouter: { route: vi.fn().mockResolvedValue({ route: "child" }) },
        quarantine,
      })

      const result = await cleanup.cleanupOrphanDirectories()

      // Should have quarantined the orphan
      expect(result.quarantined).toContain("ses_orphan_child")

      // Warning should have been emitted about continuity tree entry
      expect(mockLog).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            service: "session-tracker",
            level: "warn",
            message: expect.stringContaining("continuity tree entry"),
          }),
        }),
      )
    })

    it("should NOT emit continuity warning when orphan has no continuity file", async () => {
      const mockLog = vi.fn()
      const quarantine = new OrphanQuarantine({
        trackerRoot: sessionTrackerRoot(projectRoot),
      })

      const hierarchyIndex = new HierarchyIndex({ projectRoot })
      hierarchyIndex.registerChild("ses_main", "ses_orphan_no_cont")

      // Create orphan WITHOUT continuity file
      await createSessionDir(projectRoot, "ses_orphan_no_cont", false)

      const cleanup = new OrphanCleanup({
        client: { app: { log: mockLog } } as any,
        projectRoot,
        hierarchyIndex,
        sessionRouter: { route: vi.fn().mockResolvedValue({ route: "child" }) },
        quarantine,
      })

      const result = await cleanup.cleanupOrphanDirectories()

      expect(result.quarantined).toContain("ses_orphan_no_cont")

      // Should not have continuity warning (no continuity file exists)
      const continuityWarnings = mockLog.mock.calls.filter(
        (call: any[]) =>
          call[0]?.body?.message?.includes?.("continuity tree entry"),
      )
      expect(continuityWarnings).toHaveLength(0)
    })
  })

  // ── Test 3: Clean temp dir lifecycle test ──

  describe("temp directory lifecycle", () => {
    it("should create and clean up temp directories safely", async () => {
      // mkdtempSync lifecycle
      const lifecycleDir = mkdtempSync(join(tmpdir(), "orphan-lifecycle-"))
      expect(() => existsSyncCheck(lifecycleDir)).not.toThrow()

      // Verify directory exists
      await expect(access(lifecycleDir)).resolves.toBeUndefined()

      // Clean up
      rmSync(lifecycleDir, { recursive: true, force: true })

      // Verify directory is gone
      await expect(access(lifecycleDir)).rejects.toThrow()
    })

    it("should handle cleanup of non-existent directory gracefully", () => {
      const nonExistent = join(tmpdir(), "non-existent-orphan-dir")
      expect(() => rmSync(nonExistent, { recursive: true, force: true })).not.toThrow()
    })
  })
})

/**
 * Checks if a path exists on the local filesystem.
 * Used by the lifecycle test to verify mkdtempSync/rmSync work correctly.
 */
function existsSyncCheck(dirPath: string): boolean {
  try {
    const { accessSync } = require("node:fs") as typeof import("node:fs")
    accessSync(dirPath)
    return true
  } catch {
    return false
  }
}
