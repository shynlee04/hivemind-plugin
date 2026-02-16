/**
 * Backward-compatible export_cycle tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-cycle.ts.
 * 
 * @deprecated Use createHivemindCycleTool with action: "export" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { exportSession } from "../lib/session-export.js"
import { createStateManager } from "../lib/persistence.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

/**
 * @deprecated Use createHivemindCycleTool with action: "export" instead.
 * Creates a backward-compatible export_cycle tool.
 * Maps to hivemind_cycle action: "export".
 */
export function createExportCycleTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Export session cycle. Use hivemind_cycle action: export instead.",
    args: {
      outcome: tool.schema
        .enum(["success", "partial", "failure"])
        .optional()
        .describe("Export outcome"),
      findings: tool.schema
        .string()
        .optional()
        .describe("Key findings to capture"),
    },
    async execute(args, _context) {
      try {
        const stateManager = createStateManager(directory)
        const state = await stateManager.load()
        
        if (!state) {
          return toErrorOutput("No active session to export")
        }
        
        const exportPath = await exportSession(directory, state.session.id)
        
        return toSuccessOutput(
          `Session exported with outcome: ${args.outcome || "success"}`,
          state.session.id,
          { 
            exportPath,
            outcome: args.outcome || "success",
            findings: args.findings || "",
          } as unknown as Record<string, unknown>
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return toErrorOutput(msg)
      }
    },
  })
}