/**
 * Compaction Hook — Preserves hierarchy context across LLM compaction.
 *
 * Reads current brain state hierarchy and injects it into
 * post-compaction context via output.context.push().
 *
 * P3: try/catch — never break compaction
 * Budget-capped ≤500 tokens (~2000 chars)
 */

import type { Logger } from "../lib/logging.js"
import { createStateManager } from "../lib/persistence.js"
import { loadMems } from "../lib/mems.js"

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
      const state = await stateManager.load()
      if (!state) {
        await log.debug("Compaction: no brain state to preserve")
        return
      }

      const lines: string[] = []
      lines.push("=== HiveMind Context (post-compaction) ===")
      lines.push("")

      // Session info
      lines.push(
        `Session: ${state.session.id} | Status: ${state.session.governance_status} | Mode: ${state.session.mode}`
      )
      lines.push("")

      // Hierarchy — the most important context to preserve
      lines.push("## Current Hierarchy")
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

      await log.debug(`Compaction: injected ${context.length} chars`)
    } catch (error) {
      // P3: Never break compaction — this is critical
      await log.error(`Compaction hook error: ${error}`)
    }
  }
}
