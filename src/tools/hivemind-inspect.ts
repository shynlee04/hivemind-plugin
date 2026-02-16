/**
 * hivemind_inspect — Unified inspection tool for session state and drift analysis.
 *
 * Merged from: scan_hierarchy, think_back, check_drift
 * Actions: scan (quick snapshot), deep (full context refresh), drift (alignment check)
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
} from "../lib/inspect-engine.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

export function createHivemindInspectTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Inspect your session state and alignment. " +
      "Actions: scan (quick snapshot), deep (full context refresh), drift (alignment check). " +
      "Always returns JSON for FK chaining.",
    args: {
      action: tool.schema
        .enum(["scan", "deep", "drift"])
        .describe("What to do: scan | deep | drift"),
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
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}
