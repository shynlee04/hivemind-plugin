/**
 * hivemind_anchor — Unified anchor management tool with symmetric read/write.
 *
 * Merged from: save_anchor
 * New actions: list, get (HC4 compliance - symmetric read operations)
 *
 * Design:
 *   1. Iceberg — minimal args, system handles storage
 *   2. Context Inference — session ID from brain state
 *   3. Signal-to-Noise — structured output
 *   4. HC4 Compliance — symmetric read/write flows
 *   5. HC5 Compliance — --json flag for deterministic machine-parseable output
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
import { loadAnchors, saveAnchors, addAnchor } from "../lib/anchors.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

export function createHivemindAnchorTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Manage immutable anchors that persist across compactions. " +
      "Actions: save (store anchor), list (show all), get (read specific). " +
      "Use --json for machine-parseable output.",
    args: {
      action: tool.schema
        .enum(["save", "list", "get"])
        .describe("What to do: save | list | get"),
      key: tool.schema
        .string()
        .optional()
        .describe("Anchor key (e.g., 'DB_SCHEMA', 'API_PORT')"),
      value: tool.schema
        .string()
        .optional()
        .describe("For save: the anchor value"),
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
        case "list":
          return handleList(directory, jsonOutput)
        case "get":
          return handleGet(directory, args, jsonOutput)
        default:
          return jsonOutput
            ? toErrorOutput(`Unknown action: ${args.action}`)
            : `ERROR: Unknown action. Use save, list, or get.`
      }
    },
  })
}

async function handleSave(
  directory: string,
  args: {
    key?: string
    value?: string
    json?: boolean
  },
  jsonOutput: boolean
): Promise<string> {
  if (!args.key?.trim()) {
    return jsonOutput
      ? toErrorOutput("key cannot be empty")
      : "ERROR: key cannot be empty. Use a descriptive name like 'DB_SCHEMA' or 'API_PORT'."
  }

  if (!args.value?.trim()) {
    return jsonOutput
      ? toErrorOutput("value cannot be empty")
      : "ERROR: value cannot be empty. Describe the constraint or fact."
  }

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state ? state.session.id : "unknown"
  const noSessionWarning = state ? "" : " (⚠ no active session — anchor saved but unlinked)"

  let anchorsState = await loadAnchors(directory)

  // Detect existing anchor before upsert
  const existing = anchorsState.anchors.find(a => a.key === args.key)

  anchorsState = addAnchor(anchorsState, args.key, args.value, sessionId)
  await saveAnchors(directory, anchorsState)

  const count = anchorsState.anchors.length

  if (jsonOutput) {
    return toSuccessOutput(existing ? "Anchor updated" : "Anchor saved", args.key, {
      key: args.key,
      value: args.value,
      previousValue: existing?.value || null,
      totalAnchors: count,
      updated: !!existing,
      sessionId,
    })
  }

  if (existing) {
    return `Anchor updated: [${args.key}] (was: "${existing.value.slice(0, 50)}", now: "${args.value.slice(0, 50)}"). ${count} total anchors.${noSessionWarning}\n→ Use hivemind_anchor list to see all anchors.`
  } else {
    return `Anchor saved: [${args.key}] = "${args.value.slice(0, 50)}". ${count} total anchors.${noSessionWarning}\n→ Use hivemind_anchor list to see all anchors.`
  }
}

async function handleList(
  directory: string,
  jsonOutput: boolean
): Promise<string> {
  const anchorsState = await loadAnchors(directory)

  if (anchorsState.anchors.length === 0) {
    return jsonOutput
      ? toSuccessOutput("No anchors found", undefined, { anchors: [], total: 0 })
      : "No anchors saved. Use hivemind_anchor save to store critical constraints."
  }

  if (jsonOutput) {
    return toSuccessOutput("Anchors listed", undefined, {
      total: anchorsState.anchors.length,
      anchors: anchorsState.anchors.map(a => ({
        key: a.key,
        value: a.value,
        createdAt: new Date(a.created_at).toISOString(),
        sessionId: a.session_id,
      })),
    })
  }

  const lines: string[] = []
  lines.push(`=== ANCHORS (${anchorsState.anchors.length}) ===`)
  lines.push("")

  for (const a of anchorsState.anchors) {
    const date = new Date(a.created_at).toISOString().split("T")[0]
    lines.push(`[${a.key}] (${date})`)
    // Show full value, not truncated
    const valueLines = a.value.split("\n")
    if (valueLines.length === 1) {
      lines.push(`  ${a.value}`)
    } else {
      lines.push(`  ${valueLines[0]}`)
      for (let i = 1; i < valueLines.length && i < 5; i++) {
        lines.push(`  ${valueLines[i]}`)
      }
      if (valueLines.length > 5) {
        lines.push(`  ... (${valueLines.length - 5} more lines)`)
      }
    }
    lines.push("")
  }

  lines.push("=== END ANCHORS ===")
  lines.push("Use hivemind_anchor get to read a specific anchor by key.")
  return lines.join("\n")
}

async function handleGet(
  directory: string,
  args: {
    key?: string
    json?: boolean
  },
  jsonOutput: boolean
): Promise<string> {
  if (!args.key?.trim()) {
    return jsonOutput
      ? toErrorOutput("key is required")
      : "ERROR: key is required. Specify the anchor key to retrieve."
  }

  const anchorsState = await loadAnchors(directory)
  const anchor = anchorsState.anchors.find(a => a.key === args.key)

  if (!anchor) {
    return jsonOutput
      ? toErrorOutput(`Anchor [${args.key}] not found`)
      : `Anchor [${args.key}] not found. Use hivemind_anchor list to see available anchors.`
  }

  if (jsonOutput) {
    return toSuccessOutput("Anchor retrieved", anchor.key, {
      key: anchor.key,
      value: anchor.value,
      createdAt: new Date(anchor.created_at).toISOString(),
      sessionId: anchor.session_id,
    })
  }

  const lines: string[] = []
  const date = new Date(anchor.created_at).toISOString()
  lines.push(`=== ANCHOR: ${anchor.key} ===`)
  lines.push("")
  lines.push(`Created: ${date}`)
  lines.push(`Session: ${anchor.session_id}`)
  lines.push("")
  lines.push("Value:")
  lines.push(anchor.value)
  lines.push("")
  lines.push("=== END ANCHOR ===")
  return lines.join("\n")
}