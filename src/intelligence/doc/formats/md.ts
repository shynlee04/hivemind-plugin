import { remark } from 'remark'
import { visit } from 'unist-util-visit'
import type { Heading, Root } from 'mdast'

import type { DocumentChunk, HeadingHierarchy } from '../types.js'

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

function stripFrontmatter(content: string): string {
  return content.replace(FRONTMATTER_REGEX, '')
}

export function estimateTokens(content: string): number {
  return Math.max(1, Math.ceil(content.length / 4))
}

function headingText(node: Heading): string {
  const pieces: string[] = []
  visit(node, 'text', (child) => {
    if (typeof child.value === 'string') {
      pieces.push(child.value)
    }
  })
  return pieces.join(' ').trim()
}

interface SectionHeading {
  depth: number
  text: string
  startOffset: number
  line: number
}

function listSectionHeadings(content: string): SectionHeading[] {
  const markdownContent = stripFrontmatter(content)
  const tree = remark().parse(markdownContent) as Root
  const headings: SectionHeading[] = []

  visit(tree, 'heading', (node: Heading) => {
    headings.push({
      depth: node.depth,
      text: headingText(node),
      startOffset: node.position?.start.offset ?? 0,
      line: node.position?.start.line ?? 1,
    })
  })

  return headings
}

export function readMarkdownOutline(content: string): HeadingHierarchy[] {
  const markdownContent = stripFrontmatter(content)
  const tree = remark().parse(markdownContent) as Root
  const result: HeadingHierarchy[] = []
  const stack: HeadingHierarchy[] = []

  visit(tree, 'heading', (node: Heading) => {
    const current: HeadingHierarchy = {
      level: node.depth,
      text: headingText(node),
      line: node.position?.start.line ?? 1,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1]?.level >= current.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      result.push(current)
    } else {
      stack[stack.length - 1]?.children.push(current)
    }

    stack.push(current)
  })

  return result
}

export function readMarkdownMetadata(content: string): Record<string, string> | null {
  const match = content.match(FRONTMATTER_REGEX)
  if (!match) {
    return null
  }

  const metadata: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const parts = line.match(/^([^:]+):\s*(.*)$/)
    if (parts) {
      metadata[parts[1].trim()] = parts[2].trim()
    }
  }

  return metadata
}

export function readMarkdownSection(content: string, heading: string): string | null {
  const markdownContent = stripFrontmatter(content)
  const headings = listSectionHeadings(markdownContent)
  const currentIndex = headings.findIndex((entry) => entry.text === heading)
  if (currentIndex === -1) {
    return null
  }

  const current = headings[currentIndex]
  const lines = markdownContent.split('\n')
  const startLineIndex = current.line
  let endLineIndex = lines.length

  for (let index = currentIndex + 1; index < headings.length; index += 1) {
    const next = headings[index]
    if (next && next.depth <= current.depth) {
      endLineIndex = next.line - 1
      break
    }
  }

  return lines.slice(startLineIndex, endLineIndex).join('\n').trim()
}

export function chunkMarkdownSections(content: string, maxTokens: number): DocumentChunk[] {
  const markdownContent = stripFrontmatter(content)
  const headings = listSectionHeadings(markdownContent)
  const lines = markdownContent.split('\n')
  const budget = Math.max(1, maxTokens)

  if (headings.length === 0) {
    return [{
      heading: null,
      content: markdownContent,
      tokenEstimate: estimateTokens(markdownContent),
      startLine: 1,
      endLine: lines.length,
    }]
  }

  const chunks: DocumentChunk[] = []
  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index]
    const next = headings[index + 1]
    const startLine = current.line
    const endLine = next ? next.line - 1 : lines.length
    const sectionContent = lines.slice(startLine - 1, endLine).join('\n')
    const tokenEstimate = estimateTokens(sectionContent)

    if (tokenEstimate <= budget) {
      chunks.push({
        heading: current.text,
        content: sectionContent,
        tokenEstimate,
        startLine,
        endLine,
      })
      continue
    }

    const maxChars = Math.max(20, budget * 4)
    let chunkStartLine = startLine
    let remaining = sectionContent
    while (remaining.length > 0) {
      const piece = remaining.slice(0, maxChars)
      const pieceLineCount = piece.split('\n').length
      chunks.push({
        heading: current.text,
        content: piece,
        tokenEstimate: estimateTokens(piece),
        startLine: chunkStartLine,
        endLine: chunkStartLine + pieceLineCount - 1,
      })
      remaining = remaining.slice(maxChars)
      chunkStartLine += pieceLineCount
    }
  }

  return chunks
}
