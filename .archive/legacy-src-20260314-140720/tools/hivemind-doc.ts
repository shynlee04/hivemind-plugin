/**
 * hivemind_doc — Unified document intelligence tool (V2).
 *
 * A multi-action tool for hierarchy-aware, chunk-based, and search-first
 * document reading, writing, editing, and searching. Replaces ad-hoc document
 * operations with a structured agentic approach.
 *
 * V2 Actions (20 total):
 *   skim         — outline/hierarchy of one file or directory
 *   read         — read full file, a section, or chunked
 *   read_lines   — read a specific line range from any file
 *   metadata     — extract YAML frontmatter
 *   list         — list document files with summary metadata
 *   search       — search across documents by keyword or regex
 *   inspect      — extract JSDoc blocks, comments, exports from code files
 *   index        — build comprehensive document index for a directory
 *   xref         — find cross-document links and check integrity
 *   context      — smart context extraction by query + token budget
 *   write        — replace a section body under a heading
 *   upsert       — replace or create a section (write-or-create)
 *   append       — append to a section body
 *   insert       — insert a new section after a heading
 *   delete       — delete a section by heading
 *   batch        — multiple section operations on one file atomically
 *   batch_files  — operations across multiple files
 *   set_metadata — set/update YAML frontmatter fields
 *   create       — create a new document with frontmatter template
 *   toc          — generate a markdown table of contents
 *
 * Philosophy:
 *   1. Read before write — always skim the outline first
 *   2. Chunk discipline — files >400 LOC are never written in one shot
 *   3. Hierarchy-first — navigate by headings, not line numbers
 *   4. Context-on-demand — pull only the section that matters
 *   5. File-type safety — only .md, .xml, .json, .yaml may be written
 *   6. Swarm-safe — advisory locks, atomic writes, content hashing
 *
 * Supersedes: hivemind_doc_weaver
 *
 * @module hivemind-doc
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import {
  skimDocument,
  skimDirectory,
  readSection,
  readChunked,
  readMetadata,
  readLines,
  generateTOC,
  writeSection,
  upsertSection,
  appendSection,
  insertSection,
  deleteSection,
  writeMetadata,
  createDocument,
  searchDocuments,
  listDocuments,
  inspectCode,
  batchEdit,
  batchFiles,
  xrefDocuments,
  indexDocuments,
  contextExtract,
  type WriteResult,
} from "../lib/doc-intel.js"

/**
 * Create the `hivemind_doc` tool definition.
 *
 * @param directory - Project root directory for path resolution.
 * @returns OpenCode tool definition for document intelligence.
 */
