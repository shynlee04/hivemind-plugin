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
    description: "Full document intelligence for files (text, markdown, JSON, YAML, XML). PICK CAREFULLY: skim (single FILE only) vs skim_directory (directory listing). write (replaces EXISTING heading) vs upsert (creates if heading missing). create (new file, fails if exists) vs set_metadata (adds frontmatter to existing).",
    args: {
      action: z.enum(["skim","skim_directory","read","chunk","search","read_lines","read_offset","create","write","upsert","append","insert","delete","write_lines","write_offset","insert_lines","insert_offset","delete_lines","delete_offset","batch","batch_files","metadata","set_metadata","delete_metadata","toc","outline","inspect","xref","index","context"]).describe(
        "READ actions — skim (1 file): heading outline of 1 file. skim_directory (1 dir): list all docs in a dir. read/chunk: full content or chunked. search: keyword/regex across files. read_lines/read_offset: byte-precise extraction. toc/outline: heading tree. metadata: frontmatter keys+values. xref: cross-reference link discovery. index: build heading+hash index.\n\nWRITE actions — create: new file (FAILS if exists). write: REPLACE section under EXISTING heading (use upsert if heading missing). upsert: replace section OR auto-create heading if missing. append: add content to end of a section. insert: insert a NEW section after an existing heading. delete: remove section or (mode:'file') entire file. write_lines/write_offset: REPLACE a line range or char range (universal across .md, .json, .yaml, .xml). insert_lines/insert_offset: INSERT lines/chars at a position. delete_lines/delete_offset: REMOVE a line range or char range. set_metadata: set frontmatter keys. delete_metadata: remove a frontmatter key. batch/batch_files: multi-section or multi-file edits at once.\n\nCODE actions — inspect: extract JSDoc/exports/signatures from code files. context: relevance-scored section extraction given a query+token budget."
      ),
      path: z.string().describe("Project-root-relative file path (or directory path for skim_directory). REQUIRED for every action."),

      // Read params
      maxCharacters: z.number().int().positive().optional().describe("[read,chunk] Max characters to return (default 20000)"),
      heading: z.string().optional().describe("[read,write,upsert,append,insert,delete,metadata] Target section heading text (not regex, not slug)"),
      startLine: z.number().int().positive().optional().describe("[read_lines,write_lines,insert_lines,delete_lines] First line number (1-based)"),
      endLine: z.number().int().positive().optional().describe("[read_lines,write_lines,delete_lines] Last line number (1-based, inclusive). Omit to read to end."),
      offset: z.number().int().nonnegative().optional().describe("[read_offset,write_offset,insert_offset,delete_offset] Character position to start reading from (0-based)"),
      limit: z.number().int().positive().optional().describe("[read_offset,write_offset,delete_offset] Number of characters to extract/replace/delete"),
      query: z.string().optional().describe("[search,context] Keyword or regex pattern. For search: finds matches. For context: selects relevant sections."),
      maxResults: z.number().int().positive().optional().describe("[search] Maximum result count (default 50)"),
      regex: z.boolean().optional().describe("[search] Set true to treat query as regex pattern"),
      headingOnly: z.boolean().optional().describe("[search] Set true to search in heading text, skip body"),
      tokenBudget: z.number().int().positive().optional().describe("[context] Target token count for relevance-scoped extraction"),
      format: z.enum(["md","json","yaml","xml"]).optional().describe("[skim_directory] Filter results to one format: md, json, yaml, xml"),

      // Write params
      title: z.string().optional().describe("[create] Document title (used as H1 + filename stem)"),
      metadata: z.string().optional().describe("[create,set_metadata] Frontmatter as JSON string. For create: embedded in template. For set_metadata: replaces all frontmatter."),
      initialContent: z.string().optional().describe("[create] Custom body override (skips template generation)"),
      body: z.string().optional().describe("[write,upsert,insert] Section body text (markdown content)"),
      content: z.string().optional().describe("[append,write_lines,write_offset,insert_lines,insert_offset] Text to write/insert. For write_lines/insert_lines multi-line content uses '\\n' as line separator."),
      afterHeading: z.string().optional().describe("[insert] Existing heading name to insert the NEW section after"),
      newHeading: z.string().optional().describe("[insert] Name of the NEW section heading to create"),
      level: z.number().int().min(1).max(6).optional().describe("[upsert,insert] Heading level for newly created section (default 2)"),
      expectedHash: z.string().optional().describe("[write,upsert,append,insert,write_lines,write_offset,insert_lines,insert_offset,delete_lines,delete_offset,set_metadata,delete_metadata] SHA-256 hash for stale-file detection. Read the file first to get its hash, then pass it here to prevent overwriting concurrent edits."),
      mode: z.enum(["file"]).optional().describe("[delete] Set mode='file' to DELETE the ENTIRE FILE. Omit mode to delete only a section by heading."),
      field: z.string().optional().describe("[delete_metadata] Name of the specific frontmatter field to remove"),

      // Batch params
      ops: z.string().optional().describe("[batch] JSON array of section operations: [{\"op\":\"write|upsert|append|insert|delete\",\"heading\":\"...\",\"body\":\"...\"}]. All operations on ONE file, executed atomically."),
      files: z.string().optional().describe("[batch_files] JSON array of per-file batches: [{\"path\":\"...\",\"ops\":[...]}]. Each file is processed independently (best-effort: one file failure does not block others)."),
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
