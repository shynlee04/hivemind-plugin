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

import { writeFile, rename, mkdir, readFile, unlink } from "node:fs/promises"
import { dirname } from "node:path"
import { safeSessionPath } from "./atomic-write.js"
import type { HierarchyManifest, HierarchyManifestChild } from "../types.js"

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
      return JSON.parse(raw) as HierarchyManifest
    } catch {
      return {
        version: "1.0",
        rootMainSessionID,
        lastUpdated: new Date().toISOString(),
        children: {},
        totalChildren: 0,
        maxDepth: 0,
      }
    }
  }

  /**
   * Atomically writes the hierarchy manifest to disk.
   *
   * Uses write-to-tmp → rename pattern (D-03). On crash mid-write, only
   * the temp file exists — the target is either complete or untouched.
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
    const tmpPath = `${filePath}.tmp.${Date.now().toString(36)}`
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(tmpPath, JSON.stringify(manifest, null, 2), "utf-8")
    await rename(tmpPath, filePath)
    // Post-rename temp cleanup (F-01 / REQ-21-01) — this path may be deprecated by Plan 02
    // but fix it now while it exists to prevent leaks
    try {
      await unlink(tmpPath)
    } catch {
      // Best-effort cleanup
    }
  }
}
