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
import { resolve } from "node:path"
import matter from "gray-matter"
import { SessionTrackerInputSchema, type SessionTrackerInput } from "../../schema-kernel/session-tracker.schema.js"
import { sessionTrackerRoot, safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
import { isValidSessionID } from "../../features/session-tracker/types.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"
import { resolveSessionFile } from "./session-resolver.js"

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
      timeRange: tool.schema.object({
        after: tool.schema.string().optional(),
        before: tool.schema.string().optional(),
      }).optional(),
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

/** Search for query in session's child .json files, returning matches. */
async function searchChildJsonFiles(
  projectRoot: string,
  sessionId: string,
  queryLower: string,
): Promise<Array<{ childId: string; field: string; snippet: string }>> {
  const matches: Array<{ childId: string; field: string; snippet: string }> = []
  try {
    const manifestPath = safeSessionPath(projectRoot, sessionId, "hierarchy-manifest.json")
    const raw = await readFile(manifestPath, "utf-8")
    const manifest = JSON.parse(raw) as { children?: Record<string, { sessionID: string; childFile: string }> }
    const children = manifest.children ?? {}
    for (const [childId, childMeta] of Object.entries(children)) {
      const childFile = childMeta.childFile || `${childId}.json`
      const childPath = safeSessionPath(projectRoot, sessionId, childFile)
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
            matches.push({ childId, field, snippet: truncated })
            break  // One match per child file
          }
        }
      } catch { /* skip unreadable child file */ }
    }
  } catch { /* no hierarchy manifest found */ }
  return matches
}

async function handleExportSession(projectRoot: string, sessionId: string, format?: "markdown" | "json") {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved) return renderToolResult(error(`Session not found: ${sessionId}`))
  try {
    if (resolved.type === "main") {
      const content = await readFile(resolved.filePath, "utf-8")
      if (format === "json") {
        const { data: frontmatter } = matter(content)
        return renderToolResult(success(`Session export (JSON): ${sessionId}`, {
          sessionId, frontmatter, filePath: resolved.filePath,
        }))
      }
      return renderToolResult(success(`Session export: ${sessionId}`, {
        sessionId, content, filePath: resolved.filePath,
      }))
    } else {
      const record = resolved.childRecord!
      if (format === "json") {
        return renderToolResult(success(`Session export (JSON): ${sessionId}`, {
          sessionId, frontmatter: {
            sessionID: record.sessionID,
            parentSessionID: record.parentSessionID,
            delegationDepth: record.delegationDepth,
            status: record.status,
            created: record.created,
            updated: record.updated,
          },
          filePath: resolved.filePath,
        }))
      }
      const frontmatterLines = [
        "---",
        `sessionID: ${record.sessionID}`,
        `created: ${record.created}`,
        `updated: ${record.updated}`,
        `parentSessionID: ${record.parentSessionID}`,
        `delegationDepth: ${record.delegationDepth}`,
        `status: ${record.status}`,
        "---",
      ]
      const turnsLines = record.turns.map((turn) => {
        const isUser = turn.role === "user" || turn.actor === "user"
        const header = isUser ? `## USER (turn ${turn.turn})` : `## ${turn.actor || "assistant"}`
        return `${header}\n\n${turn.content}`
      })
      const markdown = [...frontmatterLines, "", ...turnsLines].join("\n")
      return renderToolResult(success(`Session export: ${sessionId}`, {
        sessionId, content: markdown, filePath: resolved.filePath,
      }))
    }
  } catch {
    return renderToolResult(error(`Session not found: ${sessionId}`))
  }
}

async function handleGetStatus(projectRoot: string, sessionId: string) {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved) return renderToolResult(error(`Session status not found: ${sessionId}`))
  try {
    if (resolved.type === "main") {
      const raw = await readFile(resolved.continuityPath, "utf-8")
      const json = JSON.parse(raw) as Record<string, unknown>
      return renderToolResult(success(`Session status for ${sessionId}`, {
        sessionId,
        status: json.status ?? "unknown",
        lastUpdated: json.lastUpdated ?? null,
        turnCount: json.turnCount ?? 0,
        childCount: json.childCount ?? 0,
        toolSummary: json.toolSummary ?? {},
      }))
    } else {
      const record = resolved.childRecord!
      const toolSummary: Record<string, number> = {}
      for (const turn of record.turns) {
        for (const toolCall of turn.tools || []) {
          if (toolCall.tool) {
            toolSummary[toolCall.tool] = (toolSummary[toolCall.tool] ?? 0) + 1
          }
        }
      }
      return renderToolResult(success(`Session status for ${sessionId}`, {
        sessionId,
        status: record.status ?? "unknown",
        lastUpdated: record.updated ?? null,
        turnCount: record.turns.length,
        childCount: record.children?.length ?? 0,
        toolSummary,
      }))
    }
  } catch {
    return renderToolResult(error(`Session status not found: ${sessionId}`))
  }
}

