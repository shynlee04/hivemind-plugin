/**
 * Session-tracker tool — read-only query/export of session knowledge files.
 *
 * All path construction uses safeSessionPath() with isValidSessionID() pre-validation.
 * All I/O is async via node:fs/promises. Six actions:
 *   export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions
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

const MAX_QUERY_LENGTH = 1000
type ToolContext = { sessionID?: string }

export function createSessionTrackerTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Query and export session tracker data. Actions: export-session, get-status, get-summary, list-sessions, search-sessions, filter-sessions.",
    args: {
      action: tool.schema.string(),
      sessionId: tool.schema.string().optional(),
      query: tool.schema.string().optional(),
      limit: tool.schema.number().optional(),
      format: tool.schema.enum(["markdown", "json"]).optional(),
      status: tool.schema.string().optional(),
      agentType: tool.schema.string().optional(),
      minDepth: tool.schema.number().optional(),
      maxDepth: tool.schema.number().optional(),
      timeRange: tool.schema.string().optional(),
      filterJson: tool.schema.string().optional(),
      removeEmpty: tool.schema.string().optional(),
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
          case "filter-sessions": return handleFilterSessions(projectRoot, input)
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

/** Search for query in session's child .json files, returning matches. */
async function searchChildJsonFiles(
  projectRoot: string,
  sessionId: string,
  queryLower: string,
): Promise<Array<{ childId: string; field: string; snippet: string }>> {
  const matches: Array<{ childId: string; field: string; snippet: string }> = []
  try {
    const continuityPath = safeSessionPath(projectRoot, sessionId, "session-continuity.json")
    const raw = await readFile(continuityPath, "utf-8")
    const continuity = JSON.parse(raw) as Record<string, unknown>
    const hierarchy = continuity.hierarchy as { children?: Array<{ sessionID: string; childFile: string }> } | undefined
    const children = hierarchy?.children ?? []
    for (const child of children) {
      const childPath = safeSessionPath(projectRoot, sessionId, child.childFile)
      try {
        const childData = JSON.parse(await readFile(childPath, "utf-8")) as Record<string, unknown>
        // Search target fields per D-02
        const fieldsToSearch: Array<{ field: string; extract: (d: Record<string, unknown>) => string | undefined }> = [
          { field: "lastMessage", extract: (d) => typeof d.lastMessage === "string" ? d.lastMessage : undefined },
          { field: "turn.content", extract: (d) => {
            const turns = d.turns as Array<{ content?: string }> | undefined
            return turns ? turns.map((t) => t.content ?? "").join("\n") : undefined
          }},
          { field: "journey[].content", extract: (d) => {
            const journey = d.journey as Array<{ content?: string }> | undefined
            return journey ? journey.map((j) => j.content ?? "").join("\n") : undefined
          }},
          { field: "delegatedBy.subagentType", extract: (d) => {
            const delegatedBy = d.delegatedBy as { subagentType?: string } | undefined
            return delegatedBy?.subagentType
          }},
        ]
        for (const { field, extract } of fieldsToSearch) {
          const value = extract(childData)
          if (value && value.toLowerCase().includes(queryLower)) {
            const truncated = value.length > 200 ? value.slice(0, 200) + "..." : value
            matches.push({ childId: child.sessionID, field, snippet: truncated })
            break  // One match per child file
          }
        }
      } catch { /* skip unreadable child file */ }
    }
  } catch { /* no session-continuity.json found */ }
  return matches
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
  if (!query || query.length > MAX_QUERY_LENGTH) {
    return renderToolResult(error("Query must be between 1 and 1000 characters."))
  }
  const trackerRoot = sessionTrackerRoot(projectRoot)
  const matches: Array<{ sessionId: string; file: string; snippet: string; matchLine: number }> = []
  const fileWarnings: string[] = []
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
        const contentBytes = Buffer.byteLength(content, "utf-8")
        if (contentBytes > 1_000_000) {
          fileWarnings.push(`${sessionId}/${sessionId}.md: ${(contentBytes / 1024 / 1024).toFixed(1)}MB — large file may slow search`)
        }
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

      // Also search child .json files per D-02
      const childMatches = await searchChildJsonFiles(projectRoot, sessionId, query)
      for (const cm of childMatches) {
        matches.push({
          sessionId, file: `${sessionId}/${cm.childId}.json`,
          snippet: `[${cm.field}] ${cm.snippet}`, matchLine: 0,
        })
      }
    }
  } catch {
    return renderToolResult(error("Unable to scan session directory."))
  }
  const paginated = matches.slice(0, limit)
  return renderToolResult(success(`Found ${matches.length} matches across sessions`, {
    totalMatches: matches.length, sessions: paginated, hasMore: matches.length > limit,
    fileWarnings: fileWarnings.length > 0 ? fileWarnings : undefined,
  }))
}

/**
 * Filter sessions using hierarchy-manifest.json index.
 *
 * Reads the pre-built index for fast queries by status, agentType, delegation depth,
 * and time range without scanning individual session files.
 */
async function handleFilterSessions(
  projectRoot: string,
  input: {
    status?: string
    agentType?: string
    minDepth?: number
    maxDepth?: number
    timeRange?: { after?: string; before?: string }
    limit: number
  },
) {
  try {
    const indexPath = safeSessionPath(projectRoot, "project-continuity", "hierarchy-manifest.json")
    await access(indexPath)
    const raw = await readFile(indexPath, "utf-8")
    const manifest = JSON.parse(raw) as {
      sessions?: Record<string, {
        status?: string
        agentType?: string
        depth?: number
        lastUpdated?: string
      }>
      lastUpdated?: string
    }
    const sessions = manifest.sessions ?? {}
    const statusLower = input.status?.toLowerCase()
    const agentLower = input.agentType?.toLowerCase()
    const afterDate = input.timeRange?.after ? new Date(input.timeRange.after).getTime() : undefined
    const beforeDate = input.timeRange?.before ? new Date(input.timeRange.before).getTime() : undefined

    const filtered = Object.entries(sessions).filter(([_, meta]) => {
      if (statusLower && meta.status?.toLowerCase() !== statusLower) return false
      if (agentLower && meta.agentType?.toLowerCase() !== agentLower) return false
      if (input.minDepth !== undefined && (meta.depth ?? 0) < input.minDepth) return false
      if (input.maxDepth !== undefined && (meta.depth ?? 0) > input.maxDepth) return false
      if (afterDate !== undefined || beforeDate !== undefined) {
        const updated = meta.lastUpdated ? new Date(meta.lastUpdated).getTime() : undefined
        if (updated === undefined) return false
        if (afterDate !== undefined && updated < afterDate) return false
        if (beforeDate !== undefined && updated > beforeDate) return false
      }
      return true
    })

    const paginated = filtered.slice(0, input.limit).map(([sessionId, meta]) => ({
      sessionId, ...meta,
    }))

    return renderToolResult(success(`Found ${paginated.length} sessions matching filters`, {
      totalMatches: filtered.length, sessions: paginated,
      hasMore: filtered.length > input.limit, indexLastUpdated: manifest.lastUpdated ?? null,
    }))
  } catch {
    return renderToolResult(error("Hierarchy manifest not found. Enable hierarchy tracking first."))
  }
}
