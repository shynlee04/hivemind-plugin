/**
 * Orphan quarantine protocol.
 *
 * Moves orphan session directories to `.hivemind/session-tracker/quarantine/`
 * instead of deleting them. Supports manifest verification (skip sessions
 * registered in hierarchy-manifest.json) and auto-cleanup of old entries.
 *
 * @module session-tracker/persistence/orphan-quarantine
 */

import { readdir, rename, rm, access, readFile } from "node:fs/promises"
import { join, dirname } from "node:path"
import { mkdir } from "node:fs/promises"

/**
 * Manages quarantine of orphan session directories.
 *
 * Orphans are session directories that exist on disk but are classified
 * as child sessions (they should not have their own directory). Instead
 * of deleting them, they are moved to quarantine for auditability.
 */
export class OrphanQuarantine {
  private trackerRoot: string
  private quarantineDir: string

  /**
   * @param deps - Injected dependencies.
   * @param deps.trackerRoot - Absolute path to `.hivemind/session-tracker/`.
   */
  constructor(deps: { trackerRoot: string }) {
    this.trackerRoot = deps.trackerRoot
    this.quarantineDir = join(deps.trackerRoot, "quarantine")
  }

  /**
   * Moves an orphan session directory to quarantine.
   *
   * Creates the quarantine directory if it does not exist. Records a
   * `.quarantined-at` timestamp file for cleanup eligibility.
   *
   * Best-effort: if the source directory does not exist, silently returns.
   *
   * @param sessionID - The orphan session directory name to quarantine.
   * @returns Promise that resolves when the move is complete.
   */
  async quarantineOrphan(sessionID: string): Promise<void> {
    const sourcePath = join(this.trackerRoot, sessionID)

    // Verify source exists before attempting move
    try {
      await access(sourcePath)
    } catch {
      // Directory does not exist — nothing to quarantine
      return
    }

    // Ensure quarantine directory exists
    await mkdir(this.quarantineDir, { recursive: true })

    const destPath = join(this.quarantineDir, sessionID)
    await rename(sourcePath, destPath)

    // Record quarantine timestamp for cleanup
    const timestampPath = join(destPath, ".quarantined-at")
    await this.writeFileSafe(timestampPath, new Date().toISOString())
  }

  /**
   * Checks if a session ID is registered in the hierarchy manifest
   * of a given root main session.
   *
   * @param rootMainSessionID - The root main session directory name.
   * @param childSessionID - The child session ID to check.
   * @returns `true` if the child is registered in the manifest.
   */
  async isInManifest(
    rootMainSessionID: string,
    childSessionID: string,
  ): Promise<boolean> {
    const manifestPath = join(
      this.trackerRoot,
      rootMainSessionID,
      "hierarchy-manifest.json",
    )

    try {
      const raw = await readFile(manifestPath, "utf-8")
      const manifest = JSON.parse(raw) as {
        children?: Record<string, { sessionID?: string }>
      }
      const children = manifest.children ?? {}
      return childSessionID in children
    } catch {
      // Manifest does not exist or is unparseable — treat as not registered
      return false
    }
  }

  /**
   * Removes quarantined entries older than the specified number of days.
   *
   * Entries must have a `.quarantined-at` timestamp file to be eligible
   * for cleanup. Entries without a timestamp are preserved (safety).
   *
   * @param daysThreshold - Number of days before an entry is considered stale.
   * @returns Array of session IDs that were removed.
   */
  async cleanupOld(daysThreshold: number): Promise<string[]> {
    const removed: string[] = []
    const cutoffMs = daysThreshold * 24 * 60 * 60 * 1000
    const now = Date.now()

    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = (await readdir(this.quarantineDir, {
        withFileTypes: true,
      })) as unknown as { name: string; isDirectory(): boolean }[]
    } catch {
      // Quarantine directory does not exist
      return removed
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith(".")) continue

      const timestampPath = join(this.quarantineDir, entry.name, ".quarantined-at")
      try {
        const raw = await readFile(timestampPath, "utf-8")
        const quarantinedAt = new Date(raw.trim()).getTime()
        if (isNaN(quarantinedAt)) continue // Invalid timestamp — skip

        if (now - quarantinedAt > cutoffMs) {
          const dirPath = join(this.quarantineDir, entry.name)
          await rm(dirPath, { recursive: true, force: true })
          removed.push(entry.name)
        }
      } catch {
        // No timestamp file — skip for safety
      }
    }

    return removed
  }

  /**
   * Safely writes content to a file, creating parent directories if needed.
   *
   * @param filePath - Absolute path to the file.
   * @param content - Content to write.
   */
  private async writeFileSafe(
    filePath: string,
    content: string,
  ): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true })
    const { writeFile } = await import("node:fs/promises")
    await writeFile(filePath, content, "utf-8")
  }
}
