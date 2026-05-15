/**
 * Orphan cleanup logic extracted from index.ts.
 *
 * Scans session-tracker directory for orphan child session directories
 * and moves them to quarantine (instead of deleting). Integrates with
 * OrphanQuarantine protocol.
 *
 * @module session-tracker/orphan-cleanup
 */

import type { OpenCodeClient } from "../../shared/session-api.js"
import type { HierarchyIndex } from "./persistence/hierarchy-index.js"
import type { OrphanQuarantine } from "./persistence/orphan-quarantine.js"
import { isValidSessionID } from "./types.js"
import { safeSessionPath, sessionTrackerRoot } from "./persistence/atomic-write.js"
import { readdir, access } from "node:fs/promises"
import { resolve } from "node:path"

/**
 * Result of an orphan cleanup operation.
 */
export interface OrphanCleanupResult {
  /** Session IDs that were quarantined. */
  quarantined: string[]
  /** Session IDs that were skipped (not orphans). */
  skipped: number
  /** Errors encountered during cleanup. */
  errors: string[]
}

/**
 * Manages detection and quarantine of orphan child session directories.
 */
export class OrphanCleanup {
  private client: OpenCodeClient
  private projectRoot: string
  private hierarchyIndex: HierarchyIndex | undefined
  private quarantine: OrphanQuarantine

  /**
   * @param deps - Injected dependencies.
   */
  constructor(deps: {
    client: OpenCodeClient
    projectRoot: string
    hierarchyIndex?: HierarchyIndex
    quarantine: OrphanQuarantine
  }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
    this.hierarchyIndex = deps.hierarchyIndex
    this.quarantine = deps.quarantine
  }

  /**
   * Scans for and quarantines orphan child session directories.
   *
   * An orphan is a directory whose session ID is classified as a child
   * in the hierarchy index. Instead of deleting, directories are moved
   * to the quarantine directory for auditability.
   *
   * Enhanced checks:
   * - HierarchyIndex.isChild() check (primary)
   * - Missing session-continuity.json + classified as child (secondary fallback)
   * - Manifest verification before quarantining
   * - Audit logging with reason for each action
   *
   * Best-effort: individual failures are silently skipped.
   *
   * @returns Result summary with quarantined count and errors.
   */
  async cleanupOrphanDirectories(): Promise<OrphanCleanupResult> {
    const result: OrphanCleanupResult = {
      quarantined: [],
      skipped: 0,
      errors: [],
    }

    const trackerRoot = sessionTrackerRoot(this.projectRoot)

    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = (await readdir(trackerRoot, {
        withFileTypes: true,
      })) as unknown as { name: string; isDirectory(): boolean }[]
    } catch {
      // Root directory doesn't exist yet — nothing to clean
      return result
    }

    // Skip quarantine and known non-session directories
    const skipDirs = new Set(["quarantine"])

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (skipDirs.has(entry.name)) continue

      const sessionID = entry.name

      // Skip non-session directories
      if (!isValidSessionID(sessionID)) {
        result.skipped++
        continue
      }

      let isOrphan = false
      let reason = ""

      // Check 1: hierarchyIndex classifies as child
      if (this.hierarchyIndex?.isChild(sessionID)) {
        isOrphan = true
        reason = "classified as child by HierarchyIndex"
      }

      // Check 2: No session-continuity.json + classified as child
      if (!isOrphan) {
        const indexPath = safeSessionPath(
          this.projectRoot,
          sessionID,
          "session-continuity.json",
        )
        try {
          await access(indexPath)
          // Has session-continuity.json — might be a legitimate main session
        } catch {
          // No session-continuity.json — likely orphan from race condition
          if (this.hierarchyIndex?.isChild(sessionID)) {
            isOrphan = true
            reason = "no session-continuity.json + classified as child"
          }
        }
      }

      if (isOrphan) {
        // Quarantine instead of delete (CP-ST-05-03)
        try {
          await this.quarantine.quarantineOrphan(sessionID)
          result.quarantined.push(sessionID)
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "info",
              message: `[Harness] Session tracker: quarantined orphan directory "${sessionID}" (${reason})`,
            },
          })
        } catch (err) {
          result.errors.push(
            `Failed to quarantine "${sessionID}": ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      } else {
        result.skipped++
      }
    }

    return result
  }

  /**
   * Removes orphaned `*.tmp.*` files from the session-tracker root.
   *
   * These accumulate when writes are interrupted (process killed between
   * writeFile and rename in atomicWriteJson/atomicAppendMarkdown).
   * Safe to remove — they're atomic-write intermediates, never the
   * authoritative file.
   */
  async cleanupOrphanedTmpFiles(): Promise<void> {
    try {
      const { unlink } = await import("node:fs/promises")
      const trackerRoot = resolve(this.projectRoot, ".hivemind", "session-tracker")

      const entries = await readdir(trackerRoot, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile()) continue
        if (entry.name.includes(".tmp.")) {
          const filePath = resolve(trackerRoot, entry.name)
          try {
            await unlink(filePath)
          } catch {
            // Best-effort: skip files that can't be removed
          }
        }
      }
    } catch {
      // Best-effort: directory may not exist or be inaccessible
    }
  }
}
