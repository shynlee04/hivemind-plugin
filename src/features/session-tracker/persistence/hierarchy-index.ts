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
import type { ChildHierarchyEntry, SessionContinuityIndex } from "../types.js"

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
   * parentID → Set of childIDs.
   * Reverse index used to propagate rootMain changes to descendants
   * when a parent's rootMain is updated after reverse-order registration.
   */
  private parentToChildren: Map<string, Set<string>> = new Map()

  /**
   * childID → rootMainSessionID map.
   * Tracks the root main session (delegation depth 0) whose directory
   * owns all child .json files for this child (D-03, D-08).
   *
   * Populated by registerChild() and buildFromDisk().
   */
  private childToRootMain: Map<string, string> = new Map()

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
          this.registerChildrenFromTree(parentID, children)
        }
      } catch {
        // Best-effort: skip directories without a readable index
      }
    }

    // Second pass: resolve root main for each registered child (D-03, D-08).
    // After all child→parent relationships are loaded, walk each chain
    // to determine the root main session ID. This handles reverse-order
    // registration (e.g., L1→L2 registered before root→L1).
    for (const [childID] of this.childToParent) {
      if (!this.childToRootMain.has(childID)) {
        const root = this.resolveRootMain(childID)
        if (root) this.childToRootMain.set(childID, root)
      }
    }

    // Third pass (G-2 / REQ-21-05): Ensure EVERY registered child has
    // a rootMain. The second pass only resolves children NOT already in
    // childToRootMain. This pass catches any children whose parent chain
    // was fully resolved after their iteration in the second pass.
    this.rebuildChildToRootMain()
  }

  /**
   * Recursively registers child hierarchy entries from session-continuity.json.
   *
   * Root session-continuity may store L2 entries nested under their L1 parent
   * after orphan cleanup has rehydrated a bad child directory. Rebuilding the
   * hierarchy index must preserve that nested parent chain.
   *
   * @param parentID - Parent session ID for the provided children map.
   * @param children - Child hierarchy entries keyed by child session ID.
   */
  private registerChildrenFromTree(
    parentID: string,
    children: Record<string, ChildHierarchyEntry>,
  ): void {
    for (const [childID, child] of Object.entries(children)) {
      this.childToParent.set(childID, parentID)

      // Maintain reverse index for descendant propagation
      let siblings = this.parentToChildren.get(parentID)
      if (!siblings) {
        siblings = new Set()
        this.parentToChildren.set(parentID, siblings)
      }
      siblings.add(childID)

      if (child.children) {
        this.registerChildrenFromTree(childID, child.children)
      }
    }
  }

  /**
   * Registers a child→parent relationship in the in-memory index.
   *
   * Called by tool-capture.handleTask() when a task delegation fires.
   *
   * When a parent's rootMain changes (e.g., reverse-order registration where
   * L1→L2 is registered before root→L1), this method propagates the new
   * rootMain to all descendants to maintain consistency (RC-1).
   *
   * @param parentID - The parent session identifier.
   * @param childID - The child session identifier.
   */
  registerChild(parentID: string, childID: string): void {
    this.childToParent.set(childID, parentID)

    // Maintain reverse index for descendant propagation
    let siblings = this.parentToChildren.get(parentID)
    if (!siblings) {
      siblings = new Set()
      this.parentToChildren.set(parentID, siblings)
    }
    siblings.add(childID)

    // Resolve root main (D-03, D-08):
    // If parent already has a rootMain assigned, propagate it.
    // If parent is NOT in childToParent, parent IS the root main.
    const parentRootMain = this.childToRootMain.get(parentID)
    const rootMain = parentRootMain ?? (this.childToParent.has(parentID) ? undefined : parentID)
    if (rootMain) {
      this.propagateRootMain(childID, rootMain)
    }
  }

  /**
   * Propagates a rootMain value to a child and all its descendants.
   *
   * Used when a parent's rootMain is resolved or changes (e.g., reverse-order
   * registration). Walks the parentToChildren reverse index to update every
   * descendant's childToRootMain entry.
   *
   * @param childID - The child session identifier.
   * @param rootMain - The root main session ID to propagate.
   */
  private propagateRootMain(childID: string, rootMain: string): void {
    this.childToRootMain.set(childID, rootMain)
    const children = this.parentToChildren.get(childID)
    if (children) {
      for (const desc of children) {
        this.propagateRootMain(desc, rootMain)
      }
    }
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
   * Returns the root main session ID for a child session.
   *
   * Traverses the child→parent chain to find the session with delegationDepth 0
   * or the outermost parent (which owns the directory).
   *
   * Returns undefined if the root main session is not known (e.g., registered
   * before the parent chain was fully established).
   *
   * @param childID - The child session identifier.
   * @returns The root main session ID, or `undefined` if not resolved.
   */
  getRootMain(childID: string): string | undefined {
    return this.childToRootMain.get(childID)
  }

  /**
   * Resolves the root main session ID by walking the child→parent chain.
   *
   * Walks up through childToParent until it finds a session that is NOT
   * itself a child (i.e., the root main). Includes cycle detection via a
   * `visited` Set to prevent infinite loops (T-04-05).
   *
   * @param childID - The child session identifier to resolve from.
   * @returns The root main session ID, or `undefined` if chain is incomplete.
   */
  private resolveRootMain(childID: string): string | undefined {
    let current = childID
    const visited = new Set<string>()
    while (this.childToParent.has(current) && !visited.has(current)) {
      visited.add(current)
      current = this.childToParent.get(current)!
    }
    // current is now the outermost node — if it's NOT in childToParent, it's a root
    return this.childToParent.has(current) ? undefined : current
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
   * Caps at 2 per locked decision GA-2 (max depth = L2). Includes cycle guard.
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
   * Rebuilds the childToRootMain mapping for all registered children.
   *
   * Called at the end of buildFromDisk() to ensure that every child in the
   * hierarchy index has a root main session ID. Uses resolveRootMain() to
   * walk each child's parent chain.
   *
   * For DAG hierarchies (child under multiple parents), uses first-found-wins
   * strategy — the first parent chain that resolves determines the rootMain.
   * This matches existing runtime behavior where registerChild() propagates
   * rootMain from the parent at registration time.
   *
   * Per G-2: No new file format. Rebuilds from the in-memory childToParent
   * map which was populated from session-continuity.json files.
   */
  rebuildChildToRootMain(): void {
    for (const [childID] of this.childToParent) {
      if (!this.childToRootMain.has(childID)) {
        const root = this.resolveRootMain(childID)
        if (root) {
          this.childToRootMain.set(childID, root)
        }
      }
    }
  }

  /**
   * Returns the number of direct children for a session.
   * Walks the parentToChildren reverse index for O(1) lookup.
   *
   * @param sessionID - The parent session identifier.
   * @returns The number of direct children, or 0 if none.
   */
  getChildCountForSession(sessionID: string): number {
    return this.parentToChildren.get(sessionID)?.size ?? 0
  }

  /**
   * Computes the maximum delegation depth in a session's subtree.
   * Walks all descendants via parentToChildren reverse index.
   *
   * @param sessionID - The session whose subtree to measure.
   * @returns The maximum delegation depth (0 = no children, 1 = L1, 2 = L2, etc.).
   */
  getMaxDepthForSession(sessionID: string): number {
    let maxDepth = 0
    const walk = (id: string, depth: number): void => {
      if (depth > maxDepth) maxDepth = depth
      const children = this.parentToChildren.get(id)
      if (children) {
        for (const childId of children) {
          walk(childId, depth + 1)
        }
      }
    }
    walk(sessionID, 0)
    return maxDepth
  }

  /**
   * Returns the current number of tracked child→parent mappings.
   */
  get size(): number {
    return this.childToParent.size
  }
}
