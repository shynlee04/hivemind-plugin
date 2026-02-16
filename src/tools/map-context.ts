/**
 * Backward-compatible map_context tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-session.ts.
 * 
 * @deprecated Use createHivemindSessionTool with action: "update" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { updateSession } from "../lib/session-engine.js"
import type { HierarchyLevel } from "../lib/session-engine.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import { loadTrajectory, saveTrajectory } from "../lib/graph-io.js"
import { loadTree, saveTree, createNode, addChild, treeExists } from "../lib/hierarchy-tree.js"

/**
 * @deprecated Use createHivemindSessionTool with action: "update" instead.
 * Creates a backward-compatible map_context tool.
 * Maps to hivemind_session action: "update".
 */
export function createMapContextTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Update session context. Use hivemind_session action: update instead.",
    args: {
      level: tool.schema
        .enum(["trajectory", "tactic", "action"])
        .optional()
        .describe("Hierarchy level to update"),
      content: tool.schema
        .string()
        .optional()
        .describe("New focus content"),
      status: tool.schema
        .string()
        .optional()
        .describe("Status override (legacy, ignored)"),
    },
    async execute(args, _context) {
      const result = await updateSession(directory, {
        level: args.level as HierarchyLevel | undefined,
        content: args.content,
      })

      if (!result.success) {
        return toErrorOutput(result.error || "Failed to update session")
      }

      const level = args.level as HierarchyLevel | undefined
      const content = args.content

      // Update hierarchy tree (add nodes for tactic/action)
      if (level && content && treeExists(directory)) {
        const tree = await loadTree(directory)
        
        if (level === "tactic" && tree.root) {
          // Add tactic as child of trajectory
          const tacticNode = createNode("tactic", content, "active")
          const updatedTree = addChild(tree, tree.root.id, tacticNode)
          await saveTree(directory, updatedTree)
        } else if (level === "action" && tree.root) {
          // Find the tactic node (cursor should point to it after tactic was added)
          const cursorId = tree.cursor
          if (cursorId) {
            // Add action as child of current cursor (tactic)
            const actionNode = createNode("action", content, "active")
            const updatedTree = addChild(tree, cursorId, actionNode)
            await saveTree(directory, updatedTree)
          }
        }
      }

      // Sync trajectory to graph (same as hivemind-session.ts)
      if (result.success) {
        const trajectory = await loadTrajectory(directory)
        if (trajectory?.trajectory) {
          const now = new Date().toISOString()
          trajectory.trajectory.updated_at = now
          
          if (level === "trajectory") {
            trajectory.trajectory.intent = args.content || ""
          } else if (level === "tactic") {
            trajectory.trajectory.active_phase_id = null
          } else if (level === "action") {
            trajectory.trajectory.active_task_ids = []
          }
          
          await saveTrajectory(directory, trajectory)
        }
      }

      return toSuccessOutput(
        "Session updated (map_context)",
        undefined,
        result.data
      )
    },
  })
}