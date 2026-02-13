/**
 * list_shelves — Show Mems Brain shelf summary.
 *
 * Agent Thought: "What's in my long-term memory?"
 *
 * Design:
 *   1. Iceberg — 0 required args
 *   2. Context Inference — reads mems.json
 *   3. Signal-to-Noise — structured shelf overview
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { loadMems, getShelfSummary, BUILTIN_SHELVES } from "../lib/mems.js";
import { CliFormatter } from "../lib/cli-formatter.js";

export function createListShelvesTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Show what's stored in the Mems Brain — shelf counts and recent entries. " +
      "Use this to check what long-term memories exist before searching.",
    args: {},
    async execute(_args, _context) {
      const memsState = await loadMems(directory);

      if (memsState.mems.length === 0) {
        return "Mems Brain is empty. Use save_mem to store decisions, patterns, errors, or solutions.";
      }

      const summary = getShelfSummary(memsState);
      const fmt = new CliFormatter();
      fmt.header("MEMS BRAIN");
      fmt.line(`Total memories: ${memsState.mems.length}`).line();

      // Show all shelves with counts
      fmt.section("Shelves");
      for (const shelf of BUILTIN_SHELVES) {
        const count = summary[shelf] || 0;
        fmt.line(`${shelf}: ${count}`, 1);
      }
      // Show custom shelves
      for (const [shelf, count] of Object.entries(summary)) {
        if (!(BUILTIN_SHELVES as readonly string[]).includes(shelf)) {
          fmt.line(`${shelf}: ${count} (custom)`, 1);
        }
      }
      fmt.line();

      // Show 3 most recent mems
      const recent = [...memsState.mems]
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 3);

      fmt.section("Recent Memories");
      for (const m of recent) {
        const date = new Date(m.created_at).toISOString().split("T")[0];
        const preview = m.content.length > 60
          ? m.content.slice(0, 57) + "..."
          : m.content;
        fmt.line(`[${m.shelf}] ${date}: ${preview}`, 1);
      }
      fmt.line();
      fmt.line("Use recall_mems to search memories by keyword.");
      fmt.footer("END MEMS BRAIN");

      return fmt.toString();
    },
  });
}
