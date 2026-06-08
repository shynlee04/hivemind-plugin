import { tool } from "@opencode-ai/plugin/tool"

import { executeDocIntelligenceAction } from "../../features/doc-intelligence/index.js"
import { DocIntelligenceInputSchema } from "../../schema-kernel/doc-intelligence.schema.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/**
 * Create the document intelligence tool with full CRUD, search, indexing,
 * and cross-reference capabilities.
 *
 * @param projectRoot - Trusted project root used to scope every document path.
 * @returns OpenCode tool instance exposing all doc-intelligence actions.
 *
 * @example
 * ```typescript
 * const hivemindDoc = createHivemindDocTool(process.cwd())
 * ```
 */
export function createHivemindDocTool(projectRoot: string): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description: "Document intelligence for hierarchy-aware CRUD, search, indexing, and cross-reference operations.",
    args: {
      action: s.string().describe("Action: skim, skim_directory, read, chunk, search, read_lines, read_offset, create, write, upsert, append, insert, delete, batch, batch_files, metadata, set_metadata, delete_metadata, toc, outline, inspect, xref, index, context"),
      path: s.string().describe("Project-root-relative file or directory path"),
      query: s.string().optional().describe("Search query for search/context actions"),
      maxCharacters: s.number().optional().describe("Maximum characters for read/chunk sizing"),
      maxResults: s.number().optional().describe("Maximum matches for search actions"),
      format: s.string().optional().describe("Format filter for skim_directory (md, json, yaml, xml)"),
      heading: s.string().optional().describe("Heading for targeted section read/write/delete"),
      startLine: s.number().optional().describe("Start line for read_lines action"),
      endLine: s.number().optional().describe("End line for read_lines action"),
      offset: s.number().optional().describe("Character offset for read_offset action"),
      limit: s.number().optional().describe("Character limit for read_offset action"),
      title: s.string().optional().describe("Title for create action"),
      metadata: s.string().optional().describe("JSON metadata string for create/set_metadata actions"),
      initialContent: s.string().optional().describe("Custom initial content for create action"),
      body: s.string().optional().describe("Section body content for write/upsert/insert"),
      content: s.string().optional().describe("Content to append"),
      afterHeading: s.string().optional().describe("Target heading for insert action"),
      newHeading: s.string().optional().describe("New heading for insert action"),
      level: s.number().optional().describe("Heading level (1-6) for upsert/insert"),
      expectedHash: s.string().optional().describe("Expected SHA-256 hash for stale-file detection"),
      mode: s.string().optional().describe("Mode for delete: 'file' to delete entire file"),
      ops: s.string().optional().describe("JSON array of batch section edit operations"),
      files: s.string().optional().describe("JSON array of file operations for batch_files"),
      field: s.string().optional().describe("Metadata field name for delete_metadata action"),
      tokenBudget: s.number().optional().describe("Token budget for context extraction"),
      regex: s.boolean().optional().describe("Enable regex mode for search"),
      headingOnly: s.boolean().optional().describe("Search headings only"),
    },
    async execute(rawArgs: Record<string, unknown>, _context: ToolContext): Promise<string> {
      try {
        const parsedArgs = DocIntelligenceInputSchema.parse(rawArgs)
        const result = await Promise.resolve(executeDocIntelligenceAction(projectRoot, parsedArgs as unknown as { action: string; path: string; [key: string]: unknown }))
        return renderToolResult(success("Doc intelligence action completed", result))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { DocIntelligenceInputSchema }
