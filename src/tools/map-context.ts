/**
 * map_context — Update focus in the 3-level hierarchy.
 *
 * Agent Thought: "I need to update what I'm focused on"
 *
 * Design: Agent-Native lifecycle verb.
 *   1. Iceberg — 2 args, system handles hierarchy state + file sync
 *   2. Context Inference — reads current hierarchy from brain state
 *   3. Signal-to-Noise — 1-line output with visual beacon
 *   4. No-Shadowing — description matches agent intent
 *   5. Native Parallelism — can update different levels independently
 *
 * Hierarchy Redesign Changes:
 *   - Creates child node in hierarchy tree under correct parent
 *   - Moves cursor to new node
 *   - Appends log entry to per-session file (append-only)
 *   - Updates hierarchy section from tree rendering
 *   - Projects tree cursor back into flat brain.json (backward compat)
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
import {
  resetTurnCount,
  updateHierarchy,
  clearPendingFailureAck,
} from "../schemas/brain-state.js"
import type { HierarchyLevel, ContextStatus } from "../schemas/hierarchy.js"
import {
  generateIndexMd,
  readSessionFile,
  writeSessionFile,
  readManifest,
  appendToSessionLog,
  updateSessionHierarchy,
} from "../lib/planning-fs.js"
import {
  loadTree,
  saveTree,
  createNode,
  addChild,
  markComplete,
  getCursorNode,
  getAncestors,
  toActiveMdBody,
  toBrainProjection,
} from "../lib/hierarchy-tree.js"

const VALID_LEVELS: HierarchyLevel[] = ["trajectory", "tactic", "action"]
const VALID_STATUSES: ContextStatus[] = ["pending", "active", "complete", "blocked"]

/** Map hierarchy level to the parent level that should contain it */
const PARENT_LEVEL: Record<HierarchyLevel, HierarchyLevel | null> = {
  trajectory: null,     // root — no parent
  tactic: "trajectory", // tactic lives under trajectory
  action: "tactic",     // action lives under tactic
}

export function createMapContextTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Update your current focus in the 3-level hierarchy. " +
      "Call this when changing what you're working on.",
    args: {
      level: tool.schema
        .enum(VALID_LEVELS)
        .describe("Which level to update: trajectory | tactic | action"),
      content: tool.schema
        .string()
        .describe("The new focus (1-2 sentences)"),
      status: tool.schema
        .enum(VALID_STATUSES)
        .optional()
        .describe("Status of this context item (default: active)"),
    },
    async execute(args, _context) {
      if (!args.content?.trim()) return "ERROR: content cannot be empty. Describe your current focus."

      const stateManager = createStateManager(directory)
      const status = args.status ?? "active"

      // Load brain state
      let state = await stateManager.load()
      if (!state) {
        return "ERROR: No active session. Call declare_intent first."
      }

      // === Hierarchy Tree: Add node or mark complete ===
      let tree = await loadTree(directory)

      if (tree.root) {
        if (status === "complete") {
          // If marking complete, find existing node by content match and mark it
          const cursorNode = getCursorNode(tree)
          if (cursorNode && cursorNode.content === args.content) {
            tree = markComplete(tree, cursorNode.id)
          } else {
            // Create new completed node
            const now = new Date()
            const node = createNode(args.level, args.content, "complete", now)

            // Find parent: walk cursor ancestry to find correct parent level
            const parentLevel = PARENT_LEVEL[args.level]
            if (parentLevel && tree.root) {
              const parentId = findParentId(tree, parentLevel)
              if (parentId) {
                tree = addChild(tree, parentId, node)
                tree = markComplete(tree, node.id, now.getTime())
              } else {
                return `ERROR: Cannot set ${args.level} without an active ${parentLevel}. Please set ${parentLevel} first.`
              }
            }
          }
        } else {
          // Create new active node under correct parent
          const now = new Date()
          const node = createNode(args.level, args.content, status, now)

          if (args.level === "trajectory") {
            // Update the root node's content directly
            if (tree.root) {
              tree = {
                ...tree,
                root: { ...tree.root, content: args.content, status },
              }
            }
          } else {
            const parentLevel = PARENT_LEVEL[args.level]
            if (parentLevel) {
              const parentId = findParentId(tree, parentLevel)
              if (parentId) {
                tree = addChild(tree, parentId, node)
              } else {
                return `ERROR: Cannot set ${args.level} without an active ${parentLevel}. Please set ${parentLevel} first.`
              }
            }
          }
        }

        // Save updated tree
        await saveTree(directory, tree)

        // Project tree into flat brain.json (backward compat)
        const projection = toBrainProjection(tree)
        state = updateHierarchy(state, projection)
      } else {
        // No tree — use flat update (legacy path)
        state = updateHierarchy(state, { [args.level]: args.content })
      }

      // Reset turn count on context update (re-engagement signal)
      state = resetTurnCount(state)

      // Clear pending_failure_ack when agent acknowledges with blocked status
      if (status === "blocked" && state.pending_failure_ack) {
        state = clearPendingFailureAck(state)
      }

      // Save state
      await stateManager.save(state)

      // === Per-session file: Append log entry + update hierarchy section ===
      const manifest = await readManifest(directory)
      if (manifest.active_stamp) {
        // Append log entry (chronological, append-only)
        const timestamp = new Date().toISOString()
        const logEntry = `- [${timestamp}] [${args.level}] ${args.content} → ${status}`
        await appendToSessionLog(directory, manifest.active_stamp, logEntry)

        // Update hierarchy section (regenerated from tree)
        if (tree.root) {
          const hierarchyBody = toActiveMdBody(tree)
          await updateSessionHierarchy(directory, manifest.active_stamp, hierarchyBody)
        }

        const sessionMd = await readSessionFile(directory, manifest.active_stamp)
        sessionMd.frontmatter = {
          ...sessionMd.frontmatter,
          trajectory: state.hierarchy.trajectory || "",
          tactic: state.hierarchy.tactic || "",
          action: state.hierarchy.action || "",
          status,
          last_activity: new Date().toISOString(),
          turns: state.metrics.turn_count,
          drift: state.metrics.drift_score,
          last_updated: Date.now(),
        }
        await writeSessionFile(directory, manifest.active_stamp, sessionMd)
      }

      await generateIndexMd(directory)

      return `[${args.level}] "${args.content}" → ${status}\n→ Continue working, or use check_drift to verify alignment.`
    },
  })
}

/**
 * Find the ID of the most recent node at a given level.
 * Walks cursor ancestry first, falls back to last child at that level.
 */
function findParentId(
  tree: { root: import("../lib/hierarchy-tree.js").HierarchyNode | null; cursor: string | null },
  level: HierarchyLevel
): string | null {
  if (!tree.root || !tree.cursor) {
    // No cursor — use root if looking for trajectory
    return level === "trajectory" ? tree.root?.id ?? null : null
  }

  // Walk cursor ancestry to find a node at the target level
  const ancestors = getAncestors(tree.root, tree.cursor)
  for (const node of ancestors) {
    if (node.level === level) return node.id
  }

  // Fallback: if cursor is at or above the target level, use root for trajectory
  if (level === "trajectory") return tree.root.id

  // If no parent found at target level, try using the cursor itself
  // (e.g., cursor is a tactic and we're adding an action)
  const cursorNode = getCursorNode(tree as any)
  if (cursorNode && cursorNode.level === level) return cursorNode.id

  return null
}
