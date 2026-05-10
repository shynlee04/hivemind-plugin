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
  private projectRoot: string

  /**
   * Promise-based serial queue. Each write chains after the previous one.
   * Initialized to a resolved promise to allow the first write to proceed.
   */
  private writeQueue: Promise<void> = Promise.resolve()

  /**
   * @param deps - Injected dependencies.
   * @param deps.projectRoot - Absolute path to the project root.
   */
  constructor(deps: { projectRoot: string }) {
    this.projectRoot = deps.projectRoot
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
   * index atomically.
   *
   * @returns Promise that resolves when the index is written.
   */
  async initializeIndex(): Promise<void> {
    const rootDir = sessionTrackerRoot(this.projectRoot)
    await ensureDirectory(rootDir)
    const filePath = this.getIndexPath()
    const index = this.createDefault()
    await atomicWriteJson(filePath, index)
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
   * Enqueues a write operation into the serial queue.
   *
   * Chains the provided function onto the end of `writeQueue` so that
   * only one write is in-flight at a time. Errors are caught and logged
   * to prevent a failed write from breaking the queue entirely.
   *
   * @param fn - The write operation to enqueue.
   * @returns Promise that resolves when the enqueued write completes.
   */
  private async enqueueWrite(fn: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue.then(fn).catch((err) => {
      console.warn(
        "[Harness] Session tracker: project index write failed:",
        err,
      )
    })
    return this.writeQueue
  }
}
