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

function estimateTokens(content: string): number {
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

export class DocWeaver {
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

  patchSection(content: string, heading: string, newContent: string): string {
    const tree = remark().parse(content) as Root
    const headings = tree.children
      .filter((node): node is Heading => node.type === "heading")
      .map((node) => ({ node, text: headingText(node) }))

    const currentIndex = headings.findIndex((entry) => entry.text === heading)
    if (currentIndex === -1) return content

    const current = headings[currentIndex]
    const currentStart = current.node.position?.start.offset ?? 0
    const sectionBodyStart = current.node.position?.end.offset ?? currentStart
    let sectionEnd = content.length

    for (let i = currentIndex + 1; i < headings.length; i++) {
      const candidate = headings[i]
      if (candidate.node.depth <= current.node.depth) {
        sectionEnd = candidate.node.position?.start.offset ?? sectionEnd
        break
      }
    }

    const headingLine = content.slice(currentStart, sectionBodyStart)
    const patchedBody = normalizeSectionBody(newContent)
    return `${content.slice(0, currentStart)}${headingLine}${patchedBody}${content.slice(sectionEnd)}`
  }

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
