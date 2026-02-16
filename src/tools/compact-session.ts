/**
 * Backward-compatible compact_session tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-session.ts.
 * 
 * @deprecated Use createHivemindSessionTool with action: "close" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { closeSession } from "../lib/session-engine.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import { loadTrajectory, saveTrajectory } from "../lib/graph-io.js"

/**
 * @deprecated Use createHivemindSessionTool with action: "close" instead.
 * Creates a backward-compatible compact_session tool.
 * Maps to hivemind_session action: "close".
 */
export function createCompactSessionTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Compact and archive session. Use hivemind_session action: close instead.",
    args: {
      summary: tool.schema
        .string()
        .optional()
        .describe("Session summary for archive"),
    },
    async execute(args, _context) {
      const result = await closeSession(directory, args.summary)

      if (!result.success) {
        return toErrorOutput(result.error || "Failed to close session")
      }

      // Sync trajectory to graph (same as hivemind-session.ts)
      if (result.data.sessionId) {
        let trajectory = await loadTrajectory(directory)
        const now = new Date().toISOString()

        if (trajectory?.trajectory) {
          trajectory.trajectory.active_phase_id = null
          trajectory.trajectory.active_task_ids = []
          trajectory.trajectory.updated_at = now
          await saveTrajectory(directory, trajectory)
        }
      }

      return toSuccessOutput(
        "Session compacted (compact_session)",
        result.data.sessionId as string | undefined,
        result.data
      )
    },
  })
}
