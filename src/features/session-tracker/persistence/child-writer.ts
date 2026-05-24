/**
 * Child writer for child session `.json` files.
 *
 * Creates and manages JSON files for delegation child sessions under the
 * parent session's subdirectory. All writes use atomic rename (D-03).
 *
 * Files are stored at:
 * `.hivemind/session-tracker/{parentSessionID}/{childSessionID}.json`
 *
 * @module session-tracker/persistence/child-writer
 */

import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { atomicWriteJson, ensureDirectory, safeSessionPath } from "./atomic-write.js"
import type { ChildSessionRecord, Turn, JourneyEntry } from "../types.js"
import type { HierarchyIndex } from "./hierarchy-index.js"
import type { ChildWriteRetryQueue } from "./retry-queue.js"
import type { HierarchyManifestWriter } from "./hierarchy-manifest.js"

// ---------------------------------------------------------------------------
// ChildWriter class
// ---------------------------------------------------------------------------

/**
 * Manages child session `.json` files within the parent session's subdirectory.
 *
 * All writes use `atomicWriteJson()` for crash safety.
 */
export class ChildWriter {
  private projectRoot: string

  /**
   * Optional hierarchy index for resolving the root main session directory.
   * When present, all child .json writes are routed to the root main's
   * directory instead of the immediate parent (D-03).
   */
  private hierarchyIndex: HierarchyIndex | undefined

  /**
   * Retry queue for failed child writes (RC-5).
   * Failed writes are enqueued here for automatic retry with exponential backoff.
   */
  private retryQueue: ChildWriteRetryQueue | undefined

  /**
   * Optional hierarchy manifest writer for syncing turnCount after turn appends.
   * When present, `appendChildTurn` updates the manifest's child turnCount.
   */
  private manifestWriter: HierarchyManifestWriter | undefined

  /**
   * Per-child serial write queues (key: `parentID/childID`).
   * Prevents concurrent read-modify-write corruption on child .json files.
   */
  private writeQueues: Map<string, Promise<void>> = new Map()

  /**
   * Per-child last write timestamps for stale queue detection.
   */
  private lastWriteTimes: Map<string, number> = new Map()

  /**
   * Delegation context map (childID → { agentName, model }) for Bug D-2.
   *
   * Stores the agent name and model from the dispatch so that child-recorder
   * can use them as fallback when the chat.message hook payload has empty
   * agent/model fields.
   */
  private delegationContext: Map<string, { agentName: string; model?: string }> = new Map()

  /**
   * Threshold (in milliseconds) before a per-child queue is considered
   * stale and auto-reset.
   */
  private static readonly STALE_QUEUE_MS = 5 * 60 * 1000

  /**
   * @param deps - Injected dependencies.
   * @param deps.projectRoot - Absolute path to the project root.
   * @param deps.hierarchyIndex - Optional hierarchy index for root main resolution (D-03).
   * @param deps.retryQueue - Optional retry queue for failed child writes (RC-5).
   * @param deps.manifestWriter - Optional manifest writer for turnCount sync (Bug C).
   */
  constructor(deps: {
    projectRoot: string
    hierarchyIndex?: HierarchyIndex
    retryQueue?: ChildWriteRetryQueue
    manifestWriter?: HierarchyManifestWriter
  }) {
    this.projectRoot = deps.projectRoot
    this.hierarchyIndex = deps.hierarchyIndex
    this.retryQueue = deps.retryQueue
    this.manifestWriter = deps.manifestWriter
  }

  /**
   * Stores delegation context (agentName, model) for a child session.
   *
   * Called after child file creation when the dispatch context (from
   * PendingDispatchRegistry) is available. The stored values are later
   * retrieved by child-recorder as fallback for actor/model attribution.
   *
   * @param childSessionID - The child session identifier.
   * @param context - The delegation context with agentName and optional model.
   */
  setDelegationContext(
    childSessionID: string,
    context: { agentName: string; model?: string },
  ): void {
    this.delegationContext.set(childSessionID, context)
  }

  /**
   * Retrieves the stored delegation context for a child session.
   *
   * @param childSessionID - The child session identifier.
   * @returns The delegation context, or `undefined` if none was stored.
   */
  getDelegationContext(
    childSessionID: string,
  ): { agentName: string; model?: string } | undefined {
    return this.delegationContext.get(childSessionID)
  }

