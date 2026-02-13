/**
 * recall_mems — Search or list the Mems Brain.
 *
 * Agent Thought: "Have I seen this problem/pattern before?" or "What's in my memory?"
 *
 * Design:
 *   1. Iceberg — 0-2 args (query optional → list mode)
 *   2. Context Inference — reads mems.json, optional shelf filter
 *   3. Signal-to-Noise — structured search results or shelf overview
 *
 * Absorbs list_shelves: when query is omitted, returns shelf summary.
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { loadMems, searchMems, getShelfSummary, BUILTIN_SHELVES } from "../lib/mems.js";

const MAX_RESULTS = 5;

export function createRecallMemsTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Search or list the Mems Brain. " +
      "With a query: returns matching decisions, patterns, errors, and solutions. " +
      "Without a query: shows shelf counts and recent entries (overview mode). " +
      "Use when you encounter a familiar problem, need past context, or want to see what memories exist.",
    args: {
      query: tool.schema
        .string()
        .optional()
        .describe("Search keyword (matches content and tags, case-insensitive). Omit to list all shelves."),
      shelf: tool.schema
        .string()
        .optional()
        .describe("Optional: filter results to a specific shelf (e.g., 'errors', 'decisions')"),
      json: tool.schema
        .boolean()
        .optional()
        .describe("Return output as JSON (default: false)"),
    },
    async execute(args, _context) {
      const memsState = await loadMems(directory);

      if (memsState.mems.length === 0) {
        return "Mems Brain is empty. Use save_mem to store decisions, patterns, errors, or solutions.";
      }

      // List mode: no query provided → show shelf summary (was list_shelves)
      if (!args.query) {
        const summary = getShelfSummary(memsState);
        const lines: string[] = [];
        lines.push("=== MEMS BRAIN ===");
        lines.push("");
        lines.push(`Total memories: ${memsState.mems.length}`);
        lines.push("");

        lines.push("## Shelves");
        for (const shelf of BUILTIN_SHELVES) {
          const count = summary[shelf] || 0;
          lines.push(`  ${shelf}: ${count}`);
        }
        for (const [shelf, count] of Object.entries(summary)) {
          if (!(BUILTIN_SHELVES as readonly string[]).includes(shelf)) {
            lines.push(`  ${shelf}: ${count} (custom)`);
          }
        }
        lines.push("");

        const recent = [...memsState.mems]
          .sort((a, b) => b.created_at - a.created_at)
          .slice(0, 3);

        lines.push("## Recent Memories");
        for (const m of recent) {
          const date = new Date(m.created_at).toISOString().split("T")[0];
          const preview = m.content.length > 60
            ? m.content.slice(0, 57) + "..."
            : m.content;
          lines.push(`  [${m.shelf}] ${date}: ${preview}`);
        }
        lines.push("");
        lines.push("Use recall_mems with a query to search memories by keyword.");
        lines.push("=== END MEMS BRAIN ===");

        if (args.json) {
          const data = {
            total: memsState.mems.length,
            shelves: summary,
            recent: recent.map(m => ({ shelf: m.shelf, content: m.content, created_at: m.created_at })),
          }
          return JSON.stringify(data, null, 2)
        }
        return lines.join("\n");
      }

      // Search mode: query provided
      const results = searchMems(memsState, args.query, args.shelf);

      if (results.length === 0) {
        const filterNote = args.shelf ? ` in shelf "${args.shelf}"` : "";
        return `No memories found for "${args.query}"${filterNote}. Try a broader search or different keywords.`;
      }

      const shown = results.slice(0, MAX_RESULTS);
      const lines: string[] = [];
      lines.push(`=== RECALL: ${results.length} memories found for "${args.query}" ===`);
      lines.push("");

      for (const m of shown) {
        const date = new Date(m.created_at).toISOString().split("T")[0];
        lines.push(`[${m.shelf}] ${m.id} (${date})`);
        lines.push(`  ${m.content}`);
        if (m.tags.length > 0) {
          lines.push(`  Tags: ${m.tags.join(", ")}`);
        }
        lines.push("");
      }

      if (results.length > MAX_RESULTS) {
        lines.push(`... and ${results.length - MAX_RESULTS} more. Narrow your search or filter by shelf.`);
      }

      lines.push("=== END RECALL ===");

      if (args.json) {
        const data = {
          query: args.query,
          total: results.length,
          results: shown.map(m => ({ id: m.id, shelf: m.shelf, content: m.content, tags: m.tags, created_at: m.created_at })),
        }
        return JSON.stringify(data, null, 2)
      }
      return lines.join("\n");
    },
  });
}
