/**
 * Hierarchy manifest writer for D-07.
 *
 * Writes `hierarchy-manifest.json` in each root main session directory.
 * This is the AUTHORITATIVE source for the session delegation tree,
 * replacing ad-hoc gate decisions.
 *
 * Uses atomic-write pattern (write-to-tmp → rename) matching the
 * `atomicWriteJson` utility for crash safety (D-03).
 *
 * @module session-tracker/persistence/hierarchy-manifest
 */

import { readFile } from "node:fs/promises"
import { atomicWriteJson, safeSessionPath } from "./atomic-write.js"
import type {
  HierarchyManifest,
  HierarchyManifestChild,
  SessionContinuityIndex,
  ChildHierarchyEntry,
} from "../types.js"

// ---------------------------------------------------------------------------
// HierarchyManifestWriter
// ---------------------------------------------------------------------------

/**
 * Persists and reads the hierarchy manifest for each root main session.
 *
 * Each root main session directory contains a `hierarchy-manifest.json`
 * that is the single authoritative source for the session delegation tree.
 * All child sessions (L1, L2, ...) are registered here with their current
 * status, depth, and metadata.
 */
export class HierarchyManifestWriter {
  private projectRoot: string

  /**
   * @param deps - Injected dependencies.
   * @param deps.projectRoot - Absolute path to the project root directory.
   */
  constructor(deps: { projectRoot: string }) {
    this.projectRoot = deps.projectRoot
  }

  /**
   * Adds or updates a child entry in the root main's `hierarchy-manifest.json`.
   *
   * If the child already exists, its metadata is overwritten. Otherwise a
   * new entry is created with status "active" and turnCount 0.
   *
   * @param params - Child entry parameters.
   * @param params.rootMainSessionID - The root main session that owns the manifest.
   * @param params.childSessionID - The child session ID to register.
   * @param params.parentSessionID - The immediate parent of this child.
   * @param params.delegationDepth - Delegation depth (1 = L1, 2 = L2, etc.).
   * @param params.delegatedBy - Agent name that performed the delegation.
   * @param params.subagentType - Subagent type dispatched.
   * @param params.childFile - Filename of the child .json file.
   * @returns Promise that resolves when the manifest has been atomically written.
   */
  async addChild(params: {
    rootMainSessionID: string
    childSessionID: string
    parentSessionID: string
    delegationDepth: number
    delegatedBy: string
    subagentType: string
    childFile: string
  }): Promise<void> {
    const manifest = await this.loadManifest(params.rootMainSessionID)
    const now = new Date().toISOString()

    const entry: HierarchyManifestChild = {
      sessionID: params.childSessionID,
      parentSessionID: params.parentSessionID,
      rootMainSessionID: params.rootMainSessionID,
      delegationDepth: params.delegationDepth,
      delegatedBy: params.delegatedBy,
      subagentType: params.subagentType,
      createdAt: now,
      updatedAt: now,
      status: "active",
      turnCount: 0,
      childFile: params.childFile,
    }

    manifest.children[params.childSessionID] = entry
    manifest.totalChildren = Object.keys(manifest.children).length
    manifest.maxDepth = Math.max(manifest.maxDepth, params.delegationDepth)
    manifest.lastUpdated = now

    await this.writeManifest(params.rootMainSessionID, manifest)
  }

  /**
   * Updates the status of a child in the manifest.
   *
   * Silently no-ops if the child is not found in the manifest (the child
   * may belong to a different root main session).
   *
   * @param rootMainSessionID - The root main session that owns the manifest.
   * @param childSessionID - The child session ID to update.
   * @param status - New status (e.g. "idle", "completed", "error").
   * @returns Promise that resolves when the manifest has been updated.
   */
  async updateChildStatus(
    rootMainSessionID: string,
    childSessionID: string,
    status: string,
  ): Promise<void> {
    const manifest = await this.loadManifest(rootMainSessionID)
    const entry = manifest.children[childSessionID]
    if (!entry) return

    entry.status = status
    entry.updatedAt = new Date().toISOString()
    manifest.lastUpdated = entry.updatedAt

    await this.writeManifest(rootMainSessionID, manifest)
  }

  /**
   * Updates the turnCount for a child session in the manifest.
   *
   * Called after each turn append to keep the manifest's turnCount in sync
   * with the actual number of turns in the child `.json` file.
   * Silently no-ops if the child is not found in the manifest.
   *
   * @param rootMainSessionID - The root main session that owns the manifest.
   * @param childSessionID - The child session ID to update.
   * @param turnCount - The current number of turns in the child session.
   * @returns Promise that resolves when the manifest has been updated.
   */
  async updateTurnCount(
    rootMainSessionID: string,
    childSessionID: string,
    turnCount: number,
  ): Promise<void> {
    const manifest = await this.loadManifest(rootMainSessionID)
    const entry = manifest.children[childSessionID]
    if (!entry) return

    entry.turnCount = turnCount
    entry.updatedAt = new Date().toISOString()
    manifest.lastUpdated = entry.updatedAt

    await this.writeManifest(rootMainSessionID, manifest)
  }

