import { parseDocument } from "./parser.js"
import { assignHeadingPath, parseHeadings, type HeadingWithPath } from "./heading-index.js"
import type { DocChunk, DocChunkOptions } from "./types.js"

export const DEFAULT_MAX_CHARACTERS = 4000

type DraftDocChunk = Omit<DocChunk, "id" | "index"> & { index: number }

/**
 * Split a single heading section into chunks at paragraph boundaries when
 * content exceeds size limits. Each chunk carries its heading path context.
 *
 * @param relativePath - Root-relative document path.
 * @param sectionLines - Lines belonging to the current section.
 * @param startLine - One-based source line where the section starts.
 * @param heading - Nearest heading text for the section.
 * @param headingPath - Full heading breadcrumb for context.
 * @param depth - Heading depth of the nearest parent.
 * @param parentHeading - Direct parent heading text.
 * @param frontmatter - Document frontmatter metadata.
 * @param maxCharacters - Maximum desired characters per chunk.
 * @returns Draft chunks with heading context but without final ids.
 */
function splitSection(
  relativePath: string,
  sectionLines: string[],
  startLine: number,
  heading: string | null,
  headingPath: string[],
  depth: number,
  parentHeading: string | null,
  frontmatter: Record<string, unknown>,
  maxCharacters: number,
): DraftDocChunk[] {
  const chunks: DraftDocChunk[] = []
  let buffer: string[] = []
  let bufferStart = startLine

  const flush = (endLine: number): void => {
    const content = buffer.join("\n").trim()
    if (!content) return
    chunks.push({
      path: relativePath,
      index: 0,
      heading,
      headingPath,
      depth,
      parentHeading,
      frontmatter,
      startLine: bufferStart,
      endLine,
      content,
      characterCount: content.length,
      estimatedTokens: Math.ceil(content.length / 4),
    })
    buffer = []
  }

  sectionLines.forEach((line, offset) => {
    if (buffer.length === 0) bufferStart = startLine + offset
    const candidate = [...buffer, line].join("\n")
    if (candidate.length > maxCharacters && buffer.length > 0 && line.trim() !== "") {
      flush(startLine + offset - 1)
      bufferStart = startLine + offset
    }
    buffer.push(line)
  })
  flush(startLine + sectionLines.length - 1)
  return chunks
}

/**
 * Split Markdown into stable, heading-aware chunks. Each chunk carries:
 * - headingPath: full breadcrumb from root (e.g. ["API", "Endpoints", "GET /users"])
 * - depth: heading depth of nearest parent (0 for preamble before first heading)
 * - parentHeading: direct parent heading text
 * - frontmatter: document metadata for context
 *
 * Heading extraction and path assignment both come from the unified
 * `heading-index` module, so this chunker shares its parsing contract
 * with `hierarchy-ops`, `indexer-ops`, and `md-ast-ops` (NF-06).
 *
 * @param relativePath - Project-root-relative POSIX source path.
 * @param content - Raw Markdown content.
 * @param options - Optional chunk sizing controls.
 * @returns Deterministic list of chunks in source order with heading context.
 */
export function chunkMarkdownDocument(
  relativePath: string,
  content: string,
  options: DocChunkOptions = {},
): DocChunk[] {
  const maxCharacters = Math.max(200, options.maxCharacters ?? DEFAULT_MAX_CHARACTERS)
  const lines = content.split(/\r?\n/)
  const parsed = parseDocument(relativePath, content)
  const headings = assignHeadingPath(parseHeadings(content))
  const frontmatter = parsed.frontmatter

  // If no headings, treat entire doc as one preamble chunk
  if (headings.length === 0) {
    const fullContent = content.trim()
    return [{
      id: `${relativePath}#document-1`,
      path: relativePath,
      index: 1,
      heading: null,
      headingPath: [],
      depth: 0,
      parentHeading: null,
      frontmatter,
      startLine: 1,
      endLine: lines.length,
      content: fullContent,
      characterCount: fullContent.length,
      estimatedTokens: Math.ceil(fullContent.length / 4),
    }]
  }

  const allChunks: DraftDocChunk[] = []

  headings.forEach((heading: HeadingWithPath, sectionIndex) => {
    const startLine = heading.startLine
    const endLine = heading.endLine
    const sectionLines = lines.slice(startLine - 1, endLine)

    allChunks.push(...splitSection(
      relativePath,
      sectionLines,
      startLine,
      heading.text,
      heading.headingPath,
      heading.level,
      heading.parentHeading,
      frontmatter,
      maxCharacters,
    ))

    // Suppress unused-variable warning for the sectionIndex; it was used by
    // the previous slice-based implementation but the forEach with index is
    // no longer needed now that the section boundary is encoded on the node.
    void sectionIndex
  })

  return allChunks.map((chunk, index) => ({
    ...chunk,
    index: index + 1,
    id: `${relativePath}#${(chunk.headingPath.length > 0 ? chunk.headingPath.join("-") : "document")}-${index + 1}`,
  }))
}
