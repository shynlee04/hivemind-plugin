import { tool } from "@opencode-ai/plugin/tool"

import { executeDocIntelligenceAction } from "../../features/doc-intelligence/index.js"
import { analyzeCrossReferences } from "../../features/doc-intelligence/xref-ops.js"
import { slugifyHeading } from "../../features/doc-intelligence/parser.js"
import { deleteLines } from "../../features/doc-intelligence/line-offset-ops.js"
import { DocIntelligenceInputSchema } from "../../schema-kernel/doc-intelligence.schema.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

type ToolContext = { sessionID?: string }

/** Type alias for doc-intelligence action payload passed to executeDocIntelligenceAction. */
type DocIntelligenceAction = { action: string; path: string; [key: string]: unknown }
/**
 * Parse raw tool input with action-specific error guidance.
 * Zod's discriminatedUnion errors are aggregated and opaque; this wrapper
 * replaces raw ZodError noise with actionable field-level hints so the
 * agent can self-correct on the next call (outer/inner type-parity fix).
 */
function parseDocIntelligenceInput(rawArgs: Record<string, unknown>): Record<string, unknown> {
  const parsed = DocIntelligenceInputSchema.safeParse(rawArgs)
  if (parsed.success) return parsed.data as Record<string, unknown>

  const action = typeof rawArgs.action === "string" ? rawArgs.action : "<unknown>"
  const issues = parsed.error.issues
  const missingStrings = issues
    .filter((i) => i.code === "invalid_type" && "expected" in i && i.expected === "string")
    .map((i) => i.path.join("."))
  const missingNumbers = issues
    .filter((i) => i.code === "invalid_type" && "expected" in i && i.expected === "number")
    .map((i) => i.path.join("."))
  const missingArrays = issues
    .filter((i) => i.code === "invalid_type" && "expected" in i && i.expected === "array")
    .map((i) => i.path.join("."))
  const hints: string[] = []
  if (missingStrings.length > 0) hints.push("missing string fields: " + missingStrings.join(", "))
  if (missingNumbers.length > 0) hints.push("missing number fields: " + missingNumbers.join(", "))
  if (missingArrays.length > 0) hints.push("missing array fields: " + missingArrays.join(", "))

  const hint = hints.length > 0 ? ". " + hints.join("; ") : ""
  throw new Error(
    "[Hivemind] Invalid doc-intelligence input for action \"" + action + "\"" + hint + ". " +
    "Check the action's required fields in the tool description and retry with all required params."
  )
}


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
      regex: z.boolean().optional().describe("[search] DEPRECATED: use 'mode' instead. Set true to treat query as regex pattern"),
      headingOnly: z.boolean().optional().describe("[search] Set true to search in heading text, skip body"),
      maxTokens: z.number().int().nonnegative().optional().describe("[search,context] Token-budget ceiling for the result envelope; non-positive means no budget. When the accumulated snippet tokens exceed the budget, the result is truncated with truncationReason='token_budget'."),
      tokenBudget: z.number().int().positive().optional().describe("[context] Target token count for relevance-scoped extraction"),
      format: z.enum(["md","json","yaml","xml"]).optional().describe("[skim_directory] Filter results to one format: md, json, yaml, xml"),

      // Write params
      title: z.string().optional().describe("[create] Document title (used as H1 + filename stem)"),
      // Wave 1.5 type-parity fix: outer shape must match inner shape so the
      // agent (which trusts the outer declaration) sends a real object, not
      // a JSON string. The inner DocIntelligenceInputSchema still enforces
      // the specific SectionEditOp / FileOps element shape at execute-entry;
      // the outer only needs to declare "object" / "array" so the agent
      // stops wrapping payloads in JSON.stringify(...).
      metadata: z.record(z.string(), z.unknown()).optional().describe("[create,set_metadata] Frontmatter as a JSON object. For create: embedded in template. For set_metadata: replaces all frontmatter."),
      initialContent: z.string().optional().describe("[create] Custom body override (skips template generation)"),
      body: z.string().optional().describe("[write,upsert,insert] Section body text (markdown content)"),
      content: z.string().optional().describe("[append,write_lines,write_offset,insert_lines,insert_offset] Text to write/insert. For write_lines/insert_lines multi-line content uses '\\n' as line separator."),
      afterHeading: z.string().optional().describe("[insert] Existing heading name to insert the NEW section after"),
      newHeading: z.string().optional().describe("[insert] Name of the NEW section heading to create"),
      level: z.number().int().min(1).max(6).optional().describe("[upsert,insert] Heading level for newly created section (default 2)"),
      expectedHash: z.string().optional().describe("[write,upsert,append,insert,write_lines,write_offset,insert_lines,insert_offset,delete_lines,delete_offset,set_metadata,delete_metadata] SHA-256 hash for stale-file detection. Read the file first to get its hash, then pass it here to prevent overwriting concurrent edits."),
      mode: z.string().optional().describe("[search|delete] Mode discriminator. SEARCH: 'literal' (substring), 'regex' (default; no `g` flag, no stateful bug), or 'fuzzy' (Levenshtein). DELETE: 'section' (requires heading), 'lines' (requires startLine, endLine), 'file' (delete entire file). Omit for default section delete (heading required) or default regex search."),
      field: z.string().optional().describe("[delete_metadata] Name of the specific frontmatter field to remove"),

      // Batch params
      ops: z.array(z.unknown()).optional().describe("[batch] An array of section operation objects: [{\"op\":\"write|upsert|append|insert|delete\",\"heading\":\"...\",\"body\":\"...\"}]. All operations on ONE file, executed atomically."),
      files: z.array(z.unknown()).optional().describe("[batch_files] An array of per-file batch objects: [{\"path\":\"...\",\"ops\":[...]}]. Each file is processed independently (best-effort: one file failure does not block others)."),
    },
    async execute(rawArgs: Record<string, unknown>, _context: ToolContext): Promise<string> {
      try {
        const parsedArgs = parseDocIntelligenceInput(rawArgs)

        // F-19: intercept `mode: "lines"` — the router (don't-modify
        // for Wave 4) does not know about this mode, so we dispatch to
        // `deleteLines` directly here in the wrapper.
        if (parsedArgs.action === "delete" && parsedArgs.mode === "lines") {
          const startLine = Number(parsedArgs.startLine)
          const endLine = Number(parsedArgs.endLine ?? startLine)
          const lineResult = await deleteLines(projectRoot, String(parsedArgs.path), startLine, endLine)
          return renderToolResult(success("Doc intelligence action completed", {
            action: "delete_lines",
            hash: lineResult.hash,
            opId: lineResult.opId,
          }))
        }

        const result = await Promise.resolve(executeDocIntelligenceAction(projectRoot, parsedArgs as DocIntelligenceAction))

        // NF-04: cascade warning for section/file deletes. The router
        // does not know about xref graphs, so the wrapper owns this
        // post-processing. The delete has already succeeded at this
        // point — warnings are informational, not errors.
        if (parsedArgs.action === "delete" && result && typeof result === "object" && "result" in result) {
          const rawResult = result as Record<string, unknown>
          const rawInner = rawResult.result
          if (rawInner && typeof rawInner === "object") {
            const inner = rawInner as Record<string, unknown>
            if (inner.deleted === true && !Array.isArray(inner.warnings)) {
              const deletedHeading = typeof parsedArgs.heading === "string" ? parsedArgs.heading : undefined
              const warnings = computeCascadeWarnings(projectRoot, String(parsedArgs.path), deletedHeading)
              if (warnings.length > 0) {
                inner.warnings = warnings
              }
            }
          }
        }

        return renderToolResult(success("Doc intelligence action completed", result))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

/**
 * NF-04 — compute cascade warnings after a successful section or file
 * delete. Reuses the Wave-3 `analyzeCrossReferences` to find any other
 * document in the project that xrefs the deleted scope, and builds a
 * human-readable warning string per dangling xref.
 *
 * For a section delete (`mode: "section"` or no-mode), the deleted
 * scope is `${path}#${slug-or-text-of-heading}`. For a file delete
 * (`mode: "file"`), the deleted scope is the whole `${path}`.
 *
 * The xref source (`from`) is excluded when it equals the deleted
 * path (the file itself can't have a dangling xref to itself).
 *
 * @param projectRoot - Trusted project root.
 * @param deletedPath - Project-root-relative path of the deleted file.
 * @param deletedHeading - Optional heading text for section deletes.
 * @returns Array of warning strings (empty when no cascade).
 */
function computeCascadeWarnings(
  projectRoot: string,
  deletedPath: string,
  deletedHeading: string | undefined,
): string[] {
  let links: ReturnType<typeof analyzeCrossReferences>
  try {
    links = analyzeCrossReferences(projectRoot, ".")
  } catch {
    return []
  }
  const warnings: string[] = []
  for (const link of links) {
    if (link.from === deletedPath) continue
    const hashIndex = link.to.indexOf("#")
    const linkPath = hashIndex >= 0 ? link.to.slice(0, hashIndex) : link.to
    if (linkPath !== deletedPath) continue

    if (deletedHeading) {
      // Section delete: only warn if the fragment targets the deleted
      // heading (case-insensitive text match or slug match).
      if (hashIndex < 0) continue
      const linkFragment = link.to.slice(hashIndex + 1)
      if (!linkFragment) continue
      const matchesText = linkFragment.toLowerCase() === deletedHeading.toLowerCase()
      const matchesSlug = linkFragment === slugifyHeading(deletedHeading)
      if (!matchesText && !matchesSlug) continue
      warnings.push(
        `${link.from}:${link.line} — xref to deleted section '#${linkFragment}' will be dangling`,
      )
    } else {
      // File delete: any xref whose path matches is a cascade candidate.
      const linkFragment = hashIndex >= 0 ? link.to.slice(hashIndex + 1) : ""
      const suffix = linkFragment ? `#${linkFragment}` : ""
      warnings.push(
        `${link.from}:${link.line} — xref to deleted file '${deletedPath}${suffix}' will be dangling`,
      )
    }
  }
  return warnings
}

export { DocIntelligenceInputSchema }
