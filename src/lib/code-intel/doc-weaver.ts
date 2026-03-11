import { remark } from "remark"
import { visit } from "unist-util-visit"
import type { Heading, Root } from "mdast"

export interface HeadingHierarchy {
  level: number
  text: string
  line: number
  children: HeadingHierarchy[]
}

export interface DocumentChunk {
  heading: string
  level: number
  content: string
  startOffset: number
  endOffset: number
  tokenEstimate: number
}

/**
 * Estimate the number of LLM tokens for a given string (rough ~4 chars/token).
 *
 * @param content - Raw text content.
 * @returns Estimated token count (minimum 1).
 */
export function estimateTokens(content: string): number {
  return Math.max(1, Math.ceil(content.length / 4))
}

function headingText(node: Heading): string {
  const pieces: string[] = []
  visit(node, "text", (child) => {
    if (typeof child.value === "string") pieces.push(child.value)
  })
  return pieces.join(" ").trim()
}

function normalizeSectionBody(newContent: string): string {
  const trimmed = newContent.trim()
  if (!trimmed) return "\n"
  return `\n${trimmed}\n\n`
}

// ─── Frontmatter Helpers ──────────────────────────────────────────────────────

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

/**
 * Parse YAML frontmatter into a key/value record.
 * Only handles simple single-line `key: value` pairs (no nested YAML).
 *
 * @param raw - The raw frontmatter body between the `---` fences.
 * @returns Parsed key/value record.
 */
function parseFrontmatter(raw: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.*)$/)
    if (match) {
      result[match[1].trim()] = match[2].trim()
    }
  }
  return result
}

/**
 * Serialize a key/value record into YAML frontmatter format.
 *
 * @param metadata - Key/value record to serialize.
 * @returns Frontmatter string including the `---` fences.
 */
function serializeFrontmatter(metadata: Record<string, string>): string {
  const lines = Object.entries(metadata).map(([key, value]) => `${key}: ${value}`)
  return `---\n${lines.join("\n")}\n---\n`
}

// ─── Section Boundary Resolution ──────────────────────────────────────────────

interface SectionBoundary {
  headingStart: number
  bodyStart: number
  sectionEnd: number
  depth: number
}

/**
 * Find the offset boundaries of a section identified by heading text.
 *
 * @param content - Full document content.
 * @param heading - Exact heading text to find.
 * @returns Section boundaries or null if the heading is not found.
 */
function findSectionBoundary(content: string, heading: string): SectionBoundary | null {
  const tree = remark().parse(content) as Root
  const headings = tree.children
    .filter((node): node is Heading => node.type === "heading")
    .map((node) => ({ node, text: headingText(node) }))

  const idx = headings.findIndex((entry) => entry.text === heading)
  if (idx === -1) return null

  const current = headings[idx]
  const headingStart = current.node.position?.start.offset ?? 0
  const bodyStart = current.node.position?.end.offset ?? headingStart
  let sectionEnd = content.length

  for (let i = idx + 1; i < headings.length; i++) {
    if (headings[i].node.depth <= current.node.depth) {
      sectionEnd = headings[i].node.position?.start.offset ?? sectionEnd
      break
    }
  }

  return { headingStart, bodyStart, sectionEnd, depth: current.node.depth }
}

export class DocWeaver {
  /**
   * Parse document content into a heading hierarchy tree.
   *
   * @param content - Raw markdown content.
   * @returns Nested heading hierarchy with line numbers.
   */
  readOutline(content: string): HeadingHierarchy[] {
    const tree = remark().parse(content) as Root
    const result: HeadingHierarchy[] = []
    const stack: HeadingHierarchy[] = []

    visit(tree, "heading", (node: Heading) => {
      const current: HeadingHierarchy = {
        level: node.depth,
        text: headingText(node),
        line: node.position?.start.line ?? 1,
        children: [],
      }

      while (stack.length > 0 && stack[stack.length - 1].level >= current.level) {
        stack.pop()
      }

      if (stack.length === 0) {
        result.push(current)
      } else {
        stack[stack.length - 1].children.push(current)
      }

      stack.push(current)
    })

    return result
  }

  /**
   * Replace the body of a section identified by heading text.
   *
   * @param content - Full document content.
   * @param heading - Exact heading text to target.
   * @param newContent - Replacement section body.
   * @returns Modified document content, or the original if heading not found.
   */
  patchSection(content: string, heading: string, newContent: string): string {
    const boundary = findSectionBoundary(content, heading)
    if (!boundary) return content

    const headingLine = content.slice(boundary.headingStart, boundary.bodyStart)
    const patchedBody = normalizeSectionBody(newContent)
    return `${content.slice(0, boundary.headingStart)}${headingLine}${patchedBody}${content.slice(boundary.sectionEnd)}`
  }

  /**
   * Replace a section body if the heading exists, or append a new heading block
   * to the end of the document when it does not.
   *
   * @param content - Full document content.
   * @param heading - Exact heading text to target or create.
   * @param newContent - Replacement section body.
   * @param level - Heading depth to use when creating a new section.
   * @returns Modified document content.
   */
  upsertSection(content: string, heading: string, newContent: string, level = 2): string {
    const patched = this.patchSection(content, heading, newContent)
    if (patched !== content) return patched

    const depth = Math.max(1, Math.min(6, level))
    const normalizedHeading = `${"#".repeat(depth)} ${heading}`
    const prefix = content.trimEnd()
    const body = normalizeSectionBody(newContent)

    if (!prefix) {
      return `${normalizedHeading}${body}`
    }

    return `${prefix}\n\n${normalizedHeading}${body}`
  }

