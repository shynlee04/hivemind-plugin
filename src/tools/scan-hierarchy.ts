/**
 * scan_hierarchy — Structured read of current session state.
 * Agent Thought: "What am I working on right now?"
 *
 * Hierarchy Redesign: renders ASCII tree from hierarchy.json instead of flat strings.
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadAnchors } from "../lib/anchors.js";
import { loadMems, getShelfSummary } from "../lib/mems.js";
import {
  loadTree,
  toAsciiTree,
  getTreeStats,
  treeExists,
} from "../lib/hierarchy-tree.js";

export function createScanHierarchyTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Quick snapshot of your current session — hierarchy, metrics, anchors, and memories. " +
      "For a deeper refocus with plan review and chain analysis, use think_back instead.",
    args: {},
    async execute(_args, _context) {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      if (!state) {
        return "ERROR: No active session. Call declare_intent to start.";
      }

      const lines: string[] = []
      lines.push(`📊 Session: ${state.session.governance_status} | Mode: ${state.session.mode}`)
      lines.push(`   ID: ${state.session.id}`)
      lines.push(``)

      // Hierarchy: prefer tree if available, fall back to flat strings
      if (treeExists(directory)) {
        const tree = await loadTree(directory);
        const stats = getTreeStats(tree);
        lines.push(`Hierarchy Tree (${stats.totalNodes} nodes, depth ${stats.depth}):`)
        lines.push(toAsciiTree(tree))
        if (stats.completedNodes > 0) {
          lines.push(`  Completed: ${stats.completedNodes} | Active: ${stats.activeNodes} | Pending: ${stats.pendingNodes}`)
        }
      } else {
        lines.push(`Hierarchy:`)
        lines.push(`  Trajectory: ${state.hierarchy.trajectory || '(not set)'}`)
        lines.push(`  Tactic: ${state.hierarchy.tactic || '(not set)'}`)
        lines.push(`  Action: ${state.hierarchy.action || '(not set)'}`)
      }
      lines.push(``)

      lines.push(`Metrics:`)
      lines.push(`  Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100`)
      lines.push(`  Files: ${state.metrics.files_touched.length} | Context updates: ${state.metrics.context_updates}`)

      // Anchors
      const anchorsState = await loadAnchors(directory)
      if (anchorsState.anchors.length > 0) {
        lines.push(``)
        lines.push(`Anchors (${anchorsState.anchors.length}):`)
        for (const a of anchorsState.anchors.slice(0, 5)) {
          lines.push(`  [${a.key}]: ${a.value.slice(0, 60)}`)
        }
        if (anchorsState.anchors.length > 5) {
          lines.push(`  ... and ${anchorsState.anchors.length - 5} more`)
        }
      }

      // Mems
      const memsState = await loadMems(directory)
      if (memsState.mems.length > 0) {
        const summary = getShelfSummary(memsState)
        const shelfInfo = Object.entries(summary).map(([k, v]) => `${k}(${v})`).join(', ')
        lines.push(``)
        lines.push(`Memories: ${memsState.mems.length} [${shelfInfo}]`)
      }

      return lines.join('\n') + '\n→ Use check_drift for alignment analysis, or think_back for a full context refresh.'
    },
  });
}
