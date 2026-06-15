import matter from "gray-matter"

import { slugifyHeading } from "./parser.js"

/**
 * A flat heading node extracted from a Markdown document, with a known line
 * range. This is the minimal "I found an ATX heading" data structure — it
 * carries no parent / breadcrumb / tree information. Use `assignHeadingPath`
 * to enrich it, and `buildHeadingTree` to nest it.
 *
 * Public fields:
 * - `level`    — Markdown heading depth (1-6).
 * - `text`     — Plain heading text without leading hash markers.
 * - `startLine` — One-based source line where the heading begins.
 * - `endLine`  — One-based source line where this heading's section ends
 *                (line before the next heading, or end of file for the last).
 * - `slug`     — Stable kebab-case slug suitable for chunk ids / anchors.
 */
export type HeadingNode = {
  level: number
  text: string
  startLine: number
  endLine: number
  slug: string
}

/**
 * A `HeadingNode` enriched with its full breadcrumb path and parent link.
 * This is the canonical "where does this heading sit in the document"
 * structure — every consumer that needs a heading's path or parent reads
 * from here.
 *
 * Public fields (additions over `HeadingNode`):
 * - `headingPath`    — Breadcrumb from document root to this heading (inclusive).
 * - `parentHeading`  — Text of the direct parent heading, or `null` for top-level.
 * - `parentLevel`    — Level of the direct parent heading, or `null` for top-level.
 */
export type HeadingWithPath = HeadingNode & {
  headingPath: string[]
  parentHeading: string | null
  parentLevel: number | null
}

/**
 * A `HeadingWithPath` in tree form — a node with a `children` array of
 * nested `HeadingTreeNode`s. The tree is built from the assigned paths
 * using last-seen-wins parent lookup, so it is consistent with
 * `assignHeadingPath`.
 */
export type HeadingTreeNode = HeadingWithPath & {
  children: HeadingTreeNode[]
}

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/
const CODE_FENCE_PATTERN = /^(```|~~~)/

/**
 * Count frontmatter delimiter block lines so that body heading line numbers
 * reflect their position in the *original* (pre-parse) document, not the
 * post-frontmatter body. Mirrors the helper in `parser.ts` so that
 * `parseHeadings` and the legacy `parseMarkdownDocument` agree on line
 * numbers for the same document.
 *
 * @param content - Raw Markdown content, possibly starting with YAML frontmatter.
 * @returns Number of frontmatter lines including delimiters, or zero when absent.
 */
function countFrontmatterLines(content: string): number {
  const lines = content.split(/\r?\n/)
  if (lines[0] !== "---") return 0
  const endIndex = lines.findIndex((line, index) => index > 0 && line === "---")
  return endIndex === -1 ? 0 : endIndex + 1
}

/**
 * Extract ATX-style Markdown headings in source order. Handles frontmatter
 * (YAML block at the very top of the document — stripped before parsing,
 * with the line offset applied to all reported `startLine`/`endLine` values)
 * and fenced code blocks (lines starting with ` ``` ` or ` ~~~ ` toggle a
 * fence; headings inside the fence are ignored). Setext-style underlined
 * headings and ATX headings inside list items or blockquotes are not
 * detected by this regex-based extractor; consumers needing that should use
 * the remark-based path.
 *
 * @param markdown - Raw Markdown content, optionally with YAML frontmatter.
 * @returns Flat heading list in source order, with line ranges and slugs.
 */
