import { tool } from "@opencode-ai/plugin/tool"

import { executeDocIntelligenceAction } from "../../features/doc-intelligence/index.js"
import { DocIntelligenceInputSchema, type DocIntelligenceSchemaInput } from "../../schema-kernel/doc-intelligence.schema.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/**
 * Create the read-only document intelligence tool.
 *
 * @param projectRoot - Trusted project root used to scope every document path.
 * @returns OpenCode tool instance exposing skim, skim_directory, read, chunk, and search actions.
 *
 * @example
 * ```typescript
 * const hivemindDoc = createHivemindDocTool(process.cwd())
 * ```
 */
export function createHivemindDocTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Read-only document intelligence for Markdown skim, directory skim, read, chunk, and search actions.",
    args: {
      action: s.string().describe("Action: skim, skim_directory, read, chunk, or search"),
      path: s.string().describe("Project-root-relative Markdown file or directory path"),
      query: s.string().optional().describe("Search query for the search action"),
      maxCharacters: s.number().optional().describe("Maximum characters for read/chunk sizing"),
      maxResults: s.number().optional().describe("Maximum matches for search actions"),
    },
    async execute(rawArgs: DocIntelligenceSchemaInput, _context: ToolContext): Promise<string> {
      try {
        const args = DocIntelligenceInputSchema.parse(rawArgs)
        return renderToolResult(success("Doc intelligence action completed", executeDocIntelligenceAction(projectRoot, args)))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { DocIntelligenceInputSchema }
