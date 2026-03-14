/**
 * hivemind_inspect — Unified inspection tool for session state and drift analysis.
 *
 * Merged from: scan_hierarchy, think_back, check_drift
 * Actions: scan (quick snapshot), deep (full context refresh), drift (alignment check),
 * introspect (schema population/staleness), traverse (tree navigation)
 *
 * Design:
 *   1. Iceberg — minimal args, system handles state reads
 *   2. Context Inference — reads from brain.json, hierarchy.json, anchors.json
 *   3. Signal-to-Noise — structured output with actionable guidance
 *   4. CHIMERA-3 — Always returns JSON for FK chaining
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import {
  scanState,
  deepInspect,
  driftReport,
  introspectState,
  traverseState,
} from "../lib/inspect-engine.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

export function createHivemindInspectTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Inspect your session state and alignment. " +
      "Actions: scan (quick snapshot), deep (full context refresh), drift (alignment check), introspect (schema population/staleness), traverse (hierarchy navigation). " +
      "Always returns JSON for FK chaining.",
    args: {
      action: tool.schema
        .enum(["scan", "deep", "drift", "introspect", "traverse"])
        .describe("What to do: scan | deep | drift | introspect | traverse"),
      node_id: tool.schema
        .string()
        .optional()
        .describe("For traverse: optional hierarchy node ID to focus on"),
      direction: tool.schema
        .enum(["up", "down", "siblings"])
        .optional()
        .describe("For traverse: traversal direction (default: down)"),
      depth: tool.schema
        .number()
        .optional()
        .describe("For traverse: descendant depth limit, clamped to 0-3"),
    },
    async execute(args, _context) {
      // CHIMERA-3: Always return JSON for FK chaining
      switch (args.action) {
        case "scan": {
          const result = await scanState(directory)
          return toSuccessOutput("Scan completed", result.sessionId, result as unknown as Record<string, unknown>)
        }
        case "deep": {
          const result = await deepInspect(directory, "active")
          return toSuccessOutput("Deep inspect completed", result.sessionId, result as unknown as Record<string, unknown>)
        }
        case "drift": {
          const result = await driftReport(directory)
          // DriftReport doesn't have sessionId, pass entity_id if available
          return toSuccessOutput("Drift report completed", result.active ? undefined : undefined, result as unknown as Record<string, unknown>)
        }
        case "introspect": {
          const result = await introspectState(directory)
          return toSuccessOutput("Schema introspection completed", result.sessionId, result as unknown as Record<string, unknown>)
        }
        case "traverse": {
          const result = await traverseState(directory, {
            nodeId: args.node_id,
            direction: args.direction,
            depth: args.depth,
          })
          return toSuccessOutput("Hierarchy traversal completed", result.sessionId, result as unknown as Record<string, unknown>)
        }
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}
