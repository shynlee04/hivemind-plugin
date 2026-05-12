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
    const record = await this.readChildFile(parentSessionID, childSessionID)
    record.status = status
    record.updated = new Date().toISOString()

    const filePath = this.getChildFilePath(parentSessionID, childSessionID)
    await atomicWriteJson(filePath, record)
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
    const record = await this.readChildFile(parentSessionID, childSessionID)
    record.turns.push(turn)
    record.updated = new Date().toISOString()

    // P-04: Track last assistant message for resumption context
    if (turn.actor !== "user" && turn.content) {
      record.lastMessage = turn.content.length > 200
        ? turn.content.slice(0, 200)
        : turn.content
    }

    const filePath = this.getChildFilePath(parentSessionID, childSessionID)
    await atomicWriteJson(filePath, record)
  }
}
