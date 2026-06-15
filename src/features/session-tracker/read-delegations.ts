/**
 * Reads delegation records from session-tracker persistence files.
 *
 * Provides a public API for reading hierarchy-manifest.json and child .json
 * files that session-tracker owns. This is the canonical read path for
 * delegation data — other modules (e.g., delegation-persistence) should
 * call this function rather than reading session-tracker files directly.
 *
 * @module session-tracker/read-delegations
 */

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"
import type { ChildSessionRecord, HierarchyManifest } from "./types.js"

/**
 * Reads all raw delegation data from session-tracker persistence.
 *
 * Iterates all `ses_*` directories under `.hivemind/session-tracker/`,
 * reads each hierarchy-manifest.json and individual child .json files,
 * and returns the unvalidated raw hierarchy trees plus child records.
 *
 * @param trackerRoot - Absolute path to `.hivemind/session-tracker/`.
 * @returns Record of child session ID to raw JSON data read from disk.
 */
export function readRawDelegations(
  trackerRoot: string,
): Record<string, { manifest: HierarchyManifest | null; children: ChildSessionRecord[] }> {
  const result: Record<string, { manifest: HierarchyManifest | null; children: ChildSessionRecord[] }> = {}

  if (!existsSync(trackerRoot)) return result

  const rootDirs = readdirSync(trackerRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("ses"))
    .map((e) => e.name)

  const seenIds = new Set<string>()

  for (const rootId of rootDirs) {
    let manifest: HierarchyManifest | null = null
    const childRecords: ChildSessionRecord[] = []

    // Read hierarchy-manifest.json
    const manifestPath = resolve(trackerRoot, rootId, "hierarchy-manifest.json")
    if (existsSync(manifestPath)) {
      try {
        const raw = readFileSync(manifestPath, "utf-8")
        manifest = JSON.parse(raw) as HierarchyManifest
      } catch {
        // ignore corrupt manifest
      }
    }

    // Read child .json files
    try {
      const files = readdirSync(resolve(trackerRoot, rootId), { withFileTypes: true })
      for (const file of files) {
        if (
          file.isFile() &&
          file.name.endsWith(".json") &&
          file.name !== "hierarchy-manifest.json" &&
          file.name !== "session-continuity.json"
        ) {
          const childId = file.name.slice(0, -5)
          if (seenIds.has(childId)) continue
          seenIds.add(childId)

          try {
            const raw = readFileSync(resolve(trackerRoot, rootId, file.name), "utf-8")
            childRecords.push(JSON.parse(raw) as ChildSessionRecord)
          } catch {
            // ignore corrupt child file
          }
        }
      }
    } catch {
      // ignore dir read errors
    }

    result[rootId] = { manifest, children: childRecords }
  }

  return result
}
