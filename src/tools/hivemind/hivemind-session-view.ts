/**
 * Hivemind session-view tool — cross-root unified session query.
 *
 * Single action: get — reads from 3 data roots concurrently and returns
 * an enriched nested view per D-11.
 * Read-only (CQRS read-side). No mutation authority.
 * @module tools/hivemind/hivemind-session-view
 */

import { tool } from "@opencode-ai/plugin/tool"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { SessionViewInputSchema, type SessionViewInput } from "../../schema-kernel/session-view.schema.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"
import { resolveSessionFile } from "./session-resolver.js"

type ToolContext = { sessionID?: string }

/**
 * Create the cross-root session view tool.
 *
 * @param projectRoot - Trusted project root containing .hivemind/ directories.
 * @returns OpenCode tool instance exposing get action.
 */
export function createHivemindSessionViewTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description: [
      "Query a unified session view across 3 Hivemind data roots: session-tracker, delegations, and trajectory.",
      "Returns an enriched nested tree: { session: {...}, delegations: [...], trajectory: {...} }.",
      "Read-only — no mutation authority.",
      "Actions: get.",
    ].join("\n"),
    args: {
      action: tool.schema.enum(["get"]).describe("Action to perform (get)"),
      sessionId: tool.schema.string().describe("Session ID to query"),
    },
    async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
      try {
        const input = SessionViewInputSchema.parse(rawArgs) as SessionViewInput
        const data = await buildUnifiedView(projectRoot, input.sessionId)
        if (data.error) {
          return renderToolResult(error(`Session not found: ${input.sessionId}`, data))
        }
        return renderToolResult(success(`Unified view for ${input.sessionId}`, data))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/** Read session continuity data from session-tracker. */
async function readSessionData(projectRoot: string, sessionId: string): Promise<Record<string, unknown> | null> {
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved) return null
  if (resolved.type === "main") {
    try {
      const raw = await readFile(resolved.continuityPath, "utf-8")
      return JSON.parse(raw) as Record<string, unknown>
    } catch { return null }
  } else {
    return resolved.childRecord as unknown as Record<string, unknown>
  }
}

/** Read delegations for a session from state/delegations.json. */
async function readDelegationsForSession(projectRoot: string, sessionId: string): Promise<Record<string, unknown>[]> {
  try {
    const delegationsPath = resolve(projectRoot, ".hivemind", "state", "delegations.json")
    const raw = await readFile(delegationsPath, "utf-8")
    const allDelegations = JSON.parse(raw) as Array<Record<string, unknown>>
    // Filter by session ID — delegations may use childSessionId or parentSessionId
    return allDelegations.filter((d) =>
      d.childSessionId === sessionId || d.id === sessionId,
    ).slice(0, 20)
  } catch { return [] }
}

/** Read trajectory events for a session from state/trajectory-ledger.json. */
async function readTrajectoryForSession(projectRoot: string, sessionId: string): Promise<Record<string, unknown> | null> {
  try {
    const ledgerPath = resolve(projectRoot, ".hivemind", "state", "trajectory-ledger.json")
    const raw = await readFile(ledgerPath, "utf-8")
    const allRecords = JSON.parse(raw) as Array<Record<string, unknown>>
    const sessionRecords = allRecords.filter((r) =>
      (r as Record<string, unknown>).rootSessionId === sessionId ||
      (r as Record<string, unknown>).sessionId === sessionId,
    )
    return sessionRecords.length > 0 ? { total: sessionRecords.length, entries: sessionRecords.slice(0, 50) } : null
  } catch { return null }
}

/** Build a unified view from all 3 data roots. */
async function buildUnifiedView(projectRoot: string, sessionId: string): Promise<Record<string, unknown>> {
  const [session, delegations, trajectory] = await Promise.all([
    readSessionData(projectRoot, sessionId),
    readDelegationsForSession(projectRoot, sessionId),
    readTrajectoryForSession(projectRoot, sessionId),
  ])

  if (!session) {
    return {
      session: null, delegations: [], trajectory: null,
      error: `Session not found: ${sessionId}`,
    }
  }

  // Enrich session with basic metadata
  const enrichedSession: Record<string, unknown> = {
    sessionId: (session as Record<string, unknown>).sessionID ?? sessionId,
    status: (session as Record<string, unknown>).status ?? "unknown",
    turnCount: (session as Record<string, unknown>).turnCount ?? 0,
    childCount: (session as Record<string, unknown>).childCount ?? 0,
    delegationDepth: (session as Record<string, unknown>).delegationDepth ?? 0,
    parentSessionID: (session as Record<string, unknown>).parentSessionID ?? null,
    lastUpdated: (session as Record<string, unknown>).lastUpdated ?? null,
    toolSummary: (session as Record<string, unknown>).toolSummary ?? {},
  }

  return {
    session: enrichedSession,
    delegations: {
      total: delegations.length,
      active: delegations.filter((d) => d.status === "running" || d.status === "dispatched").length,
      entries: delegations,
    },
    trajectory,
    queriedAt: new Date().toISOString(),
  }
}
