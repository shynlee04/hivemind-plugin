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
import { isValidSessionID } from "../../features/session-tracker/types.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success, error } from "../../shared/tool-response.js"
import { resolveSessionFile } from "./session-resolver.js"

import type { ChildRef } from "../../features/session-tracker/types.js"

type ToolContext = { sessionID?: string }

interface ContinuityRecord {
  sessionID: string
  parentSessionID?: string | null
  delegationDepth?: number
  status?: string
  hierarchy?: {
    root?: string
    children?: Record<string, ChildRef & { status?: string; delegationDepth?: number; children?: Record<string, unknown> }>
  }
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

/** Read session continuity JSON, returning parsed record or null. */
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

/** Normalize children to array — handles both Record<string, ...> (object) and Array formats. */
function normalizeChildren(
  children: unknown,
): Array<{ sessionID: string; childFile: string; status?: string; delegationDepth?: number }> {
  if (!children) return []
  if (Array.isArray(children)) return children as Array<{ sessionID: string; childFile: string; status?: string; delegationDepth?: number }>
  if (typeof children === "object") {
    return Object.values(children).map((v) => {
      const entry = v as Record<string, unknown>
      return {
        sessionID: typeof entry.sessionID === "string" ? entry.sessionID : String(entry.file ?? ""),
        childFile: typeof entry.childFile === "string" ? entry.childFile : (typeof entry.file === "string" ? entry.file : ""),
        status: typeof entry.status === "string" ? entry.status : undefined,
        delegationDepth: typeof entry.depth === "number" ? entry.depth : undefined,
      }
    })
  }
  return []
}

/** Get children of a session. */
async function handleGetChildren(projectRoot: string, sessionId: string, includeStatus: boolean | undefined) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const record = await readContinuity(projectRoot, sessionId)
  if (!record) return renderToolResult(error(`Session not found: ${sessionId}`))
  const children = normalizeChildren(record.hierarchy?.children).map((c) => ({
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
  if (!record) return 0
  const children = normalizeChildren(record.hierarchy?.children)
  if (children.length === 0) return 0
  let maxChildDepth = 0
  for (const child of children) {
    const childDepth = await computeDepth(projectRoot, child.sessionID, visited)
    maxChildDepth = Math.max(maxChildDepth, childDepth + 1)
  }
  return maxChildDepth
}

/** Read hierarchy-manifest.json for a session. */
async function handleGetManifest(projectRoot: string, sessionId: string) {
  if (!isValidSessionID(sessionId)) return renderToolResult(error(`Invalid session ID: ${sessionId}`))
  const resolved = await resolveSessionFile(projectRoot, sessionId)
  if (!resolved) return renderToolResult(error(`Manifest not found for session: ${sessionId}`))
  try {
    const manifestPath = resolved.manifestPath
    const raw = await readFile(manifestPath, "utf-8")
    const manifest = JSON.parse(raw) as {
      version?: string
      rootMainSessionID?: string
      lastUpdated?: string
      totalChildren?: number
      maxDepth?: number
      children?: Record<string, {
        sessionID: string
        parentSessionID?: string
        rootMainSessionID?: string
        delegationDepth?: number
        delegatedBy?: string
        subagentType?: string
        status?: string
        turnCount?: number
        childFile?: string
        createdAt?: string
      }>
    }
    const childrenMap = manifest.children ?? {}
    const children = Object.entries(childrenMap).map(([childId, c]) => ({
      childSessionId: childId,
      status: c.status ?? "unknown",
      delegatedBy: c.delegatedBy ?? null,
      subagentType: c.subagentType ?? null,
      depth: c.delegationDepth ?? 0,
      turnCount: c.turnCount ?? 0,
      createdAt: c.createdAt ?? null,
    }))
    return renderToolResult(success(`Manifest for ${sessionId}`, {
      sessionId,
      rootMainSessionID: manifest.rootMainSessionID ?? resolved.rootSessionId,
      childCount: children.length,
      totalChildren: manifest.totalChildren ?? children.length,
      maxDepth: manifest.maxDepth ?? 0,
      lastUpdated: manifest.lastUpdated ?? null,
      children,
    }))
  } catch {
    // Attempt fallback: check if session has a continuity file with children
    try {
      const record = await readContinuity(projectRoot, sessionId)
      if (record && record.hierarchy?.children) {
        const children = normalizeChildren(record.hierarchy.children)
        if (children.length > 0) {
          return renderToolResult(success(`Manifest (from continuity fallback) for ${sessionId}`, {
            sessionId,
            rootMainSessionID: resolved.rootSessionId,
            childCount: children.length,
            totalChildren: children.length,
            maxDepth: 0,
            lastUpdated: null,
            children: children.map((c) => ({
              childSessionId: c.sessionID,
              status: c.status ?? "unknown",
              delegatedBy: null,
              subagentType: null,
              depth: c.delegationDepth ?? 0,
              turnCount: 0,
              createdAt: null,
            })),
          }))
        }
      }
    } catch { /* fallback failed too */ }
    return renderToolResult(error(`Manifest not found for session: ${sessionId}. Hierarchies are only tracked for root sessions that have active delegation children.`))
  }
}
