import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkStringify from "remark-stringify"
import matter from "gray-matter"

import { assignHeadingPath, parseHeadings, type HeadingWithPath } from "./heading-index.js"
import type { DocHeading } from "./types.js"

/**
 * Heading metadata derived from the Markdown document, augmented with the
 * full breadcrumb path (root -> leaf) and the direct parent heading text.
 *
 * This shape is the legacy `AstHeading` from the remark-AST walker; the
 * extraction is now driven by the unified `heading-index` module, so the
 * type name is preserved for backward compatibility with downstream
 * consumers (the router, the indexer, and the test suite) but the
 * implementation is no longer AST-based.
 */
export type AstHeading = DocHeading & {
  /** Full breadcrumb path from root heading to this heading (inclusive). */
  path: string[]
  /** Text of the direct parent heading, or `null` for top-level headings. */
  parentHeading: string | null
}

/**
 * Extract a Markdown heading outline from a document.
 *
 * Replaces the previous remark-AST walker with a call to the unified
 * `heading-index` module (`parseHeadings` + `assignHeadingPath`), so the
 * parser contract is shared with `chunker`, `hierarchy-ops`, and
 * `indexer-ops` (NF-06, F-14, F-15, F-20, F-25).
 *
 * Frontmatter is stripped before parsing and its line offset is applied to
 * the reported source line numbers so callers see one-based lines in the
 * original (pre-parse) document.
 *
 * @param content - Raw Markdown content, optionally with YAML frontmatter.
 * @returns Flat heading list in source order with path, parent, and slug.
 */
export function extractHeadingsAst(content: string): AstHeading[] {
  const withPath = assignHeadingPath(parseHeadings(content))
  return withPath.map(toAstHeading)
}

function toAstHeading(h: HeadingWithPath): AstHeading {
  return {
    depth: h.level,
    text: h.text,
    line: h.startLine,
    slug: h.slug,
    path: [...h.headingPath],
    parentHeading: h.parentHeading,
  }
}

/**
 * Locate a section by its full breadcrumb path and return its line range
 * and content. The range is bounded by the next heading at the same or
 * shallower depth, so the returned content includes all nested children
 * but does not bleed into the next sibling of the matched heading.
 *
 * @param content - Raw Markdown content to search.
 * @param path - Heading breadcrumb path (e.g. `["Chapter 1", "Components"]`).
 * @returns Section metadata, or `null` when no heading matches the path.
 */
export function findSectionByPathAst(
  content: string,
  path: string[],
): { startLine: number; endLine: number; content: string } | null {
  if (path.length === 0) return null
  const headings = extractHeadingsAst(content)
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    if (!h) continue
    if (h.path.length !== path.length) continue
    let match = true
    for (let j = 0; j < path.length; j++) {
      if (h.path[j] !== path[j]) {
        match = false
        break
      }
    }
    if (!match) continue
    const lines = content.split(/\r?\n/)
    const targetDepth = h.depth
    let endLine = lines.length
    for (let k = i + 1; k < headings.length; k++) {
      const candidate = headings[k]
      if (!candidate) continue
      if (candidate.depth <= targetDepth) {
        endLine = candidate.line - 1
        break
      }
    }
    return {
      startLine: h.line,
      endLine,
      content: lines.slice(h.line - 1, endLine).join("\n"),
    }
  }
  return null
}

/**
 * Insert a new Markdown section after a target heading. The new section is
 * appended at the end of the target's content area, immediately before the
 * next heading at the same or shallower depth. Frontmatter (if any) is
 * preserved across the round-trip.
 *
 * @param content - Raw Markdown content to mutate.
 * @param afterHeading - Exact text of the heading to insert after.
 * @param newHeading - Text for the newly inserted heading.
 * @param body - Body paragraphs placed under the new heading.
 * @param level - Markdown heading depth (1-6) for the new heading.
 * @returns Updated Markdown content with the new section in place.
 * @throws Error prefixed `[Hivemind]` when `afterHeading` is not found.
 */
export function insertSectionAst(
  content: string,
  afterHeading: string,
  newHeading: string,
  body: string,
  level: number,
): string {
  if (level < 1 || level > 6) {
    throw new Error(`[Hivemind] md_ast: invalid heading level: ${level}`)
  }
  const parsed = matter(content)
  const lines = parsed.content.split(/\r?\n/)
  const escaped = escapeRegex(afterHeading)
  const insertAt = lines.findIndex((line) =>
    line.match(new RegExp(`^#{1,6}\\s+${escaped}\\s*$`)),
  )
  if (insertAt === -1) {
    throw new Error(`[Hivemind] md_ast: heading not found: ${afterHeading}`)
  }
  const headerLine = lines[insertAt] ?? ""
  const currentLevel = headerLine.match(/^#+/)?.at(0)?.length ?? 1
  let endAt = lines.length
  for (let i = insertAt + 1; i < lines.length; i++) {
    const line = lines[i] ?? ""
    const m = line.match(/^(#+)\s/)
    if (m && m[1] !== undefined && m[1].length <= currentLevel) {
      endAt = i
      break
    }
  }
  const hashes = "#".repeat(level)
  const newSection = `\n${hashes} ${newHeading}\n\n${body}\n`
  const merged = [
    ...lines.slice(0, endAt),
    newSection,
    ...lines.slice(endAt),
  ].join("\n")
  return matter.stringify(merged, parsed.data)
}

/**
 * Re-serialize Markdown content through remark-parse + remark-stringify to
 * obtain canonical formatting, preserving YAML frontmatter across the
 * round-trip.
 *
 * @param content - Raw Markdown content, optionally with frontmatter.
 * @returns Canonical Markdown string with frontmatter restored.
 */
export function stringifyAst(content: string): string {
  const parsed = matter(content)
  const tree = unified().use(remarkParse).use(remarkStringify).processSync(parsed.content)
  return matter.stringify(String(tree), parsed.data)
}

/**
 * Escape a literal string for safe embedding inside a RegExp pattern.
 *
 * @param text - Raw literal to escape.
 * @returns RegExp-safe string with metacharacters backslash-escaped.
 */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
