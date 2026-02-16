/**
 * Backward-compatible save_mem tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-memory.ts.
 * 
 * @deprecated Use createHivemindMemoryTool with action: "save" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { addGraphMem, loadGraphMems } from "../lib/graph-io.js"
import type { MemNode } from "../schemas/graph-nodes.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

/**
 * @deprecated Use createHivemindMemoryTool with action: "save" instead.
 * Creates a backward-compatible save_mem tool.
 * Maps to hivemind_memory action: "save".
 */
export function createSaveMemTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Save a memory. Use hivemind_memory action: save instead.",
    args: {
      content: tool.schema
        .string()
        .describe("Memory content"),
      shelf: tool.schema
        .string()
        .optional()
        .describe("Memory shelf (category)"),
      tags: tool.schema
        .string()
        .optional()
        .describe("Comma-separated tags"),
      linked_task_id: tool.schema
        .string()
        .optional()
        .describe("Linked task ID for FK chaining"),
    },
    async execute(args, _context) {
      try {
        const now = new Date().toISOString()
        const mem: MemNode = {
          id: crypto.randomUUID(),
          content: args.content,
          shelf: args.shelf || "general",
          type: "insight",
          created_at: now,
          updated_at: now,
          relevance_score: 1.0,
          staleness_stamp: now,
          origin_task_id: args.linked_task_id || null,
        }
        await addGraphMem(directory, mem)
        const state = await loadGraphMems(directory)
        return toSuccessOutput(
          `Memory saved to ${args.shelf || "general"}`,
          mem.id,
          { count: state.mems.length } as unknown as Record<string, unknown>
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return toErrorOutput(msg)
      }
    },
  })
}