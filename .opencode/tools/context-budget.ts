// @ts-nocheck — plugin types expect Zod v3 shapes; we have Zod v4 installed
import { z } from "zod";
import { existsSync, readFileSync } from "fs";
import { safeTool } from "./safe-tool.ts";

export const contextBudget = safeTool({
  description: "Calculate context budget percentage from session file metadata (compaction_count)",
  args: {
    sessionFilePath: z.string().describe("Absolute path to session-context-prompt.md"),
  },
  execute: async ({ sessionFilePath }) => {
    if (!existsSync(sessionFilePath)) {
      return {
        budget_pct: 100,
        compaction_count: 0,
        status: "ok",
        error: "Session file not found — assuming fresh session",
      };
    }

    const content = readFileSync(sessionFilePath, "utf-8");
    // Extract compaction_count from YAML frontmatter
    const match = content.match(/^compaction_count:\s*(\d+)/m);
    const compactionCount = match ? parseInt(match[1], 10) : 0;

    // Budget calculation: each compaction costs ~15% context
    const budgetPct = Math.max(0, 100 - compactionCount * 15);
    const status = budgetPct >= 70 ? "ok" : budgetPct >= 40 ? "warning" : "critical";

    return {
      budget_pct: budgetPct,
      compaction_count: compactionCount,
      status,
    };
  },
});
