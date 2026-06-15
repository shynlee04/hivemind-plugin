import { extname } from "node:path"

import matter from "gray-matter"
import yaml from "yaml"

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
 * Parse JSON content: extract title from "title" key, return flat metadata.
 *
 * @param relativePath - Project-root-relative POSIX document path.
 * @param content - Raw JSON content.
 * @returns Parsed document metadata (outline will be empty).
 */
export function parseJsonDocument(relativePath: string, content: string): ParsedMarkdownDocument {
  let data: Record<string, unknown> = {}
  try {
    data = JSON.parse(content) as Record<string, unknown>
  } catch {
    // Invalid JSON — return minimal metadata
  }

  const title = typeof data.title === "string" ? data.title : null
  const frontmatter: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key !== "title" && typeof value !== "object") {
      frontmatter[key] = value
    }
  }

  return {
    path: relativePath,
    frontmatter,
    title,
    outline: [],
    wordCount: countWords(content),
    characterCount: content.length,
  }
}

/**
 * Parse YAML content: extract title from "title" key, return flat metadata.
 *
 * @param relativePath - Project-root-relative POSIX document path.
 * @param content - Raw YAML content.
 * @returns Parsed document metadata (outline will be empty).
 */
export function parseYamlDocument(relativePath: string, content: string): ParsedMarkdownDocument {
  let data: Record<string, unknown> = {}
  try {
    data = yaml.parse(content) as Record<string, unknown>
  } catch {
    // Invalid YAML — return minimal metadata
  }

  const title = typeof data.title === "string" ? data.title : null
  const frontmatter: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key !== "title" && typeof value !== "object") {
      frontmatter[key] = value
    }
  }

  return {
    path: relativePath,
    frontmatter,
    title,
    outline: [],
    wordCount: countWords(content),
    characterCount: content.length,
  }
}

/**
 * Parse XML content: extract title from <title> element, return minimal metadata.
 *
 * @param relativePath - Project-root-relative POSIX document path.
 * @param content - Raw XML content.
 * @returns Parsed document metadata (outline will be empty).
 */
export function parseXmlDocument(relativePath: string, content: string): ParsedMarkdownDocument {
  const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(content)
  const title = titleMatch ? titleMatch[1].trim() : null

  return {
    path: relativePath,
    frontmatter: {},
    title,
    outline: [],
    wordCount: countWords(content),
    characterCount: content.length,
  }
}

/**
 * Parse plain text: extract title from first line, minimal metadata.
 *
 * @param relativePath - Project-root-relative POSIX document path.
 * @param content - Raw text content.
 * @returns Parsed document metadata (outline will be empty).
 */
export function parsePlainTextDocument(relativePath: string, content: string): ParsedMarkdownDocument {
  const lines = content.split(/\r?\n/)
  const title = lines[0]?.trim() || null

  return {
    path: relativePath,
    frontmatter: {},
    title,
    outline: [],
    wordCount: countWords(content),
    characterCount: content.length,
  }
}

/**
 * Parse a document based on its file extension.
 * Returns a uniform `ParsedMarkdownDocument`-shaped result.
 *
 * @param relativePath - Project-root-relative POSIX path.
 * @param content - Raw file content.
 * @returns Parsed document metadata.
 */
export function parseDocument(
  relativePath: string,
  content: string,
): ParsedMarkdownDocument {
  const ext = extname(relativePath).toLowerCase()
  switch (ext) {
    case ".md":
    case ".mdx":
      return parseMarkdownDocument(relativePath, content)
    case ".json":
      return parseJsonDocument(relativePath, content)
    case ".yaml":
    case ".yml":
      return parseYamlDocument(relativePath, content)
    case ".xml":
      return parseXmlDocument(relativePath, content)
    default:
      return parsePlainTextDocument(relativePath, content)
  }
}

/**
 * Count visible words in text for skim summaries.
 *
 * @param text - Text content.
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


