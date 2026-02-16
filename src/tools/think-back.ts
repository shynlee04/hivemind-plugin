/**
 * Backward-compatible think_back tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-inspect.ts.
 * 
 * @deprecated Use createHivemindInspectTool with action: "deep" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { deepInspect } from "../lib/inspect-engine.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

/**
 * @deprecated Use createHivemindInspectTool with action: "deep" instead.
 * Creates a backward-compatible think_back tool.
 * Maps to hivemind_inspect action: "deep".
 */
export function createThinkBackTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Deep session introspection. Use hivemind_inspect action: deep instead.",
    args: {},
    async execute(_args, _context) {
      try {
        const result = await deepInspect(directory, "active")
        return toSuccessOutput(
          "Deep introspection completed (think_back)",
          result.sessionId,
          result as unknown as Record<string, unknown>
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return toErrorOutput(msg)
      }
    },
  })
}