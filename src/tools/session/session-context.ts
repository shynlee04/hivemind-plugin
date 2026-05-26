/**
 * Session-context tool — read-only cross-session synthesis and discovery.
 *
 * Four actions: find-related, cross-reference, synthesize-context, aggregate.
 * All path construction uses safeSessionPath() with isValidSessionID() pre-validation.
 * Read-only (CQRS read-side). No mutation authority.
 * @module tools/hivemind/session-context
 */

import { tool } from "@opencode-ai/plugin/tool"
import { readFile, readdir } from "node:fs/promises"
import { resolve } from "node:path"
import matter from "gray-matter"
import { SessionContextInputSchema, type SessionContextInput } from "../../schema-kernel/session-tracker.schema.js"
import { safeSessionPath, sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
import { isValidSessionID } from "../../features/session-tracker/types.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"
import { resolveSessionFile } from "./session-resolver.js"

type ToolContext = { sessionID?: string }

interface ProjectIndex {
  sessions?: Record<string, { toolSummary?: Record<string, number>; created?: string }>
  chronologicalOrder?: string[]
}

interface ContinuityRecord {
  sessionID: string; status?: string; parentSessionID?: string | null
  delegationDepth?: number; turnCount?: number; childCount?: number
  toolSummary?: Record<string, number>; lastUpdated?: string
  hierarchy?: {
    root?: string
    children?: Record<string, any>
  }
}

const TIME_PROXIMITY_MS = 30 * 60 * 1000 // ±30 minutes

export function createSessionContextTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Cross-session synthesis and discovery. Actions: find-related, cross-reference, synthesize-context, aggregate.",
    args: {
      action: tool.schema.enum(["find-related", "cross-reference", "synthesize-context", "aggregate"]),
      sessionId: tool.schema.string().optional(),
      query: tool.schema.string().optional(),
      maxRelated: tool.schema.number().optional(),
      groupBy: tool.schema.enum(["subagentType", "status"]).optional(),
    },
    async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
      try {
        const input = SessionContextInputSchema.parse(rawArgs) as SessionContextInput
        switch (input.action) {
          case "find-related": return handleFindRelated(projectRoot, input.sessionId, input.maxRelated)
          case "cross-reference": return handleCrossReference(projectRoot, input.sessionId, input.query)
          case "synthesize-context": return handleSynthesizeContext(projectRoot, input.sessionId)
          case "aggregate": return handleAggregate(projectRoot, input.groupBy)
          default: return renderToolResult(error(`Unknown action`))
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/** Read project-continuity.json index (flat path under session-tracker root). */
async function readProjectIndex(projectRoot: string): Promise<ProjectIndex | null> {
  try {
    const indexPath = resolve(sessionTrackerRoot(projectRoot), "project-continuity.json")
    const raw = await readFile(indexPath, "utf-8")
    return JSON.parse(raw) as ProjectIndex
  } catch { return null }
}

/** Recursively searches the hierarchy tree to find the entry matching targetId. */
function findHierarchyEntry(
  children: Record<string, any> | undefined,
  targetId: string,
  parentId: string | null = null,
): { entry: any; parentId: string | null } | null {
  if (!children) return null
  if (children[targetId]) {
    return { entry: children[targetId], parentId }
  }
  for (const [childId, childEntry] of Object.entries(children)) {
    const found = findHierarchyEntry(childEntry.children, targetId, childId)
    if (found) return found
  }
  return null
}

/** Read a session's continuity JSON or return null. */
async function readContinuity(projectRoot: string, sessionId: string): Promise<ContinuityRecord | null> {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved) return null

  if (resolved.type === "main") {
    try {
      const raw = await readFile(resolved.continuityPath, "utf-8")
      return JSON.parse(raw) as ContinuityRecord
    } catch {
      return null
    }
  } else {
    // Child session
    try {
      const raw = await readFile(resolved.continuityPath, "utf-8")
      const rootContinuity = JSON.parse(raw) as ContinuityRecord
      const found = findHierarchyEntry(rootContinuity.hierarchy?.children, sessionId, resolved.rootSessionId)
      if (found) {
        return {
          sessionID: sessionId,
          parentSessionID: found.parentId,
          delegationDepth: found.entry.depth ?? found.entry.delegationDepth,
          status: found.entry.status,
          hierarchy: {
            root: resolved.rootSessionId,
            children: found.entry.children || {},
          },
        }
      }
      // Fallback to child record metadata
      const record = resolved.childRecord!
      return {
        sessionID: sessionId,
        parentSessionID: record.parentSessionID,
        delegationDepth: record.delegationDepth,
        status: record.status,
        hierarchy: {
          root: resolved.rootSessionId,
          children: {},
        },
      }
    } catch {
      return null
    }
  }
}

/** Find sessions related by tool overlap and time proximity. */
async function handleFindRelated(projectRoot: string, sessionId: string, maxRelated: number) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const index = await readProjectIndex(projectRoot)
  if (!index) return renderToolResult(error("No project index found."))
  const sourceSessions = index.sessions ?? {}
  const source = sourceSessions[sessionId]
  if (!source) return renderToolResult(error(`Session not found in index: ${sessionId}`))
  const sourceTools = source.toolSummary ?? {}
  const sourceCreated = source.created ? new Date(source.created).getTime() : 0
  const related: Array<{ sessionId: string; score: number; sharedTools: string[]; timeProximity: boolean }> = []
  for (const [otherId, other] of Object.entries(sourceSessions)) {
    if (otherId === sessionId) continue
    const otherTools = other.toolSummary ?? {}
    const sharedTools = Object.keys(sourceTools).filter((t) => otherTools[t])
    const toolScore = sharedTools.length > 0 ? sharedTools.length : 0
    const otherCreated = other.created ? new Date(other.created).getTime() : 0
    const timeProximity = sourceCreated > 0 && Math.abs(sourceCreated - otherCreated) < TIME_PROXIMITY_MS
    const score = toolScore * 2 + (timeProximity ? 1 : 0)
    if (score > 0) related.push({ sessionId: otherId, score, sharedTools, timeProximity })
  }
  related.sort((a, b) => b.score - a.score)
  const paginated = related.slice(0, maxRelated)
  return renderToolResult(success(`Found ${related.length} related sessions`, {
    sessionId, totalRelated: related.length, related: paginated, hasMore: related.length > maxRelated,
  }))
}

/** Cross-reference sessions for a tool or agent name. */
async function handleCrossReference(projectRoot: string, sessionId: string, query?: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const trackerRoot = sessionTrackerRoot(projectRoot)
  // query is a tool/agent name (e.g. "bash", "delegate") — NOT a session ID
  // Only validate sessionId; query is a free-text search term
  const searchQuery = (query ?? sessionId).trim()
  if (!searchQuery) return renderToolResult(error("Cross-reference requires a query or sessionId."))
  const refs: Array<{ sessionId: string; toolMatches: string[] }> = []
  try {
    const entries = await readdir(trackerRoot, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || !entry.name.startsWith("ses_")) continue
      const otherId = entry.name
      if (!isValidSessionID(otherId)) continue
      const record = await readContinuity(projectRoot, otherId)
      if (!record?.toolSummary) continue
      const toolMatches = Object.keys(record.toolSummary).filter((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      if (toolMatches.length > 0) refs.push({ sessionId: otherId, toolMatches: toolMatches.slice(0, 10) })
    }
  } catch { return renderToolResult(error("Unable to scan session directory.")) }
  return renderToolResult(success(`Cross-reference results for "${searchQuery}"`, {
    sessionId, query: searchQuery, totalRefs: refs.length, refs: refs.slice(0, 50),
  }))
}

/** Synthesize compact markdown context for a session. */
async function handleSynthesizeContext(projectRoot: string, sessionId: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const record = await readContinuity(projectRoot, sessionId)
  if (!record) return renderToolResult(error(`Session not found: ${sessionId}`))
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved) return renderToolResult(error(`Session not found: ${sessionId}`))
  let frontmatter: Record<string, unknown> = {}
  try {
    if (resolved.type === "main") {
      const raw = await readFile(resolved.filePath, "utf-8")
      const parsed = matter(raw)
      frontmatter = parsed.data as Record<string, unknown>
    } else {
      const childRecord = resolved.childRecord!
      frontmatter = {
        sessionID: childRecord.sessionID,
        parentSessionID: childRecord.parentSessionID,
        delegationDepth: childRecord.delegationDepth,
        status: childRecord.status,
        created: childRecord.created,
        updated: childRecord.updated,
        delegatedBy: childRecord.delegatedBy,
        mainAgent: childRecord.mainAgent,
      }
    }
  } catch { /* frontmatter optional */ }
  const tools = record.toolSummary ?? {}
  const toolList = Object.entries(tools)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 15)
    .map(([name, count]) => `${name}: ${count}`)
    .join("\n- ")
  const markdown = [
    `# Session: ${sessionId}`,
    `Status: ${record.status ?? "unknown"}  `,
    `Turns: ${record.turnCount ?? "?"}  `,
    `Children: ${record.childCount ?? "?"}  `,
    `Depth: ${record.delegationDepth ?? "?"}  `,
    `Last updated: ${record.lastUpdated ?? "?"}`,
    ``,
    `## Frontmatter`,
    ...Object.entries(frontmatter).map(([k, v]) => `- **${k}**: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`),
    ``,
    `## Top Tools (${Object.keys(tools).length} total)`,
    toolList ? `- ${toolList}` : "No tool usage recorded.",
  ].join("\n")
  return renderToolResult(success(`Synthesized context for ${sessionId}`, {
    sessionId, context: markdown,
  }))
}

