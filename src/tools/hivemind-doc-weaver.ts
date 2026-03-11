/**
 * Legacy `hivemind_doc_weaver` compatibility wrapper.
 *
 * The canonical document authority is now `hivemind_doc`.
 * This wrapper remains only to isolate older callers while routing them
 * through the newer `doc-intel` write path.
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { writeSection } from "../lib/doc-intel.js"
import { toErrorOutput, toSuccessOutput } from "../lib/tool-response.js"

/**
 * Create the legacy `hivemind_doc_weaver` compatibility tool.
 *
 * @param directory - Project root used for path resolution.
 * @returns OpenCode tool definition for legacy callers.
 */
export function createHivemindDocWeaverTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Compatibility-only wrapper for legacy hivemind_doc_weaver callers. " +
      "Routes section patch requests through the canonical hivemind_doc write path.",
    args: {
      file_path: tool.schema.string().describe("Workspace-relative markdown file path"),
      heading: tool.schema.string().describe("Exact heading text to patch"),
      new_content: tool.schema.string().describe("Replacement section body content"),
    },
    async execute(args, _context) {
      const filePath = args.file_path.trim()
      const heading = args.heading.trim()

      if (!filePath) {
        return toErrorOutput("file_path is required", "Provide a non-empty file_path")
      }
      if (!heading) {
        return toErrorOutput("heading is required", "Provide a non-empty heading")
      }

      try {
        const result = await writeSection(directory, filePath, heading, args.new_content)

        if ("status" in result) {
          return toErrorOutput(
            `Legacy doc weaving requires chunked handling for ${filePath}`,
            "Use hivemind_doc skim/read/write section-by-section for large documents",
          )
        }

        if (!result.changed) {
          return toErrorOutput(
            `No section changes applied for heading '${heading}' in ${filePath}`,
            "Confirm the heading exists and is an exact text match, or use hivemind_doc.skim first",
          )
        }

        return toSuccessOutput(`Patched heading '${heading}' in ${filePath}`, undefined, {
          filePath,
          heading,
          bytesChanged: result.bytesChanged,
          compatibility_only: true,
          canonical_tool: "hivemind_doc",
        })
      } catch (err) {
        return toErrorOutput(
          `Doc weaving failed: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
  })
}
