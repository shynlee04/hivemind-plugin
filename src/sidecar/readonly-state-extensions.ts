/**
 * Extended canonical state surface definitions for the sidecar.
 *
 * This module re-exports the extended prefix list and provides the
 * directory listing function used by SC-02's REST API to enumerate
 * files under canonical state surfaces.
 *
 * @module sidecar/readonly-state-extensions
 */

import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

import {
  isCanonicalStatePath,
  type ReadOnlyStateOptions,
} from "./readonly-state.js"

import type { DirectoryEntry } from "./types.js"

/**
 * Extended canonical prefixes. This constant mirrors the internal
 * array in {@link module:sidecar/readonly-state.ts} so that consumers
 * (tests, REST API) can reference the authoritative set without
 * reaching into the private module const.
 */
export const CANONICAL_PREFIXES = [
  ".hivemind/state",
  ".hivemind/session-tracker",
  ".opencode",
  ".planning",
] as const

/**
 * List the entries of a directory inside a canonical state surface.
 *
 * Returns an empty array when the path is outside the canonical
 * state surface, when the directory does not exist, or when a
 * filesystem error occurs — the function never throws.
 *
 * @param absoluteDirPath - Absolute path to the directory to list.
 * @param opts            - Read-only state options including the
 *   absolute project root.
 * @returns An array of {@link DirectoryEntry} objects describing
 *   every entry in the directory.
 */
export function listCanonicalDirectory(
  absoluteDirPath: string,
  opts: ReadOnlyStateOptions,
): DirectoryEntry[] {
  if (!isCanonicalStatePath(absoluteDirPath, opts)) {
    return []
  }

  try {
    const entries = readdirSync(absoluteDirPath, { withFileTypes: true })
    return entries.map((entry) => {
      const fullPath = join(absoluteDirPath, entry.name)
      try {
        const stat = statSync(fullPath)
        return {
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
          size: stat.size,
          mtime: stat.mtimeMs,
        }
      } catch {
        return {
          name: entry.name,
          type: entry.isDirectory() ? "directory" : "file",
          size: 0,
          mtime: 0,
        }
      }
    })
  } catch {
    return []
  }
}

/**
 * Convenience helper to build a {@link ReadOnlyStateOptions} object
 * from a project root path.
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns A {@link ReadOnlyStateOptions} object.
 */
export function createReadOnlyStateOptions(
  projectRoot: string,
): ReadOnlyStateOptions {
  return { projectRoot }
}
