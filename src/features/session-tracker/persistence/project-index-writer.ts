/**
 * Project-level continuity index writer with serial queue.
 *
 * Manages the `project-continuity.json` file at the session-tracker root.
 * Connects all main sessions across the project for cross-session navigation.
 * Uses a serial promise queue to prevent concurrent write corruption (REQ-ST-09).
 *
 * File location: `.hivemind/session-tracker/project-continuity.json`
 *
 * @module session-tracker/persistence/project-index-writer
 */

import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  atomicWriteJson,
  ensureDirectory,
  sessionTrackerRoot,
} from "./atomic-write.js"
import type {
  ProjectContinuityIndex,
  ProjectSessionEntry,
} from "../types.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import type { HierarchyIndex } from "./hierarchy-index.js"

// ---------------------------------------------------------------------------
// ProjectIndexWriter class
// ---------------------------------------------------------------------------

/**
 * Manages the project-level continuity index with serialized concurrent writes.
 *
 * All mutation methods are serialized through `writeQueue` to ensure
 * only one write is in-flight at a time. This prevents corruption
 * when up to 6 concurrent sessions write to the same index file.
 */
export class ProjectIndexWriter {
  private client: OpenCodeClient
  private projectRoot: string

  /**
   * Optional hierarchy index for computing childCount and totalDelegationDepth.
   * When undefined, these fields will remain at their default values (0).
   */
  private hierarchyIndex: HierarchyIndex | undefined

  /**
   * Timestamp of the last successful write (epoch ms).
   * Initialized to now so the queue is immediately "healthy."
   */
  private lastWriteTime: number = Date.now()

  /**
   * Duration of write inactivity before the queue is detected as stale
   * and auto-recovered (5 minutes).
   */
  private static readonly STALE_QUEUE_MS = 300_000

  /**
   * Promise-based serial queue. Each write chains after the previous one.
   * Initialized to a resolved promise to allow the first write to proceed.
   */
  private writeQueue: Promise<void> = Promise.resolve()

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for logging.
   * @param deps.projectRoot - Absolute path to the project root.
   * @param deps.hierarchyIndex - Optional hierarchy index for childCount/depth.
   */
  constructor(deps: {
    client: OpenCodeClient
    projectRoot: string
    hierarchyIndex?: HierarchyIndex
  }) {
    this.client = deps.client
    this.projectRoot = deps.projectRoot
    this.hierarchyIndex = deps.hierarchyIndex
  }

  /**
   * Returns the absolute path to the project-continuity.json file.
   *
   * @returns Absolute file path.
   */
  private getIndexPath(): string {
    return resolve(sessionTrackerRoot(this.projectRoot), "project-continuity.json")
  }

  /**
   * Reads the existing project index or returns a default.
   *
   * @returns The parsed index (or a new default if the file doesn't exist).
   */
  private async readIndex(): Promise<ProjectContinuityIndex> {
    try {
      const filePath = this.getIndexPath()
      const raw = await readFile(filePath, "utf-8")
      return JSON.parse(raw) as ProjectContinuityIndex
    } catch {
      return this.createDefault()
    }
  }

  /**
   * Creates a default project continuity index.
   *
   * @returns A fresh default index.
   */
  private createDefault(): ProjectContinuityIndex {
    return {
      version: "2.0",
      projectRoot: this.projectRoot,
      lastUpdated: new Date().toISOString(),
      sessions: {},
      chronologicalOrder: [],
    }
  }

