/**
 * hivemind_doc — Unified document intelligence tool.
 *
 * A multi-action tool for hierarchy-aware, chunk-based, and search-first
 * document reading, writing, editing, and searching. Replaces ad-hoc document
 * operations with a structured agentic approach.
 *
 * Actions:
 *   skim         — outline/hierarchy of one file or directory
 *   read         — read full file, a section, or chunked
 *   metadata     — extract YAML frontmatter
 *   list         — list document files with summary metadata
 *   search       — search across documents by keyword or regex
 *   write        — replace a section body under a heading
 *   append       — append to a section body
 *   insert       — insert a new section after a heading
 *   delete       — delete a section by heading
 *   set_metadata — set/update YAML frontmatter fields
 *   create       — create a new document with frontmatter template
 *   toc          — generate a markdown table of contents
 *
 * Philosophy:
 *   1. Read before write — always skim the outline first
 *   2. Chunk discipline — files >600 LOC are never written in one shot
 *   3. Hierarchy-first — navigate by headings, not line numbers
 *   4. Context-on-demand — pull only the section that matters
 *   5. File-type safety — only .md, .xml, .json, .yaml may be written
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
  generateTOC,
  writeSection,
  appendSection,
  insertSection,
  deleteSection,
  writeMetadata,
  createDocument,
  searchDocuments,
  listDocuments,
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
      "Unified document intelligence tool for hierarchy-aware reading, writing, editing, and searching. " +
      "Actions: skim (outline), read (section/chunked), metadata (frontmatter), list (directory), " +
      "search (keyword/regex), write (replace section), append (add to section), insert (new section), " +
      "delete (remove section), set_metadata (update frontmatter), create (new doc), toc (table of contents). " +
      "Write operations restricted to .md, .xml, .json, .yaml files. Files >600 LOC require section-by-section writes.",
    args: {
      action: tool.schema
        .enum([
          "skim", "read", "metadata", "list", "search",
          "write", "append", "insert", "delete",
          "set_metadata", "create", "toc",
        ])
        .describe("What to do"),
      path: tool.schema
        .string()
        .describe("Workspace-relative file or directory path"),
      heading: tool.schema
        .string()
        .optional()
        .describe("Target heading text (for read/write/append/delete)"),
      content: tool.schema
        .string()
        .optional()
        .describe("Content body (for write/append/insert/create)"),
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
        .describe("Heading level 1-6 (for insert action, default: 2)"),
      max_tokens: tool.schema
        .number()
        .optional()
        .describe("Token budget per chunk (for read action, default: 2000)"),
      query: tool.schema
        .string()
        .optional()
        .describe("Search query (for search action)"),
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
        .describe("File extension filter, e.g. '.md' (for skim/list/search on directories)"),
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
    },
    async execute(args, _context) {
      try {
        switch (args.action) {
          case "skim":
            return handleSkim(directory, args)
          case "read":
            return handleRead(directory, args)
          case "metadata":
            return handleMetadata(directory, args)
          case "list":
            return handleList(directory, args)
          case "search":
            return handleSearch(directory, args)
          case "write":
            return handleWrite(directory, args)
          case "append":
            return handleAppend(directory, args)
          case "insert":
            return handleInsert(directory, args)
          case "delete":
            return handleDelete(directory, args)
          case "set_metadata":
            return handleSetMetadata(directory, args)
          case "create":
            return handleCreate(directory, args)
          case "toc":
            return handleTOC(directory, args)
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

// ─── Action Handlers ──────────────────────────────────────────────────────────

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

  // Check if path is a directory or file by trying as document first
  try {
    const result = await skimDocument(dir, args.path)
    return toSuccessOutput("Document skimmed", undefined, {
      ...result,
    })
  } catch {
    // Might be a directory
    const results = await skimDirectory(dir, args.path, args.glob)
    return toSuccessOutput("Directory skimmed", undefined, {
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
    // Read a specific section
    const content = await readSection(dir, args.path, args.heading)
    if (content === null) {
      return toErrorOutput(
        `Heading '${args.heading}' not found in ${args.path}`,
        "Use skim action first to see available headings",
      )
    }
    return toSuccessOutput("Section read", undefined, {
      path: args.path,
      heading: args.heading,
      content,
    })
  }

  // Chunked read (always for full file)
  const chunks = await readChunked(dir, args.path, undefined, args.max_tokens)
  return toSuccessOutput("File read in chunks", undefined, {
    path: args.path,
    chunks: chunks.length,
    data: chunks,
  })
}

/**
 * Handle metadata action — extract YAML frontmatter.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with frontmatter.
 */
async function handleMetadata(
  dir: string,
  args: { path: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for metadata")
  }

  const metadata = await readMetadata(dir, args.path)
  return toSuccessOutput("Metadata extracted", undefined, {
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

  const documents = await listDocuments(dir, args.path, {
    glob: args.glob,
    sort: args.sort,
  })
  return toSuccessOutput("Documents listed", undefined, {
    path: args.path,
    total: documents.length,
    documents,
  })
}

/**
 * Handle search action — keyword/regex search across documents.
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
 * Handle write action — replace section body.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result or chunk_required signal.
 */
async function handleWrite(
  dir: string,
  args: { path: string; heading?: string; content?: string },
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

  const result = await writeSection(dir, args.path, args.heading, args.content)

  if ("status" in result && result.status === "chunk_required") {
    return JSON.stringify(result, null, 2)
  }

  // After the chunk_required guard, result is narrowed to the success type
  const writeResult = result as { changed: boolean; bytesChanged: number }

  if (!writeResult.changed) {
    return toErrorOutput(
      `No changes applied for heading '${args.heading}' in ${args.path}`,
      "Confirm the heading exists and is an exact text match. Use skim first.",
    )
  }

  return toSuccessOutput(`Patched heading '${args.heading}' in ${args.path}`, undefined, {
    path: args.path,
    heading: args.heading,
    bytesChanged: writeResult.bytesChanged,
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
  args: { path: string; heading?: string; content?: string },
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

  const result = await appendSection(dir, args.path, args.heading, args.content)

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
  args: { path: string; after_heading?: string; new_heading?: string; level?: number; content?: string },
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
  args: { path: string; heading?: string },
): Promise<string> {
  if (!args.path?.trim()) {
    return toErrorOutput("path is required for delete")
  }
  if (!args.heading?.trim()) {
    return toErrorOutput("heading is required for delete")
  }

  const result = await deleteSection(dir, args.path, args.heading)

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
  })
}

/**
 * Handle set_metadata action — update frontmatter fields.
 *
 * @param dir - Project root.
 * @param args - Tool arguments.
 * @returns JSON output with result.
 */
async function handleSetMetadata(
  dir: string,
  args: { path: string; key?: string; value?: string },
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

  const result = await writeMetadata(dir, args.path, { [args.key]: args.value })

  if (!result.changed) {
    return toErrorOutput(`Metadata unchanged for ${args.path}`)
  }

  return toSuccessOutput(`Set metadata '${args.key}' in ${args.path}`, undefined, {
    path: args.path,
    key: args.key,
    value: args.value,
    bytesChanged: result.bytesChanged,
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
  args: { path: string; title?: string; template_metadata?: string },
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
      return toErrorOutput("template_metadata must be valid JSON", "Example: {\"author\": \"hivefiver\", \"date\": \"2026-03-11\"}")
    }
  }

  const result = await createDocument(dir, args.path, args.title, metadata)
  return toSuccessOutput(`Created document: ${result.path}`, undefined, {
    path: result.path,
    created: result.created,
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
