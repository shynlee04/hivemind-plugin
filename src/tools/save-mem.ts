/**
 * save_mem — Save a memory to the Mems Brain.
 *
 * Agent Thought: "I should remember this for future sessions."
 *
 * Design:
 *   1. Iceberg — 2 required args (shelf, content)
 *   2. Context Inference — session ID from brain state
 *   3. Signal-to-Noise — JSON response with entity_id for FK chaining
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { loadMems, saveMems, addMem, BUILTIN_SHELVES } from "../lib/mems.js";
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js";

export function createSaveMemTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Save a memory to the Mems Brain — decisions, patterns, errors, solutions. " +
      "These persist across sessions and compactions. Use for lessons learned, architecture decisions, error patterns.",
    args: {
      shelf: tool.schema
        .string()
        .describe(
          `Category: ${BUILTIN_SHELVES.join(", ")} (or custom)`
        ),
      content: tool.schema
        .string()
        .describe("The memory content to save"),
      tags: tool.schema
        .string()
        .optional()
        .describe("Comma-separated tags for searchability (e.g., 'auth,jwt,middleware')"),
    },
    async execute(args, _context) {
      if (!args.content?.trim()) return toErrorOutput("content cannot be empty. Describe the decision, pattern, or lesson.");

      const stateManager = createStateManager(directory);
      const state = await stateManager.load();
      const sessionId = state ? state.session.id : "unknown";
      const noSessionWarning = state ? "" : " (⚠ no active session — memory saved but unlinked)";

      const tagList = args.tags
        ? args.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];

      let memsState = await loadMems(directory);

      // Check for duplicate content on same shelf
      const isDuplicate = memsState.mems.some(
        m => m.shelf === args.shelf && m.content === args.content
      );
      if (isDuplicate) {
        return toSuccessOutput(
          `Memory already exists on [${args.shelf}] shelf with identical content.${noSessionWarning}`
        );
      }

      const newMemState = addMem(memsState, args.shelf, args.content, tagList, sessionId);
      const newMem = newMemState.mems[newMemState.mems.length - 1];
      await saveMems(directory, newMemState);

      return toSuccessOutput(
        `Memory saved to [${args.shelf}]. ${newMemState.mems.length} total memories. Tags: ${tagList.length > 0 ? tagList.join(", ") : "(none)"}${noSessionWarning}\n→ Use recall_mems to search, or list_shelves to browse.`,
        newMem.id
      );
    },
  });
}