async function handleGetSummary(projectRoot: string, sessionId: string) {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved) return renderToolResult(error(`Session summary not found: ${sessionId}`))
  try {
    if (resolved.type === "main") {
      const raw = await readFile(resolved.filePath, "utf-8")
      const { data: frontmatter } = matter(raw)
      return renderToolResult(success(`Session summary for ${sessionId}`, {
        sessionId, frontmatter,
      }))
    } else {
      const record = resolved.childRecord!
      const frontmatter = {
        sessionID: record.sessionID,
        parentSessionID: record.parentSessionID,
        delegationDepth: record.delegationDepth,
        status: record.status,
        created: record.created,
        updated: record.updated,
        delegatedBy: record.delegatedBy,
        mainAgent: record.mainAgent,
      }
      return renderToolResult(success(`Session summary for ${sessionId}`, {
        sessionId, frontmatter,
      }))
    }
  } catch {
    return renderToolResult(error(`Session summary not found: ${sessionId}`))
  }
}

async function handleListSessions(projectRoot: string, limit: number) {
  // Try project-continuity.json index first
  try {
    const indexPath = resolve(sessionTrackerRoot(projectRoot), "project-continuity.json")
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
 * Filter sessions using per-session hierarchy-manifest.json files.
 *
 * Aggregates across all session directories, reading each session's
 * hierarchy-manifest.json for fast queries by status, agentType, delegation depth,
 * and time range. Falls back to directory scan if no manifests exist.
 */
async function handleFilterSessions(
  projectRoot: string,
  input: Record<string, unknown>,
) {
  const trackerRoot = sessionTrackerRoot(projectRoot)
  const inputAny = input as { status?: string; agentType?: string; minDepth?: number; maxDepth?: number; timeRange?: { after?: string; before?: string }; limit: number }
  const statusLower = inputAny.status?.toLowerCase()
  const agentLower = inputAny.agentType?.toLowerCase()
  const afterDate = inputAny.timeRange?.after ? new Date(inputAny.timeRange.after).getTime() : undefined
  const beforeDate = inputAny.timeRange?.before ? new Date(inputAny.timeRange.before).getTime() : undefined
  const matches: Array<{ sessionId: string; status?: string; agentType?: string; depth?: number; lastUpdated?: string }> = []

  try {
    const entries = await readdir(trackerRoot, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("ses_")) continue
      const sessionId = entry.name
      if (!isValidSessionID(sessionId)) continue
      const manifestPath = safeSessionPath(projectRoot, sessionId, "hierarchy-manifest.json")
      try {
        await access(manifestPath)
        const raw = await readFile(manifestPath, "utf-8")
        const manifest = JSON.parse(raw) as {
          rootMainSessionID?: string
          lastUpdated?: string
          maxDepth?: number
          children?: Record<string, {
            sessionID?: string
            status?: string
            subagentType?: string
            delegationDepth?: number
            updatedAt?: string
          }>
        }
        // Add root session itself
        const rootId = manifest.rootMainSessionID ?? sessionId
        matches.push({
          sessionId: rootId,
          status: "active",
          depth: 0,
          lastUpdated: manifest.lastUpdated,
        })
        // Add children from manifest with their metadata
        if (manifest.children) {
          for (const [, childMeta] of Object.entries(manifest.children)) {
            if (childMeta.sessionID) {
              matches.push({
                sessionId: childMeta.sessionID,
                status: childMeta.status,
                agentType: childMeta.subagentType,
                depth: childMeta.delegationDepth,
                lastUpdated: childMeta.updatedAt,
              })
            }
          }
        }
      } catch {
        // No manifest for this session — skip
      }
    }
  } catch {
    return renderToolResult(error("Unable to scan session directory for filtering."))
  }

  // Apply filters
  const filtered = matches.filter((meta) => {
    if (statusLower && meta.status?.toLowerCase() !== statusLower) return false
    if (agentLower && meta.agentType?.toLowerCase() !== agentLower) return false
    if (inputAny.minDepth !== undefined && (meta.depth ?? 0) < inputAny.minDepth) return false
    if (inputAny.maxDepth !== undefined && (meta.depth ?? 0) > inputAny.maxDepth) return false
    if (afterDate !== undefined || beforeDate !== undefined) {
      const updated = meta.lastUpdated ? new Date(meta.lastUpdated).getTime() : undefined
      if (updated === undefined) return false
      if (afterDate !== undefined && updated < afterDate) return false
      if (beforeDate !== undefined && updated > beforeDate) return false
    }
    return true
  })

  const paginated = filtered.slice(0, inputAny.limit)
  return renderToolResult(success(`Found ${paginated.length} sessions matching filters`, {
    totalMatches: filtered.length, sessions: paginated,
    hasMore: filtered.length > inputAny.limit, indexLastUpdated: null,
  }))
}
