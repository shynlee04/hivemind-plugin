import matter from "gray-matter"

import type { DocHeading, ParsedMarkdownDocument } from "./types.js"

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/

/**
 * Create a stable slug for a Markdown heading.
 *
 * @param text - Heading text to normalize.
 * @returns Lowercase slug suitable for chunk ids and outline references.
 *
 * @example
 * ```typescript
 * slugifyHeading("Install Guide") // "install-guide"
 * ```
 */
export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
  return slug || "section"
}

/**
 * Extract Markdown headings in source order using a minimal heading parser.
 *
 * @param markdown - Markdown body content without frontmatter.
 * @param lineOffset - Number of frontmatter lines before the body starts.
 * @returns Heading outline with one-based source line numbers.
 */
export function extractMarkdownOutline(markdown: string, lineOffset = 0): DocHeading[] {
  return markdown.split(/\r?\n/).flatMap((line, index) => {
    const match = HEADING_PATTERN.exec(line)
    if (!match) return []
    const text = match[2]?.trim() ?? ""
    return [{ depth: match[1]?.length ?? 1, text, line: index + 1 + lineOffset, slug: slugifyHeading(text) }]
  })
}

/**
 * Parse a Markdown document into lightweight intelligence metadata.
 *
 * @param relativePath - Project-root-relative POSIX document path.
 * @param content - Raw Markdown content.
 * @returns Parsed document metadata including frontmatter and heading outline.
 *
 * @example
 * ```typescript
 * const doc = parseMarkdownDocument("docs/guide.md", "# Guide")
 * console.log(doc.outline[0]?.text) // "Guide"
 * ```
 */
export function parseMarkdownDocument(relativePath: string, content: string): ParsedMarkdownDocument {
  const parsed = matter(content)
  const frontmatterLineOffset = countFrontmatterLines(content)
  const outline = extractMarkdownOutline(parsed.content, frontmatterLineOffset)
  const title = typeof parsed.data.title === "string" && parsed.data.title.trim()
    ? parsed.data.title.trim()
    : outline[0]?.text ?? null

  return {
    path: relativePath,
    frontmatter: parsed.data as Record<string, unknown>,
    title,
    outline,
    wordCount: countWords(parsed.content),
    characterCount: content.length,
  }
}

/**
 * Count visible words in Markdown text for skim summaries.
 *
 * @param text - Markdown body content.
 * @returns Count of non-empty word-like tokens.
 */
function countWords(text: string): number {
  const matches = text.replace(/[`*_#[\]()]/g, " ").match(/\b\S+\b/g)
  return matches?.length ?? 0
}

/**
 * Count frontmatter delimiter block lines so body headings retain source line numbers.
 *
 * @param content - Raw Markdown content.
 * @returns Number of frontmatter lines including delimiters, or zero when absent.
 */
function countFrontmatterLines(content: string): number {
  const lines = content.split(/\r?\n/)
  if (lines[0] !== "---") return 0
  const endIndex = lines.findIndex((line, index) => index > 0 && line === "---")
  return endIndex === -1 ? 0 : endIndex + 1
}