  /**
   * Gets the absolute path to a child session `.json` file.
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @returns Absolute path to the child `.json` file.
   */
  private getChildFilePath(
    parentSessionID: string,
    childSessionID: string,
  ): string {
    return safeSessionPath(
      this.projectRoot,
      parentSessionID,
      `${childSessionID}.json`,
    )
  }

  /**
   * Resolves the correct parent directory for a child .json file.
   *
   * Per D-03: all children are stored under the ROOT main session directory,
   * not the immediate parent. If hierarchyIndex is available, the root main
   * session is resolved; otherwise falls back to the immediate parent.
   *
   * @param childID - The child session identifier.
   * @param immediateParentID - The immediate parent session identifier.
   * @returns The session ID whose directory should contain the child .json.
   */
  private resolveWriteParent(childID: string, immediateParentID: string): string {
    if (this.hierarchyIndex) {
      const rootMain = this.hierarchyIndex.getRootMain(childID)
      if (rootMain) return rootMain
    }
    // Fallback: if root main not resolved, use immediate parent
    return immediateParentID
  }

  /**
   * Detects and resets a stale write queue for a given child.
   *
   * If no write has completed for this child file within `STALE_QUEUE_MS`,
   * the queue is replaced with a fresh resolved promise so subsequent
   * writes are not blocked by a stuck preceding promise.
   *
   * @param queueKey - The queue key (`parentID/childID`).
   */
  private detectStaleQueue(queueKey: string): void {
    const lastTime = this.lastWriteTimes.get(queueKey)
    // No write has completed for this child yet — nothing to reset
    if (lastTime === undefined) return
    if (Date.now() - lastTime > ChildWriter.STALE_QUEUE_MS) {
      this.writeQueues.set(queueKey, Promise.resolve())
    }
  }

  /**
   * Enqueues a write operation into the per-child serial queue.
   *
   * Stale-queue detection runs first to auto-recover from a frozen pipeline.
   * Chains the provided function onto the end of the child's write queue
   * so that only one write per child file is in-flight at a time. Records
   * `lastWriteTime` on success. Failed writes are enqueued to the retry
   * queue (RC-5) and the error is propagated to the caller.
   *
   * @param queueKey - The queue key (`parentID/childID`).
   * @param fn - The write operation to enqueue.
   * @param retryData - Optional data for retry queue enrollment on failure.
   * @returns Promise that resolves when the enqueued write completes.
   */
  private enqueueWrite(
    queueKey: string,
    fn: () => Promise<void>,
    retryData?: { sessionID: string; parentID: string; data: Record<string, unknown> },
  ): Promise<void> {
    this.detectStaleQueue(queueKey)
    const current = this.writeQueues.get(queueKey) ?? Promise.resolve()
    const next = current.then(async () => {
      await fn()
      this.lastWriteTimes.set(queueKey, Date.now())
    }).catch(async (err) => {
      // RC-5: Enqueue failed write to retry queue instead of swallowing
      if (retryData && this.retryQueue) {
        this.retryQueue.enqueue({
          sessionID: retryData.sessionID,
          parentID: retryData.parentID,
          data: retryData.data,
          attempt: 0,
          writeFn: async () => {
            await fn()
            return true
          },
        })
      }
      // Propagate error to caller
      throw err
    })
    this.writeQueues.set(queueKey, next.catch(() => {}))
    return next
  }

  /**
   * Reads an existing child file if it exists.
   *
   * @param parentSessionID - The directory-owning parent session ID.
   * @param childSessionID - The child session identifier.
   * @returns Existing child record, or `undefined` when no file exists.
   */
  private async readExistingChildFile(
    parentSessionID: string,
    childSessionID: string,
  ): Promise<ChildSessionRecord | undefined> {
    try {
      return await this.readChildFile(parentSessionID, childSessionID)
    } catch {
      return undefined
    }
  }

  /**
   * Merges new child metadata into an existing record without losing live data.
   *
   * @param existing - Existing child record from disk, if any.
   * @param metadata - New metadata to apply.
   * @returns Merged child record safe to write back to disk.
   */
  private mergeChildRecord(
    existing: ChildSessionRecord | undefined,
    metadata: ChildSessionRecord,
  ): ChildSessionRecord {
    if (!existing) return metadata

    const nextJourney = metadata.journey ?? []
    const existingJourney = existing.journey ?? []

    return {
      ...existing,
      ...metadata,
      created: existing.created,
      turns: metadata.turns.length > 0 ? metadata.turns : existing.turns,
      children: Array.from(new Set([...existing.children, ...metadata.children])),
      lastMessage: metadata.lastMessage ?? existing.lastMessage,
      journey: nextJourney.length > 0
        ? [...existingJourney, ...nextJourney]
        : existingJourney,
    }
  }

