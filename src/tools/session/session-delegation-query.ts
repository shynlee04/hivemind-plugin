/**
 * Session-delegation-query tool — progressive-disclosure read-only query
 * of delegation history from session-tracker data.
 *
 * Two actions:
 * - `list`: Paginated delegation summaries from hierarchy-manifest.json
 * - `get`: Full delegation detail drill-down from child .json files via resolveSessionFile()
 *
 * Reads exclusively from session-tracker files (hierarchy-manifest.json + child .json).
 * Does NOT import from delegation-persistence.ts, DelegationManager, or any in-memory
 * delegation state (REQ-P41E-03).
 *
 * @module tools/session/session-delegation-query
 */

import { tool } from "@opencode-ai/plugin/tool"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

import { safeSessionPath, sessionTrackerRoot } from "../../features/session-tracker/persistence/atomic-write.js"
import { resolveSessionFile } from "./session-resolver.js"
import { isValidSessionID } from "../../features/session-tracker/types.js"
import { success, error } from "../../shared/tool-response.js"
import { renderToolResult } from "../../shared/tool-helpers.js"

import type { HierarchyManifest, HierarchyManifestChild, ChildSessionRecord } from "../../features/session-tracker/types.js"
import type { SessionDelegationQueryInput } from "../../schema-kernel/session-delegation-query.schema.js"