  /**
   * Initializes the project-level continuity index file.
   *
   * Creates the session-tracker root directory and writes the default
   * index atomically. Uses the serial queue to prevent concurrent write
   * corruption with hook-triggered writes.
   *
   * Only writes if the file does not already exist — preserves any
   * lazily-bootstrapped session entries written before initialization
   * completes.
   *
   * @returns Promise that resolves when the index is written.
   */
  async initializeIndex(): Promise<void> {
    await this.enqueueWrite(async () => {
      const rootDir = sessionTrackerRoot(this.projectRoot)
      await ensureDirectory(rootDir)
      const filePath = this.getIndexPath()

      // Only create if file doesn't exist — prevents overwriting populated index
      try {
        await readFile(filePath, "utf-8")
        // File exists — skip initialization to preserve existing data
        return
      } catch {
        // File doesn't exist — write the default
      }

      const index = this.createDefault()
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Adds a new main session to the project index.
   *
   * Serialized via the write queue to prevent concurrent write corruption.
   *
   * @param sessionID - The session identifier.
   * @param sessionDir - Relative path to the session subdirectory.
   * @param mainFile - Filename of the main session `.md` file.
   * @returns Promise that resolves when the index is updated.
   */
  async addSession(
    sessionID: string,
    sessionDir: string,
    mainFile: string,
  ): Promise<void> {
    await this.enqueueWrite(async () => {
      const index = await this.readIndex()
      const now = new Date().toISOString()

      index.lastUpdated = now

      const existing = index.sessions[sessionID]
      if (existing) {
        // Session already registered — only update non-path metadata.
        // Preserve dir, mainFile, continuityIndex, created, childCount,
        // and totalDelegationDepth to prevent data loss on concurrent writes.
        existing.updated = now
        if (existing.status !== "error" && existing.status !== "deleted") {
          existing.status = "active"
        }
      } else {
        index.sessions[sessionID] = {
          dir: sessionDir,
          mainFile,
          continuityIndex: `${sessionDir}session-continuity.json`,
          created: now,
          updated: now,
          status: "active",
          childCount: 0,
          totalDelegationDepth: 0,
        }
      }

      if (!index.chronologicalOrder.includes(sessionID)) {
        index.chronologicalOrder.push(sessionID)
      }

      const filePath = this.getIndexPath()
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Updates an existing session's metadata in the project index.
   *
   * Serialized via the write queue. Merges partial updates into the
   * existing session entry.
   *
   * @param sessionID - The session identifier.
   * @param updates - Partial session metadata to merge.
   * @returns Promise that resolves when the index is updated.
   */
  async updateSession(
    sessionID: string,
    updates: Partial<ProjectSessionEntry>,
  ): Promise<void> {
    await this.enqueueWrite(async () => {
      const index = await this.readIndex()
      const now = new Date().toISOString()

      const existing = index.sessions[sessionID]
      if (existing) {
        // F-19: Compute childCount and totalDelegationDepth from hierarchy index
        updates.childCount = await this.computeChildCount(sessionID)
        updates.totalDelegationDepth = await this.computeMaxDepth(sessionID)

        index.sessions[sessionID] = {
          ...existing,
          ...updates,
          updated: now,
        }
      }

      index.lastUpdated = now

      const filePath = this.getIndexPath()
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Computes childCount from the hierarchy index.
   * Returns 0 if no hierarchyIndex is wired (graceful degradation).
   *
   * @param sessionID - The session to count children for.
   * @returns The number of direct children.
   */
  private async computeChildCount(sessionID: string): Promise<number> {
    if (!this.hierarchyIndex) return 0
    return this.hierarchyIndex.getChildCountForSession(sessionID)
  }

  /**
   * Computes the maximum delegation depth from the hierarchy index.
   * Returns 0 if no hierarchyIndex is wired.
   *
   * @param sessionID - The session to measure depth for.
   * @returns The maximum delegation depth.
   */
  private async computeMaxDepth(sessionID: string): Promise<number> {
    if (!this.hierarchyIndex) return 0
    return this.hierarchyIndex.getMaxDepthForSession(sessionID)
  }

  /**
   * Atomically increments the childCount for a session in the project index.
   *
   * If `depth` is provided and exceeds the current `totalDelegationDepth`,
   * updates it to reflect the deepest delegation seen (AC-10).
   *
   * Serialized via the write queue to prevent concurrent update corruption.
   *
   * @param sessionID - The parent session identifier.
   * @param depth - Optional delegation depth of the new child.
   * @returns Promise that resolves when the index is updated.
   */
  async incrementChildCount(sessionID: string, depth?: number): Promise<void> {
    await this.enqueueWrite(async () => {
      const index = await this.readIndex()
      const now = new Date().toISOString()
      const entry = index.sessions[sessionID]
      if (entry) {
        entry.childCount = (entry.childCount ?? 0) + 1
        if (depth !== undefined && depth > (entry.totalDelegationDepth ?? 0)) {
          entry.totalDelegationDepth = depth
        }
        entry.updated = now
      }
      index.lastUpdated = now
      const filePath = this.getIndexPath()
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Removes a session from the project index.
   *
   * Serialized via the write queue. Removes the session entry and
   * updates the chronological order.
   *
   * @param sessionID - The session identifier to remove.
   * @returns Promise that resolves when the index is updated.
   */
  async removeSession(sessionID: string): Promise<void> {
    await this.enqueueWrite(async () => {
      const index = await this.readIndex()
      const now = new Date().toISOString()

      delete index.sessions[sessionID]
      index.chronologicalOrder = index.chronologicalOrder.filter(
        (id) => id !== sessionID,
      )
      index.lastUpdated = now

      const filePath = this.getIndexPath()
      await atomicWriteJson(filePath, index)
    })
  }

  /**
   * Checks if the write queue has been idle beyond the stale threshold.
   *
   * If `lastWriteTime` is older than `STALE_QUEUE_MS`, logs a warning
   * and resets the queue so subsequent writes are not blocked by a stuck
   * preceding promise (DEFECT-02).
   */
  private detectStaleQueue(): void {
    if (Date.now() - this.lastWriteTime > ProjectIndexWriter.STALE_QUEUE_MS) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message:
            "[Harness] Session tracker: project index write queue appears STALE " +
            "— last successful write was more than 5 minutes ago. Resetting queue.",
        },
      })
      this.writeQueue = Promise.resolve()
    }
  }

  /**
   * Returns the current health of the serial write queue.
   *
   * @returns Object with `lastWriteTime` as an ISO string and `stalled`
   *   boolean indicating whether the queue has exceeded the stale threshold.
   */
  async getQueueHealth(): Promise<{ lastWriteTime: string; stalled: boolean }> {
    return {
      lastWriteTime: new Date(this.lastWriteTime).toISOString(),
      stalled:
        Date.now() - this.lastWriteTime > ProjectIndexWriter.STALE_QUEUE_MS,
    }
  }

  /**
   * Enqueues a write operation into the serial queue.
   *
   * Stale-queue detection runs FIRST to auto-recover from a frozen pipeline.
   * Chains the provided function onto the end of `writeQueue` so that only
   * one write is in-flight at a time. Records `lastWriteTime` on success.
   * Errors are caught and logged to prevent a failed write from breaking the
   * queue entirely. A final `.then()` ensures the promise chain always resolves
   * to void (DEFECT-02).
   *
   * @param fn - The write operation to enqueue.
   * @returns Promise that resolves when the enqueued write completes.
   */
  private async enqueueWrite(fn: () => Promise<void>): Promise<void> {
    this.detectStaleQueue()

    this.writeQueue = this.writeQueue
      .then(async () => {
        await fn()
        this.lastWriteTime = Date.now()
      })
      .catch((err) => {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: "[Harness] Session tracker: project index write failed",
            extra: { error: err instanceof Error ? err.message : String(err) },
          },
        })
      })
      .then(() => {})

    return this.writeQueue
  }
}
