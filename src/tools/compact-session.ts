/**
 * compact_session — Archive completed work and reset for next session.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import {
  executeCompaction,
  identifyTurningPoints as identifyTurningPointsFromLib,
  generateNextCompactionReport as generateNextCompactionReportFromLib,
  type TurningPoint,
} from "../lib/compaction-engine.js"
import type { HierarchyTree } from "../lib/hierarchy-tree.js"
import type { BrainState, MetricsState } from "../schemas/brain-state.js"

export type { TurningPoint }

export function identifyTurningPoints(tree: HierarchyTree, metrics: MetricsState): TurningPoint[] {
  return identifyTurningPointsFromLib(tree, metrics)
}

// Backward-compatible wrapper for tests expecting report text
export function generateNextCompactionReport(
  tree: HierarchyTree,
  turningPoints: TurningPoint[],
  state: BrainState,
): string {
  return generateNextCompactionReportFromLib(tree, turningPoints, state).text
}

export function createCompactSessionTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Archive completed work and reset for next session. " +
      "Call this when you're done with your current work.",
    args: {
      summary: tool.schema
        .string()
        .optional()
        .describe("Optional 1-line summary of what was accomplished"),
    },
    async execute(args) {
      const result = await executeCompaction({
        directory,
        summary: args.summary,
      })
      return JSON.stringify(result, null, 2)
    },
  })
}