  /**
   * Returns all child entries from the manifest.
   *
   * @param rootMainSessionID - The root main session that owns the manifest.
   * @returns Promise resolving to a Record of child entries keyed by sessionID.
   */
  async getChildren(
    rootMainSessionID: string,
  ): Promise<Record<string, HierarchyManifestChild>> {
    const manifest = await this.loadManifest(rootMainSessionID)
    return manifest.children
  }

  /**
   * Returns a single child entry, or `undefined` if not found.
   *
   * @param rootMainSessionID - The root main session that owns the manifest.
   * @param childSessionID - The child session ID to look up.
   * @returns Promise resolving to the child entry, or undefined.
   */
  async getChild(
    rootMainSessionID: string,
    childSessionID: string,
  ): Promise<HierarchyManifestChild | undefined> {
    const manifest = await this.loadManifest(rootMainSessionID)
    return manifest.children[childSessionID]
  }

  /**
   * Generates a flattened hierarchy manifest from the continuity tree.
   *
   * Per G-1: The continuity tree is the canonical hierarchy source.
   * The manifest is a derivative cache — generated from the tree at read time
   * to eliminate drift between the two stores.
   *
   * Walks all nested `hierarchy.children` entries in the session-continuity.json
   * file and flattens them into a single `Record<string, HierarchyManifestChild>`.
   *
   * @param rootMainID - The root main session whose continuity tree to walk.
   * @returns A flattened hierarchy manifest.
   */
  async generateFromContinuity(rootMainID: string): Promise<HierarchyManifest> {
    const continuityPath = safeSessionPath(
      this.projectRoot,
      rootMainID,
      "session-continuity.json",
    )
    let continuity: SessionContinuityIndex

    try {
      const raw = await readFile(continuityPath, "utf-8")
      continuity = JSON.parse(raw)
    } catch {
      // No continuity file — return an empty manifest
      return {
        version: "1.0",
        rootMainSessionID: rootMainID,
        lastUpdated: new Date().toISOString(),
        children: {},
        totalChildren: 0,
        maxDepth: 0,
      }
    }

    const children: Record<string, HierarchyManifestChild> = {}

    const walk = (
      entries: Record<string, ChildHierarchyEntry>,
      parentID: string,
    ): void => {
      for (const [childID, entry] of Object.entries(entries)) {
        children[childID] = {
          sessionID: childID,
          parentSessionID: parentID,
          rootMainSessionID: rootMainID,
          delegationDepth: entry.depth ?? 1,
          delegatedBy:
            (entry.delegatedBy && entry.delegatedBy !== "unknown")
              ? entry.delegatedBy
              : entry.subagentType ?? "unknown",
          subagentType:
            (entry.subagentType && entry.subagentType !== "unknown")
              ? entry.subagentType
              : entry.delegatedBy ?? "unknown",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: entry.status ?? "active",
          turnCount: 0,
          childFile: entry.file ?? `${childID}.json`,
        }
        if (entry.children && Object.keys(entry.children).length > 0) {
          walk(entry.children, childID)
        }
      }
    }

    walk(continuity.hierarchy?.children ?? {}, rootMainID)

    const ids = Object.keys(children)
    return {
      version: "1.0",
      rootMainSessionID: rootMainID,
      lastUpdated: new Date().toISOString(),
      children,
      totalChildren: ids.length,
      maxDepth:
        ids.length > 0
          ? Math.max(0, ...ids.map((id) => children[id].delegationDepth ?? 0))
          : 0,
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Loads the hierarchy manifest for a root main session.
   *
   * If the file does not exist or is unparseable, returns a fresh empty
   * manifest. Graceful degradation on parse failure — never throws.
   *
   * @param rootMainSessionID - The root main session that owns the manifest.
   * @returns Promise resolving to the loaded or default manifest.
   */
  private async loadManifest(
    rootMainSessionID: string,
  ): Promise<HierarchyManifest> {
    const filePath = safeSessionPath(
      this.projectRoot,
      rootMainSessionID,
      "hierarchy-manifest.json",
    )
    try {
      const raw = await readFile(filePath, "utf-8")
      const parsed = JSON.parse(raw) as HierarchyManifest
      // Cache hit — return the cached manifest (fast path)
      return parsed
    } catch {
      // Cache miss — regenerate from continuity tree (G-1 derivative cache)
      // Write the generated manifest back to disk as cache optimization
      const generated = await this.generateFromContinuity(rootMainSessionID)
      await this.writeManifest(rootMainSessionID, generated)
      return generated
    }
  }

  /**
   * Atomically writes the hierarchy manifest to disk.
   *
   * Delegates to {@link atomicWriteJson} which handles write-to-tmp → rename
   * (D-03), cross-volume detection (G-5 / REQ-21-02), and temp file cleanup
   * (F-01 / REQ-21-01).
   *
   * @param rootMainSessionID - The root main session that owns the manifest.
   * @param manifest - The manifest to persist.
   */
  private async writeManifest(
    rootMainSessionID: string,
    manifest: HierarchyManifest,
  ): Promise<void> {
    const filePath = safeSessionPath(
      this.projectRoot,
      rootMainSessionID,
      "hierarchy-manifest.json",
    )
    await atomicWriteJson(filePath, manifest)
  }
}
