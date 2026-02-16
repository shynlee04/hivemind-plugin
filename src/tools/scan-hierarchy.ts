/**
 * scan_hierarchy — Structured read of current session state + optional drift analysis.
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import {
  handleStatus,
  handleAnalyze,
  handleRecommend,
  executeOrchestration,
  type ScanAction,
} from "../lib/brownfield-scan.js"

export function createScanHierarchyTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Session and brownfield scan tool. " +
      "action=status (default) returns hierarchy/metrics state. " +
      "action=analyze detects framework/artifact context. " +
      "action=recommend outputs remediation runbook. " +
      "action=orchestrate persists safe bootstrap intelligence. " +
      "Set include_drift=true for alignment analysis in status mode.",
    args: {
      action: tool.schema
        .enum(["status", "analyze", "recommend", "orchestrate"])
        .optional()
        .describe("status | analyze | recommend | orchestrate (default: status)"),
      include_drift: tool.schema
        .boolean()
        .optional()
        .describe("Status mode only: include drift alignment analysis (default: false)."),
      json: tool.schema
        .boolean()
        .optional()
        .describe("Return output as JSON (default: false)"),
    },
    async execute(args, _context) {
      const action = (args.action ?? "status") as ScanAction
      const jsonOutput = args.json ?? false

      switch (action) {
        case "status":
          return handleStatus(directory, args.include_drift ?? false, jsonOutput)
        case "analyze":
          return handleAnalyze(directory, jsonOutput)
        case "recommend":
          return handleRecommend(directory, jsonOutput)
        case "orchestrate": {
          const result = await executeOrchestration(directory, { json: jsonOutput })
          return result.output
        }
      }
    },
  })
}