/** Cross-session aggregation by status or subagentType. */
async function handleAggregate(projectRoot: string, groupBy: "subagentType" | "status") {
  const index = await readProjectIndex(projectRoot)
  if (!index) return renderToolResult(error("No project index found. Session tracking may not be running."))

  const sessions = index.sessions ?? {}
  const counts: Record<string, number> = {}

  if (groupBy === "status") {
    // Fast path: status is in project-continuity.json index
    for (const [, meta] of Object.entries(sessions)) {
      const metaRecord = meta as Record<string, unknown>
      const status = typeof metaRecord.status === "string" ? metaRecord.status : "unknown"
      counts[status] = (counts[status] ?? 0) + 1
    }
  } else if (groupBy === "subagentType") {
    // Loop through all root sessions from the project index and aggregate real subagent types
    for (const rootId of Object.keys(sessions)) {
      // 1. Every root session itself is an opencode-session
      counts["opencode-session"] = (counts["opencode-session"] ?? 0) + 1

      // 2. Read its hierarchy manifest to get all child sessions and count their actual subagentType
      const manifestPath = safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json")
      try {
        const raw = await readFile(manifestPath, "utf-8")
        const manifest = JSON.parse(raw) as { children?: Record<string, { subagentType?: string }> }
        if (manifest.children) {
          for (const child of Object.values(manifest.children)) {
            const agentType = child.subagentType || "unknown-subagent"
            counts[agentType] = (counts[agentType] ?? 0) + 1
          }
        }
      } catch {
        // No hierarchy manifest or unreadable, check if the directory exists
      }
    }
  }

  // Sort by count descending
  const sorted = Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a),
  )

  const totalSessions = Object.keys(sessions).length
  return renderToolResult(success(`Aggregated ${totalSessions} sessions by ${groupBy}`, {
    groupBy,
    totalSessions,
    counts: sorted,
    timestamp: new Date().toISOString(),
  }))
}
