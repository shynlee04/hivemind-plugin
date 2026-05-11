/**
 * Session-tracker tool — read-only query/export of session knowledge files.
 *
 * All path construction uses safeSessionPath() with isValidSessionID() pre-validation.
 * All I/O is async via node:fs/promises. Five actions:
 *   export-session, get-status, get-summary, list-sessions, search-sessions
 * Read-only (CQRS read-side). No mutation authority.
 * @module tools/hivemind/session-tracker
 */

import { tool } from "@opencode-ai/plugin/tool"
import { readFile, readdir, access } from "node:fs/promises"
import matter from "gray-matter"
import { SessionTrackerInputSchema, type SessionTrackerInput } from "../../schema-kernel/session-tracker.schema.js"
import { sessionTrackerRoot, safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
import { isValidSessionID } from "../../features/session-tracker/types.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"

const MAX_SEARCH_CHUNK_BYTES = 50000
type ToolContext = { sessionID?: string }

export function createSessionTrackerTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Query and export session tracker data. Actions: export-session, get-status, get-summary, list-sessions, search-sessions.",
    args: {
      action: tool.schema.string(),
      sessionId: tool.schema.string().optional(),
      query: tool.schema.string().optional(),
      limit: tool.schema.number().optional(),
      format: tool.schema.enum(["markdown", "json"]).optional(),
    },
    async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
      try {
        const input = SessionTrackerInputSchema.parse(rawArgs) as SessionTrackerInput
        switch (input.action) {
          case "export-session": return handleExportSession(projectRoot, input.sessionId, input.format)
          case "get-status": return handleGetStatus(projectRoot, input.sessionId)
          case "get-summary": return handleGetSummary(projectRoot, input.sessionId)
          case "list-sessions": return handleListSessions(projectRoot, input.limit)
          case "search-sessions": return handleSearchSessions(projectRoot, input.query, input.limit)
          default: return renderToolResult(error(`Unknown action`))
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/** Validates sessionId and returns safe paths. Returns error string if invalid. */
function resolvePaths(
  projectRoot: string,
  sessionId: string,
): { safeMd: string; safeJson: string } | string {
  if (!isValidSessionID(sessionId)) {
    return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  }
  return {
    safeMd: safeSessionPath(projectRoot, sessionId, `${sessionId}.md`),
    safeJson: safeSessionPath(projectRoot, sessionId, "session-continuity.json"),
  }
}

async function handleExportSession(projectRoot: string, sessionId: string, format?: "markdown" | "json") {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const paths = resolvePaths(projectRoot, sessionId)
  if (typeof paths === "string") return paths
  try {
    const content = await readFile(paths.safeMd, "utf-8")
    if (format === "json") {
      const { data: frontmatter } = matter(content)
      return renderToolResult(success(`Session export (JSON): ${sessionId}`, {
        sessionId, frontmatter, filePath: paths.safeMd,
      }))
    }
    return renderToolResult(success(`Session export: ${sessionId}`, {
      sessionId, content, filePath: paths.safeMd,
    }))
  } catch {
    return renderToolResult(error(`Session not found: ${sessionId}`))
  }
}

async function handleGetStatus(projectRoot: string, sessionId: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const paths = resolvePaths(projectRoot, sessionId)
  if (typeof paths === "string") return paths
  try {
    const raw = await readFile(paths.safeJson, "utf-8")
    const json = JSON.parse(raw) as Record<string, unknown>
    return renderToolResult(success(`Session status for ${sessionId}`, {
      sessionId,
      status: json.status ?? "unknown",
      lastUpdated: json.lastUpdated ?? null,
      turnCount: json.turnCount ?? 0,
      childCount: json.childCount ?? 0,
      toolSummary: json.toolSummary ?? {},
    }))
  } catch {
    return renderToolResult(error(`Session status not found: ${sessionId}`))
  }
}

async function handleGetSummary(projectRoot: string, sessionId: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const paths = resolvePaths(projectRoot, sessionId)
  if (typeof paths === "string") return paths
  try {
    const raw = await readFile(paths.safeMd, "utf-8")
    const { data: frontmatter } = matter(raw)
    return renderToolResult(success(`Session summary for ${sessionId}`, {
      sessionId, frontmatter,
    }))
  } catch {
    return renderToolResult(error(`Session summary not found: ${sessionId}`))
  }
}

async function handleListSessions(projectRoot: string, limit: number) {
  // Try project-continuity.json index first
  try {
    const indexPath = safeSessionPath(projectRoot, "project-continuity", "project-continuity.json")
    await access(indexPath)
    const raw = await readFile(indexPath, "utf-8")
    const index = JSON.parse(raw) as {
      sessions?: Record<string, unknown>
      chronologicalOrder?: string[]
      lastUpdated?: string
    }
    const allSessions = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
    const sessionIds = allSessions.slice(0, limit)
    const details = sessionIds.map((sessionId) => ({
      sessionId, metadata: index.sessions?.[sessionId] ?? null,
    }))
    return renderToolResult(success(`Found ${sessionIds.length} sessions`, {
      total: allSessions.length, sessions: details,
      hasMore: allSessions.length > limit, indexLastUpdated: index.lastUpdated ?? null,
    }))
  } catch {
    // Fall through to directory scan (GAP-06)
  }

  // GAP-06: Directory-scanning fallback when index is stale or missing
  try {
    const trackerRoot = sessionTrackerRoot(projectRoot)
    const entries = await readdir(trackerRoot, { withFileTypes: true })
    const sessionDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith("ses_"))
      .map((e) => e.name)
    const sessions = sessionDirs.slice(0, limit).map((sessionId) => ({ sessionId }))
    return renderToolResult(success(`Found ${sessions.length} sessions (directory scan)`, {
      total: sessionDirs.length, sessions,
      hasMore: sessionDirs.length > limit, indexLastUpdated: null,
    }))
  } catch {
    return renderToolResult(error("No session index found. Session tracking may not be running."))
  }
}

async function handleSearchSessions(projectRoot: string, query: string, limit: number) {
  const trackerRoot = sessionTrackerRoot(projectRoot)
  const matches: Array<{ sessionId: string; file: string; snippet: string; matchLine: number }> = []
  try {
    const entries = await readdir(trackerRoot, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("ses_")) continue
      const sessionId = entry.name
      if (!isValidSessionID(sessionId)) continue
      const mdPath = safeSessionPath(projectRoot, sessionId, `${sessionId}.md`)
      try { await access(mdPath) } catch { continue }
      try {
        const content = await readFile(mdPath, "utf-8")
        if (content.length > MAX_SEARCH_CHUNK_BYTES) continue
        const lines = content.split("\n")
        const queryLower = query.toLowerCase()
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(queryLower)) {
            const start = Math.max(0, i - 2)
            const end = Math.min(lines.length, i + 3)
            matches.push({
              sessionId, file: `${sessionId}/${sessionId}.md`,
              snippet: lines.slice(start, end).join("\n").trim(), matchLine: i + 1,
            })
            break
          }
        }
      } catch { /* skip unreadable */ }
    }
  } catch {
    return renderToolResult(error("Unable to scan session directory."))
  }
  const paginated = matches.slice(0, limit)
  return renderToolResult(success(`Found ${matches.length} matches across sessions`, {
    totalMatches: matches.length, sessions: paginated, hasMore: matches.length > limit,
  }))
}
