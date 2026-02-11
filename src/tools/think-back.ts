/**
 * think_back — Context refresh. Summarizes current state to help refocus.
 * Agent Thought: "I'm lost, help me refocus."
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadAnchors } from "../lib/anchors.js";
import { readActiveMd } from "../lib/planning-fs.js";
import { detectChainBreaks } from "../lib/chain-analysis.js";

export function createThinkBackTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Pause and refocus. Shows your current trajectory, anchors, " +
      "what you've accomplished, and any issues. Use when you feel lost or stuck.",
    args: {},
    async execute(_args, _context) {
      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      if (!state) {
        return "ERROR: No active session. Call declare_intent to start.";
      }
      const anchorsState = await loadAnchors(directory);
      const activeMd = await readActiveMd(directory);
      const chainBreaks = detectChainBreaks(state);

      const lines: string[] = [];
      lines.push("=== THINK BACK: Context Refresh ===");
      lines.push("");
      
      lines.push("## Where You Are");
      lines.push(`Mode: ${state.session.mode}`);
      if (state.hierarchy.trajectory) lines.push(`Trajectory: ${state.hierarchy.trajectory}`);
      if (state.hierarchy.tactic) lines.push(`Tactic: ${state.hierarchy.tactic}`);
      if (state.hierarchy.action) lines.push(`Action: ${state.hierarchy.action}`);
      lines.push("");

      lines.push("## Session Health");
      lines.push(`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100`);
      lines.push(`Files touched: ${state.metrics.files_touched.length}`);
      lines.push(`Context updates: ${state.metrics.context_updates}`);
      if (chainBreaks.length > 0) {
        lines.push("⚠ Chain breaks:");
        chainBreaks.forEach(b => lines.push(`  - ${b.message}`));
      }
      lines.push("");

      if (anchorsState.anchors.length > 0) {
        lines.push("## Immutable Anchors");
        const anchorsToShow = anchorsState.anchors.slice(0, 5);
        for (const a of anchorsToShow) {
          lines.push(`  [${a.key}]: ${a.value}`);
        }
        if (anchorsState.anchors.length > 5) {
          lines.push(`  ... and ${anchorsState.anchors.length - 5} more anchors`);
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
      let result = lines.join("\n") + "\n→ Use map_context to update your focus, or compact_session to archive and reset.";
      if (result.length > 2000) {
        result = result.slice(0, 1970) + '\n... (output truncated)';
      }
      return result;
    },
  });
}
