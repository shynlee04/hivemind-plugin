/**
 * Global in-memory hierarchy index for session parent-child relationships.
 *
 * Provides O(1) lookup to determine if a session ID is a child of any known
 * parent, without relying on SDK runtime state (which is structurally
 * unreliable for OpenCode child sessions).
 *
 * ## Why this exists
 *
 * `ensureSessionReady()` classifies sessions as MAIN vs CHILD based on SDK
 * `parentID`. When the SDK fails to report `parentID` (or the call fails),
 * child sessions get orphan top-level directories. The session-continuity.json
 * hierarchy data (written by `handleTask()`) correctly records parent-child
 * relationships, but was never consulted during classification.
 *
 * This class provides a SECOND gate: after checking SDK parentID, also check
 * the hierarchy index. If a session ID is a registered child of any parent,
 * treat it as a child — no directory, no project index entry.
 *
 * ## Lifecycle
 *
 * 1. **Build phase** (on SessionTracker.initialize): scans all existing
 *    `session-continuity.json` files to rebuild the index from disk.
 * 2. **Update phase** (on tool-capture.handleTask): registers new children
 *    in real-time as task delegations fire.
 * 3. **Consult phase** (on ensureSessionReady, handleChatMessage): checks
 *    whether a session ID is a known child before creating directories or
 *    routing messages.
 *
 * @module session-tracker/persistence/hierarchy-index
 */

import { readdir, readFile } from "node:fs/promises"
import { sessionTrackerRoot, safeSessionPath } from "./atomic-write.js"
import type { SessionContinuityIndex } from "../types.js"

// ---------------------------------------------------------------------------
// HierarchyIndex class
// ---------------------------------------------------------------------------

/**
 * Global in-memory index for session parent-child relationships.
 *
 * Thread-safe: does not use write queues (all writes are in-memory Map sets).
 * Disk scanning happens once at initialization. Real-time updates happen
 * via `registerChild()` called by tool-capture.handleTask().
 */
export class HierarchyIndex {
  private projectRoot: string

  /**
   * childID → parentID map.
   * Built from disk at init, updated live by registerChild().
   */
  private childToParent: Map<string, string> = new Map()

  /**
   * @param deps - Injected dependencies.
   * @param deps.projectRoot - Absolute path to the project root.
   */
  constructor(deps: { projectRoot: string }) {
    this.projectRoot = deps.projectRoot
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Builds the hierarchy index by scanning ALL session-continuity.json files
   * under `.hivemind/session-tracker/`.
   *
   * For each session-continuity.json, extracts all `hierarchy.children`
   * entries and registers each child→parent mapping.
   *
   * Best-effort: individual file failures are silently skipped.
   */
  async buildFromDisk(): Promise<void> {
    const root = sessionTrackerRoot(this.projectRoot)

    let entries: { name: string; isDirectory(): boolean }[]
    try {
      entries = (await readdir(root, { withFileTypes: true })) as unknown as { name: string; isDirectory(): boolean }[]
    } catch {
      // Root directory doesn't exist yet — nothing to scan
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const parentID = entry.name
      try {
        const indexPath = safeSessionPath(
          this.projectRoot,
          parentID,
          "session-continuity.json",
        )
        const raw = await readFile(indexPath, "utf-8")
        const index = JSON.parse(raw) as SessionContinuityIndex

        const children = index.hierarchy?.children
        if (children) {
          for (const childID of Object.keys(children)) {
            this.childToParent.set(childID, parentID)
          }
        }
      } catch {
        // Best-effort: skip directories without a readable index
      }
    }
  }

  /**
   * Registers a child→parent relationship in the in-memory index.
   *
   * Called by tool-capture.handleTask() when a task delegation fires.
   *
   * @param parentID - The parent session identifier.
   * @param childID - The child session identifier.
   */
  registerChild(parentID: string, childID: string): void {
    this.childToParent.set(childID, parentID)
  }

  /**
   * Looks up the parent session ID for a given child session ID.
   *
   * @param childID - The child session identifier.
   * @returns The parent session ID, or `null` if not found.
   */
  getParent(childID: string): string | null {
    return this.childToParent.get(childID) ?? null
  }

  /**
   * Checks whether a session ID is a registered child of any parent.
   *
   * @param sessionID - The session identifier to check.
   * @returns `true` if this session is known to be a child.
   */
  isChild(sessionID: string): boolean {
    return this.childToParent.has(sessionID)
  }

  /**
   * Computes the delegation depth of a session by walking the parent chain.
   *
   * L0 (no parent) = 0, L1 (parent is L0) = 1, L2 (parent is L1) = 2.
   * Caps at 2 per SPEC §1.2. Includes cycle guard.
   *
   * @param sessionID - The session identifier to compute depth for.
   * @returns The delegation depth (0, 1, or 2).
   */
  getDepth(sessionID: string): number {
    let depth = 0
    let current = sessionID
    const visited = new Set<string>()
    while (this.childToParent.has(current)) {
      if (visited.has(current)) break // cycle guard
      visited.add(current)
      current = this.childToParent.get(current)!
      depth++
    }
    return Math.min(depth, 2) // cap at L2
  }

  /**
   * Returns the current number of tracked child→parent mappings.
   */
  get size(): number {
    return this.childToParent.size
  }
}
