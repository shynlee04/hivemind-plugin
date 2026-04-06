import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const STATE_FILE = ".hivemind/state/session-context-prompt.md";

const INITIAL_CONTENT = [
  "---",
  "patch_count: 0",
  "compaction_count: 0",
  "context_budget_pct: 100",
  "status: idle",
  "---",
  "",
  "## What Happened So Far",
  "Session initialized.",
  "",
  "## Identified Risks",
  "None yet.",
  "",
  "## Task List",
  "None yet.",
  "",
  "## Deferred Items",
  "None yet.",
  "",
  "## Clarification Log",
  "None yet.",
  "",
  "## Final Output",
  "Pending.",
  "",
].join("\n");

/**
 * Ensure the prompt-enhance state file and patches directory exist.
 * Idempotent: creates file only if it doesn't exist.
 * @param workspaceRoot - The workspace root directory
 * @returns Object with sessionFilePath and patchesDirPath
 */
function ensurePromptEnhanceState(workspaceRoot: string) {
  const sessionFilePath = join(workspaceRoot, STATE_FILE);
  const patchesDirPath = join(dirname(sessionFilePath), ".patches");

  mkdirSync(dirname(sessionFilePath), { recursive: true });
  mkdirSync(patchesDirPath, { recursive: true });

  if (!existsSync(sessionFilePath)) {
    writeFileSync(sessionFilePath, INITIAL_CONTENT);
  }

  return { sessionFilePath, patchesDirPath };
}

/**
 * Increment compaction_count and update context_budget_pct in the state file.
 * Uses status-based thresholds: 0→100%, 1-2→50%, >2→25%.
 */
function recordCompaction(sessionFilePath: string) {
  const current = readFileSync(sessionFilePath, "utf-8");

  const countMatch = current.match(/^compaction_count:\s*(\d+)/m);
  const currentCount = countMatch ? parseInt(countMatch[1], 10) : 0;
  const nextCount = currentCount + 1;
  const nextBudget = nextCount === 0 ? 100 : nextCount <= 2 ? 50 : 25;

  const updated = current
    .replace(/^compaction_count:\s*\d+/m, `compaction_count: ${nextCount}`)
    .replace(/^context_budget_pct:\s*\d+/m, `context_budget_pct: ${nextBudget}`);

  writeFileSync(sessionFilePath, updated);
  return updated;
}

export const PromptEnhancePlugin: Plugin = async () => {
  return {
    event: async () => {
      ensurePromptEnhanceState(process.cwd());
    },

    "experimental.session.compacting": async (_input, output) => {
      const { sessionFilePath } = ensurePromptEnhanceState(process.cwd());
      const updated = recordCompaction(sessionFilePath);

      const sessionSnapshot =
        updated.length > 4000
          ? `${updated.slice(0, 4000)}\n\n[truncated session snapshot]`
          : updated;

      output.context = Array.isArray(output.context) ? output.context : [];
      output.context.push(
        [
          "## Prompt-Enhance Session Context",
          `Session file: ${sessionFilePath}`,
          "",
          "```md",
          sessionSnapshot,
          "```",
        ].join("\n"),
      );
    },
  };
};