  /**
   * Read the body content of a section identified by heading text.
   *
   * @param content - Full document content.
   * @param heading - Exact heading text to target.
   * @returns Section body text (without the heading line), or null if not found.
   */
  readSectionContent(content: string, heading: string): string | null {
    const boundary = findSectionBoundary(content, heading)
    if (!boundary) return null
    return content.slice(boundary.bodyStart, boundary.sectionEnd).trim()
  }

  /**
   * Append content to the end of a section body without replacing existing content.
   *
   * @param content - Full document content.
   * @param heading - Exact heading text to target.
   * @param appendContent - Content to append to the section body.
   * @returns Modified document content, or the original if heading not found.
   */
  appendToSection(content: string, heading: string, appendContent: string): string {
    const boundary = findSectionBoundary(content, heading)
    if (!boundary) return content

    const existingBody = content.slice(boundary.bodyStart, boundary.sectionEnd)
    const trimmedExisting = existingBody.trimEnd()
    const trimmedAppend = appendContent.trim()
    if (!trimmedAppend) return content

    const headingLine = content.slice(boundary.headingStart, boundary.bodyStart)
    const mergedBody = trimmedExisting.length > 0
      ? `\n${trimmedExisting}\n\n${trimmedAppend}\n\n`
      : `\n${trimmedAppend}\n\n`

    return `${content.slice(0, boundary.headingStart)}${headingLine}${mergedBody}${content.slice(boundary.sectionEnd)}`
  }

  /**
   * Insert a new section after the section identified by a heading.
   *
   * @param content - Full document content.
   * @param afterHeading - Heading text of the section after which to insert.
   * @param newHeading - Heading text for the new section.
   * @param level - Heading level (1–6) for the new section.
   * @param body - Body content for the new section.
   * @returns Modified document content, or the original if afterHeading not found.
   */
  insertAfterSection(content: string, afterHeading: string, newHeading: string, level: number, body: string): string {
    const boundary = findSectionBoundary(content, afterHeading)
    if (!boundary) return content

    const depth = Math.max(1, Math.min(6, level))
    const prefix = "#".repeat(depth)
    const newSection = `${prefix} ${newHeading}${normalizeSectionBody(body)}`

    return `${content.slice(0, boundary.sectionEnd)}${newSection}${content.slice(boundary.sectionEnd)}`
  }

  /**
   * Delete an entire section (heading + body) from the document.
   *
   * @param content - Full document content.
   * @param heading - Exact heading text to delete.
   * @returns Modified document content, or the original if heading not found.
   */
  deleteSection(content: string, heading: string): string {
    const boundary = findSectionBoundary(content, heading)
    if (!boundary) return content
    return `${content.slice(0, boundary.headingStart)}${content.slice(boundary.sectionEnd)}`
  }

  /**
   * Extract YAML frontmatter from a document as a key/value record.
   *
   * @param content - Full document content (may or may not have frontmatter).
   * @returns Parsed frontmatter record, or null if no frontmatter is present.
   */
  readFrontmatter(content: string): Record<string, string> | null {
    const match = content.match(FRONTMATTER_REGEX)
    if (!match) return null
    return parseFrontmatter(match[1])
  }

  /**
   * Write or update YAML frontmatter on a document.
   * Merges new values into existing frontmatter, or creates a new block.
   *
   * @param content - Full document content.
   * @param metadata - Key/value pairs to set in the frontmatter.
   * @returns Modified document content with updated frontmatter.
   */
  writeFrontmatter(content: string, metadata: Record<string, string>): string {
    const existing = this.readFrontmatter(content)
    const merged = { ...existing, ...metadata }

    if (content.match(FRONTMATTER_REGEX)) {
      return content.replace(FRONTMATTER_REGEX, serializeFrontmatter(merged))
    }
    return `${serializeFrontmatter(merged)}\n${content}`
  }

  /**
   * Split a document into token-budget-aware chunks by heading.
   *
   * @param content - Full document content.
   * @param maxChunkTokens - Maximum tokens per chunk.
   * @returns Array of document chunks with heading, content, and token estimates.
   */
  chunkByHeadings(content: string, maxChunkTokens: number): DocumentChunk[] {
    const budget = Math.max(1, maxChunkTokens)
    const tree = remark().parse(content) as Root
    const headings = tree.children
      .filter((node): node is Heading => node.type === "heading")
      .map((node) => ({
        node,
        text: headingText(node),
        start: node.position?.start.offset ?? 0,
      }))

    if (headings.length === 0) {
      return [{
        heading: "(root)",
        level: 0,
        content,
        startOffset: 0,
        endOffset: content.length,
        tokenEstimate: estimateTokens(content),
      }]
    }

    const chunks: DocumentChunk[] = []

    for (let i = 0; i < headings.length; i++) {
      const current = headings[i]
      const end = i + 1 < headings.length ? headings[i + 1].start : content.length
      const section = content.slice(current.start, end)
      const sectionTokens = estimateTokens(section)

      if (sectionTokens <= budget) {
        chunks.push({
          heading: current.text,
          level: current.node.depth,
          content: section,
          startOffset: current.start,
          endOffset: end,
          tokenEstimate: sectionTokens,
        })
        continue
      }

      let cursor = current.start
      let remainder = section
      while (remainder.length > 0) {
        const maxChars = Math.max(20, budget * 4)
        const splitAt = Math.min(remainder.length, maxChars)
        const piece = remainder.slice(0, splitAt)
        const pieceStart = cursor
        const pieceEnd = cursor + piece.length

        chunks.push({
          heading: current.text,
          level: current.node.depth,
          content: piece,
          startOffset: pieceStart,
          endOffset: pieceEnd,
          tokenEstimate: estimateTokens(piece),
        })

        cursor = pieceEnd
        remainder = remainder.slice(splitAt)
      }
    }

    return chunks
  }
}
