/**
 * Pending dispatch registry for tracking in-flight subagent delegations.
 *
 * Stores entries keyed by tool callID or child session ID, with a TTL-based
 * auto-cleanup mechanism. Entries survive PostToolUse so the child recorder
 * can read actor/model attribution from the registry after dispatch starts.
 *
 * @module session-tracker/persistence/pending-dispatch-registry
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A pending dispatch entry tracking an in-flight delegation.
 */
export interface PendingDispatchEntry {
  /** Parent session that dispatched the delegation. */
  parentSessionID: string
  /** Tool call identifier from the hook event. */
  callID: string
  /** Subagent type (used for actor attribution). */
  subagentType: string
  /** Tool name (task or delegate-task). */
  tool?: string
  /** Timestamp of the last activity (used for TTL). */
  timestamp: number
  /** Model identifier (e.g. "claude-sonnet-4-20250514"). */
  model?: string
  /** Child session ID assigned after dispatch resolves. */
  childSessionID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Stale threshold: 30 seconds. Entries older than this are auto-purged.
 */
const STALE_THRESHOLD_MS = 30_000

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * Registry that tracks pending subagent dispatches.
 *
 * Three indexing strategies:
 * 1. **dispatches** — Map<string, PendingDispatchEntry> keyed by `call:<callID>` or child sessionID.
 * 2. **byParent** — Map<string, Set<string>> tracking which callIDs belong to which parent.
 * 3. **callIDToChild** — Map<string, string> bridging callID → child sessionID (re-keyed after updateWithChildID).
 *
 * Entries survive PostToolUse (see Bug D-1): callers use `refreshTimestamp()`
 * instead of `removeByCallID()` at PostToolUse.
 * `removeByCallID()` now requires an explicit `"completed"` reason to delete.
 */
export class PendingDispatchRegistry {
  private readonly dispatches = new Map<string, PendingDispatchEntry>()
  private readonly byParent = new Map<string, Set<string>>()
  private readonly callIDToChild = new Map<string, string>()

  // -----------------------------------------------------------------------
  // Core operations
  // -----------------------------------------------------------------------

  /**
   * Adds a new pending dispatch entry.
   *
   * @param entry - The entry to add.
   */
  add(entry: PendingDispatchEntry): void {
    const callKey = `call:${entry.callID}`
    this.dispatches.set(callKey, { ...entry })

    // Index by parent (D-04)
    const parentSet = this.byParent.get(entry.parentSessionID)
    if (parentSet) {
      parentSet.add(entry.callID)
    } else {
      this.byParent.set(entry.parentSessionID, new Set([entry.callID]))
    }
  }

  /**
   * Checks if a pending dispatch entry exists for the given key.
   *
   * The key can be a `call:<callID>` string, a `callID`, or a child session ID.
   * Runs cleanupStale() on every call.
   *
   * @param key - The key to check (callID, call:callID, or sessionID).
   * @returns `true` if a non-stale entry exists.
   */
  has(key: string): boolean {
    this.cleanupStale()
    return this.dispatches.has(this.normalizeKey(key))
  }

  /**
   * Gets a pending dispatch entry for the given key.
   *
   * The key can be a `call:<callID>` string, a `callID`, or a child session ID.
   * Runs cleanupStale() on every call.
   *
   * @param key - The key to look up.
   * @returns The entry, or `undefined` if not found (or stale).
   */
  get(key: string): PendingDispatchEntry | undefined {
    this.cleanupStale()
    const k = this.normalizeKey(key)
    return this.dispatches.get(k)
  }

