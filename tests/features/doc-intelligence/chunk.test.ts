import { describe, it, expect } from "vitest"

import { chunkMarkdownDocument } from "../../../src/features/doc-intelligence/index.js"

describe("chunk", () => {
  const content = "# Intro\n\nHello\n\n## Section 1\n\nContent A\n\n## Section 2\n\nContent B\n\n## Section 3\n\nContent C\n"

  it("splits document into heading-aware chunks", () => {
    const chunks = chunkMarkdownDocument("test.md", content)
    expect(chunks.length).toBeGreaterThanOrEqual(4)
    expect(chunks[0].heading).toBe("Intro")
    expect(chunks[1].heading).toBe("Section 1")
  })

  it("produces deterministic chunk IDs", () => {
    const chunks1 = chunkMarkdownDocument("test.md", content)
    const chunks2 = chunkMarkdownDocument("test.md", content)
    expect(chunks1.map((c) => c.id)).toEqual(chunks2.map((c) => c.id))
  })

  it("includes all required fields", () => {
    const chunks = chunkMarkdownDocument("test.md", content)
    const chunk = chunks[0]
    expect(chunk.id).toBeDefined()
    expect(chunk.path).toBe("test.md")
    expect(chunk.index).toBeGreaterThan(0)
    expect(chunk.startLine).toBeGreaterThan(0)
    expect(chunk.endLine).toBeGreaterThan(0)
    expect(chunk.content).toBeDefined()
    expect(chunk.characterCount).toBeGreaterThan(0)
    expect(chunk.estimatedTokens).toBeGreaterThan(0)
  })
})
