import { parseDocument } from "./parser.js"
import type { DocChunk, DocChunkOptions } from "./types.js"

export const DEFAULT_MAX_CHARACTERS = 4000

type DraftDocChunk = Omit<DocChunk, "id" | "index"> & { index: number }

/**
 * Build heading path breadcrumb array from flat heading list up to a given line.
 *
 * @param headings - Flat heading list in source order.
 * @param targetLine - One-based target line number.
 * @returns Heading path array and direct parent heading text.
 */
function buildHeadingPath(
  headings: { line: number; text: string; depth: number }[],
  targetLine: number,
): { path: string[]; parentHeading: string | null } {
  const path: string[] = []
  let parentHeading: string | null = null
  for (const h of headings) {
    if (h.line >= targetLine) break
    // Only include headings that could be ancestors
    path.push(h.text)
    parentHeading = path.length > 0 ? path[path.length - 1] : null
  }
  return { path, parentHeading }
}

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
  const headings = parsed.outline
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

  const starts = headings.map((h) => h.line)
  const allChunks: DraftDocChunk[] = []

  starts.forEach((startLine, sectionIndex) => {
    const nextStartLine = starts[sectionIndex + 1] ?? lines.length + 1
    const sectionLines = lines.slice(startLine - 1, nextStartLine - 1)
    const heading = headings[sectionIndex]

    // Compute heading path up to this section
    const { path: headingPath, parentHeading } = buildHeadingPath(
      headings.map(h => ({ line: h.line, text: h.text, depth: h.depth })),
      startLine,
    )

    const depth = heading?.depth ?? 0

    allChunks.push(...splitSection(
      relativePath,
      sectionLines,
      startLine,
      heading?.text ?? null,
      headingPath,
      depth,
      parentHeading,
      frontmatter,
      maxCharacters,
    ))
  })

  return allChunks.map((chunk, index) => ({
    ...chunk,
    index: index + 1,
    id: `${relativePath}#${(chunk.headingPath.length > 0 ? chunk.headingPath.join("-") : "document")}-${index + 1}`,
  }))
}
