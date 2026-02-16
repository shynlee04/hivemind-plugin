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
import { loadMems, saveMems, addMem, searchMems, getShelfSummary, BUILTIN_SHELVES } from "../lib/mems.js"

const MAX_RESULTS = 5

interface JsonOutput {
  success: boolean
  action: string
  data: Record<string, unknown>
  timestamp: string
}

function toJsonOutput(action: string, data: Record<string, unknown>): string {
  return JSON.stringify({
    success: true,
    action,
    data,
    timestamp: new Date().toISOString(),
  } as JsonOutput)
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
      json: tool.schema
        .boolean()
        .optional()
        .describe("Output as machine-parseable JSON (HC5)"),
    },
    async execute(args, _context) {
      const jsonOutput = args.json ?? false

      switch (args.action) {
        case "save":
          return handleSave(directory, args, jsonOutput)
        case "recall":
          return handleRecall(directory, args, jsonOutput)
        case "list":
          return handleList(directory, args, jsonOutput)
        default:
          return jsonOutput
            ? toJsonOutput("error", { message: `Unknown action: ${args.action}` })
            : `ERROR: Unknown action. Use save, recall, or list.`
      }
    },
  })
}

async function handleSave(
  directory: string,
  args: {
    shelf?: string
    content?: string
    tags?: string
    json?: boolean
  },
  jsonOutput: boolean
): Promise<string> {
  if (!args.shelf?.trim()) {
    return jsonOutput
      ? toJsonOutput("save", { error: "shelf required" })
      : `ERROR: shelf is required. Use: ${BUILTIN_SHELVES.join(", ")} (or custom).`
  }

  if (!args.content?.trim()) {
    return jsonOutput
      ? toJsonOutput("save", { error: "content required" })
      : "ERROR: content cannot be empty. Describe the decision, pattern, or lesson."
  }

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state ? state.session.id : "unknown"
  const noSessionWarning = state ? "" : " (⚠ no active session — memory saved but unlinked)"

  const tagList = args.tags
    ? args.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    : []

  let memsState = await loadMems(directory)

  // Check for duplicate
  const isDuplicate = memsState.mems.some(
    m => m.shelf === args.shelf && m.content === args.content
  )
  if (isDuplicate) {
    return jsonOutput
      ? toJsonOutput("save", { error: "duplicate", shelf: args.shelf })
      : `Memory already exists on [${args.shelf}] shelf with identical content.${noSessionWarning}`
  }

  memsState = addMem(memsState, args.shelf, args.content, tagList, sessionId)
  await saveMems(directory, memsState)

  if (jsonOutput) {
    return toJsonOutput("save", {
      shelf: args.shelf,
      content: args.content.slice(0, 100),
      tags: tagList,
      totalMemories: memsState.mems.length,
      sessionId,
    })
  }

  return `Memory saved to [${args.shelf}]. ${memsState.mems.length} total memories. Tags: ${tagList.length > 0 ? tagList.join(", ") : "(none)"}${noSessionWarning}\n→ Use hivemind_memory recall to search, or list to browse.`
}

