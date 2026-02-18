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
 * Budget-capped ≤3000 tokens (~12000 chars)
 *
 * FLAW-TOAST-003 FIX: Removed info toast - compaction is transparent operation.
 */

import type { Logger } from "../lib/logging.js"
import { createStateManager } from "../lib/persistence.js"
import { loadMems } from "../lib/mems.js"
import { loadAnchors } from "../lib/anchors.js"
import { loadTasks } from "../lib/manifest.js"
import { queueStateMutation, flushMutations } from "../lib/state-mutation-queue.js"
import {
  loadTree,
  toAsciiTree,
  getCursorNode,
  getAncestors,
  treeExists,
} from "../lib/hierarchy-tree.js"
import { HIVE_MASTER_GOVERNANCE_INSTRUCTION, GOVERNANCE_MARKER } from "../lib/governance-instruction.js"

const INJECTION_BUDGET_CHARS = 12000

/**
 * Inject governance instruction into compaction context (deduplicated)
 */
function injectGovernanceToCompaction(output: { context: string[] }): void {
  const alreadyInjected = output.context.some(s => s.includes(GOVERNANCE_MARKER))
  if (!alreadyInjected) {
    output.context.push(HIVE_MASTER_GOVERNANCE_INSTRUCTION)
  }
}

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
      // Inject governance instruction to persist across compactions
      injectGovernanceToCompaction(output)

      let state = await stateManager.load()
      if (!state) {
        await log.debug("Compaction: no brain state to preserve")
        return
      }

      // Check for purification report from last compact_session
      if (state.next_compaction_report) {
        output.context.push(state.next_compaction_report);
        await log.debug(`Compaction: injected purification report (${state.next_compaction_report.length} chars)`);
        // CQRS: Queue mutation instead of direct save
        queueStateMutation({
          type: "UPDATE_STATE",
          payload: { next_compaction_report: null },
          source: "compaction-hook"
        });
        await log.debug("Compaction: queued mutation to clear consumed purification report")
        const appliedMutations = await flushMutations(stateManager)
        await log.debug(`Compaction: applied ${appliedMutations} queued mutation(s) after report injection`)
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
            // Truncate tree for compaction budget if extremely large, but prefer strict hierarchy
            const treeLines = treeView.split('\n');
            if (treeLines.length > 20) {
               lines.push(...treeLines.slice(0, 20));
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

      // Structural Anchors
      const anchorsState = await loadAnchors(directory)
      if (anchorsState.anchors.length > 0) {
        lines.push("## Anchors")
        for (const anchor of anchorsState.anchors) {
           lines.push(`- [${anchor.key}]: ${anchor.value}`)
        }
        lines.push("")
      }

      // Active Tasks (TODOs)
      const taskManifest = await loadTasks(directory)
      if (taskManifest && Array.isArray(taskManifest.tasks) && taskManifest.tasks.length > 0) {
        const pending = taskManifest.tasks.filter(t => t.status !== "completed" && t.status !== "cancelled")
        if (pending.length > 0) {
          lines.push("## Active Tasks (Pending)")
          for (const t of pending.slice(0, 5)) {
            lines.push(`- ${t.title} (${t.id})`)
          }
          if (pending.length > 5) lines.push(`... and ${pending.length - 5} more`)
          lines.push("")
        }
      }

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

      // FLAW-TOAST-003 FIX: Removed toast emission
      // Compaction is a transparent operation - no user notification needed
      // Context is preserved and available via think_back if needed

      await log.debug(`Compaction: injected ${context.length} chars`)
    } catch (error) {
      // P3: Never break compaction — this is critical
      await log.error(`Compaction hook error: ${error}`)
    }
  }
}
