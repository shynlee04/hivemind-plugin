/**
 * Backward-compatible recall_mems tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-memory.ts.
 * 
 * @deprecated Use createHivemindMemoryTool with action: "recall" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { loadGraphMems } from "../lib/graph-io.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

/**
 * @deprecated Use createHivemindMemoryTool with action: "recall" instead.
 * Creates a backward-compatible recall_mems tool.
 * Maps to hivemind_memory action: "recall".
 */
export function createRecallMemsTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Recall memories. Use hivemind_memory action: recall instead.",
    args: {
      query: tool.schema
        .string()
        .optional()
        .describe("Search query (omit to list all)"),
      shelf: tool.schema
        .string()
        .optional()
        .describe("Filter by shelf"),
      limit: tool.schema
        .number()
        .optional()
        .describe("Max results"),
    },
    async execute(args, _context) {
      try {
        const state = await loadGraphMems(directory)
        let results = state.mems
        
        // Filter by shelf
        if (args.shelf) {
          results = results.filter(m => m.shelf === args.shelf)
        }
        
        // Search by query
        if (args.query) {
          const q = args.query.toLowerCase()
          results = results.filter(m => 
            m.content.toLowerCase().includes(q) ||
            m.shelf.toLowerCase().includes(q)
          )
        }
        
        // Sort by relevance
        results.sort((a, b) => b.relevance_score - a.relevance_score)
        
        // Limit
        if (args.limit) {
          results = results.slice(0, args.limit)
        }
        
        return toSuccessOutput(
          args.query 
            ? `Found ${results.length} memories matching "${args.query}"`
            : `Listed ${results.length} memories`,
          undefined,
          { count: results.length, mems: results } as unknown as Record<string, unknown>
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return toErrorOutput(msg)
      }
    },
  })
}