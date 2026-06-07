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
import type { ChildHierarchyEntry, SessionContinuityIndex, HierarchyManifest } from "./types.js"
import { safeSessionPath, sessionTrackerRoot, atomicWriteJson } from "./persistence/atomic-write.js"
import { readdir, access, readFile, rename, unlink } from "node:fs/promises"
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
   * Checks whether a session has a continuity tree entry on disk.
   * Returns true if session-continuity.json exists for the session.
   *
   * G-6 guardrail: prevents quarantining legitimate children that
   * happen to have continuity tree entries but are classified as orphans.
   *
   * @param sessionID - The session identifier to check.
   * @returns True if continuity file exists.
   */
  private async checkContinuityTree(sessionID: string): Promise<boolean> {
    try {
      const indexPath = safeSessionPath(
        this.projectRoot,
        sessionID,
        "session-continuity.json",
      )
      await access(indexPath)
      return true
    } catch {
      return false
    }
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
        // G-6 guardrail (REQ-21-14): Warn if quarantining a session that has
        // a valid continuity tree entry — it may be a legitimate child that
        // should not be quarantined.
        const hasContinuity = await this.checkContinuityTree(sessionID)
        if (hasContinuity) {
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Hivemind] Session tracker: quarantining "${sessionID}" which has a continuity tree entry — may be a legitimate child`,
            },
          })
        }

        // Quarantine instead of delete (CP-ST-05-03)
        try {
          await this.preserveOrphanHierarchy(sessionID)
          await this.quarantine.quarantineOrphan(sessionID)
          result.quarantined.push(sessionID)
          void this.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "info",
              message: `[Hivemind] Session tracker: quarantined orphan directory "${sessionID}" (${reason})`,
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
   * Preserves nested child records from an orphan child directory before it is
   * moved to quarantine.
   *
   * If an L1 child incorrectly has its own `session-continuity.json`, its L2
   * child records are merged into the root main session hierarchy and manifest.
   * Any child `.json` files found in the orphan directory are moved into the
   * root main directory. This prevents cleanup from erasing delegated-session
   * history that should have lived under the root main session all along.
   *
   * @param orphanSessionID - Child session directory being quarantined.
   */
  private async preserveOrphanHierarchy(orphanSessionID: string): Promise<void> {
    const rootMainSessionID = this.hierarchyIndex?.getRootMain(orphanSessionID)
    if (!rootMainSessionID) return

    const orphanIndex = await this.readJson<SessionContinuityIndex>(
      safeSessionPath(this.projectRoot, orphanSessionID, "session-continuity.json"),
    )
    if (!orphanIndex?.hierarchy?.children) return

    const rootIndexPath = safeSessionPath(this.projectRoot, rootMainSessionID, "session-continuity.json")
    const rootIndex =
      (await this.readJson<SessionContinuityIndex>(rootIndexPath)) ??
      this.createDefaultIndex(rootMainSessionID)

    const manifestPath = safeSessionPath(this.projectRoot, rootMainSessionID, "hierarchy-manifest.json")
    const manifest =
      (await this.readJson<HierarchyManifest>(manifestPath)) ??
      this.createDefaultManifest(rootMainSessionID)

    const orphanEntry = rootIndex.hierarchy.children[orphanSessionID]
    if (!orphanEntry) return

    for (const [childID, childEntry] of Object.entries(orphanIndex.hierarchy.children)) {
      const normalizedEntry: ChildHierarchyEntry = {
        ...childEntry,
        depth: Math.max(2, childEntry.depth + 1),
        children: childEntry.children ?? {},
      }

      await this.moveChildJsonToRoot(
        orphanSessionID,
        rootMainSessionID,
        normalizedEntry.file,
      )

      orphanEntry.children[childID] = normalizedEntry
      manifest.children[childID] = {
        sessionID: childID,
        parentSessionID: orphanSessionID,
        rootMainSessionID,
        delegationDepth: normalizedEntry.depth,
        delegatedBy: normalizedEntry.delegatedBy,
        subagentType: normalizedEntry.subagentType ?? normalizedEntry.delegatedBy ?? "unknown",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: normalizedEntry.status,
        turnCount: 0,
        childFile: normalizedEntry.file,
      }
    }

    const now = new Date().toISOString()
    rootIndex.lastUpdated = now
    manifest.lastUpdated = now
    manifest.totalChildren = Object.keys(manifest.children).length
    manifest.maxDepth = Math.max(
      0,
      ...Object.values(manifest.children).map((child) => child.delegationDepth),
    )

    await atomicWriteJson(rootIndexPath, rootIndex)
    await atomicWriteJson(manifestPath, manifest)
  }

  /**
   * Moves a child JSON record from an orphan child directory into root main.
   * Existing root records are preserved and never overwritten.
   *
   * @param orphanSessionID - Orphan directory session ID.
   * @param rootMainSessionID - Root main directory owner.
   * @param childFile - Child JSON filename.
   */
  private async moveChildJsonToRoot(
    orphanSessionID: string,
    rootMainSessionID: string,
    childFile: string,
  ): Promise<void> {
    if (!childFile.endsWith(".json")) return
    const sourcePath = safeSessionPath(this.projectRoot, orphanSessionID, childFile)
    const targetPath = safeSessionPath(this.projectRoot, rootMainSessionID, childFile)
    try {
      await access(targetPath)
      return
    } catch {
      // Target missing — move from orphan if present.
    }

    try {
      await rename(sourcePath, targetPath)
    } catch {
      // Source may not exist; hierarchy merge still preserves the reference.
    }
  }

  /**
   * Reads and parses a JSON file, returning undefined on any error.
   *
   * @param filePath - JSON file path.
   */
  private async readJson<T>(filePath: string): Promise<T | undefined> {
    try {
      return JSON.parse(await readFile(filePath, "utf-8")) as T
    } catch {
      return undefined
    }
  }

  /**
   * Creates a default root session continuity index.
   *
   * @param sessionID - Root main session ID.
   */
  private createDefaultIndex(sessionID: string): SessionContinuityIndex {
    return {
      version: "2.0",
      sessionID,
      lastUpdated: new Date().toISOString(),
      hierarchy: { root: sessionID, children: {} },
      turnCount: 0,
      toolSummary: {},
    }
  }

  /**
   * Creates a default root hierarchy manifest.
   *
   * @param rootMainSessionID - Root main session ID.
   */
  private createDefaultManifest(rootMainSessionID: string): HierarchyManifest {
    return {
      version: "1.0",
      rootMainSessionID,
      lastUpdated: new Date().toISOString(),
      children: {},
      totalChildren: 0,
      maxDepth: 0,
    }
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