  /**
   * Reads and parses an existing child session `.json` file.
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @returns The parsed child session record.
   * @throws If the file does not exist or cannot be parsed.
   */
  private async readChildFile(
    parentSessionID: string,
    childSessionID: string,
  ): Promise<ChildSessionRecord> {
    const filePath = this.getChildFilePath(parentSessionID, childSessionID)
    const raw = await readFile(filePath, "utf-8")
    return JSON.parse(raw) as ChildSessionRecord
  }

  /**
   * Reads a child session record from disk using only the child session ID.
   *
   * Resolves the parent directory via hierarchy index, then falls back to
   * scanning all session-tracker subdirectories if the index is unavailable.
   *
   * @param sessionID - The child session identifier to look up.
   * @returns The parsed child session record, or `undefined` if not found.
   */
  async readChildData(sessionID: string): Promise<ChildSessionRecord | undefined> {
    if (this.hierarchyIndex) {
      const parentID = this.hierarchyIndex.getParent(sessionID)
      if (parentID) {
        try {
          return await this.readChildFile(parentID, sessionID)
        } catch {
          // File not found under indexed parent — try scan below
        }
      }
      const rootMain = this.hierarchyIndex.getRootMain(sessionID)
      if (rootMain) {
        try {
          return await this.readChildFile(rootMain, sessionID)
        } catch {
          // Not found under root main either
        }
      }
    }

    const trackerRoot = resolve(this.projectRoot, ".hivemind", "session-tracker")
    let entries: string[]
    try {
      entries = await readdir(trackerRoot)
    } catch {
      return undefined
    }

    const targetFile = `${sessionID}.json`
    for (const entry of entries) {
      try {
        const filePath = safeSessionPath(this.projectRoot, entry, targetFile)
        const raw = await readFile(filePath, "utf-8")
        return JSON.parse(raw) as ChildSessionRecord
      } catch {
        continue
      }
    }

    return undefined
  }

  /**
   * Creates a new child session `.json` file.
   *
   * Ensures the parent session subdirectory exists, then writes the
   * child metadata atomically.
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param metadata - The initial child session record.
   * @returns Promise that resolves when the file is created.
   */
  async createChildFile(
    parentSessionID: string,
    childSessionID: string,
    metadata: ChildSessionRecord,
  ): Promise<void> {
    // Resolve the correct parent directory (root main per D-03)
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)

    return this.enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        const parentDir = safeSessionPath(this.projectRoot, writeParent, "")
        await ensureDirectory(parentDir)

