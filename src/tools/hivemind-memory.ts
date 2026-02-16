/**
 * hivemind_memory — Unified memory management tool.
 *
 * Merged from: save_mem, recall_mems, list_shelves
 * Actions: save, recall, list
 *
 * Design:
 *   1. Iceberg — minimal args, system handles storage
 *   2. Context Inference — session ID from brain state
 *   3. Signal-to-Noise — structured output
 *   4. HC5 Compliance — --json flag for deterministic machine-parseable output
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
// CHIMERA-1 FIX: Wired to graph-io.ts (NOT mems.ts) to eliminate split-brain data black hole
import { loadGraphMems, addGraphMem } from "../lib/graph-io.js"
import type { MemNode } from "../schemas/graph-nodes.js"
import type { GraphMemsState } from "../schemas/graph-state.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

// Built-in shelves for memory categorization
const BUILTIN_SHELVES = ["decisions", "patterns", "errors", "solutions", "context"] as const

/**
 * Search MemNodes by query string.
 * Returns results sorted by relevance_score (descending).
 */
function searchGraphMems(
  state: GraphMemsState,
  query: string,
  shelf?: string,
  options?: {
    createdAfter?: number
    createdBefore?: number
    linkedTaskId?: string
    limit?: number
    offset?: number
  }
): MemNode[] {
  const q = query.toLowerCase()
  let results = state.mems.filter(m => {
    if (shelf && m.shelf !== shelf) return false

    // Time-bounded filtering
    const createdTime = new Date(m.created_at).getTime()
    if (options?.createdAfter && createdTime < options.createdAfter) return false
    if (options?.createdBefore && createdTime > options.createdBefore) return false

    // Task ID filter (origin_task_id) - only filter if provided
    if (options?.linkedTaskId !== undefined && m.origin_task_id !== options.linkedTaskId) {
      return false
    }

    // Content match
    return m.content.toLowerCase().includes(q)
  })

  // Sort by relevance_score descending, then by created_at descending
  results.sort((a, b) => {
    const scoreDiff = b.relevance_score - a.relevance_score
    if (Math.abs(scoreDiff) > 0.01) return scoreDiff
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  // Apply pagination
  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 0
  if (limit > 0) {
    results = results.slice(offset, offset + limit)
  } else if (offset > 0) {
    results = results.slice(offset)
  }

  return results
}

/**
 * Get shelf summary from GraphMemsState.
 */
function getGraphShelfSummary(state: GraphMemsState): Record<string, number> {
  const summary: Record<string, number> = {}
  for (const m of state.mems) {
    summary[m.shelf] = (summary[m.shelf] || 0) + 1
  }
  return summary
}

export function createHivemindMemoryTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Manage long-term memories that persist across sessions. " +
      "Actions: save (store memory), recall (search), list (show shelves). " +
      "Use --json for machine-parseable output.",
    args: {
      action: tool.schema
        .enum(["save", "recall", "list"])
        .describe("What to do: save | recall | list"),
      shelf: tool.schema
        .string()
        .optional()
        .describe("For save: category shelf | For recall: filter by shelf"),
      content: tool.schema
        .string()
        .optional()
        .describe("For save: the memory content to store"),
      tags: tool.schema
        .string()
        .optional()
        .describe("For save: comma-separated tags (e.g., 'auth,jwt')"),
      query: tool.schema
        .string()
        .optional()
        .describe("For recall: search keyword"),
      strict_session: tool.schema
        .boolean()
        .optional()
        .describe("For recall/list: only include current session memories"),
      // P0-7 Fix 2: Time-bounded search parameters
      created_after: tool.schema
        .string()
        .optional()
        .describe("For recall: only memories created after this ISO datetime"),
      created_before: tool.schema
        .string()
        .optional()
        .describe("For recall: only memories created before this ISO datetime"),
      limit: tool.schema
        .number()
        .min(1)
        .max(100)
        .optional()
        .describe("For recall: max results (default 20, max 100)"),
      offset: tool.schema
        .number()
        .min(0)
        .optional()
        .describe("For recall: pagination offset (default 0)"),
      linked_task_id: tool.schema
        .string()
        .optional()
        .describe("For recall: filter by linked task UUID"),
    },
    async execute(args, _context) {
      // CHIMERA-3: Always return JSON for FK chaining
      switch (args.action) {
        case "save":
          return handleSave(directory, args)
        case "recall":
          return handleRecall(directory, args)
        case "list":
          return handleList(directory, args)
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}

// CHIMERA-1 FIX: Uses graph-io.ts (loadGraphMems, addGraphMem) instead of mems.ts
async function handleSave(
  directory: string,
  args: {
    shelf?: string
    content?: string
    tags?: string
  }
): Promise<string> {
  if (!args.shelf?.trim()) {
    return toErrorOutput(`shelf is required. Use: ${BUILTIN_SHELVES.join(", ")} (or custom).`)
  }

  if (!args.content?.trim()) {
    return toErrorOutput("content cannot be empty")
  }

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state ? state.session.id : null

  // CHIMERA-1 FIX: Load from graph (NOT legacy mems.ts)
  const memsState = await loadGraphMems(directory)

  // Check for duplicate
  const isDuplicate = memsState.mems.some(
    (m: MemNode) => m.shelf === args.shelf && m.content === args.content
  )
  if (isDuplicate) {
    return toErrorOutput("Duplicate memory - identical content already exists on this shelf")
  }

  // Create new MemNode with UUID and FK constraints (CHIMERA-1: use MemNode schema)
  const now = new Date().toISOString()
  const newMem: MemNode = {
    id: crypto.randomUUID(),
    origin_task_id: sessionId, // FK to session (can be null)
    shelf: args.shelf,
    type: "insight", // Default type for user memories
    content: args.content,
    relevance_score: 1.0, // Fresh memory has max relevance
    staleness_stamp: now,
    created_at: now,
    updated_at: now,
  }

  // CHIMERA-1 FIX: Save to graph (NOT legacy mems.ts)
  const newMemId = await addGraphMem(directory, newMem)
  const updatedState = await loadGraphMems(directory)

  return toSuccessOutput("Memory saved successfully", newMemId, {
    shelf: args.shelf,
    content: args.content.slice(0, 100),
    totalMemories: updatedState.mems.length,
    sessionId,
  })
}

// CHIMERA-1 FIX: Uses graph-io.ts (loadGraphMems) instead of mems.ts
async function handleRecall(
  directory: string,
  args: {
    query?: string
    shelf?: string
    strict_session?: boolean
    created_after?: string
    created_before?: string
    limit?: number
    offset?: number
    linked_task_id?: string
  }
): Promise<string> {
  if (!args.query?.trim()) {
    return toErrorOutput("query is required")
  }

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state?.session.id

  // CHIMERA-1 FIX: Load from graph (NOT legacy mems.ts)
  const memsState = await loadGraphMems(directory)

  if (memsState.mems.length === 0) {
    return toSuccessOutput("No memories found", undefined, { results: [], total: 0 })
  }

  // Parse time bounds
  const createdAfter = args.created_after ? new Date(args.created_after).getTime() : undefined
  const createdBefore = args.created_before ? new Date(args.created_before).getTime() : undefined
  const limit = args.limit ?? 20
  const offset = args.offset ?? 0

  // Validate date parsing
  if (args.created_after && isNaN(createdAfter!)) {
    return toErrorOutput("invalid created_after date format - must be valid ISO datetime")
  }
  if (args.created_before && isNaN(createdBefore!)) {
    return toErrorOutput("invalid created_before date format - must be valid ISO datetime")
  }

  // Build search options
  const searchOptions: {
    createdAfter?: number
    createdBefore?: number
    linkedTaskId?: string
    limit: number
    offset: number
  } = {
    createdAfter,
    createdBefore,
    limit,
    offset,
  }

  // Filter by linked_task_id if strict_session is true and we have a session
  if (args.strict_session && sessionId) {
    searchOptions.linkedTaskId = sessionId
  } else if (args.linked_task_id) {
    searchOptions.linkedTaskId = args.linked_task_id
  }

  // CHIMERA-1 FIX: Use graph search against MemNode schema
  const results = searchGraphMems(memsState, args.query, args.shelf, searchOptions)

  if (results.length === 0) {
    return toSuccessOutput("No memories found", undefined, {
      results: [],
      total: 0,
      query: args.query,
      shelf: args.shelf,
      limit,
      offset
    })
  }

  return toSuccessOutput(`Found ${results.length} memories`, undefined, {
    query: args.query,
    shelf: args.shelf || null,
    total: results.length,
    limit,
    offset,
    results: results.map((m: MemNode) => ({
      id: m.id,
      shelf: m.shelf,
      content: m.content,
      type: m.type,
      relevanceScore: m.relevance_score,
      originTaskId: m.origin_task_id,
      createdAt: m.created_at,
    })),
  })
}

// CHIMERA-1 FIX: Uses graph-io.ts (loadGraphMems) instead of mems.ts
async function handleList(
  directory: string,
  _args: {
    strict_session?: boolean
  }
): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state?.session.id

  // CHIMERA-1 FIX: Load from graph (NOT legacy mems.ts)
  const memsState = await loadGraphMems(directory)

  // Filter by origin_task_id (MemNode FK field) if strict_session
  const pool = _args.strict_session && sessionId
    ? { ...memsState, mems: memsState.mems.filter(m => m.origin_task_id === sessionId) }
    : memsState

  if (pool.mems.length === 0) {
    return toSuccessOutput("No memories found", undefined, { shelves: {}, total: 0, recent: [] })
  }

  // CHIMERA-1 FIX: Use graph shelf summary
  const summary = getGraphShelfSummary(pool)

  // Show 3 most recent mems, sorted by created_at (ISO string in MemNode)
  const recent = [...pool.mems]
    .sort((a, b) => {
      // Prefer current session's mems
      if (sessionId) {
        const aIsSession = a.origin_task_id === sessionId
        const bIsSession = b.origin_task_id === sessionId
        if (aIsSession !== bIsSession) {
          return aIsSession ? -1 : 1
        }
      }
      // Sort by created_at descending (ISO string comparison)
      return b.created_at.localeCompare(a.created_at)
    })
    .slice(0, 3)

  return toSuccessOutput("Memories listed", undefined, {
    total: memsState.mems.length,
    scope: _args.strict_session ? "session" : "global",
    shelves: summary,
    recent: recent.map(m => ({
      id: m.id,
      shelf: m.shelf,
      content: m.content.slice(0, 60),
      originTaskId: m.origin_task_id,
      createdAt: m.created_at,
    })),
  })
}