export function parseHeadings(markdown: string): HeadingNode[] {
  const frontmatterLineOffset = countFrontmatterLines(markdown)
  const body = frontmatterLineOffset > 0
    ? matter(markdown).content
    : markdown

  const lines = body.split(/\r?\n/)
  const nodes: HeadingNode[] = []
  let inCodeFence = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""
    if (CODE_FENCE_PATTERN.test(line.trimStart())) {
      inCodeFence = !inCodeFence
      continue
    }
    if (inCodeFence) continue

    const match = HEADING_PATTERN.exec(line)
    if (!match) continue

    const level = match[1]?.length ?? 1
    const text = match[2]?.trim() ?? ""
    nodes.push({
      level,
      text,
      startLine: i + 1 + frontmatterLineOffset,
      endLine: 0, // filled in below
      slug: slugifyHeading(text),
    })
  }

  // Fill endLine for each non-last heading as one less than the next
  // heading's startLine. The last heading extends to the end of the body.
  for (let i = 0; i < nodes.length; i++) {
    const next = nodes[i + 1]
    const current = nodes[i]
    if (!current) continue
    current.endLine = next ? next.startLine - 1 : lines.length + frontmatterLineOffset
  }

  return nodes
}

/**
 * Assign each heading a breadcrumb path using **last-seen-wins** semantics:
 * a heading's parent is the most-recently-encountered heading whose level
 * is strictly less than its own. The algorithm walks the flat heading
 * list once, maintaining a level-keyed breadcrumb stack:
 *
 *   1. Pop the stack while `stack.length >= heading.level` — this drops
 *      the previous sibling and any of *its* descendants that are now
 *      too deep to be the current heading's ancestor.
 *   2. Push the current heading's text onto the stack.
 *   3. The stack (copied) is the heading's breadcrumb; the second-to-top
 *      is its parent.
 *
 * This single algorithm fixes F-14 (correct parent across same-or-higher
 * levels), F-15/NF-08 (no sequential-chain duplicates in `chunk.headingPath`),
 * and NF-06 (every consumer reads from the same source).
 *
 * @param headings - Flat heading list from `parseHeadings`.
 * @returns Same headings, augmented with `headingPath`, `parentHeading`, `parentLevel`.
 */
export function assignHeadingPath(headings: HeadingNode[]): HeadingWithPath[] {
  const stack: string[] = []
  return headings.map((h) => {
    while (stack.length >= h.level) {
      stack.pop()
    }
    stack.push(h.text)
    const parentHeading = stack.length > 1 ? stack[stack.length - 2] ?? null : null
    const parentLevel = stack.length > 1 ? stack.length - 1 : null
    return {
      ...h,
      headingPath: [...stack],
      parentHeading,
      parentLevel,
    }
  })
}

/**
 * Build a heading tree from a list of headings with assigned paths. Uses
 * the same last-seen-wins parent-lookup rule as `assignHeadingPath`, so the
 * tree is consistent with the per-heading `parentHeading` / `headingPath`
 * fields. Top-level headings become roots; their children are appended
 * in source order to the matching parent's `children` array.
 *
 * @param headings - Headings with assigned paths (output of `assignHeadingPath`).
 * @returns Nested tree with each node carrying its full path metadata plus a `children` array.
 */
export function buildHeadingTree(headings: HeadingWithPath[]): HeadingTreeNode[] {
  const tree: HeadingTreeNode[] = []
  const stack: HeadingTreeNode[] = []
  for (const h of headings) {
    const node: HeadingTreeNode = { ...h, children: [] }
    while (stack.length > 0) {
      const top = stack[stack.length - 1]
      if (!top || top.level >= node.level) {
        stack.pop()
      } else {
        break
      }
    }
    if (stack.length === 0) {
      tree.push(node)
    } else {
      const parent = stack[stack.length - 1]
      if (parent) parent.children.push(node)
    }
    stack.push(node)
  }
  return tree
}

/**
 * Find the first heading matching a predicate. Linear scan; returns
 * `undefined` when no heading matches. Duplicate heading text is allowed
 * (both occurrences are kept by `parseHeadings`); this function returns
 * the first match in source order.
 *
 * @param headings - Headings (typically the output of `assignHeadingPath`).
 * @param predicate - Match function over a single heading.
 * @returns The first matching heading, or `undefined`.
 */
export function findHeading(
  headings: HeadingWithPath[],
  predicate: (h: HeadingWithPath) => boolean,
): HeadingWithPath | undefined {
  for (const h of headings) {
    if (predicate(h)) return h
  }
  return undefined
}
