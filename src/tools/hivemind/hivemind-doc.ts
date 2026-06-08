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
  const z = tool.schema

  return tool({
    description: "Document intelligence for hierarchy-aware CRUD, search, indexing, and cross-reference operations.",
    args: {
      action: z.enum(["skim","skim_directory","read","chunk","search","read_lines","read_offset","create","write","upsert","append","insert","delete","batch","batch_files","metadata","set_metadata","delete_metadata","toc","outline","inspect","xref","index","context"]).describe(
        "Operation to perform. Read: skim, skim_directory, read, chunk, search, read_lines, read_offset, toc, outline, metadata, xref, index. Write: create, write, upsert, append, insert, delete, batch, batch_files, set_metadata, delete_metadata. Code: inspect, context."
      ),
      path: z.string().describe("Project-root-relative file or directory path"),

      // Read params
      maxCharacters: z.number().int().positive().optional().describe("[read,chunk] Max characters"),
      heading: z.string().optional().describe("[read,write,upsert,append,insert,delete,metadata] Target heading"),
      startLine: z.number().int().positive().optional().describe("[read_lines] Start line (1-based)"),
      endLine: z.number().int().positive().optional().describe("[read_lines] End line (1-based)"),
      offset: z.number().int().nonnegative().optional().describe("[read_offset] Char offset"),
      limit: z.number().int().positive().optional().describe("[read_offset] Char count"),
      query: z.string().optional().describe("[search,context] Search query"),
      maxResults: z.number().int().positive().optional().describe("[search] Max results"),
      regex: z.boolean().optional().describe("[search] Enable regex"),
      headingOnly: z.boolean().optional().describe("[search] Headings only"),
      tokenBudget: z.number().int().positive().optional().describe("[context] Token budget"),
      format: z.enum(["md","json","yaml","xml"]).optional().describe("[skim_directory] Format filter"),

      // Write params
      title: z.string().optional().describe("[create] Document title"),
      metadata: z.string().optional().describe("[create,set_metadata] Frontmatter as JSON"),
      initialContent: z.string().optional().describe("[create] Custom body content"),
      body: z.string().optional().describe("[write,upsert,insert] Section body"),
      content: z.string().optional().describe("[append] Content to append"),
      afterHeading: z.string().optional().describe("[insert] Insert after heading"),
      newHeading: z.string().optional().describe("[insert] New heading name"),
      level: z.number().int().min(1).max(6).optional().describe("[upsert,insert] Heading level"),
      expectedHash: z.string().optional().describe("[write,upsert,append,insert,set_metadata,delete_metadata] SHA-256 for stale detection"),
      mode: z.enum(["file"]).optional().describe("[delete] 'file' to delete entire file"),
      field: z.string().optional().describe("[delete_metadata] Field to remove"),

      // Batch params
      ops: z.string().optional().describe("[batch] JSON array of section ops"),
      files: z.string().optional().describe("[batch_files] JSON array of file ops"),
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
