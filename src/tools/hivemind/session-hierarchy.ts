/**
 * Session-hierarchy tool — read-only navigation of session delegation trees.
 *
 * Four actions: get-children, get-parent-chain, get-delegation-depth, get-manifest.
 * All path construction uses safeSessionPath() with isValidSessionID() pre-validation.
 * Read-only (CQRS read-side). No mutation authority.
 * @module tools/hivemind/session-hierarchy
 */

import { tool } from "@opencode-ai/plugin/tool"
import { readFile } from "node:fs/promises"
import { SessionHierarchyInputSchema, type SessionHierarchyInput } from "../../schema-kernel/session-tracker.schema.js"
import { safeSessionPath } from "../../features/session-tracker/persistence/atomic-write.js"
import { isValidSessionID } from "../../features/session-tracker/types.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"

import type { ChildRef } from "../../features/session-tracker/types.js"

type ToolContext = { sessionID?: string }

interface ContinuityRecord {
  sessionID: string
  parentSessionID?: string | null
  delegationDepth?: number
  status?: string
  hierarchy?: { children?: Array<ChildRef & { status?: string; delegationDepth?: number }> }
}

export function createSessionHierarchyTool(projectRoot: string): ReturnType<typeof tool> {
  return tool({
    description:
      "Navigate session delegation hierarchy. Actions: get-children, get-parent-chain, get-delegation-depth, get-manifest.",
    args: {
      action: tool.schema.enum(["get-children", "get-parent-chain", "get-delegation-depth", "get-manifest"]),
      sessionId: tool.schema.string(),
      includeStatus: tool.schema.boolean().optional(),
    },
    async execute(rawArgs: unknown, _context: ToolContext): Promise<string> {
      try {
        const input = SessionHierarchyInputSchema.parse(rawArgs) as SessionHierarchyInput
        switch (input.action) {
          case "get-children": return handleGetChildren(projectRoot, input.sessionId, input.includeStatus)
          case "get-parent-chain": return handleGetParentChain(projectRoot, input.sessionId)
          case "get-delegation-depth": return handleGetDelegationDepth(projectRoot, input.sessionId)
          case "get-manifest": return handleGetManifest(projectRoot, input.sessionId)
          default: return renderToolResult(error(`Unknown action`))
        }
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/** Read session continuity JSON, returning parsed record or null. */
async function readContinuity(projectRoot: string, sessionId: string): Promise<ContinuityRecord | null> {
  if (!isValidSessionID(sessionId)) return null
  const indexPath = safeSessionPath(projectRoot, sessionId, "session-continuity.json")
  try {
    const raw = await readFile(indexPath, "utf-8")
    return JSON.parse(raw) as ContinuityRecord
  } catch {
    return null
  }
}

/** Get children of a session. */
async function handleGetChildren(projectRoot: string, sessionId: string, includeStatus: boolean | undefined) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const record = await readContinuity(projectRoot, sessionId)
  if (!record) return renderToolResult(error(`Session not found: ${sessionId}`))
  const children = (record.hierarchy?.children ?? []).map((c) => ({
    sessionId: c.sessionID,
    childFile: c.childFile,
    status: includeStatus !== false ? c.status ?? record.status : undefined,
    delegationDepth: c.delegationDepth ?? (record.delegationDepth ?? 0) + 1,
  }))
  return renderToolResult(success(`Children of ${sessionId}`, {
    sessionId, childCount: children.length, children,
  }))
}

/** Walk parent chain up to root. */
async function handleGetParentChain(projectRoot: string, sessionId: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const chain: Array<{ sessionId: string; status: string; depth: number }> = []
  let current = sessionId
  let depth = 0
  const MAX_DEPTH = 50
  while (current && depth < MAX_DEPTH) {
    const record = await readContinuity(projectRoot, current)
    if (!record) break
    chain.push({ sessionId: record.sessionID, status: record.status ?? "unknown", depth })
    if (!record.parentSessionID) break
    current = record.parentSessionID
    depth++
  }
  return renderToolResult(success(`Parent chain for ${sessionId}`, {
    sessionId, chainLength: chain.length, chain,
  }))
}

/** Recursively compute max delegation depth under a session. */
async function handleGetDelegationDepth(projectRoot: string, sessionId: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const depth = await computeDepth(projectRoot, sessionId, new Set())
  return renderToolResult(success(`Delegation depth for ${sessionId}`, {
    sessionId, delegationDepth: depth,
  }))
}

const COMPUTE_DEPTH_MAX = 100

async function computeDepth(projectRoot: string, sessionId: string, visited: Set<string>): Promise<number> {
  if (visited.has(sessionId)) return 0
  if (visited.size >= COMPUTE_DEPTH_MAX) return 0
  visited.add(sessionId)
  const record = await readContinuity(projectRoot, sessionId)
  if (!record || !record.hierarchy?.children?.length) return 0
  let maxChildDepth = 0
  for (const child of record.hierarchy.children) {
    const childDepth = await computeDepth(projectRoot, child.sessionID, visited)
    maxChildDepth = Math.max(maxChildDepth, childDepth + 1)
  }
  return maxChildDepth
}

/** Read hierarchy-manifest.json for a session. */
async function handleGetManifest(projectRoot: string, sessionId: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  try {
    const manifestPath = safeSessionPath(projectRoot, sessionId, "hierarchy-manifest.json")
    const raw = await readFile(manifestPath, "utf-8")
    const manifest = JSON.parse(raw) as {
      children?: Array<{
        childSessionId: string
        status?: string
        delegatedBy?: { subagentType?: string; taskDescription?: string }
        depth?: number
        turnCount?: number
        createdAt?: string
      }>
    }
    const children = manifest.children ?? []
    return renderToolResult(success(`Manifest for ${sessionId}`, {
      sessionId,
      childCount: children.length,
      children: children.map((c) => ({
        childSessionId: c.childSessionId,
        status: c.status ?? "unknown",
        delegatedBy: c.delegatedBy ?? null,
        depth: c.depth ?? 0,
        turnCount: c.turnCount ?? 0,
        createdAt: c.createdAt ?? null,
      })),
    }))
  } catch {
    return renderToolResult(error(`Manifest not found for session: ${sessionId}`))
  }
}
