/**
 * Session-tracker tool — read-only query/export tool for session knowledge files.
 *
 * Provides agents with query access to persisted session tracker data under
 * `.hivemind/session-tracker/`. Designed for extensibility (D-02) with
 * action-based routing.
 *
 * Actions:
 * - `export-session` — returns the full content of a session's .md capture file
 * - `list-sessions` — returns all known sessions from project-continuity.json
 * - `search-sessions` — scans session files for a query string
 *
 * All operations are read-only (CQRS read-side). No mutation authority.
 *
 * @module tools/hivemind/session-tracker
 */

import { tool } from "@opencode-ai/plugin/tool"
import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { statSync, existsSync } from "node:fs"

import {
  SessionTrackerInputSchema,
  type SessionTrackerInput,
} from "../../schema-kernel/session-tracker.schema.js"
import { sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SEARCH_CHUNK_BYTES = 50000 // Per-file read limit for search

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

type ToolContext = { sessionID?: string }

/**
 * Creates the session-tracker tool instance.
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns An OpenCode tool definition for session query/export operations.
 *
 * @example
 * ```typescript
 * const sessionTrackerTool = createSessionTrackerTool(process.cwd())
 * ```
 */
export function createSessionTrackerTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Query and export session tracker data. Actions: export-session (get full session capture), list-sessions (list all sessions), search-sessions (search session content).",
    args: {
      action: s.string().describe("Action: export-session, list-sessions, or search-sessions"),
      sessionId: s.string().optional().describe("Session ID (required for export-session)"),
      query: s.string().optional().describe("Search query (required for search-sessions)"),
      limit: s.number().optional().describe("Maximum results (default 20, max 100)"),
    },
    async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
      try {
        const input = SessionTrackerInputSchema.parse(rawArgs) as SessionTrackerInput

        switch (input.action) {
          case "export-session":
            return await handleExportSession(projectRoot, input)
          case "list-sessions":
            return await handleListSessions(projectRoot, input)
          case "search-sessions":
            return await handleSearchSessions(projectRoot, input)
          default:
            return renderToolResult(error(`Unknown action: ${(input as { action: string }).action}`))
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

/**
 * Exports the full content of a session's .md capture file.
 *
 * @param projectRoot - Absolute project root path.
 * @param input - Tool input (must include sessionId).
 * @returns Rendered tool response with file content.
 */
async function handleExportSession(
  projectRoot: string,
  input: SessionTrackerInput,
): Promise<string> {
  if (!input.sessionId) {
    return renderToolResult(error("sessionId is required for export-session action"))
  }

  const trackerRoot = sessionTrackerRoot(projectRoot)
  const filePath = resolve(trackerRoot, input.sessionId, `${input.sessionId}.md`)

  try {
    const content = await readFile(filePath, "utf-8")
    return renderToolResult(
      success(`Session export: ${input.sessionId}`, {
        sessionId: input.sessionId,
        content,
        filePath,
      }),
    )
  } catch {
    return renderToolResult(error(`Session not found: ${input.sessionId}`))
  }
}

/**
 * Lists all known sessions from the project-continuity.json index.
 *
 * @param projectRoot - Absolute project root path.
 * @param input - Tool input (limit controls max results).
 * @returns Rendered tool response with session list.
 */
async function handleListSessions(
  projectRoot: string,
  input: SessionTrackerInput,
): Promise<string> {
  const trackerRoot = sessionTrackerRoot(projectRoot)
  const indexPath = resolve(trackerRoot, "project-continuity.json")

  try {
    const raw = await readFile(indexPath, "utf-8")
    const index = JSON.parse(raw) as {
      sessions?: Record<string, unknown>
      chronologicalOrder?: string[]
    }

    const allSessions = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
    const limit = input.limit ?? 20
    const sessions = allSessions.slice(0, limit)

    const sessionDetails: Array<{ sessionId: string; metadata?: unknown }> = []
    for (const sessionId of sessions) {
      sessionDetails.push({
        sessionId,
        metadata: index.sessions?.[sessionId] ?? null,
      })
    }

    return renderToolResult(
      success(`Found ${sessions.length} sessions`, {
        total: allSessions.length,
        sessions: sessionDetails,
        hasMore: allSessions.length > limit,
        indexLastUpdated: (index as { lastUpdated?: string }).lastUpdated ?? null,
      }),
    )
  } catch {
    return renderToolResult(error("No session index found. Session tracking may not be running."))
  }
}

/**
 * Searches session .md files for a query string.
 *
 * @param projectRoot - Absolute project root path.
 * @param input - Tool input (must include query string).
 * @returns Rendered tool response with matching sessions.
 */
async function handleSearchSessions(
  projectRoot: string,
  input: SessionTrackerInput,
): Promise<string> {
  if (!input.query || input.query.trim().length === 0) {
    return renderToolResult(error("query is required for search-sessions action"))
  }

  const trackerRoot = sessionTrackerRoot(projectRoot)
  const matches: Array<{ sessionId: string; file: string; snippet: string; matchLine: number }> = []

  try {
    const entries = await readdir(trackerRoot, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (!entry.name.startsWith("ses_")) continue

      const sessionId = entry.name
      const mdPath = resolve(trackerRoot, sessionId, `${sessionId}.md`)

      if (!existsSync(mdPath)) continue

      try {
        const fileStat = statSync(mdPath)
        if (fileStat.size > MAX_SEARCH_CHUNK_BYTES) continue

        const content = await readFile(mdPath, "utf-8")
        const lines = content.split("\n")
        const queryLower = input.query.toLowerCase()

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(queryLower)) {
            // Get surrounding context (2 lines before, 2 after)
            const start = Math.max(0, i - 2)
            const end = Math.min(lines.length, i + 3)
            const snippet = lines.slice(start, end).join("\n").trim()

            matches.push({
              sessionId,
              file: `${sessionId}/${sessionId}.md`,
              snippet,
              matchLine: i + 1,
            })
            break // One match per session
          }
        }
      } catch {
        // Skip unreadable files
      }
    }
  } catch {
    return renderToolResult(error("Unable to scan session directory."))
  }

  const limit = input.limit ?? 20
  const paginated = matches.slice(0, limit)

  return renderToolResult(
    success(`Found ${matches.length} matches across sessions`, {
      totalMatches: matches.length,
      sessions: paginated,
      hasMore: matches.length > limit,
    }),
  )
}
