import { extractMarkdownOutline, slugifyHeading } from "./parser.js"
import type { DocChunk, DocChunkOptions } from "./types.js"

/** Default maximum characters per chunk. */
export const DEFAULT_MAX_CHARACTERS = 4000

type DraftDocChunk = Omit<DocChunk, "id" | "index"> & { index: number }

/**
 * Split Markdown into stable, heading-aware chunks without persisting indexes.
 *
 * @param relativePath - Project-root-relative POSIX source path.
 * @param content - Raw Markdown content.
 * @param options - Optional chunk sizing controls.
 * @returns Deterministic list of chunks in source order.
 *
 * @example
 * ```typescript
 * const chunks = chunkMarkdownDocument("README.md", "# Intro")
 * console.log(chunks[0]?.id) // "README.md#intro-1"
 * ```
 */
export function chunkMarkdownDocument(
  relativePath: string,
  content: string,
  options: DocChunkOptions = {},
): DocChunk[] {
  const maxCharacters = Math.max(200, options.maxCharacters ?? DEFAULT_MAX_CHARACTERS)
  const lines = content.split(/\r?\n/)
  const headings = extractMarkdownOutline(content)
  const starts = headings.length > 0 ? headings.map((heading) => heading.line) : [1]

  return starts.flatMap((startLine, sectionIndex) => {
    const nextStartLine = starts[sectionIndex + 1] ?? lines.length + 1
    const sectionLines = lines.slice(startLine - 1, nextStartLine - 1)
    const heading = headings.find((candidate) => candidate.line === startLine)
    return splitSection(relativePath, sectionLines, startLine, heading?.text ?? null, maxCharacters)
  }).map((chunk, index) => ({
    ...chunk,
    index: index + 1,
    id: `${relativePath}#${slugifyHeading(chunk.heading ?? "document")}-${index + 1}`,
  }))
}

/**
 * Split a single heading section at paragraph boundaries when it exceeds size limits.
 *
 * @param relativePath - Root-relative document path.
 * @param sectionLines - Lines belonging to the current section.
 * @param startLine - One-based source line where the section starts.
 * @param heading - Nearest heading text for the section.
 * @param maxCharacters - Maximum desired characters per chunk.
 * @returns Chunks with stable line ranges.
 */
function splitSection(
  relativePath: string,
  sectionLines: string[],
  startLine: number,
  heading: string | null,
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
