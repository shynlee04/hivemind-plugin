/**
 * Session-local continuity index writer.
 *
 * Manages the `session-continuity.json` file inside each main session's
 * subdirectory. Tracks parent-child hierarchy within a single session.
 * All writes use `atomicWriteJson()` for crash safety.
 *
 * File location: `.hivemind/session-tracker/{sessionID}/session-continuity.json`
 *
 * @module session-tracker/persistence/session-index-writer
 */

import { readFile } from "node:fs/promises"
import {
  atomicWriteJson,
  ensureDirectory,
  safeSessionPath,
} from "./atomic-write.js"
import type { SessionContinuityIndex, ChildHierarchyEntry } from "../types.js"

// ---------------------------------------------------------------------------
// SessionIndexWriter class
// ---------------------------------------------------------------------------

/**
 * Manages the session-local continuity index file.
 *
 * Provides methods to initialize the index, add child session references,
 * update child statuses, increment turn counts, and track tool usage.
 */
export class SessionIndexWriter {
  private projectRoot: string

  /**
   * Per-session serial write queues to prevent concurrent read-modify-write
   * corruption. Each session gets its own queue because SessionIndexWriter
   * writes to DIFFERENT files per session.
   */
  private writeQueues: Map<string, Promise<void>> = new Map()

  /**
   * Timestamp of the last successful write per session, used for stale
   * queue detection.
   */
  private lastWriteTimes: Map<string, number> = new Map()

  /**
   * Threshold (in milliseconds) before a per-session queue is considered
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
   * Returns the absolute path to the session-continuity.json file.
   *
   * @param sessionID - The session identifier.
   * @returns Absolute file path.
   */
  private getIndexPath(sessionID: string): string {
    return safeSessionPath(
      this.projectRoot,
      sessionID,
      "session-continuity.json",
    )
  }

  /**
   * Detects and resets a stale write queue for a given session.
   *
   * If no write has completed for this session within `STALE_QUEUE_MS`,
   * the queue is replaced with a fresh resolved promise so subsequent
   * writes are not blocked by a stuck preceding promise.
   *
   * @param sessionID - The session identifier.
   */
  private detectStaleQueue(sessionID: string): void {
    const lastTime = this.lastWriteTimes.get(sessionID)
    // No write has completed for this session yet — nothing to reset
    if (lastTime === undefined) return
    if (Date.now() - lastTime > SessionIndexWriter.STALE_QUEUE_MS) {
      this.writeQueues.set(sessionID, Promise.resolve())
    }
  }

  /**
   * Enqueues a write operation into the per-session serial queue.
   *
   * Stale-queue detection runs first to auto-recover from a frozen pipeline.
   * Chains the provided function onto the end of the session's write queue
   * so that only one write per session is in-flight at a time. Records
   * `lastWriteTime` on success. Errors are caught silently to prevent a
   * failed write from breaking the queue entirely. A final `.then()` ensures
   * the promise chain always resolves to void.
   *
   * @param sessionID - The session identifier (queue key).
   * @param fn - The write operation to enqueue.
   * @returns Promise that resolves when the enqueued write completes.
   */
  private enqueueWrite(
    sessionID: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    this.detectStaleQueue(sessionID)
    const current = this.writeQueues.get(sessionID) ?? Promise.resolve()
    const next = current
      .then(async () => {
        await fn()
        this.lastWriteTimes.set(sessionID, Date.now())
      })
      .catch(() => {
        // Best-effort: swallow errors to keep queue alive
      })
      .then(() => {})
    this.writeQueues.set(sessionID, next)
    return next
  }

  /**
   * Reads an existing index or returns a default.
   *
   * @param sessionID - The session identifier.
   * @returns The parsed index (or a new default if the file doesn't exist).
   */
  private async readIndex(sessionID: string): Promise<SessionContinuityIndex> {
    try {
      const filePath = this.getIndexPath(sessionID)
      const raw = await readFile(filePath, "utf-8")
      return JSON.parse(raw) as SessionContinuityIndex
    } catch {
      return this.createDefault(sessionID)
    }
  }

  /**
   * Creates a default session continuity index.
   *
   * @param sessionID - The session identifier.
   * @returns A fresh default index.
   */
  private createDefault(sessionID: string): SessionContinuityIndex {
    return {
      version: "2.0",
      sessionID,
      lastUpdated: new Date().toISOString(),
      hierarchy: {
        root: sessionID,
        children: {},
      },
      turnCount: 0,
      toolSummary: {},
    }
  }

  /**
   * Initializes a new session-local continuity index file.
   *
   * Creates the session subdirectory and writes the default index atomically.
   *
   * @param sessionID - The session identifier.
   * @returns Promise that resolves when the index is written.
   */
  async initializeIndex(sessionID: string): Promise<void> {
    const dirPath = safeSessionPath(this.projectRoot, sessionID, "")
    await ensureDirectory(dirPath)
    const filePath = this.getIndexPath(sessionID)
    const index = this.createDefault(sessionID)
    await atomicWriteJson(filePath, index)
  }

  /**
   * Adds a child session to the hierarchy tree and writes the updated index.
   *
   * @param sessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param childFile - The child's `.json` filename.
   * @param depth - The delegation depth of the child.
   * @param delegatedBy - Who delegated this child (agent name).
   * @returns Promise that resolves when the index is updated.
   */
  async addChild(
    sessionID: string,
    childSessionID: string,
    childFile: string,
    depth: number,
    delegatedBy: string,
  ): Promise<void> {
    return this.enqueueWrite(sessionID, async () => {
      const index = await this.readIndex(sessionID)
      index.lastUpdated = new Date().toISOString()

      const entry: ChildHierarchyEntry = {
        file: childFile,
        depth,
        status: "active",
        delegatedBy,
        children: {},
      }

      index.hierarchy.children[childSessionID] = entry

      const filePath = this.getIndexPath(sessionID)
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Updates a child session's status in the index.
   *
   * @param sessionID - The parent session identifier.
   * @param childSessionID - The child session identifier.
   * @param status - The new status (e.g. "completed", "error").
   * @returns Promise that resolves when the index is updated.
   */
  async updateChildStatus(
    sessionID: string,
    childSessionID: string,
    status: string,
  ): Promise<void> {
    return this.enqueueWrite(sessionID, async () => {
      const index = await this.readIndex(sessionID)
      index.lastUpdated = new Date().toISOString()

      const child = index.hierarchy.children[childSessionID]
      if (child) {
        child.status = status
      }

      const filePath = this.getIndexPath(sessionID)
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Increments the turn counter in the index.
   *
   * @param sessionID - The session identifier.
   * @returns Promise that resolves when the index is updated.
   */
  async incrementTurnCount(sessionID: string): Promise<void> {
    return this.enqueueWrite(sessionID, async () => {
      const index = await this.readIndex(sessionID)
      index.lastUpdated = new Date().toISOString()
      index.turnCount++

      const filePath = this.getIndexPath(sessionID)
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Increments the tool usage count for a specific tool in the index.
   *
   * @param sessionID - The session identifier.
   * @param toolName - The name of the tool to increment.
   * @returns Promise that resolves when the index is updated.
   */
  async updateToolSummary(
    sessionID: string,
    toolName: string,
  ): Promise<void> {
    return this.enqueueWrite(sessionID, async () => {
      const index = await this.readIndex(sessionID)
      index.lastUpdated = new Date().toISOString()

      const current = index.toolSummary[toolName] ?? 0
      index.toolSummary[toolName] = current + 1

      const filePath = this.getIndexPath(sessionID)
      await atomicWriteJson(filePath, index)
    })
  }
}
