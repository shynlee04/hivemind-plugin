/**
 * Backward-compatible save_anchor tool wrapper.
 * 
 * This file provides legacy API compatibility for tests and existing code.
 * The canonical implementation is now in hivemind-anchor.ts.
 * 
 * @deprecated Use createHivemindAnchorTool with action: "save" instead.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { addAnchor, loadAnchors, saveAnchors } from "../lib/anchors.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import { createStateManager } from "../lib/persistence.js"

/**
 * @deprecated Use createHivemindAnchorTool with action: "save" instead.
 * Creates a backward-compatible save_anchor tool.
 * Maps to hivemind_anchor action: "save".
 */
export function createSaveAnchorTool(directory: string): ToolDefinition {
  return tool({
    description:
      "[DEPRECATED] Save an anchor. Use hivemind_anchor action: save instead.",
    args: {
      key: tool.schema
        .string()
        .describe("Anchor key name"),
      value: tool.schema
        .string()
        .describe("Anchor value"),
    },
    async execute(args, _context) {
      try {
        const stateManager = createStateManager(directory)
        const state = await stateManager.load()
        const sessionId = state?.session?.id || "unknown"
        
        let anchorsState = await loadAnchors(directory)
        anchorsState = addAnchor(anchorsState, args.key, args.value, sessionId)
        await saveAnchors(directory, anchorsState)
        
        return toSuccessOutput(
          `Anchor saved: ${args.key}`,
          undefined,
          { count: anchorsState.anchors.length, anchors: anchorsState.anchors } as unknown as Record<string, unknown>
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return toErrorOutput(msg)
      }
    },
  })
}