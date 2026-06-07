/**
 * Child file read operations for ChildWriter.
 *
 * Extracts read, merge, and path-resolution methods that don't need
 * direct queue infrastructure. Used by ChildWriter for all read-path
 * operations on child session `.json` files.
 *
 * @module session-tracker/persistence/child-reader
 */

import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { safeSessionPath } from "./atomic-write.js"
import type { ChildSessionRecord } from "../types.js"
import type { HierarchyIndex } from "./hierarchy-index.js"

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/**
 * Gets the absolute path to a child session `.json` file.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param parentSessionID - The parent session identifier.
 * @param childSessionID - The child session identifier.
 * @returns Absolute path to the child `.json` file.
 */
export function getChildFilePath(
  projectRoot: string,
  parentSessionID: string,
  childSessionID: string,
): string {
  return safeSessionPath(
    projectRoot,
    parentSessionID,
    `${childSessionID}.json`,
  )
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Reads and parses an existing child session `.json` file.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param parentSessionID - The parent session identifier.
 * @param childSessionID - The child session identifier.
 * @returns The parsed child session record.
 * @throws If the file does not exist or cannot be parsed.
 */
export async function readChildFile(
  projectRoot: string,
  parentSessionID: string,
  childSessionID: string,
): Promise<ChildSessionRecord> {
  const filePath = getChildFilePath(projectRoot, parentSessionID, childSessionID)
  const raw = await readFile(filePath, "utf-8")
  return JSON.parse(raw) as ChildSessionRecord
}

/**
 * Reads an existing child file if it exists (returns undefined on failure).
 *
 * @param projectRoot - Absolute path to the project root.
 * @param parentSessionID - The directory-owning parent session ID.
 * @param childSessionID - The child session identifier.
 * @returns Existing child record, or `undefined` when no file exists.
 */
export async function readExistingChildFile(
  projectRoot: string,
  parentSessionID: string,
  childSessionID: string,
): Promise<ChildSessionRecord | undefined> {
  try {
    return await readChildFile(projectRoot, parentSessionID, childSessionID)
  } catch {
    return undefined
  }
}

/**
 * Checks if a child session `.json` file exists on disk.
 *
 * Resolves via hierarchy index (D-03 root main directory) first,
 * then falls back to scanning all session-tracker subdirectories.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param hierarchyIndex - Optional hierarchy index for root main resolution.
 * @param parentSessionID - The parent session ID.
 * @param childSessionID - The child session ID.
 * @param resolveWriteParent - Function to resolve the correct write parent.
 * @returns True if the file exists on disk.
 */
export async function childFileExists(
  projectRoot: string,
  _hierarchyIndex: HierarchyIndex | undefined,
  parentSessionID: string,
  childSessionID: string,
  resolveWriteParent: (childID: string, immediateParentID: string) => string,
): Promise<boolean> {
  // Primary: resolve via hierarchy index (D-03 root main directory)
  const writeParent = resolveWriteParent(childSessionID, parentSessionID)
  const primaryPath = getChildFilePath(projectRoot, writeParent, childSessionID)
  try {
    await readFile(primaryPath, "utf-8")
    return true
  } catch {
    // Primary lookup failed — fall back to scanning all directories
  }

  // Fallback: scan all session-tracker subdirectories
  const trackerRoot = resolve(projectRoot, ".hivemind", "session-tracker")
  let entries: string[]
  try {
    entries = await readdir(trackerRoot)
  } catch {
    return false
  }

  const targetFile = `${childSessionID}.json`
  for (const entry of entries) {
    try {
      const filePath = safeSessionPath(projectRoot, entry, targetFile)
      await readFile(filePath, "utf-8")
      return true
    } catch {
      continue
    }
  }

  return false
}

/**
 * Reads a child session record from disk using only the child session ID.
 *
 * Resolves the parent directory via hierarchy index, then falls back to
 * scanning all session-tracker subdirectories if the index is unavailable.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param hierarchyIndex - Optional hierarchy index for parent resolution.
 * @param sessionID - The child session identifier to look up.
 * @returns The parsed child session record, or `undefined` if not found.
 */
export async function readChildData(
  projectRoot: string,
  hierarchyIndex: HierarchyIndex | undefined,
  sessionID: string,
): Promise<ChildSessionRecord | undefined> {
  if (hierarchyIndex) {
    const parentID = hierarchyIndex.getParent(sessionID)
    if (parentID) {
      try {
        return await readChildFile(projectRoot, parentID, sessionID)
      } catch {
        // File not found under indexed parent — try scan below
      }
    }
    const rootMain = hierarchyIndex.getRootMain(sessionID)
    if (rootMain) {
      try {
        return await readChildFile(projectRoot, rootMain, sessionID)
      } catch {
        // Not found under root main either
      }
    }
  }

  const trackerRoot = resolve(projectRoot, ".hivemind", "session-tracker")
  let entries: string[]
  try {
    entries = await readdir(trackerRoot)
  } catch {
    return undefined
  }

  const targetFile = `${sessionID}.json`
  for (const entry of entries) {
    try {
      const filePath = safeSessionPath(projectRoot, entry, targetFile)
      const raw = await readFile(filePath, "utf-8")
      return JSON.parse(raw) as ChildSessionRecord
    } catch {
      continue
    }
  }

  return undefined
}

// ---------------------------------------------------------------------------
// Merge operation
// ---------------------------------------------------------------------------

/**
 * Merges new child metadata into an existing record without losing live data.
 *
 * @param existing - Existing child record from disk, if any.
 * @param metadata - New metadata to apply.
 * @returns Merged child record safe to write back to disk.
 */
export function mergeChildRecord(
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
    // preserve delegationType across merges (R7).
    // If the new metadata has a delegationType, use it; otherwise keep
    // the existing one (first-write-wins on this field).
    delegationType: metadata.delegationType ?? existing.delegationType,
  }
}