async function handleRecall(
  directory: string,
  args: {
    query?: string
    shelf?: string
    strict_session?: boolean
    json?: boolean
  },
  jsonOutput: boolean
): Promise<string> {
  if (!args.query?.trim()) {
    return jsonOutput
      ? toJsonOutput("recall", { error: "query required" })
      : "ERROR: query is required. Provide a search keyword."
  }

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state?.session.id
  const memsState = await loadMems(directory)

  if (memsState.mems.length === 0) {
    return jsonOutput
      ? toJsonOutput("recall", { results: [], total: 0 })
      : "Mems Brain is empty. Use hivemind_memory save to store memories first."
  }

  const results = searchMems(memsState, args.query, args.shelf, {
    sessionId,
    strictSession: args.strict_session ?? false,
    preferSession: true,
  })

  if (results.length === 0) {
    const filterNote = args.shelf ? ` in shelf "${args.shelf}"` : ""
    return jsonOutput
      ? toJsonOutput("recall", { results: [], total: 0, query: args.query, shelf: args.shelf })
      : `No memories found for "${args.query}"${filterNote}. Try a broader search or different keywords.`
  }

  const shown = results.slice(0, MAX_RESULTS)

  if (jsonOutput) {
    return toJsonOutput("recall", {
      query: args.query,
      shelf: args.shelf || null,
      total: results.length,
        results: shown.map(m => ({
          id: m.id,
          shelf: m.shelf,
          content: m.content,
          tags: m.tags,
          sessionId: m.session_id,
          createdAt: new Date(m.created_at).toISOString(),
        })),
      })
  }

  const lines: string[] = []
  lines.push(`=== RECALL: ${results.length} memories found for "${args.query}" ===`)
  lines.push("")

  for (const m of shown) {
    const date = new Date(m.created_at).toISOString().split("T")[0]
    lines.push(`[${m.shelf}] ${m.id} (${date})`)
    lines.push(`  ${m.content}`)
    if (m.tags.length > 0) {
      lines.push(`  Tags: ${m.tags.join(", ")}`)
    }
    lines.push("")
  }

  if (results.length > MAX_RESULTS) {
    lines.push(`... and ${results.length - MAX_RESULTS} more. Narrow your search or filter by shelf.`)
  }

  lines.push("=== END RECALL ===")
  return lines.join("\n")
}

async function handleList(
  directory: string,
  _args: {
    strict_session?: boolean
    json?: boolean
  },
  jsonOutput: boolean
): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state?.session.id
  const memsState = await loadMems(directory)
  const pool = _args.strict_session && sessionId
    ? { ...memsState, mems: memsState.mems.filter(m => m.session_id === sessionId) }
    : memsState

  if (pool.mems.length === 0) {
    return jsonOutput
      ? toJsonOutput("list", { shelves: {}, total: 0, recent: [] })
      : "Mems Brain is empty. Use hivemind_memory save to store decisions, patterns, errors, or solutions."
  }

  const summary = getShelfSummary(pool)

  // Show 3 most recent mems
  const recent = [...pool.mems]
    .sort((a, b) => {
      if (sessionId && a.session_id !== b.session_id) {
        if (a.session_id === sessionId) return -1
        if (b.session_id === sessionId) return 1
      }
      return b.created_at - a.created_at
    })
    .slice(0, 3)

  if (jsonOutput) {
    return toJsonOutput("list", {
      total: memsState.mems.length,
      scope: _args.strict_session ? "session" : "global",
      shelves: summary,
      recent: recent.map(m => ({
        id: m.id,
        shelf: m.shelf,
        content: m.content.slice(0, 60),
        sessionId: m.session_id,
        createdAt: new Date(m.created_at).toISOString(),
      })),
    })
  }

  const lines: string[] = []
  lines.push("=== MEMS BRAIN ===")
  lines.push("")
  lines.push(`Total memories: ${pool.mems.length}`)
  lines.push("")

  lines.push("## Shelves")
  for (const shelf of BUILTIN_SHELVES) {
    const count = summary[shelf] || 0
    lines.push(`  ${shelf}: ${count}`)
  }
  // Show custom shelves
  for (const [shelf, count] of Object.entries(summary)) {
    if (!(BUILTIN_SHELVES as readonly string[]).includes(shelf)) {
      lines.push(`  ${shelf}: ${count} (custom)`)
    }
  }
  lines.push("")

  lines.push("## Recent Memories")
  for (const m of recent) {
    const date = new Date(m.created_at).toISOString().split("T")[0]
    const preview = m.content.length > 60
      ? m.content.slice(0, 57) + "..."
      : m.content
    lines.push(`  [${m.shelf}] ${date}: ${preview}`)
  }
  lines.push("")
  lines.push("Use hivemind_memory recall to search memories by keyword.")
  lines.push("=== END MEMS BRAIN ===")

  return lines.join("\n")
}
