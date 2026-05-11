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
    const index = await this.readIndex(sessionID)
    index.lastUpdated = new Date().toISOString()

    const child = index.hierarchy.children[childSessionID]
    if (child) {
      child.status = status
    }

    const filePath = this.getIndexPath(sessionID)
    await atomicWriteJson(filePath, index)
  }

  /**
   * Increments the turn counter in the index.
   *
   * @param sessionID - The session identifier.
   * @returns Promise that resolves when the index is updated.
   */
  async incrementTurnCount(sessionID: string): Promise<void> {
    const index = await this.readIndex(sessionID)
    index.lastUpdated = new Date().toISOString()
    index.turnCount++

    const filePath = this.getIndexPath(sessionID)
    await atomicWriteJson(filePath, index)
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
    const index = await this.readIndex(sessionID)
    index.lastUpdated = new Date().toISOString()

    const current = index.toolSummary[toolName] ?? 0
    index.toolSummary[toolName] = current + 1

    const filePath = this.getIndexPath(sessionID)
    await atomicWriteJson(filePath, index)
  }
}
