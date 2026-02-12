/**
 * Compaction Hook — Preserves hierarchy context across LLM compaction.
 *
 * Reads current brain state + hierarchy tree and injects into
 * post-compaction context via output.context.push().
 *
 * Hierarchy Redesign Changes:
 *   - Reads hierarchy.json tree for cursor ancestry injection
 *   - Includes ASCII tree excerpt (budget-capped)
 *   - If brain.next_compaction_report exists, uses output.prompt to replace
 *     the compaction prompt with curated instructions (purification loop)
 *   - If not, falls back to generic context injection with alert
 *
 * P3: try/catch — never break compaction
 * Budget-capped ≤500 tokens (~2000 chars)
 */

import type { Logger } from "../lib/logging.js"
import { createStateManager } from "../lib/persistence.js"
import { loadMems } from "../lib/mems.js"
import {
  loadTree,
  toAsciiTree,
  getCursorNode,
  getAncestors,
  treeExists,
} from "../lib/hierarchy-tree.js"
import { emitGovernanceToast } from "./soft-governance.js"

/** Budget in characters (~500 tokens at ~4 chars/token) */
const INJECTION_BUDGET_CHARS = 2000

/**
 * Creates the compaction hook.
 *
 * Hook factory pattern: captured logger + directory.
 */
export function createCompactionHook(log: Logger, directory: string) {
  const stateManager = createStateManager(directory)

  return async (
    _input: { sessionID: string },
    output: { context: string[] }
  ): Promise<void> => {
    try {
      let state = await stateManager.load()
      if (!state) {
        await log.debug("Compaction: no brain state to preserve")
        return
      }

      // Check for purification report from last compact_session
      if (state.next_compaction_report) {
        output.context.push(state.next_compaction_report);
        await log.debug(`Compaction: injected purification report (${state.next_compaction_report.length} chars)`);
        state = { ...state, next_compaction_report: null }
        await stateManager.save(state)
        await log.debug("Compaction: cleared consumed purification report")
        // Don't return — still add standard context too, but purification report comes first
      }

      const lines: string[] = []
      lines.push("=== HiveMind Context (post-compaction) ===")
      lines.push("")

      // Session info
      lines.push(
        `Session: ${state.session.id} | Status: ${state.session.governance_status} | Mode: ${state.session.mode}`
      )
      lines.push("")

      // Hierarchy — prefer tree view if available
      lines.push("## Current Hierarchy")
      if (treeExists(directory)) {
        try {
          const tree = await loadTree(directory);
          if (tree.root) {
            const treeView = toAsciiTree(tree);
            // Truncate tree for compaction budget
            const treeLines = treeView.split('\n');
            if (treeLines.length > 6) {
              lines.push(...treeLines.slice(0, 6));
              lines.push("  ... (truncated for compaction)");
            } else {
              lines.push(treeView);
            }

            // Show cursor ancestry (the path to current work)
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
          } else {
            lines.push("No hierarchy declared.");
          }
        } catch {
          // Fall back to flat hierarchy if tree read fails
          if (state.hierarchy.trajectory) lines.push(`Trajectory: ${state.hierarchy.trajectory}`);
          if (state.hierarchy.tactic) lines.push(`Tactic: ${state.hierarchy.tactic}`);
          if (state.hierarchy.action) lines.push(`Action: ${state.hierarchy.action}`);
        }
      } else {
        // Flat hierarchy fallback
        if (state.hierarchy.trajectory) {
          lines.push(`Trajectory: ${state.hierarchy.trajectory}`)
        }
        if (state.hierarchy.tactic) {
          lines.push(`Tactic: ${state.hierarchy.tactic}`)
        }
        if (state.hierarchy.action) {
          lines.push(`Action: ${state.hierarchy.action}`)
        }
        if (
          !state.hierarchy.trajectory &&
          !state.hierarchy.tactic &&
          !state.hierarchy.action
        ) {
          lines.push("No hierarchy set. Use map_context to set focus.")
        }
      }
      lines.push("")

      // Metrics
      lines.push(
        `Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`
      )

      if (state.metrics.files_touched.length > 0) {
        const maxFiles = 10
        const shown = state.metrics.files_touched.slice(0, maxFiles)
        lines.push(`Files: ${shown.join(", ")}`)
        if (state.metrics.files_touched.length > maxFiles) {
          lines.push(
            `  ... and ${state.metrics.files_touched.length - maxFiles} more`
          )
        }
      }

      // Mems Brain summary
      const memsState = await loadMems(directory)
      if (memsState.mems.length > 0) {
        lines.push(`Mems Brain: ${memsState.mems.length} memories stored. Use recall_mems to search.`)
      }

      lines.push("")
      lines.push("=== End HiveMind Context ===")

      // Budget enforcement
      let context = lines.join("\n")
      if (context.length > INJECTION_BUDGET_CHARS) {
        context =
          context.slice(0, INJECTION_BUDGET_CHARS - 30) +
          "\n=== End HiveMind Context ==="
        await log.warn(
          `Compaction injection truncated: ${lines.join("\n").length} → ${context.length} chars`
        )
      }

      output.context.push(context)

      await emitGovernanceToast(log, {
        key: "compaction:info",
        message: "Compaction context injected. Continue from the preserved hierarchy path.",
        variant: "info",
      })

      await log.debug(`Compaction: injected ${context.length} chars`)
    } catch (error) {
      // P3: Never break compaction — this is critical
      await log.error(`Compaction hook error: ${error}`)
    }
  }
}