  /**
   * Gets the number of non-stale pending dispatch entries.
   */
  get size(): number {
    this.cleanupStale()
    return this.dispatches.size
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

  // -----------------------------------------------------------------------
  // Query by parent
  // -----------------------------------------------------------------------

  /**
   * Gets entries for a parent session, maintaining insertion order.
   *
   * @param parentSessionID - The parent session ID to query.
   * @returns An array of entries, or `undefined` if no entries exist.
   */
  getByParent(parentSessionID: string): PendingDispatchEntry[] | undefined {
    this.cleanupStale()
    const callIDs = this.byParent.get(parentSessionID)
    if (!callIDs || callIDs.size === 0) {
      return undefined
    }

    const entries: PendingDispatchEntry[] = []
    for (const callID of callIDs) {
      const entry = this.dispatches.get(`call:${callID}`) || this.dispatches.get(callID)
      if (entry) {
        entries.push(entry)
      }
    }
    return entries.length > 0 ? entries : undefined
  }

  // -----------------------------------------------------------------------
  // Child ID bridge
  // -----------------------------------------------------------------------

  /**
   * Re-keys a callID to use the child session ID after dispatch resolves.
   *
   * Prevents dispatches from cleaning stale callID entries while the child
   * session is still being tracked.
   *
   * @param callID - The original tool call identifier.
   * @param childSessionID - The child session ID assigned by dispatch.
   */
  updateWithChildID(callID: string, childSessionID: string): void {
    const callKey = `call:${callID}`
    const entry = this.dispatches.get(callKey)
    if (!entry) {
      return
    }

    entry.childSessionID = childSessionID

    // Re-key from call:callID → childSessionID
    this.dispatches.delete(callKey)
    this.dispatches.set(childSessionID, entry)
    this.callIDToChild.set(callID, childSessionID)

    // D-04: byParent index stays on callID so parent can still find the entry
    // even after re-keying. No change to byParent needed.
  }

  // -----------------------------------------------------------------------
  // TTL management
  // -----------------------------------------------------------------------

  /**
   * Refreshes the timestamp for a pending dispatch entry.
   *
   * Used at PostToolUse to keep the entry alive for actor attribution
   * instead of prematurely removing it (Bug D-1).
   *
   * @param callID - The tool call identifier to refresh.
   */
  refreshTimestamp(callID: string): void {
    const callKey = `call:${callID}`
    const entry = this.dispatches.get(callKey)
    if (entry) {
      entry.timestamp = Date.now()
    }

    // Also refresh the child entry if re-keyed
    const childID = this.callIDToChild.get(callID)
    if (childID) {
      const childEntry = this.dispatches.get(childID)
      if (childEntry) {
        childEntry.timestamp = Date.now()
      }
    }
  }

  /**
   * Removes a pending dispatch entry by callID.
   *
   * **Bug D-1 hardening:** Only deletes when `reason === "completed"`.
   * For `"postToolUse"` and `"stale"`, does nothing — callers should use
   * `refreshTimestamp()` to keep entries alive for actor attribution.
   *
   * @param callID - The tool call identifier to remove.
   * @param reason - The reason for removal. Only `"completed"` triggers deletion.
   */
  removeByCallID(callID: string, reason: "completed" | "postToolUse" | "stale" = "postToolUse"): void {
    // Bug D-1: Only delete when reason is explicitly "completed".
    // For "postToolUse" and "stale", the entry must survive for actor attribution.
    if (reason !== "completed") {
      return
    }

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

  // -----------------------------------------------------------------------
  // Stale cleanup
  // -----------------------------------------------------------------------

  /**
   * Removes ALL pending dispatch entries whose timestamp exceeds
   * STALE_THRESHOLD_MS. Called automatically by has() and get().
   *
   * Per SPEC §2.2: stale entries (>30s) auto-purged on next classification check.
   */
  cleanupStale(): void {
    const now = Date.now()
    const staleKeys: string[] = []

    for (const [key, entry] of this.dispatches) {
      if (now - entry.timestamp > STALE_THRESHOLD_MS) {
        staleKeys.push(key)
      }
    }

    for (const key of staleKeys) {
      this.dispatches.delete(key)
    }
  }

  // -----------------------------------------------------------------------
  // Diagnostics
  // -----------------------------------------------------------------------

  /**
   * Returns the list of pending keys for debugging purposes.
   *
   * @returns Array of active dispatch keys.
   */
  keys(): string[] {
    this.cleanupStale()
    return [...this.dispatches.keys()]
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Normalizes a lookup key.
   *
   * If the key starts with "call:" it is returned as-is.
   * If the key maps to a child session via callIDToChild, the child session ID is returned.
   * Otherwise the key is treated as a session ID.
   *
   * @param key - The raw lookup key.
   * @returns The normalized key for the dispatches map.
   */
  private normalizeKey(key: string): string {
    if (key.startsWith("call:")) {
      return key
    }
    // Check if this key is known as a callID that was re-keyed
    const childID = this.callIDToChild.get(key)
    if (childID) {
      return childID
    }
    // For bare callID lookup, prefix with call:
    const callKey = `call:${key}`
    if (this.dispatches.has(callKey)) {
      return callKey
    }
    // Otherwise use as session ID directly
    return key
  }
}
