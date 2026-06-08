import { readFileSync } from "node:fs"

import { parseDocument } from "./parser.js"
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
  const parsed = parseDocument(toRootRelativePath(projectRoot, absPath), content)

  const tocLines: string[] = []
  for (const heading of parsed.outline) {
    const indent = "  ".repeat(heading.depth - 1)
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
  const parsed = parseDocument(toRootRelativePath(projectRoot, absPath), content)
  return {
    flat: parsed.outline,
    tree: buildHeadingTree(parsed.outline),
  }
}

/**
 * Build a heading tree where children are nested under their parent headings.
 *
 * @param headings - Flat heading list in source order.
 * @returns Headings with nested structure via children arrays.
 */
export function buildHeadingTree(headings: DocHeading[]): DocHeadingTree[] {
  const tree: DocHeadingTree[] = []
  const stack: DocHeadingTree[] = []

  for (const heading of headings) {
    const node: DocHeadingTree = { ...heading, children: [] }

    // Pop stack until we find the parent
    while (stack.length > 0 && stack[stack.length - 1].depth >= heading.depth) {
      stack.pop()
    }

    if (stack.length === 0) {
      tree.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  }

  return tree
}

// DocHeadingTree is defined in types.ts and re-exported above.
