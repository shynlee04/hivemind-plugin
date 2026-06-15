import { readFileSync, statSync } from "node:fs"
import { z } from "zod"

import { assertPathWithinRoot } from "../../shared/security/path-scope.js"
import { FileOpsSchema, SectionEditOpSchema } from "../../schema-kernel/doc-intelligence.schema.js"
import { chunkMarkdownDocument } from "./chunker.js"
import { skimDocument, skimDirectory, readDocument, readLines, readOffset } from "./read-ops.js"
import { searchDocuments } from "./search-ops.js"
import { generateToc, generateOutline } from "./hierarchy-ops.js"
import { readDocumentMetadata, writeDocumentMetadata, deleteDocumentMetadataField } from "./metadata-ops.js"
import { createDocument, writeSectionBody, upsertSection, appendSection, insertSection, deleteSection, deleteFile } from "./write-ops.js"
import { writeLines, writeOffset, insertLines, insertOffset, deleteLines, deleteOffset } from "./line-offset-ops.js"
import { batchSectionEdits, batchMultiFileEdits } from "./batch-ops.js"
import { inspectCodeFile } from "./code-inspect.js"
import { analyzeCrossReferences } from "./xref-ops.js"
import { buildDocumentIndex } from "./indexer-ops.js"
import { extractContext } from "./context-extract.js"
import type { DocIntelligenceAction, DocIntelligenceResult } from "./types.js"

const DEFAULT_MAX_READ_CHARACTERS = 20000

/**
 * Execute a document intelligence action inside the project root boundary.
 *
 * The router is a traffic cop — it dispatches to the appropriate `*-ops.ts`
 * module based on the action discriminator. No business logic lives here
 * beyond dispatch and path security.
 *
 * @param projectRoot - Trusted project root for path security.
 * @param input - Parsed action input with discriminated action field.
 * @returns Action-specific document intelligence result.
 */