export function createHivemindDocTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Unified document intelligence tool (V2) — 20 actions for hierarchy-aware reading, writing, editing, " +
      "searching, code inspection, cross-document analysis, smart context extraction, and batch operations. " +
      "All writes are swarm-safe (advisory locks, atomic writes, content hashing). " +
      "Write operations restricted to .md, .xml, .json, .yaml files. Files >400 LOC require section-by-section writes.",
    args: {
      action: tool.schema
        .enum([
          "skim", "read", "read_lines", "metadata", "list", "search",
          "inspect", "index", "xref", "context",
          "write", "upsert", "append", "insert", "delete",
          "batch", "batch_files",
          "set_metadata", "create", "toc",
        ])
        .describe("What to do"),
      path: tool.schema
        .string()
        .describe("Workspace-relative file or directory path"),
      heading: tool.schema
        .string()
        .optional()
        .describe("Target heading text (for read/write/upsert/append/delete)"),
      content: tool.schema
        .string()
        .optional()
        .describe("Content body (for write/upsert/append/insert/create)"),
      after_heading: tool.schema
        .string()
        .optional()
        .describe("Heading after which to insert (for insert action)"),
      new_heading: tool.schema
        .string()
        .optional()
        .describe("New heading text (for insert action)"),
      level: tool.schema
        .number()
        .optional()
        .describe("Heading level 1-6 (for insert/upsert action, default: 2)"),
      max_tokens: tool.schema
        .number()
        .optional()
        .describe("Token budget per chunk (for read action, default: 2000)"),
      query: tool.schema
        .string()
        .optional()
        .describe("Search query (for search/context action)"),
      regex: tool.schema
        .boolean()
        .optional()
        .describe("Treat query as regex (for search action)"),
      heading_only: tool.schema
        .boolean()
        .optional()
        .describe("Search only heading lines (for search action)"),
      glob: tool.schema
        .string()
        .optional()
        .describe("File extension filter, e.g. '.md' (for skim/list/search/xref/index/context on directories)"),
      sort: tool.schema
        .enum(["name", "date", "size"])
        .optional()
        .describe("Sort order (for list action)"),
      key: tool.schema
        .string()
        .optional()
        .describe("Frontmatter key (for set_metadata action)"),
      value: tool.schema
        .string()
        .optional()
        .describe("Frontmatter value (for set_metadata action)"),
      title: tool.schema
        .string()
        .optional()
        .describe("Document title (for create action)"),
      template_metadata: tool.schema
        .string()
        .optional()
        .describe("JSON string of key/value pairs for frontmatter (for create action)"),
      start_line: tool.schema
        .number()
        .optional()
        .describe("Start line number, 1-indexed (for read_lines action)"),
      end_line: tool.schema
        .number()
        .optional()
        .describe("End line number, 1-indexed (for read_lines action)"),
      operations: tool.schema
        .string()
        .optional()
        .describe("JSON array of operations (for batch/batch_files actions). " +
          "batch: [{heading, op, body?, level?}]. " +
          "batch_files: [{path, ops: [{heading, op, body?, level?}]}]"),
      expected_hash: tool.schema
        .string()
        .optional()
        .describe("Expected content hash for stale-file detection on writes (optional)"),
      token_budget: tool.schema
        .number()
        .optional()
        .describe("Max total tokens to return (for context action, default: 4000)"),
      allow_governance: tool.schema
        .boolean()
        .optional()
        .describe("Allow writes to governance-owned paths for privileged callers (default: false)"),
    },
    async execute(args, _context) {
      try {
        switch (args.action) {
          case "skim":
            return await handleSkim(directory, args)
          case "read":
            return await handleRead(directory, args)
          case "read_lines":
            return await handleReadLines(directory, args)
          case "metadata":
            return await handleMetadata(directory, args)
          case "list":
            return await handleList(directory, args)
          case "search":
            return await handleSearch(directory, args)
          case "inspect":
            return await handleInspect(directory, args)
          case "index":
            return await handleIndex(directory, args)
          case "xref":
            return await handleXref(directory, args)
          case "context":
            return await handleContext(directory, args)
          case "write":
            return await handleWrite(directory, args)
          case "upsert":
            return await handleUpsert(directory, args)
          case "append":
            return await handleAppend(directory, args)
          case "insert":
            return await handleInsert(directory, args)
          case "delete":
            return await handleDelete(directory, args)
          case "batch":
            return await handleBatch(directory, args)
          case "batch_files":
            return await handleBatchFiles(directory, args)
          case "set_metadata":
            return await handleSetMetadata(directory, args)
          case "create":
            return await handleCreate(directory, args)
          case "toc":
            return await handleTOC(directory, args)
          default:
            return toErrorOutput(`Unknown action: ${args.action}`)
        }
      } catch (err) {
        return toErrorOutput(
          `hivemind_doc.${args.action} failed: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
  })
}

// ─── Read Action Handlers ─────────────────────────────────────────────────────

/**
 * Handle skim action — extract document outline.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with document outline.
 */
async function handleSkim(
  dir: string,
  args: { path: string; glob?: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for skim")
  }

  try {
    const result = await skimDocument(dir, args.path)
    return toSuccessOutput("Document skimmed", undefined, {
      ...result,
    })
  } catch {
    const results = await skimDirectory(dir, args.path, args.glob)
    return toSuccessOutput("Directory skimmed", undefined, {
      directory: args.path,
      files: results.length,
      documents: results,
    })
  }
}

/**
 * Handle read action — read file, section, or chunked.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with content.
 */
async function handleRead(
  dir: string,
  args: { path: string; heading?: string; max_tokens?: number },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for read")
  }

  if (args.heading) {
    const content = await readSection(dir, args.path, args.heading)
    if (content === null) {
      return toErrorOutput(
        `Section '${args.heading}' not found in ${args.path}`,
        "Use skim first to see available headings.",
      )
    }
    return toSuccessOutput(`Section '${args.heading}' from ${args.path}`, undefined, {
      path: args.path,
      heading: args.heading,
      content,
    })
  }

  const chunks = await readChunked(dir, args.path, undefined, args.max_tokens ?? 2000)
  return toSuccessOutput(`Read ${args.path} (${chunks.length} chunks)`, undefined, {
    path: args.path,
    chunks,
  })
}

/**
 * Handle read_lines action — read specific line range.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with content and line metadata.
 */
async function handleReadLines(
  dir: string,
  args: { path: string; start_line?: number; end_line?: number },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for read_lines")
  }
  if (!args.start_line || !args.end_line) {
    return toErrorOutput("start_line and end_line are required for read_lines")
  }

  const result = await readLines(dir, args.path, args.start_line, args.end_line)
  return toSuccessOutput(`Read lines ${result.startLine}-${result.endLine} of ${args.path}`, undefined, result)
}

/**
 * Handle metadata action — extract frontmatter.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with frontmatter data.
 */
async function handleMetadata(
  dir: string,
  args: { path: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for metadata")
  }

  const metadata = await readMetadata(dir, args.path)
  return toSuccessOutput(`Metadata from ${args.path}`, undefined, {
    path: args.path,
    metadata,
  })
}

/**
 * Handle list action — list documents in directory.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with document list.
 */
async function handleList(
  dir: string,
  args: { path: string; glob?: string; sort?: "name" | "date" | "size" },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for list")
  }

  const results = await listDocuments(dir, args.path, {
    glob: args.glob,
    sort: args.sort,
  })
  return toSuccessOutput(`Listed ${results.length} documents in ${args.path}`, undefined, {
    directory: args.path,
    total: results.length,
    documents: results,
  })
}

/**
 * Handle search action — search across documents.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with search results.
 */
async function handleSearch(
  dir: string,
  args: { path: string; query?: string; regex?: boolean; heading_only?: boolean; glob?: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for search")
  }
  if (!args.query?.trim()) {
    return toErrorOutput("query is required for search")
  }

  const results = await searchDocuments(dir, args.path, args.query, {
    regex: args.regex,
    headingOnly: args.heading_only,
    glob: args.glob,
  })
  return toSuccessOutput("Search complete", undefined, {
    query: args.query,
    total: results.length,
    results,
  })
}

/**
 * Handle inspect action — extract JSDoc, comments, exports from code files.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with code inspection results.
 */
async function handleInspect(
  dir: string,
  args: { path: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for inspect")
  }

  const result = await inspectCode(dir, args.path)
  return toSuccessOutput(`Inspected code: ${result.path}`, undefined, {
    path: result.path,
    jsdocBlocks: result.jsdocBlocks.length,
    comments: result.comments.length,
    exports: result.exports.length,
    signatures: result.signatures.length,
    details: result,
  })
}

/**
 * Handle index action — build comprehensive document index.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with document index.
 */
async function handleIndex(
  dir: string,
  args: { path: string; glob?: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for index")
  }

  const results = await indexDocuments(dir, args.path, args.glob)
  return toSuccessOutput(`Indexed ${results.length} documents in ${args.path}`, undefined, {
    directory: args.path,
    total: results.length,
    index: results,
  })
}

/**
 * Handle xref action — cross-document reference analysis.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with cross-reference results.
 */
async function handleXref(
  dir: string,
  args: { path: string; glob?: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for xref")
  }

  const results = await xrefDocuments(dir, args.path, args.glob)
  const broken = results.filter(r => !r.valid)
  return toSuccessOutput(`Cross-reference analysis of ${args.path}`, undefined, {
    directory: args.path,
    totalLinks: results.length,
    brokenLinks: broken.length,
    broken,
    all: results,
  })
}

/**
 * Handle context action — smart context extraction.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with relevant context chunks.
 */
async function handleContext(
  dir: string,
  args: { path: string; query?: string; token_budget?: number; glob?: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for context")
  }
  if (!args.query?.trim()) {
    return toErrorOutput("query is required for context")
  }

  const results = await contextExtract(dir, args.path, args.query, args.token_budget ?? 4000, args.glob)
  const totalTokens = results.reduce((sum, r) => sum + r.tokenEstimate, 0)
  return toSuccessOutput(`Extracted ${results.length} relevant sections`, undefined, {
    query: args.query,
    totalChunks: results.length,
    totalTokens,
    budget: args.token_budget ?? 4000,
    chunks: results,
  })
}

// ─── Write Action Handlers ────────────────────────────────────────────────────

/**
 * Handle write action — replace section body.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result or chunk_required signal.
 */
async function handleWrite(
  dir: string,
  args: { path: string; heading?: string; content?: string; expected_hash?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for write")
  }
  if (!args.heading?.trim()) {
    return toErrorOutput("heading is required for write")
  }
  if (args.content === undefined || args.content === null) {
    return toErrorOutput("content is required for write")
  }

  const result = await writeSection(dir, args.path, args.heading, args.content, args.expected_hash, args.allow_governance ?? false)

  if ("status" in result && result.status === "chunk_required") {
    return JSON.stringify(result, null, 2)
  }

  const wr = result as WriteResult
  if (!wr.changed) {
    return toErrorOutput(
      `No changes applied for heading '${args.heading}' in ${args.path}`,
      "Confirm the heading exists and is an exact text match. Use skim first.",
    )
  }

  return toSuccessOutput(`Patched heading '${args.heading}' in ${args.path}`, undefined, {
    path: args.path,
    heading: args.heading,
    bytesChanged: wr.bytesChanged,
    hash: wr.hash,
    opId: wr.opId,
  })
}

/**
 * Handle upsert action — replace or create section.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result or chunk_required signal.
 */
async function handleUpsert(
  dir: string,
  args: { path: string; heading?: string; content?: string; level?: number; expected_hash?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for upsert")
  }
  if (!args.heading?.trim()) {
    return toErrorOutput("heading is required for upsert")
  }
  if (args.content === undefined || args.content === null) {
    return toErrorOutput("content is required for upsert")
  }

  const result = await upsertSection(dir, args.path, args.heading, args.content, args.level ?? 2, args.expected_hash, args.allow_governance ?? false)

  if ("status" in result && result.status === "chunk_required") {
    return JSON.stringify(result, null, 2)
  }

  const ur = result as WriteResult
  return toSuccessOutput(`Upserted heading '${args.heading}' in ${args.path}`, undefined, {
    path: args.path,
    heading: args.heading,
    bytesChanged: ur.bytesChanged,
    changed: ur.changed,
    hash: ur.hash,
    opId: ur.opId,
  })
}

/**
 * Handle append action — append to section body.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result.
 */
async function handleAppend(
  dir: string,
  args: { path: string; heading?: string; content?: string; expected_hash?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for append")
  }
  if (!args.heading?.trim()) {
    return toErrorOutput("heading is required for append")
  }
  if (!args.content?.trim()) {
    return toErrorOutput("content is required for append")
  }

  const result = await appendSection(dir, args.path, args.heading, args.content, args.expected_hash, args.allow_governance ?? false)

  if (!result.changed) {
    return toErrorOutput(
      `No changes applied for heading '${args.heading}' in ${args.path}`,
      "Confirm the heading exists and is an exact text match. Use skim first.",
    )
  }

  return toSuccessOutput(`Appended to heading '${args.heading}' in ${args.path}`, undefined, {
    path: args.path,
    heading: args.heading,
    bytesChanged: result.bytesChanged,
    hash: result.hash,
    opId: result.opId,
  })
}

/**
 * Handle insert action — insert a new section.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result.
 */
async function handleInsert(
  dir: string,
  args: { path: string; after_heading?: string; new_heading?: string; level?: number; content?: string; expected_hash?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for insert")
  }
  if (!args.after_heading?.trim()) {
    return toErrorOutput("after_heading is required for insert")
  }
  if (!args.new_heading?.trim()) {
    return toErrorOutput("new_heading is required for insert")
  }

  const result = await insertSection(
    dir,
    args.path,
    args.after_heading,
    args.new_heading,
    args.level ?? 2,
    args.content ?? "",
    args.expected_hash,
    args.allow_governance ?? false,
  )

  if (!result.changed) {
    return toErrorOutput(
      `Could not insert after heading '${args.after_heading}' in ${args.path}`,
      "Confirm the after_heading exists. Use skim first.",
    )
  }

  return toSuccessOutput(`Inserted section '${args.new_heading}' in ${args.path}`, undefined, {
    path: args.path,
    after_heading: args.after_heading,
    new_heading: args.new_heading,
    level: args.level ?? 2,
    bytesChanged: result.bytesChanged,
    hash: result.hash,
    opId: result.opId,
  })
}

/**
 * Handle delete action — remove a section.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result.
 */
async function handleDelete(
  dir: string,
  args: { path: string; heading?: string; expected_hash?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for delete")
  }
  if (!args.heading?.trim()) {
    return toErrorOutput("heading is required for delete")
  }

  const result = await deleteSection(dir, args.path, args.heading, args.expected_hash, args.allow_governance ?? false)

  if (!result.changed) {
    return toErrorOutput(
      `No section found for heading '${args.heading}' in ${args.path}`,
      "Confirm the heading exists and is an exact text match. Use skim first.",
    )
  }

  return toSuccessOutput(`Deleted section '${args.heading}' from ${args.path}`, undefined, {
    path: args.path,
    heading: args.heading,
    bytesChanged: result.bytesChanged,
    hash: result.hash,
    opId: result.opId,
  })
}

// ─── Batch Action Handlers ────────────────────────────────────────────────────

/**
 * Handle batch action — multiple section ops on one file.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result.
 */
async function handleBatch(
  dir: string,
  args: { path: string; operations?: string; expected_hash?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for batch")
  }
  if (!args.operations?.trim()) {
    return toErrorOutput("operations is required for batch (JSON array of {heading, op, body?, level?})")
  }

  let ops: Array<{ heading: string; op: string; body?: string; level?: number }>
  try {
    ops = JSON.parse(args.operations)
    if (!Array.isArray(ops) || ops.length === 0) {
      return toErrorOutput("operations must be a non-empty JSON array")
    }
  } catch {
    return toErrorOutput("operations must be valid JSON", 'Example: [{"heading":"Setup","op":"write","body":"..."}]')
  }

  const result = await batchEdit(
    dir,
    args.path,
    ops as Array<{ heading: string; op: "write" | "append" | "delete" | "upsert"; body?: string; level?: number }>,
    args.expected_hash,
    args.allow_governance ?? false,
  )

  if ("status" in result && result.status === "chunk_required") {
    return JSON.stringify(result, null, 2)
  }

  const br = result as WriteResult
  return toSuccessOutput(`Batch: ${ops.length} operations on ${args.path}`, undefined, {
    path: args.path,
    operationCount: ops.length,
    changed: br.changed,
    bytesChanged: br.bytesChanged,
    hash: br.hash,
    opId: br.opId,
  })
}

/**
 * Handle batch_files action — operations across multiple files.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with per-file results.
 */
async function handleBatchFiles(
  dir: string,
  args: { operations?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.operations?.trim()) {
    return toErrorOutput("operations is required for batch_files (JSON array of {path, ops: [{heading, op, body?, level?}]})")
  }

  let fileOps: Array<{ path: string; ops: Array<{ heading: string; op: string; body?: string; level?: number }> }>
  try {
    fileOps = JSON.parse(args.operations)
    if (!Array.isArray(fileOps) || fileOps.length === 0) {
      return toErrorOutput("operations must be a non-empty JSON array")
    }
  } catch {
    return toErrorOutput("operations must be valid JSON", 'Example: [{"path":"doc.md","ops":[{"heading":"Setup","op":"write","body":"..."}]}]')
  }

  const results = await batchFiles(
    dir,
    fileOps as Array<{ path: string; ops: Array<{ heading: string; op: "write" | "append" | "delete" | "upsert"; body?: string; level?: number }> }>,
    args.allow_governance ?? false,
  )

  const succeeded = results.filter(r => r.changed).length
  const failed = results.filter(r => r.error).length
  return toSuccessOutput(`Batch files: ${fileOps.length} files, ${succeeded} changed, ${failed} errors`, undefined, {
    totalFiles: fileOps.length,
    succeeded,
    failed,
    results,
  })
}

// ─── Metadata & Create Handlers ───────────────────────────────────────────────

/**
 * Handle set_metadata action — update frontmatter fields.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result.
 */
async function handleSetMetadata(
  dir: string,
  args: { path: string; key?: string; value?: string; expected_hash?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for set_metadata")
  }
  if (!args.key?.trim()) {
    return toErrorOutput("key is required for set_metadata")
  }
  if (args.value === undefined || args.value === null) {
    return toErrorOutput("value is required for set_metadata")
  }

  const result = await writeMetadata(dir, args.path, { [args.key]: args.value }, args.expected_hash, args.allow_governance ?? false)

  if (!result.changed) {
    return toErrorOutput(`Metadata unchanged for ${args.path}`)
  }

  return toSuccessOutput(`Set metadata '${args.key}' in ${args.path}`, undefined, {
    path: args.path,
    key: args.key,
    value: args.value,
    bytesChanged: result.bytesChanged,
    hash: result.hash,
    opId: result.opId,
  })
}

/**
 * Handle create action — create a new document.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with created path.
 */
async function handleCreate(
  dir: string,
  args: { path: string; title?: string; template_metadata?: string; content?: string; allow_governance?: boolean },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for create")
  }
  if (!args.title?.trim()) {
    return toErrorOutput("title is required for create")
  }

  let metadata: Record<string, string> | undefined
  if (args.template_metadata) {
    try {
      metadata = JSON.parse(args.template_metadata)
    } catch {
      return toErrorOutput("template_metadata must be valid JSON", '{"author": "hivefiver", "date": "2026-03-11"}')
    }
  }

  const result = await createDocument(dir, args.path, args.title, metadata, args.content, args.allow_governance ?? false)
  return toSuccessOutput(`Created document: ${result.path}`, undefined, {
    path: result.path,
    created: result.created,
    hash: result.hash,
    opId: result.opId,
    receipt: result.receipt,
  })
}

/**
 * Handle toc action — generate table of contents.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with rendered TOC.
 */
async function handleTOC(
  dir: string,
  args: { path: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for toc")
  }

  const toc = await generateTOC(dir, args.path)
  return toSuccessOutput("Table of contents generated", undefined, {
    path: args.path,
    toc,
  })
}
