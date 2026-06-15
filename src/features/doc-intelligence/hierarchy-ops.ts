import { readFileSync } from "node:fs"

import { parseDocument } from "./parser.js"
import { assignHeadingPath, parseHeadings, buildHeadingTree as buildHeadingTreeUnified, type HeadingNode, type HeadingTreeNode } from "./heading-index.js"
import { resolveDocPath, toRootRelativePath } from "./safety.js"
import type { DocHeading, DocHeadingTree } from "./types.js"

export type { DocHeadingTree }

/**
 * Generate a Markdown-formatted table of contents from a document's heading hierarchy.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @returns Markdown TOC string with depth-based indentation.
 */
export function generateToc(projectRoot: string, filePath: string): string {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")
  const headings = parseHeadings(content)

  const tocLines: string[] = []
  for (const heading of headings) {
    const indent = "  ".repeat(heading.level - 1)
    tocLines.push(`${indent}- [${heading.text}](#${heading.slug})`)
  }

  return tocLines.join("\n")
}

/**
 * Generate a heading outline returning both flat list and tree structure.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @returns Object with flat heading list and nested tree structure.
 */
export function generateOutline(projectRoot: string, filePath: string): {
  flat: DocHeading[]
  tree: DocHeadingTree[]
} {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")
  parseDocument(toRootRelativePath(projectRoot, absPath), content)
  const withPath = assignHeadingPath(parseHeadings(content))
  const flat: DocHeading[] = withPath.map((h) => ({
    depth: h.level,
    text: h.text,
    line: h.startLine,
    slug: h.slug,
  }))
  return {
    flat,
    tree: buildHeadingTree(flat),
  }
}

/**
 * Build a heading tree where children are nested under their parent headings.
 *
 * Backward-compat adapter: accepts the legacy `DocHeading[]` shape and
 * returns the legacy `DocHeadingTree[]` shape, but internally delegates to
 * the unified `heading-index` module's `buildHeadingTree` so the
 * parent-lookup rule (last-seen-wins) is shared with `chunker`,
 * `indexer-ops`, and `md-ast-ops` (NF-06, F-20).
 *
 * @param headings - Flat heading list in source order (legacy `DocHeading[]`).
 * @returns Headings with nested structure via children arrays.
 */
export function buildHeadingTree(headings: DocHeading[]): DocHeadingTree[] {
  const nodes: HeadingNode[] = headings.map((h) => ({
    level: h.depth,
    text: h.text,
    startLine: h.line,
    endLine: h.line,
    slug: h.slug,
  }))
  const withPath = assignHeadingPath(nodes)
  const tree = buildHeadingTreeUnified(withPath)
  return tree.map(toLegacyTree)
}

function toLegacyTree(node: HeadingTreeNode): DocHeadingTree {
  return {
    depth: node.level,
    text: node.text,
    line: node.startLine,
    slug: node.slug,
    children: node.children.map(toLegacyTree),
  }
}
