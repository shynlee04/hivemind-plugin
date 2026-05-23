/**
 * Pending dispatch registry for session classification Gate 3.
 *
 * Tracks sessions whose parent recently dispatched a task tool but whose
 * child session ID is not yet known to the SDK or HierarchyIndex. This
 * closes the race condition window where `session.created` fires during
 * `TaskTool.execute()` and both Gate 1 (SDK parentID) and Gate 2
 * (HierarchyIndex) fail to recognize the session as a child.
 *
 * ## Lifecycle
 *
 * 1. **PreToolUse** (tool.execute.before with tool="task") → `add()`
 * 2. **PostToolUse** (tool.execute.after with metadata.sessionId) → `remove()`
 * 3. **Auto-purge**: stale entries (>30s) removed on classification check
 *
 * All methods are synchronous (Map operations, no I/O).
 * Thread safety: single-threaded Node.js event loop (sync Map ops).
 *
 * @module session-tracker/persistence/pending-dispatch-registry
 */

// ---------------------------------------------------------------------------
// PendingDispatchEntry interface
// ---------------------------------------------------------------------------

/**
 * Pending dispatch entry stored when PreToolUse detects a task tool dispatch.
 * Lives in-memory only — never persisted to disk.
 */
export interface PendingDispatchEntry {
  /** The session ID of the parent that dispatched the task. */
  parentSessionID: string
  /** The callID from the tool.execute hook input. */
  callID: string
  /** The subagent type dispatched (e.g. "hm-l2-investigator"). */
  subagentType: string
  /** `Date.now()` at registration time, for stale detection. */
  timestamp: number
  /** The tool used to dispatch (e.g. "task" or "delegate-task"). */
  tool: string
  /** Delegation depth (1 = L1, 2 = L2). CP-ST-05-01 addition. */
  delegationDepth?: number
  /** Task description from the dispatch. CP-ST-05-01 addition. */
  description?: string
}

// ---------------------------------------------------------------------------
// PendingDispatchRegistry class
// ---------------------------------------------------------------------------

/**
 * In-memory registry for sessions that have been dispatched as tasks
 * but whose child session ID is not yet known.
 *
 * Provides Gate 3 classification: if a `session.created` event fires for
 * a session whose parent recently dispatched a task, we can infer it's
 * a child even before the SDK or HierarchyIndex confirms it.
 *
 * ## Key design decisions
 *
 * - **callID as temporary key**: Because the child session ID is unknown at
 *   PreToolUse time, entries are stored with `call:` prefix. When the child
 *   ID is discovered, `updateWithChildID()` re-keys the entry with the real
 *   session ID.
 * - **Synchronous Map operations**: No async I/O — the registry is purely
 *   in-memory. All methods return synchronously.
 * - **30s auto-purge**: Stale entries are removed on every `has()`/`get()`
 *   call via `cleanupStale()`. If a dispatch never completes (tool abort,
 *   crash), the entry auto-expires and won't cause false CHILD classification.
 * - **subagentType storage**: The agent name is captured in the entry at
 *   registration time and retrieved later by tool-capture for delegator
 *   attribution.
 */
export class PendingDispatchRegistry {
  /** childID → PendingDispatchEntry map for O(1) has() lookup */
  private dispatches: Map<string, PendingDispatchEntry> = new Map()

  /** callID → childID reverse index for cleanup at PostToolUse */
  private callIDToChild: Map<string, string> = new Map()

  /**
   * Parent-indexed reverse lookup (D-04).
   *
   * Maps `parentSessionID → Set<callID>` so pending dispatches can be
   * inspected by parent when a session.created event arrives before a real
   * child ID is known. Direct `has(sessionID)` remains child/call-key scoped.
   */
  private byParent: Map<string, Set<string>> = new Map()

  /** Maximum age (ms) before an entry is considered stale and auto-purged */
  static readonly STALE_THRESHOLD_MS = 30_000

  /**
   * Registers a pending dispatch for a parent session.
   * Called by handleToolExecuteBefore when tool === "task" and task_id
   * is absent (new dispatch, not resume).
   *
   * Note: at PreToolUse time, the child session ID is NOT yet known.
   * The child will be discovered later via polling or PostToolUse metadata.
   * For the initial registration, we use callID as a temporary key
   * (replaced later with the real child session ID when discovered).
   *
   * @param entry - The pending dispatch entry to register.
   */
  add(entry: PendingDispatchEntry): void {
    // Use callID as temporary key until child session ID is discovered.
    // When the child session ID becomes known (via polling or PostToolUse),
    // updateWithChildID removes the callID key and re-adds with child session ID.
    this.dispatches.set(`call:${entry.callID}`, entry)

    // D-04: Index by parent session ID for reverse-lookup in has().
    // When a child session ID appears (Gate 3 classification), we need to
    // know that ANY pending dispatch means a child session may exist.
    if (!this.byParent.has(entry.parentSessionID)) {
      this.byParent.set(entry.parentSessionID, new Set())
    }
    this.byParent.get(entry.parentSessionID)!.add(entry.callID)
  }

  /**
   * Updates a pending dispatch entry with the actual child session ID.
   * Called when the child session is discovered (via polling or PostToolUse).
   *
   * Removes the callID-based temporary entry and re-adds with the real
   * child session ID, enabling Gate 3 has() lookups.
   *
   * @param callID - The tool call identifier from hook input.
   * @param childSessionID - The discovered child session identifier.
   */
  updateWithChildID(callID: string, childSessionID: string): void {
    const callKey = `call:${callID}`
    const entry = this.dispatches.get(callKey)
    if (!entry) return
    this.dispatches.delete(callKey)
    this.dispatches.set(childSessionID, entry)
    this.callIDToChild.set(callID, childSessionID)
  }

