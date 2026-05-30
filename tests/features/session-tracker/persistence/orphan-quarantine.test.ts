/**
 * Tests for OrphanQuarantine — moves orphan session directories to quarantine
 * instead of deleting them, with manifest verification and auto-cleanup.
 *
 * @module tests/features/session-tracker/orphan-quarantine.test
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { OrphanQuarantine } from "../../../../src/features/session-tracker/persistence/orphan-quarantine.js"
import { mkdir, rm, writeFile, readdir, stat, access } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

describe("OrphanQuarantine", () => {
  let trackerRoot: string
  let quarantine: OrphanQuarantine

  beforeEach(async () => {
    trackerRoot = join(tmpdir(), `orphan-quarantine-test-${Date.now()}`)
    await mkdir(trackerRoot, { recursive: true })
    quarantine = new OrphanQuarantine({ trackerRoot })
  })

  afterEach(async () => {
    try {
      await rm(trackerRoot, { recursive: true, force: true })
    } catch {
      // Best-effort cleanup
    }
  })

  describe("quarantineOrphan", () => {
    it("moves orphan directory to quarantine", async () => {
      // Create a fake orphan session directory
      const orphanPath = join(trackerRoot, "orphan-session-id")
      await mkdir(orphanPath, { recursive: true })
      await writeFile(join(orphanPath, "stale-file.txt"), "data")

      await quarantine.quarantineOrphan("orphan-session-id")

      // Original should be gone
      await expect(access(orphanPath)).rejects.toThrow()
      // Quarantined copy should exist
      const quarantinePath = join(trackerRoot, "quarantine", "orphan-session-id")
      await expect(access(quarantinePath)).resolves.toBeUndefined()
      // Contents preserved
      const files = await readdir(quarantinePath)
      expect(files).toContain("stale-file.txt")
    })

    it("creates quarantine directory if it does not exist", async () => {
      const orphanPath = join(trackerRoot, "another-orphan")
      await mkdir(orphanPath, { recursive: true })

      await quarantine.quarantineOrphan("another-orphan")

      const quarantineDir = join(trackerRoot, "quarantine")
      await expect(access(quarantineDir)).resolves.toBeUndefined()
    })

    it("handles non-existent orphan gracefully (no throw)", async () => {
      // Should not throw for missing directory
      await expect(
        quarantine.quarantineOrphan("non-existent-session"),
      ).resolves.toBeUndefined()
    })
  })

  describe("isInManifest", () => {
    it("returns true when session is registered in hierarchy manifest", async () => {
      // Create a session directory with hierarchy-manifest.json
      const sessionDir = join(trackerRoot, "main-session-id")
      await mkdir(sessionDir, { recursive: true })
      const manifest = {
        version: "1.0",
        rootMainSessionID: "main-session-id",
        lastUpdated: new Date().toISOString(),
        children: {
          "child-session-1": { sessionID: "child-session-1" },
          "child-session-2": { sessionID: "child-session-2" },
        },
        totalChildren: 2,
        maxDepth: 1,
      }
      await writeFile(
        join(sessionDir, "hierarchy-manifest.json"),
        JSON.stringify(manifest),
      )

      const result = await quarantine.isInManifest(
        "main-session-id",
        "child-session-1",
      )
      expect(result).toBe(true)
    })

    it("returns false when session is not in manifest", async () => {
      const sessionDir = join(trackerRoot, "main-session-2")
      await mkdir(sessionDir, { recursive: true })
      const manifest = {
        version: "1.0",
        rootMainSessionID: "main-session-2",
        lastUpdated: new Date().toISOString(),
        children: { "known-child": { sessionID: "known-child" } },
        totalChildren: 1,
        maxDepth: 1,
      }
      await writeFile(
        join(sessionDir, "hierarchy-manifest.json"),
        JSON.stringify(manifest),
      )

      const result = await quarantine.isInManifest(
        "main-session-2",
        "unknown-child",
      )
      expect(result).toBe(false)
    })

    it("returns false when manifest does not exist", async () => {
      const result = await quarantine.isInManifest(
        "non-existent-session",
        "any-child",
      )
      expect(result).toBe(false)
    })

    it("returns false when manifest is unparseable", async () => {
      const sessionDir = join(trackerRoot, "corrupt-session")
      await mkdir(sessionDir, { recursive: true })
      await writeFile(
        join(sessionDir, "hierarchy-manifest.json"),
        "not valid json {{{",
      )

      const result = await quarantine.isInManifest(
        "corrupt-session",
        "any-child",
      )
      expect(result).toBe(false)
    })
  })

  describe("cleanupOld", () => {
    it("removes quarantined entries older than threshold", async () => {
      // Create a quarantined entry with old timestamp
      const quarantineDir = join(trackerRoot, "quarantine")
      await mkdir(quarantineDir, { recursive: true })
      const oldEntry = join(quarantineDir, "old-orphan")
      await mkdir(oldEntry, { recursive: true })
      await writeFile(join(oldEntry, "data.txt"), "old data")

      // Set mtime to 10 days ago
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      await writeFile(join(oldEntry, ".quarantined-at"), tenDaysAgo.toISOString())

      const removed = await quarantine.cleanupOld(7)
      expect(removed).toContain("old-orphan")

      // Directory should be gone
      await expect(access(oldEntry)).rejects.toThrow()
    })

    it("preserves quarantined entries within threshold", async () => {
      const quarantineDir = join(trackerRoot, "quarantine")
      await mkdir(quarantineDir, { recursive: true })
      const recentEntry = join(quarantineDir, "recent-orphan")
      await mkdir(recentEntry, { recursive: true })
      await writeFile(
        join(recentEntry, ".quarantined-at"),
        new Date().toISOString(),
      )

      const removed = await quarantine.cleanupOld(7)
      expect(removed).not.toContain("recent-orphan")

      // Directory should still exist
      await expect(access(recentEntry)).resolves.toBeUndefined()
    })

    it("handles empty quarantine directory", async () => {
      const quarantineDir = join(trackerRoot, "quarantine")
      await mkdir(quarantineDir, { recursive: true })

      const removed = await quarantine.cleanupOld(7)
      expect(removed).toEqual([])
    })

    it("skips entries without .quarantined-at timestamp", async () => {
      const quarantineDir = join(trackerRoot, "quarantine")
      await mkdir(quarantineDir, { recursive: true })
      const noTimestampEntry = join(quarantineDir, "no-timestamp")
      await mkdir(noTimestampEntry, { recursive: true })

      const removed = await quarantine.cleanupOld(7)
      // Should not remove entries without timestamp (safety)
      expect(removed).not.toContain("no-timestamp")
    })
  })
})
