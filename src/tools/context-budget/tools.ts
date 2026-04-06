/**
 * Context-budget tool: read session file and calculate context budget %.
 * @module tools/context-budget/tools
 */
import { tool } from "@opencode-ai/plugin/tool"
import { existsSync, readFileSync } from "node:fs"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success } from "../../shared/tool-response.js"
import { ContextBudgetRecordSchema } from "../../schema-kernel/prompt-enhance.schema.js"
import { BUDGET_DECREMENT_PER_COMPACTION } from "../../lib/types.js"
import type { ContextBudgetRecord } from "./types.js"

/**
 * Create the context-budget tool instance.
 * @param _projectRoot - Reserved for future path resolution (unused)
 * @returns Configured OpenCode tool for context budget calculation
 */
export function createContextBudgetTool(
  _projectRoot: string,
): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Calculate context budget percentage from session file metadata (compaction_count)",
    args: {
      sessionFilePath: s
        .string()
        .describe("Absolute path to session-context-prompt.md"),
    },
    async execute(
      args: { sessionFilePath: string },
      _context: { sessionID?: string },
    ): Promise<string> {
      if (!existsSync(args.sessionFilePath)) {
        const record: ContextBudgetRecord = {
          budget_pct: 100,
          compaction_count: 0,
          status: "ok",
        }
        ContextBudgetRecordSchema.parse(record)
        return renderToolResult(success("Budget calculated", record))
      }

      const content = readFileSync(args.sessionFilePath, "utf-8")
      const match = content.match(/^compaction_count:\s*(\d+)/m)
      const compactionCount = match ? parseInt(match[1], 10) : 0

      const budgetPct = Math.max(0, 100 - compactionCount * BUDGET_DECREMENT_PER_COMPACTION)
      const status: "ok" | "warning" | "critical" =
        budgetPct >= 70 ? "ok" : budgetPct >= 40 ? "warning" : "critical"

      const record: ContextBudgetRecord = {
        budget_pct: budgetPct,
        compaction_count: compactionCount,
        status,
      }

      ContextBudgetRecordSchema.parse(record)
      return renderToolResult(success("Budget calculated", record))
    },
  })
}
