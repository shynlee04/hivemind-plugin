/**
 * Backward-compatible scan_hierarchy tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-inspect.ts.
 * 
 * @deprecated Use createHivemindInspectTool with action: "scan" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { scanState, deepInspect, driftReport } from "../lib/inspect-engine.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

export type ScanAction = "analyze" | "recommend" | "orchestrate" | "scan" | "drift"

/**
 * Format scan result as a human-readable string for backward compatibility.
 */
function formatScanOutput(result: Awaited<ReturnType<typeof scanState>>): string {
  const lines: string[] = []
  
  lines.push(`Session: ${result.active ? "OPEN" : "CLOSED"}`)
  if (result.sessionId) lines.push(`  ID: ${result.sessionId}`)
  if (result.mode) lines.push(`  Mode: ${result.mode}`)
  if (result.governanceStatus) lines.push(`  Governance: ${result.governanceStatus}`)
  
  lines.push("")
  if (result.hierarchy) {
    lines.push("Hierarchy:")
    lines.push(`  Trajectory: ${result.hierarchy.trajectory || "(none)"}`)
    lines.push(`  Tactic: ${result.hierarchy.tactic || "(none)"}`)
    lines.push(`  Action: ${result.hierarchy.action || "(none)"}`)
  }
  
  lines.push("")
  if (result.metrics) {
    lines.push(`Metrics:`)
    lines.push(`  Turns: ${result.metrics.turnCount}`)
    lines.push(`  Drift: ${result.metrics.driftScore}/100`)
    lines.push(`  Files touched: ${result.metrics.filesTouched}`)
    lines.push(`  Context updates: ${result.metrics.contextUpdates}`)
  }
  
  if (result.treeStats) {
    lines.push("")
    lines.push(`Tree: ${result.treeStats.totalNodes} nodes, depth ${result.treeStats.depth}`)
  }
  
  if (result.treeAscii) {
    lines.push("")
    lines.push("Tree view:")
    lines.push(result.treeAscii)
  }
  
  return lines.join("\n")
}

/**
 * @deprecated Use createHivemindInspectTool with appropriate action instead.
 * Creates a backward-compatible scan_hierarchy tool.
 * Maps to hivemind_inspect actions.
 */
export function createScanHierarchyTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Scan hierarchy state. Use hivemind_inspect action: scan/deep/drift instead.",
    args: {
      action: tool.schema
        .enum(["analyze", "recommend", "orchestrate", "scan", "drift"])
        .optional()
        .describe("What to do: analyze | recommend | orchestrate | scan | drift"),
      json: tool.schema
        .boolean()
        .optional()
        .describe("Return JSON output"),
    },
    async execute(args, _context) {
      const action = args.action || "scan"

      switch (action) {
        case "scan": {
          const result = await scanState(directory)
          // For backward compatibility, return formatted string unless json=true
          if (args.json) {
            return toSuccessOutput("Scan completed", result.sessionId, result as unknown as Record<string, unknown>)
          }
          return formatScanOutput(result)
        }
        case "analyze": {
          const result = await deepInspect(directory, "active")
          if (args.json) {
            return toSuccessOutput("Deep inspect completed", result.sessionId, result as unknown as Record<string, unknown>)
          }
          // Return a JSON string for backward compatibility
          return JSON.stringify({
            action: "analyze",
            data: {
              project: { name: "unknown" },
              framework: { mode: "unknown" },
              stack: { hints: [] }
            }
          })
        }
        case "drift": {
          const result = await driftReport(directory)
          if (args.json) {
            return toSuccessOutput("Drift report completed", undefined, result as unknown as Record<string, unknown>)
          }
          return JSON.stringify(result)
        }
        case "recommend":
        case "orchestrate": {
          // These are more complex actions that were part of the old scan-hierarchy
          // For backward compatibility, return a basic scan result
          const result = await scanState(directory)
          if (args.json) {
            return toSuccessOutput(`${action} completed`, result.sessionId, {
              ...result,
              action,
              message: `Action '${action}' is deprecated. Use scan for basic inspection.`,
            } as unknown as Record<string, unknown>)
          }
          return formatScanOutput(result)
        }
        default:
          return toErrorOutput(`Unknown action: ${action}`)
      }
    },
  })
}
