/**
 * think_back — Context refresh. Summarizes current state to help refocus.
 * Agent Thought: "I'm lost, help me refocus."
 *
 * Hierarchy Redesign: renders tree with cursor ancestry + timestamp gaps.
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadAnchors, getAnchorsForContext } from "../lib/anchors.js";
import { loadMems } from "../lib/mems.js";
import { readActiveMd } from "../lib/planning-fs.js";
import { detectChainBreaks } from "../lib/chain-analysis.js";
import {
  loadTree,
  toAsciiTree,
  getAncestors,
  getCursorNode,
  detectGaps,
  treeExists,
} from "../lib/hierarchy-tree.js";

export function createThinkBackTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Pause and refocus. Shows your current trajectory, anchors, " +
      "what you've accomplished, and any issues. Use when you feel lost or stuck.",
    args: {
      json: tool.schema
        .boolean()
        .optional()
        .describe("Return output as JSON (default: false)"),
    },
    async execute(args, _context) {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      if (!state) {
        return "ERROR: No active session. Call declare_intent to start.";
      }
      const anchorsState = await loadAnchors(directory);
      const scopedAnchors = getAnchorsForContext(anchorsState, state.session.id);
      const memsState = await loadMems(directory);
      const sessionMems = memsState.mems.filter((m) => m.session_id === state.session.id);
      const recentCycleMems = sessionMems
        .filter((m) => m.shelf === "cycle-intel")
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 3);
      const activeMd = await readActiveMd(directory);
      const chainBreaks = detectChainBreaks(state);

      const lines: string[] = [];
      lines.push("=== THINK BACK: Context Refresh ===");
      lines.push("");
      
      lines.push("## Where You Are");
      lines.push(`Mode: ${state.session.mode}`);

      // Hierarchy: prefer tree view if available
      if (treeExists(directory)) {
        const tree = await loadTree(directory);
        lines.push("");
        lines.push("Hierarchy Tree:");
        lines.push(toAsciiTree(tree));

        // Show cursor ancestry (the path to where we are)
        const cursorNode = getCursorNode(tree);
        if (cursorNode && tree.root) {
          const ancestors = getAncestors(tree.root, cursorNode.id);
          if (ancestors.length > 1) {
            lines.push("");
            lines.push("Cursor path:");
            for (const node of ancestors) {
              lines.push(`  ${node.level}: ${node.content} (${node.stamp})`);
            }
          }
        }

        // Show timestamp gaps (staleness)
        const gaps = detectGaps(tree);
        const staleGaps = gaps.filter(g => g.severity === "stale");
        if (staleGaps.length > 0) {
          lines.push("");
          lines.push("⚠ Stale gaps detected:");
          for (const gap of staleGaps.slice(0, 3)) {
            const hours = Math.round(gap.gapMs / (60 * 60 * 1000) * 10) / 10;
            lines.push(`  ${gap.from} → ${gap.to}: ${hours}hr (${gap.relationship})`);
          }
        }
      } else {
        // Flat hierarchy fallback
        if (state.hierarchy.trajectory) lines.push(`Trajectory: ${state.hierarchy.trajectory}`);
        if (state.hierarchy.tactic) lines.push(`Tactic: ${state.hierarchy.tactic}`);
        if (state.hierarchy.action) lines.push(`Action: ${state.hierarchy.action}`);
      }
      lines.push("");

      lines.push("## Session Health");
      lines.push(`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100`);
      lines.push(`Files touched: ${state.metrics.files_touched.length}`);
      lines.push(`Context updates: ${state.metrics.context_updates}`);
      lines.push(`Session mems: ${sessionMems.length}/${memsState.mems.length} (session/global)`);
      if (chainBreaks.length > 0) {
        lines.push("⚠ Chain breaks:");
        chainBreaks.forEach(b => lines.push(`  - ${b.message}`));
      }
      lines.push("");

      if (scopedAnchors.length > 0) {
        lines.push("## Immutable Anchors");
        const anchorsToShow = scopedAnchors.slice(0, 5);
        for (const a of anchorsToShow) {
          lines.push(`  [${a.key}]: ${a.value}`);
        }
        if (scopedAnchors.length > 5) {
          lines.push(`  ... and ${scopedAnchors.length - 5} more anchors`);
        }
        lines.push("");
      }

      if (recentCycleMems.length > 0) {
        lines.push("## Recent Cycle Exports (This Session)");
        for (const m of recentCycleMems) {
          const date = new Date(m.created_at).toISOString();
          const preview = m.content.length > 100 ? `${m.content.slice(0, 97)}...` : m.content;
          lines.push(`  - ${date}: ${preview}`);
        }
        lines.push("");
      }

      if (state.metrics.files_touched.length > 0) {
        lines.push("## Files Touched");
        const maxShow = 10;
        state.metrics.files_touched.slice(0, maxShow).forEach(f => lines.push(`  - ${f}`));
        if (state.metrics.files_touched.length > maxShow) {
          lines.push(`  ... and ${state.metrics.files_touched.length - maxShow} more`);
        }
        lines.push("");
      }

      if (activeMd.body.includes("## Plan")) {
        const planStart = activeMd.body.indexOf("## Plan");
        const planEnd = activeMd.body.indexOf("\n## ", planStart + 1);
        const planSection = planEnd > -1 
          ? activeMd.body.substring(planStart, planEnd)
          : activeMd.body.substring(planStart);
        const planContent = planSection.trim();
        const planLines = planContent.split('\n');
        if (planLines.length > 10) {
          lines.push(...planLines.slice(0, 10));
          lines.push(`  ... (${planLines.length - 10} more lines)`);
        } else {
          lines.push(...planLines);
        }
        lines.push("");
      }

      lines.push("=== END THINK BACK ===");

      if (args.json) {
        const data: Record<string, unknown> = {
          session: { id: state.session.id, mode: state.session.mode },
          hierarchy: { trajectory: state.hierarchy.trajectory, tactic: state.hierarchy.tactic, action: state.hierarchy.action },
          metrics: { turns: state.metrics.turn_count, drift_score: state.metrics.drift_score, files_touched: state.metrics.files_touched, context_updates: state.metrics.context_updates },
          anchors: scopedAnchors.map(a => ({ key: a.key, value: a.value })),
          mems: { session: sessionMems.length, total: memsState.mems.length },
          chain_breaks: chainBreaks.map(b => b.message),
        }
        return JSON.stringify(data, null, 2)
      }

      let result = lines.join("\n") + "\n→ Use map_context to update your focus, or compact_session to archive and reset.";
      if (result.length > 2000) {
        result = result.slice(0, 1970) + '\n... (output truncated)';
      }
      return result;
    },
  });
}