export function executeDocIntelligenceAction(
  projectRoot: string,
  input: { action: string; path: string; [key: string]: unknown },
): DocIntelligenceResult | Promise<DocIntelligenceResult> {
  // All actions pass through path security
  switch (input.action as DocIntelligenceAction) {
    // ── Read (original — parity preserved) ──
    case "skim": {
      const skimAbsPath = assertPathWithinRoot(projectRoot, input.path, "doc intelligence")
      if (statSync(skimAbsPath).isDirectory()) {
        throw new Error("[Hivemind] Path is a directory. Use 'skim_directory' action to list directory contents.")
      }
      return { action: "skim", document: skimDocument(projectRoot, input.path) }
    }
    case "skim_directory": {
      return { action: "skim_directory", documents: skimDirectory(projectRoot, input.path, input.format as string | undefined) }
    }
    case "read": {
      const heading = typeof input.heading === "string" && input.heading.length > 0 ? input.heading : undefined
      const result = readDocument(
        projectRoot,
        input.path,
        (input.maxCharacters as number) ?? DEFAULT_MAX_READ_CHARACTERS,
        heading,
      )
      if (result.content === null && heading !== undefined) {
        return {
          action: "read",
          ok: false,
          error: {
            code: "HEADING_NOT_FOUND",
            message: `[Hivemind] Heading not found: ${heading}`,
            data: { suggestions: result.suggestions },
          },
        }
      }
      return {
        action: "read",
        path: result.path,
        content: result.content ?? "",
        characterCount: result.characterCount,
        truncated: result.truncated,
        heading: result.heading,
        suggestions: result.suggestions,
        hash: result.hash,
      }
    }
    case "chunk": {
      const absPath = assertPathWithinRoot(projectRoot, input.path, "doc intelligence")
      const content = readFileSync(absPath, "utf-8")
      const chunks = chunkMarkdownDocument(input.path, content, { maxCharacters: input.maxCharacters as number | undefined })
      return { action: "chunk", path: input.path, chunks }
    }
    case "search": {
      const searchResult = searchDocuments(
        projectRoot,
        input.path,
        (input.query as string) ?? "",
        (input.maxResults as number) ?? 50,
        (input.regex as boolean) ?? false,
        (input.headingOnly as boolean) ?? false,
        input.mode as "literal" | "regex" | "fuzzy" | undefined,
        (input.maxTokens as number) ?? 0,
      )
      return {
        action: "search",
        query: (input.query as string) ?? "",
        matches: searchResult.matches,
        truncated: searchResult.truncated,
        ...(searchResult.truncationReason ? { truncationReason: searchResult.truncationReason } : {}),
      }
    }

    // ── Read (extended) ──
    case "read_lines": {
      return { action: "read_lines", result: readLines(projectRoot, input.path, input.startLine as number, input.endLine as number | undefined) }
    }
    case "read_offset": {
      return { action: "read_offset", result: readOffset(projectRoot, input.path, input.offset as number, input.limit as number) }
    }

    // ── Write ──
    case "create": {
      const metadata = z.record(z.string(), z.unknown()).optional().parse(input.metadata)
      return createDocument(projectRoot, input.path, input.title as string, metadata, input.initialContent as string | undefined).then(
        (result) => ({ action: "create", result }) as DocIntelligenceResult,
      )
    }
    case "write": {
      return writeSectionBody(projectRoot, input.path, input.heading as string, input.body as string, input.expectedHash as string | undefined).then(
        (result) => ({ action: "write", result }) as unknown as DocIntelligenceResult,
      )
    }
    case "upsert": {
      return upsertSection(projectRoot, input.path, input.heading as string, input.body as string, (input.level as number) ?? 2, input.expectedHash as string | undefined).then(
        (result) => ({ action: "upsert", result }) as unknown as DocIntelligenceResult,
      )
    }
    case "append": {
      return appendSection(projectRoot, input.path, input.heading as string, input.content as string, input.expectedHash as string | undefined).then(
        (result) => ({ action: "append", result }) as unknown as DocIntelligenceResult,
      )
    }
    case "insert": {
      return insertSection(projectRoot, input.path, input.afterHeading as string, input.newHeading as string, input.level as number, input.body as string, input.expectedHash as string | undefined).then(
        (result) => ({ action: "insert", result }) as unknown as DocIntelligenceResult,
      )
    }
    case "delete": {
      if (input.mode === "file") {
        return deleteFile(projectRoot, input.path).then(
          (result) => ({ action: "delete", result }) as DocIntelligenceResult,
        )
      }
      return deleteSection(projectRoot, input.path, input.heading as string).then(
        (result) => ({ action: "delete", result }) as unknown as DocIntelligenceResult,
      )
    }

    // ── Line/Offset Write (universal across formats) ──
    case "write_lines": {
      return writeLines(projectRoot, input.path, input.startLine as number, input.endLine as number, input.content as string, input.expectedHash as string | undefined).then(
        ({ hash, opId }) => ({ action: "write_lines", hash, opId }) as DocIntelligenceResult,
      )
    }
    case "write_offset": {
      return writeOffset(projectRoot, input.path, input.offset as number, input.limit as number, input.content as string, input.expectedHash as string | undefined).then(
        ({ hash, opId }) => ({ action: "write_offset", hash, opId }) as DocIntelligenceResult,
      )
    }
    case "insert_lines": {
      return insertLines(projectRoot, input.path, input.startLine as number, input.content as string, input.expectedHash as string | undefined).then(
        ({ hash, opId }) => ({ action: "insert_lines", hash, opId }) as DocIntelligenceResult,
      )
    }
    case "insert_offset": {
      return insertOffset(projectRoot, input.path, input.offset as number, input.content as string, input.expectedHash as string | undefined).then(
        ({ hash, opId }) => ({ action: "insert_offset", hash, opId }) as DocIntelligenceResult,
      )
    }
    case "delete_lines": {
      return deleteLines(projectRoot, input.path, input.startLine as number, input.endLine as number, input.expectedHash as string | undefined).then(
        ({ hash, opId }) => ({ action: "delete_lines", hash, opId }) as DocIntelligenceResult,
      )
    }
    case "delete_offset": {
      return deleteOffset(projectRoot, input.path, input.offset as number, input.limit as number, input.expectedHash as string | undefined).then(
        ({ hash, opId }) => ({ action: "delete_offset", hash, opId }) as DocIntelligenceResult,
      )
    }

    // ── Batch ──
    case "batch": {
      const ops = z.array(SectionEditOpSchema).min(1).parse(input.ops)
      return batchSectionEdits(projectRoot, input.path, ops).then(
        (result) => ({ action: "batch", ...result }) as unknown as DocIntelligenceResult,
      )
    }
    case "batch_files": {
      const files = z.array(FileOpsSchema).min(1).parse(input.files)
      return batchMultiFileEdits(projectRoot, files).then(
        (result) => ({ action: "batch_files", results: result.results }) as DocIntelligenceResult,
      )
    }

    // ── Metadata ──
    case "metadata": {
      return { action: "metadata", metadata: readDocumentMetadata(projectRoot, input.path) }
    }
    case "set_metadata": {
      const metadata = z.record(z.string(), z.unknown()).parse(input.metadata)
      return writeDocumentMetadata(projectRoot, input.path, metadata).then(
        ({ hash, opId }) => ({ action: "set_metadata", hash, opId }) as DocIntelligenceResult,
      )
    }
    case "delete_metadata": {
      return deleteDocumentMetadataField(projectRoot, input.path, input.field as string).then(
        ({ hash, opId }) => ({ action: "delete_metadata", hash, opId }) as DocIntelligenceResult,
      )
    }

    // ── Hierarchy ──
    case "toc": {
      return { action: "toc", toc: generateToc(projectRoot, input.path) }
    }
    case "outline": {
      const result = generateOutline(projectRoot, input.path)
      return { action: "outline", flat: result.flat, tree: result.tree }
    }

    // ── Code Inspect ──
    case "inspect": {
      return inspectCodeFile(projectRoot, input.path).then(
        (result) => ({ action: "inspect", result }) as unknown as DocIntelligenceResult,
      )
    }

    // ── Cross-Reference ──
    case "xref": {
      return { action: "xref", links: analyzeCrossReferences(projectRoot, input.path) }
    }

    // ── Index ──
    case "index": {
      return { action: "index", entries: buildDocumentIndex(projectRoot, input.path) }
    }

    // ── Context Extraction ──
    case "context": {
      return {
        action: "context",
        sections: extractContext(projectRoot, input.path, (input.query as string) ?? "", input.tokenBudget as number | undefined),
      }
    }

    default:
      throw new Error(`[Hivemind] Unsupported doc intelligence action: ${String(input.action)}`)
  }
}