        const existing = await this.readExistingChildFile(writeParent, childSessionID)
        const merged = this.mergeChildRecord(existing, metadata)
        const filePath = this.getChildFilePath(writeParent, childSessionID)
        await atomicWriteJson(filePath, merged)
      },
      {
        sessionID: childSessionID,
        parentID: writeParent,
        data: metadata as unknown as Record<string, unknown>,
      },
    )
  }

  /**
   * Updates the `status` field of a child session `.json` file.
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param status - The new status value (e.g. "completed", "error").
   * @returns Promise that resolves when the status is updated.
   *
   * @throws If the child file does not exist.
   */
  async updateChildStatus(
    parentSessionID: string,
    childSessionID: string,
    status: string,
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return this.enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        const record = await this.readChildFile(writeParent, childSessionID)
        // Status precedence: terminal states ("completed", "error") must NOT
        // be overwritten by non-terminal states ("idle", "active"). This
        // prevents the race where session.idle fires after
        // recordChildTaskDelegation already set "completed".
        const terminalStates = new Set(["completed", "error"])
        if (terminalStates.has(record.status) && !terminalStates.has(status)) {
          return // Preserve terminal state
        }
        record.status = status
        record.updated = new Date().toISOString()

        const filePath = this.getChildFilePath(writeParent, childSessionID)
        await atomicWriteJson(filePath, record)
      },
    )
  }

  /**
   * Appends a turn to the `turns` array of a child session `.json` file.
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param turn - The turn record to append.
   * @returns Promise that resolves when the turn is appended.
   *
   * @throws If the child file does not exist.
   */
  async appendChildTurn(
    parentSessionID: string,
    childSessionID: string,
    turn: Turn,
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return this.enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        const record = await this.readChildFile(writeParent, childSessionID)
        // Auto-assign one-based turn number from current turns length
        turn.turn = record.turns.length + 1
        record.turns.push(turn)
        record.updated = new Date().toISOString()

        // P-04: Track last assistant message for resumption context
        const isAssistant = turn.role === "assistant" || (!turn.role && turn.actor !== "user")
        if (isAssistant && turn.content) {
          record.lastMessage = turn.content
        }

        const filePath = this.getChildFilePath(writeParent, childSessionID)
        await atomicWriteJson(filePath, record)

        // Sync turnCount to hierarchy manifest (Bug C)
        if (this.manifestWriter) {
          await this.manifestWriter.updateTurnCount(
            writeParent,
            childSessionID,
            record.turns.length,
          )
        }
      },
    )
  }

  /**
   * Appends a journey entry to the `journey` array of a child session `.json` file.
   *
   * Journey entries record tool calls, results, and assistant messages for
   * audit and recovery purposes (CP-ST-05-02).
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param entry - The journey entry to append.
   * @returns Promise that resolves when the entry is appended.
   *
   * @throws If the child file does not exist.
   */
  async appendJourneyEntry(
    parentSessionID: string,
    childSessionID: string,
    entry: JourneyEntry,
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return this.enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        const record = await this.readChildFile(writeParent, childSessionID)
        if (!record.journey) {
          record.journey = []
        }
        record.journey.push(entry)
        record.updated = new Date().toISOString()

        const filePath = this.getChildFilePath(writeParent, childSessionID)
        await atomicWriteJson(filePath, record)
      },
    )
  }

  /**
   * Backfills real agent metadata into a child session `.json` file
   * when the initial creation used fallback values (F-18).
   *
   * If `mainAgent.name` is "pending" or empty, replaces it with the
   * real agent name from the completed delegation. Otherwise no-ops
   * to avoid overwriting already-correct metadata.
   *
   * Uses the same `enqueueWrite()` + `resolveWriteParent()` + `readChildFile()`
   * + `atomicWriteJson()` pipeline as `updateChildStatus()`.
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param metadata - The real agent metadata to backfill.
   * @returns Promise that resolves when the backfill completes (or no-ops).
   */
  async backfillChildMetadata(
    parentSessionID: string,
    childSessionID: string,
    metadata: { agentName: string; model?: string; description?: string },
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return this.enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        let record: ChildSessionRecord
        try {
          record = await this.readChildFile(writeParent, childSessionID)
        } catch {
          // Child file doesn't exist yet — nothing to backfill
          return
        }

        // Only backfill if mainAgent is still the fallback "pending" value
        if (record.mainAgent?.name === "pending" || !record.mainAgent?.name) {
          record.mainAgent = {
            name: metadata.agentName,
            model: metadata.model ?? record.mainAgent?.model ?? "",
          }
          record.delegatedBy = {
            ...record.delegatedBy,
            agentName: metadata.agentName,
            description: metadata.description ?? record.delegatedBy?.description ?? "",
          }
          record.updated = new Date().toISOString()

          const filePath = this.getChildFilePath(writeParent, childSessionID)
          await atomicWriteJson(filePath, record)
        }
        // If mainAgent already has real values, no-op
      },
    )
  }

  /**
   * Backfills/replaces turns for an existing child session .json file.
   *
   * Updates/merges the turns array and sets lastMessage to the latest assistant turn.
   */
  async backfillChildTurns(
    parentSessionID: string,
    childSessionID: string,
    turns: Turn[],
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return this.enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        let record: ChildSessionRecord
        try {
          record = await this.readChildFile(writeParent, childSessionID)
        } catch {
          // Child file doesn't exist yet — nothing to backfill
          return
        }

        let updated = false
        if (turns.length > record.turns.length) {
          record.turns = turns
          updated = true
        }

        const lastAssistant = [...record.turns].reverse().find(
          (t) => t.role === "assistant" || (!t.role && t.actor !== "user"),
        )
        if (lastAssistant?.content && record.lastMessage !== lastAssistant.content) {
          record.lastMessage = lastAssistant.content
          updated = true
        }

        if (updated) {
          record.updated = new Date().toISOString()
          const filePath = this.getChildFilePath(writeParent, childSessionID)
          await atomicWriteJson(filePath, record)
        }
      },
    )
  }
}