type ToolContext = { sessionID?: string }

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function createSessionDelegationQueryTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Query delegation history with progressive disclosure. Actions: list (paginated summaries with filtering), get (single delegation drill-down). Complementary to delegation-status, session-tracker, session-hierarchy, and hivemind-session-view.",

    args: {
      action: tool.schema.enum(["list", "get"]),
      // list action args
      rootSessionId: tool.schema.string().optional(),
      status: tool.schema.string().optional(),
      agentType: tool.schema.string().optional(),
      delegatedBy: tool.schema.string().optional(),
      minDepth: tool.schema.number().optional(),
      maxDepth: tool.schema.number().optional(),
      updatedAfter: tool.schema.string().optional(),
      updatedBefore: tool.schema.string().optional(),
      offset: tool.schema.number().optional(),
      limit: tool.schema.number().optional(),
      // get action args
      sessionId: tool.schema.string().optional(),
    },

    async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
      try {
        // Dynamic parse: Zod discriminatedUnion validates shape per action
        const { SessionDelegationQueryInputSchema } = await import("../../schema-kernel/session-delegation-query.schema.js")
        const input = SessionDelegationQueryInputSchema.parse(rawArgs) as SessionDelegationQueryInput

        switch (input.action) {
          case "list": return await handleList(projectRoot, input)
          case "get":  return await handleGet(projectRoot, input)
          default:     return renderToolResult(error(`Unknown action`))
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Delegation summary types
// ---------------------------------------------------------------------------

interface DelegationSummary {
  sessionID: string
  rootMainSessionID: string
  parentSessionID: string
  subagentType: string
  delegatedBy: string
  status: string
  delegationDepth: number
  turnCount: number
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// List action
// ---------------------------------------------------------------------------

const MAX_TOTAL_RESULTS = 1000

async function handleList(projectRoot: string, input: Extract<SessionDelegationQueryInput, { action: "list" }>): Promise<string> {
  const rootSessions = input.rootSessionId
    ? [input.rootSessionId]
    : await discoverRootSessions(projectRoot)

  if (rootSessions.length === 0) {
    return renderToolResult(success("No sessions found", {
      delegations: [],
      total: 0,
      offset: input.offset,
      limit: input.limit,
      hasMore: false,
    }))
  }

  const allDelegations: DelegationSummary[] = []

  for (const rootId of rootSessions) {
    if (!isValidSessionID(rootId)) continue
    if (allDelegations.length >= MAX_TOTAL_RESULTS) break

    try {
      const manifestPath = safeSessionPath(projectRoot, rootId, "hierarchy-manifest.json")
      const raw = await readFile(manifestPath, "utf-8")
      const manifest = JSON.parse(raw) as HierarchyManifest

      for (const [childId, child] of Object.entries(manifest.children ?? {})) {
        if (allDelegations.length >= MAX_TOTAL_RESULTS) break
        if (!matchesFilters(child, input)) continue

        allDelegations.push({
          sessionID: childId,
          rootMainSessionID: child.rootMainSessionID ?? rootId,
          parentSessionID: child.parentSessionID,
          subagentType: child.subagentType ?? "unknown",
          delegatedBy: child.delegatedBy ?? "unknown",
          status: child.status ?? "unknown",
          delegationDepth: child.delegationDepth ?? 0,
          turnCount: child.turnCount ?? 0,
          createdAt: child.createdAt ?? "",
          updatedAt: child.updatedAt ?? "",
        })
      }
    } catch {
      // Manifest missing or unreadable — skip this root session
      continue
    }
  }

  // Sort by updatedAt descending (most recent first)
  allDelegations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  const total = allDelegations.length
  const paginated = allDelegations.slice(input.offset, input.offset + input.limit)

  return renderToolResult(success(`Found ${total} delegation(s)`, {
    delegations: paginated,
    total,
    offset: input.offset,
    limit: input.limit,
    hasMore: total > input.offset + input.limit,
  }))
}

// ---------------------------------------------------------------------------
// Get action (drill-down)
// ---------------------------------------------------------------------------

async function handleGet(projectRoot: string, input: Extract<SessionDelegationQueryInput, { action: "get" }>): Promise<string> {
  if (!isValidSessionID(input.sessionId)) {
    return renderToolResult(error(`Invalid session ID: ${input.sessionId}`))
  }

  const resolved = await resolveSessionFile(projectRoot, input.sessionId)
  if (!resolved || resolved.type !== "child" || !resolved.childRecord) {
    return renderToolResult(
      error(`Session ID ${input.sessionId} not found in any hierarchy-manifest. Try "list" to discover available sessions.`),
    )
  }

  const record: ChildSessionRecord = resolved.childRecord

  // Build turn summary: aggregate tool name frequencies + first/last timestamps
  const toolSummary: Record<string, number> = {}
  let firstTurnTimestamp: string | undefined
  let lastTurnTimestamp: string | undefined

  for (const turn of record.turns ?? []) {
    if (!firstTurnTimestamp) firstTurnTimestamp = `turn_${turn.turn}`
    lastTurnTimestamp = `turn_${turn.turn}`

    for (const toolCall of turn.tools ?? []) {
      if (toolCall.tool) {
        toolSummary[toolCall.tool] = (toolSummary[toolCall.tool] ?? 0) + 1
      }
    }
  }

  return renderToolResult(success(`Delegation detail: ${input.sessionId}`, {
    sessionID: record.sessionID,
    parentSessionID: record.parentSessionID,
    delegationDepth: record.delegationDepth,
    delegatedBy: {
      agentName: record.delegatedBy?.agentName ?? "",
      model: record.delegatedBy?.model ?? "",
      tool: record.delegatedBy?.tool ?? "",
      description: record.delegatedBy?.description ?? "",
      subagentType: record.delegatedBy?.subagentType ?? "",
    },
    mainAgent: record.mainAgent
      ? { name: record.mainAgent.name ?? "", model: record.mainAgent.model ?? "" }
      : undefined,
    created: record.created,
    updated: record.updated,
    status: record.status,
    turnCount: (record.turns ?? []).length,
    turnSummary: {
      toolSummary,
      firstTurnAt: firstTurnTimestamp ?? null,
      lastTurnAt: lastTurnTimestamp ?? null,
    },
    journeyEntryCount: record.journey?.length ?? 0,
    lastMessage: record.lastMessage?.slice(0, 500) ?? null,
    children: {
      count: (record.children ?? []).length,
      ids: record.children ?? [],
    },
    // P41-B gap fields (optional — only present if defined)
    ...(record.queueKey !== undefined ? { queueKey: record.queueKey } : {}),
    ...(record.terminalKind !== undefined ? { terminalKind: record.terminalKind } : {}),
    ...(record.recoveryGuarantee !== undefined ? { recoveryGuarantee: record.recoveryGuarantee } : {}),
    ...(record.executionMode !== undefined ? { executionMode: record.executionMode } : {}),
    ...(record.lifecycle !== undefined ? { lifecycle: record.lifecycle } : {}),
    _note: "Journey entries and turns excluded — use session-tracker export-session for full content",
  }))
}

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

function matchesFilters(child: HierarchyManifestChild, filters: Record<string, unknown>): boolean {
  if (filters.status && child.status !== filters.status) return false
  if (filters.agentType && child.subagentType !== filters.agentType) return false
  if (filters.delegatedBy && child.delegatedBy !== filters.delegatedBy) return false

  if (filters.minDepth !== undefined && (child.delegationDepth ?? 0) < (filters.minDepth as number)) return false
  if (filters.maxDepth !== undefined && (child.delegationDepth ?? 0) > (filters.maxDepth as number)) return false

  if (filters.updatedAfter && child.updatedAt && child.updatedAt < (filters.updatedAfter as string)) return false
  if (filters.updatedBefore && child.updatedAt && child.updatedAt > (filters.updatedBefore as string)) return false

  return true
}

// ---------------------------------------------------------------------------
// Session discovery
// ---------------------------------------------------------------------------

/**
 * Discovers root sessions by reading project-continuity.json or falling back
 * to directory scan. Matches the established pattern in session-tracker.ts
 * and session-resolver.ts.
 */
async function discoverRootSessions(projectRoot: string): Promise<string[]> {
  const trackerRoot = sessionTrackerRoot(projectRoot)

  try {
    const projectIndexPath = join(trackerRoot, "project-continuity.json")
    const raw = await readFile(projectIndexPath, "utf-8")
    const index = JSON.parse(raw) as { chronologicalOrder?: string[]; sessions?: Record<string, unknown> }
    const order = index.chronologicalOrder ?? Object.keys(index.sessions ?? {})
    if (order.length > 0) return order
  } catch {
    // Fall through to directory scan
  }

  try {
    const entries = await readdir(trackerRoot, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory() && e.name.startsWith("ses_"))
      .map((e) => e.name)
  } catch {
    return []
  }
}
