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

import { atomicWriteJson, ensureDirectory, safeSessionPath } from "./atomic-write.js"
import type { ChildSessionRecord, Turn, JourneyEntry } from "../types.js"
import type { HierarchyIndex } from "./hierarchy-index.js"
import type { ChildWriteRetryQueue } from "./retry-queue.js"
import type { HierarchyManifestWriter } from "./hierarchy-manifest.js"
import { enqueueWrite } from "./child-writer-queue.js"
import type { RetryData } from "./child-writer-queue.js"
import {
  getChildFilePath,
  readChildFile,
  readExistingChildFile,
  readChildData as readChildDataImpl,
  childFileExists as childFileExistsImpl,
  mergeChildRecord,
} from "./child-reader.js"

// Re-export read operations for direct consumers
export { readChildData, childFileExists } from "./child-reader.js"

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
   * Checks if a child session `.json` file exists on disk.
   *
   * @param parentSessionID - The parent session ID.
   * @param childSessionID - The child session ID.
   * @returns True if the file exists on disk.
   */
  async childFileExists(
    parentSessionID: string,
    childSessionID: string,
  ): Promise<boolean> {
    return childFileExistsImpl(
      this.projectRoot,
      this.hierarchyIndex,
      parentSessionID,
      childSessionID,
      this.resolveWriteParent.bind(this),
    )
  }

  /**
   * Reads a child session record from disk using only the child session ID.
   *
   * @param sessionID - The child session identifier to look up.
   * @returns The parsed child session record, or `undefined` if not found.
   */
  async readChildData(sessionID: string): Promise<ChildSessionRecord | undefined> {
    return readChildDataImpl(this.projectRoot, this.hierarchyIndex, sessionID)
  }

  /**
   * Creates a new child session `.json` file.
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
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    const retryData: RetryData = {
      sessionID: childSessionID,
      parentID: writeParent,
      data: metadata as unknown as Record<string, unknown>,
    }

    return enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        const parentDir = safeSessionPath(this.projectRoot, writeParent, "")
        await ensureDirectory(parentDir)

        const existing = await readExistingChildFile(this.projectRoot, writeParent, childSessionID)
        const merged = mergeChildRecord(existing, metadata)
        const filePath = getChildFilePath(this.projectRoot, writeParent, childSessionID)
        await atomicWriteJson(filePath, merged)
      },
      retryData,
      this.writeQueues,
      this.lastWriteTimes,
      this.retryQueue,
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
   * Silently no-ops when the child file does not exist (ENOENT is caught).
   */
  async updateChildStatus(
    parentSessionID: string,
    childSessionID: string,
    status: string,
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        let record: ChildSessionRecord
        try {
          record = await readChildFile(this.projectRoot, writeParent, childSessionID)
        } catch {
          return
        }
        const terminalStates = new Set(["completed", "error", "aborted", "cancelled"])
        if (terminalStates.has(record.status) && !terminalStates.has(status)) {
          return
        }
        record.status = status
        record.updated = new Date().toISOString()

        const filePath = getChildFilePath(this.projectRoot, writeParent, childSessionID)
        await atomicWriteJson(filePath, record)
      },
      undefined,
      this.writeQueues,
      this.lastWriteTimes,
      this.retryQueue,
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
   * Silently no-ops when the child file does not exist (ENOENT is caught).
   */
  async appendChildTurn(
    parentSessionID: string,
    childSessionID: string,
    turn: Turn,
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        let record: ChildSessionRecord
        try {
          record = await readChildFile(this.projectRoot, writeParent, childSessionID)
        } catch {
          return
        }
        turn.turn = record.turns.length + 1
        record.turns.push(turn)
        record.updated = new Date().toISOString()

        const isAssistant = turn.role === "assistant" || (!turn.role && turn.actor !== "user")
        if (isAssistant && turn.content) {
          record.lastMessage = turn.content
        }

        const filePath = getChildFilePath(this.projectRoot, writeParent, childSessionID)
        await atomicWriteJson(filePath, record)

        if (this.manifestWriter) {
          await this.manifestWriter.updateTurnCount(
            writeParent,
            childSessionID,
            record.turns.length,
          )
        }
      },
      undefined,
      this.writeQueues,
      this.lastWriteTimes,
      this.retryQueue,
    )
  }

  /**
   * Appends a journey entry to the `journey` array of a child session `.json` file.
   *
   * @param parentSessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param entry - The journey entry to append.
   * @returns Promise that resolves when the entry is appended.
   *
   * Silently no-ops when the child file does not exist (ENOENT is caught).
   */
  async appendJourneyEntry(
    parentSessionID: string,
    childSessionID: string,
    entry: JourneyEntry,
  ): Promise<void> {
    const writeParent = this.resolveWriteParent(childSessionID, parentSessionID)
    return enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        let record: ChildSessionRecord
        try {
          record = await readChildFile(this.projectRoot, writeParent, childSessionID)
        } catch {
          return
        }
        if (!record.journey) {
          record.journey = []
        }
        record.journey.push(entry)
        record.updated = new Date().toISOString()

        const filePath = getChildFilePath(this.projectRoot, writeParent, childSessionID)
        await atomicWriteJson(filePath, record)
      },
      undefined,
      this.writeQueues,
      this.lastWriteTimes,
      this.retryQueue,
    )
  }

  /**
   * Backfills real agent metadata into a child session `.json` file (F-18).
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
    return enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        let record: ChildSessionRecord
        try {
          record = await readChildFile(this.projectRoot, writeParent, childSessionID)
        } catch {
          return
        }

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

          const filePath = getChildFilePath(this.projectRoot, writeParent, childSessionID)
          await atomicWriteJson(filePath, record)
        }
      },
      undefined,
      this.writeQueues,
      this.lastWriteTimes,
      this.retryQueue,
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
    return enqueueWrite(
      `${writeParent}/${childSessionID}`,
      async () => {
        let record: ChildSessionRecord
        try {
          record = await readChildFile(this.projectRoot, writeParent, childSessionID)
        } catch {
          return
        }

        let updated = false
        if (turns.length > record.turns.length) {
          record.turns = turns
          updated = true
        } else if (turns.length === record.turns.length) {
          for (let i = 0; i < turns.length; i++) {
            if (turns[i].content !== record.turns[i].content) {
              record.turns[i].content = turns[i].content
              updated = true
            }
          }
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
          const filePath = getChildFilePath(this.projectRoot, writeParent, childSessionID)
          await atomicWriteJson(filePath, record)
        }
      },
      undefined,
      this.writeQueues,
      this.lastWriteTimes,
      this.retryQueue,
    )
  }
}
