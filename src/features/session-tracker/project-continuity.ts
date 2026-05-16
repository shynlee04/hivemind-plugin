/**
 * Project continuity completeness check for session tracker.
 *
 * Ensures project-continuity.json contains ALL known sessions by walking
 * the session-tracker directory tree. Extracted from index.ts to satisfy
 * the ≤500 LOC gate (GA-4).
 *
 * @module session-tracker/project-continuity
 */

import { isValidSessionID } from "./types.js"
import type { ProjectIndexWriter } from "./persistence/project-index-writer.js"
import { sessionTrackerRoot } from "./initialization.js"

/**
 * Dependencies injected by SessionTracker for project continuity operations.
 */
export interface ProjectContinuityDeps {
  /** Project index writer for addSession calls. */
  projectIndexWriter: ProjectIndexWriter
  /** Absolute path to the project root. */
  projectRoot: string
}

/**
 * Ensures project-continuity.json contains ALL known sessions.
 *
 * Walks the session-tracker directory tree and checks that every session
 * (main .md files AND child .json files) is registered in the project index.
 * Missing entries are added. This fixes CP-ST-02's AC-08 requirement.
 *
 * Best-effort: individual failures are silently skipped.
 *
 * Usage:
 * ```typescript
 * const checker = new ProjectContinuityChecker({ projectIndexWriter, projectRoot })
 * await checker.ensureCompleteness()
 * ```
 */
export class ProjectContinuityChecker {
  private readonly projectIndexWriter: ProjectIndexWriter
  private readonly projectRoot: string

  /**
   * @param deps - Injected dependencies.
   */
  constructor(deps: ProjectContinuityDeps) {
    this.projectIndexWriter = deps.projectIndexWriter
    this.projectRoot = deps.projectRoot
  }

  /**
   * Walks the session-tracker directory and registers any missing sessions.
   *
   * For each valid session directory:
   * 1. Registers the main session if not already in the index.
   * 2. Scans for child `.json` files and registers each child session.
   *
   * Silently skips invalid or unreadable entries.
   */
  async ensureCompleteness(): Promise<void> {
    const { readdir } = await import("node:fs/promises")
    const trackerRoot = sessionTrackerRoot(this.projectRoot)

    let entries: { name: string; isDirectory(): boolean; isFile(): boolean }[]
    try {
      entries = (await readdir(trackerRoot, { withFileTypes: true })) as unknown as {
        name: string
        isDirectory(): boolean
        isFile(): boolean
      }[]
    } catch {
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const parentID = entry.name
      if (!isValidSessionID(parentID)) continue

      const { resolve } = await import("node:path")
      const parentDir = resolve(trackerRoot, parentID)

      // Register the main session if not already in the index
      try {
        await this.projectIndexWriter.addSession(
          parentID,
          `${parentID}/`,
          `${parentID}.md`,
        )
      } catch {
        // Already registered or can't register — skip
      }

      // Scan for child .json files under this directory
      let childEntries: { name: string; isFile(): boolean }[]
      try {
        childEntries = (await readdir(parentDir, { withFileTypes: true })) as unknown as {
          name: string
          isFile(): boolean
        }[]
      } catch {
        continue
      }

      for (const child of childEntries) {
        if (!child.isFile()) continue
        if (!child.name.endsWith(".json")) continue
        // Skip session-continuity.json (internal index file, not a child session)
        if (child.name === "session-continuity.json") continue

        // Extract child session ID from filename (e.g., "ses_abc123.json" → "ses_abc123")
        const childID = child.name.slice(0, -5) // remove ".json" suffix
        if (!isValidSessionID(childID)) continue

        // Register child session in project index
        try {
          await this.projectIndexWriter.addSession(
            childID,
            `${parentID}/`,
            `${childID}.json`,
          )
        } catch {
          // Already registered or can't register — skip
        }
      }
    }
  }
}
