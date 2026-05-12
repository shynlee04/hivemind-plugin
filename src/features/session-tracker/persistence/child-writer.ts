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

import { readFile } from "node:fs/promises"
import { atomicWriteJson, ensureDirectory, safeSessionPath } from "./atomic-write.js"
import type { ChildSessionRecord, Turn } from "../types.js"

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
   * Per-child serial write queues (key: `parentID/childID`).
   * Prevents concurrent read-modify-write corruption on child .json files.
   */
  private writeQueues: Map<string, Promise<void>> = new Map()

  /**
   * Per-child last write timestamps for stale queue detection.
   */
  private lastWriteTimes: Map<string, number> = new Map()

  /**
   * Threshold (in milliseconds) before a per-child queue is considered
   * stale and auto-reset.
   */
  private static readonly STALE_QUEUE_MS = 5 * 60 * 1000

  /**
   * @param deps - Injected dependencies.
   * @param deps.projectRoot - Absolute path to the project root.
   */
  constructor(deps: { projectRoot: string }) {
    this.projectRoot = deps.projectRoot
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
   * `lastWriteTime` on success. Errors are caught silently to prevent a
   * failed write from breaking the queue entirely. A final `.then()` ensures
   * the promise chain always resolves to void.
   *
   * @param queueKey - The queue key (`parentID/childID`).
   * @param fn - The write operation to enqueue.
   * @returns Promise that resolves when the enqueued write completes.
   */
  private enqueueWrite(
    queueKey: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    this.detectStaleQueue(queueKey)
    const current = this.writeQueues.get(queueKey) ?? Promise.resolve()
    const next = current
      .then(async () => {
        await fn()
        this.lastWriteTimes.set(queueKey, Date.now())
      })
      .catch(() => {
        // Best-effort: swallow errors to keep queue alive
      })
      .then(() => {})
    this.writeQueues.set(queueKey, next)
    return next
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
    // Ensure the parent session subdirectory exists
    const parentDir = safeSessionPath(this.projectRoot, parentSessionID, "")
    await ensureDirectory(parentDir)

    const filePath = this.getChildFilePath(parentSessionID, childSessionID)
    await atomicWriteJson(filePath, metadata)
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
    return this.enqueueWrite(
      `${parentSessionID}/${childSessionID}`,
      async () => {
        const record = await this.readChildFile(parentSessionID, childSessionID)
        record.status = status
        record.updated = new Date().toISOString()

        const filePath = this.getChildFilePath(parentSessionID, childSessionID)
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
    return this.enqueueWrite(
      `${parentSessionID}/${childSessionID}`,
      async () => {
        const record = await this.readChildFile(parentSessionID, childSessionID)
        record.turns.push(turn)
        record.updated = new Date().toISOString()

        // P-04: Track last assistant message for resumption context
        if (turn.actor !== "user" && turn.content) {
          record.lastMessage =
            turn.content.length > 200
              ? turn.content.slice(0, 200)
              : turn.content
        }

        const filePath = this.getChildFilePath(parentSessionID, childSessionID)
        await atomicWriteJson(filePath, record)
      },
    )
  }
}