  /**
   * Checks whether a session ID has a pending dispatch entry.
   * Used by Gate 3 classification in ensureSessionReady and handleSessionCreated.
   *
   * Checks both direct childID keys AND callID-based temporary keys.
   * Auto-purges stale entries before checking.
   *
   * @param sessionID - The session identifier to check.
   * @returns `true` if a pending dispatch entry exists for this session.
   */
  has(sessionID: string): boolean {
    this.cleanupStale()
    if (this.dispatches.has(sessionID)) return true
    if (this.dispatches.has(`call:${sessionID}`)) return true
    return false
  }

  /**
   * Retrieves the pending dispatch entry for a session ID, if any.
   * Returns undefined if not found or entry is stale.
   *
   * @param sessionID - The session identifier to look up.
   * @returns The pending dispatch entry, or `undefined`.
   */
  get(sessionID: string): PendingDispatchEntry | undefined {
    this.cleanupStale()
    const entry = this.dispatches.get(sessionID) ?? this.dispatches.get(`call:${sessionID}`)
    if (entry && Date.now() - entry.timestamp > PendingDispatchRegistry.STALE_THRESHOLD_MS) {
      this.dispatches.delete(sessionID)
      this.dispatches.delete(`call:${sessionID}`)
      return undefined
    }
    return entry
  }

  /**
   * Gets the subagentType for a pending dispatch, if any.
   * Used for delegator attribution in tool-capture.handleTask.
   *
   * @param sessionID - The session identifier to look up.
   * @returns The subagent type string, or `undefined` if not found.
   */
  getSubagentType(sessionID: string): string | undefined {
    return this.get(sessionID)?.subagentType
  }

  /**
   * Removes a pending dispatch entry by callID (PostToolUse cleanup).
   *
   * @param callID - The tool call identifier to remove.
   */
  removeByCallID(callID: string): void {
    const callKey = `call:${callID}`
    const entry = this.dispatches.get(callKey)

    // D-04: Clean byParent index when removing by callID
    if (entry) {
      const parentSet = this.byParent.get(entry.parentSessionID)
      if (parentSet) {
        parentSet.delete(callID)
        if (parentSet.size === 0) {
          this.byParent.delete(entry.parentSessionID)
        }
      }
    }

    const childID = this.callIDToChild.get(callID)
    this.dispatches.delete(callKey)
    if (childID) {
      this.dispatches.delete(childID)
      this.callIDToChild.delete(callID)
    }
  }

  /**
   * Removes a pending dispatch entry by child session ID.
   *
   * @param sessionID - The session identifier to remove.
   */
  remove(sessionID: string): void {
    // D-04: Clean byParent index when removing by session ID
    const entry = this.dispatches.get(sessionID)
    if (entry) {
      const parentSet = this.byParent.get(entry.parentSessionID)
      if (parentSet) {
        parentSet.delete(entry.callID)
        if (parentSet.size === 0) {
          this.byParent.delete(entry.parentSessionID)
        }
      }
    }
    this.dispatches.delete(sessionID)
  }

  /**
   * Removes ALL pending dispatch entries whose timestamp exceeds
   * STALE_THRESHOLD_MS. Called automatically by has() and get().
   *
   * Per SPEC §2.2: stale entries (>30s) auto-purged on next classification check.
   */
  cleanupStale(): void {
    const now = Date.now()
    const threshold = PendingDispatchRegistry.STALE_THRESHOLD_MS
    for (const [key, entry] of this.dispatches) {
      if (now - entry.timestamp > threshold) {
        this.dispatches.delete(key)

        // D-04: Clean byParent index for stale entries
        const parentSet = this.byParent.get(entry.parentSessionID)
        if (parentSet) {
          parentSet.delete(entry.callID)
          if (parentSet.size === 0) {
            this.byParent.delete(entry.parentSessionID)
          }
        }

        // Clean up callIDToChild if this was a childID entry
        for (const [callId, childId] of this.callIDToChild) {
          if (childId === key) {
            this.callIDToChild.delete(callId)
            break
          }
        }
      }
    }
  }

  /**
   * Returns the number of active (non-stale) pending dispatch entries.
   */
  get size(): number {
    this.cleanupStale()
    return this.dispatches.size
  }

  /**
   * Clears all entries. Used in tests.
   */
  clear(): void {
    this.dispatches.clear()
    this.callIDToChild.clear()
    this.byParent.clear()
  }

  /**
   * Returns all active (non-stale) pending dispatch entries.
   * Used for testing and debugging.
   */
  getAll(): PendingDispatchEntry[] {
    this.cleanupStale()
    return Array.from(this.dispatches.values())
  }

  /**
   * Gets any active pending dispatch entry when the child session ID is
   * not yet known but `byParent` indicates recent task dispatches.
   *
   * Used by Gate 0 in handleSessionCreated: when `byParent.size > 0`,
   * a task was recently dispatched and the resulting session is likely
   * a child even though we don't know its ID yet.
   *
   * @returns The first active pending entry, or `undefined`.
   */
  getAnyActiveEntry(): PendingDispatchEntry | undefined {
    this.cleanupStale()
    if (this.byParent.size === 0) return undefined
    // Return the first entry from byParent
    for (const callIds of this.byParent.values()) {
      for (const callId of callIds) {
        const entry = this.dispatches.get(`call:${callId}`)
        if (entry) return entry
      }
    }
    return undefined
  }
}
