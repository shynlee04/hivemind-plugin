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
    },
    async execute(args, _context) {
      // CHIMERA-3: Always return JSON for FK chaining
      switch (args.action) {
        case "save":
          return handleSave(directory, args)
        case "list":
          return handleList(directory)
        case "get":
          return handleGet(directory, args)
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}

// CHIMERA-3: Always return JSON for FK chaining
async function handleSave(
  directory: string,
  args: {
    key?: string
    value?: string
  }
): Promise<string> {
  if (!args.key?.trim()) {
    return toErrorOutput("key cannot be empty")
  }

  if (!args.value?.trim()) {
    return toErrorOutput("value cannot be empty")
  }

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  const sessionId = state ? state.session.id : "unknown"

  let anchorsState = await loadAnchors(directory)

  // Detect existing anchor before upsert
  const existing = anchorsState.anchors.find(a => a.key === args.key)

  anchorsState = addAnchor(anchorsState, args.key, args.value, sessionId)
  await saveAnchors(directory, anchorsState)

  const count = anchorsState.anchors.length

  return toSuccessOutput(existing ? "Anchor updated" : "Anchor saved", args.key, {
    key: args.key,
    value: args.value,
    previousValue: existing?.value || null,
    totalAnchors: count,
    updated: !!existing,
    sessionId,
  })
}

// CHIMERA-3: Always return JSON for FK chaining
async function handleList(
  directory: string
): Promise<string> {
  const anchorsState = await loadAnchors(directory)

  if (anchorsState.anchors.length === 0) {
    return toSuccessOutput("No anchors found", undefined, { anchors: [], total: 0 })
  }

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

// CHIMERA-3: Always return JSON for FK chaining
async function handleGet(
  directory: string,
  args: {
    key?: string
  }
): Promise<string> {
  if (!args.key?.trim()) {
    return toErrorOutput("key is required")
  }

  const anchorsState = await loadAnchors(directory)
  const anchor = anchorsState.anchors.find(a => a.key === args.key)

  if (!anchor) {
    return toErrorOutput(`Anchor [${args.key}] not found`)
  }

  return toSuccessOutput("Anchor retrieved", anchor.key, {
    key: anchor.key,
    value: anchor.value,
    createdAt: new Date(anchor.created_at).toISOString(),
    sessionId: anchor.session_id,
  })
}