import { join } from "node:path"
import { access, readFile, readdir } from "node:fs/promises"
import { sessionTrackerRoot, safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
import { isValidSessionID } from "../../features/session-tracker/types.js"
import type { ChildSessionRecord, HierarchyManifest } from "../../features/session-tracker/types.js"

export interface ResolvedSession {
  type: "main" | "child"
  rootSessionId: string
  filePath: string // MD path for main session, JSON path for child session
  continuityPath: string // session-continuity.json of the root main session
  manifestPath: string // hierarchy-manifest.json of the root main session
  childRecord?: ChildSessionRecord
}

/**
 * Resolves any session ID (main or child) to its files and parent structure on disk.
 * Supports both root main sessions and child sessions stateless-ly.
 *
 * All functions classes and interfaces are documented.
 */
export async function resolveSessionFile(
  projectRoot: string,
  sessionId: string,
): Promise<ResolvedSession | null> {
  if (!isValidSessionID(sessionId)) {
    return null
  }

  // 1. Try resolving as a main session
  const mainMdPath = safeSessionPath(projectRoot, sessionId, `${sessionId}.md`)
  const mainContinuityPath = safeSessionPath(projectRoot, sessionId, "session-continuity.json")
  const mainManifestPath = safeSessionPath(projectRoot, sessionId, "hierarchy-manifest.json")

  try {
    await access(mainMdPath)
    return {
      type: "main",
      rootSessionId: sessionId,
      filePath: mainMdPath,
      continuityPath: mainContinuityPath,
      manifestPath: mainManifestPath,
    }
  } catch {
    // Not a main session or files not created yet
  }

  // 2. Resolve as a child session. Scan all root main directories.
  const trackerRoot = sessionTrackerRoot(projectRoot)
  let rootDirs: string[] = []
  try {
    // Try reading project-continuity.json chronologicalOrder first
    const projectIndexPath = join(trackerRoot, "project-continuity.json")
    const raw = await readFile(projectIndexPath, "utf-8")
    const index = JSON.parse(raw) as { chronologicalOrder?: string[]; sessions?: Record<string, unknown> }
    rootDirs = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
  } catch {
    // Fall back to scanning directories starting with ses_
    try {
      const entries = await readdir(trackerRoot, { withFileTypes: true })
      rootDirs = entries
        .filter((e) => e.isDirectory() && e.name.startsWith("ses_"))
        .map((e) => e.name)
    } catch {
      return null
    }
  }

  // Search each root directory's manifest for this child session
  for (const rootId of rootDirs) {
    const manifestPath = safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json")
    try {
      const raw = await readFile(manifestPath, "utf-8")
      const manifest = JSON.parse(raw) as HierarchyManifest
      if (manifest.children && manifest.children[sessionId]) {
        const childMeta = manifest.children[sessionId]
        const childFile = childMeta.childFile || `${sessionId}.json`
        const filePath = safeSessionPath(projectRoot, rootId, childFile)
        try {
          const childRaw = await readFile(filePath, "utf-8")
          const childRecord = JSON.parse(childRaw) as ChildSessionRecord
          return {
            type: "child",
            rootSessionId: rootId,
            filePath,
            continuityPath: safeSessionPath(projectRoot, rootId, "session-continuity.json"),
            manifestPath,
            childRecord,
          }
        } catch {
          // File not readable, skip
        }
      }
    } catch {
      // Manifest not found or unreadable, check if the child json file exists directly
      const childJsonPath = safeSessionPath(projectRoot, rootId, `${sessionId}.json`)
      try {
        await access(childJsonPath)
        const childRaw = await readFile(childJsonPath, "utf-8")
        const childRecord = JSON.parse(childRaw) as ChildSessionRecord
        return {
          type: "child",
          rootSessionId: rootId,
          filePath: childJsonPath,
          continuityPath: safeSessionPath(projectRoot, rootId, "session-continuity.json"),
          manifestPath: safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json"),
          childRecord,
        }
      } catch {
        // Not in this root directory
      }
    }
  }

  return null
}
