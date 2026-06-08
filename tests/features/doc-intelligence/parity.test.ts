import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { executeDocIntelligenceAction } from "../../../src/features/doc-intelligence/index.js"

function createTempWorkspace(): { root: string; cleanup: () => void } {
  const root = mkdtempSync(join(tmpdir(), "doc-parity-"))
  writeFileSync(join(root, "readme.md"), "---\ntitle: Test\n---\n# Test\n\nHello world\n\n## Section 1\n\nContent here\n\n## Section 2\n\nMore content\n")
  writeFileSync(join(root, "other.md"), "# Other\n\nSome text\n")
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) }
}

describe("parity — 5 original actions", () => {
  it("skim: returns document metadata with outline, frontmatter, title", async () => {
    const { root, cleanup } = createTempWorkspace()
    try {
      const result = await Promise.resolve(executeDocIntelligenceAction(root, { action: "skim", path: "readme.md" }))
      expect(result.action).toBe("skim")
      if (result.action === "skim") {
        expect(result.document.title).toBe("Test")
        expect(result.document.outline.length).toBeGreaterThanOrEqual(3)
        expect(result.document.frontmatter).toBeDefined()
        expect(result.document.wordCount).toBeGreaterThan(0)
        expect(result.document.characterCount).toBeGreaterThan(0)
      }
    } finally {
      cleanup()
    }
  })

  it("skim_directory: returns documents sorted by path", async () => {
    const { root, cleanup } = createTempWorkspace()
    try {
      const result = await Promise.resolve(executeDocIntelligenceAction(root, { action: "skim_directory", path: "." }))
      expect(result.action).toBe("skim_directory")
      if (result.action === "skim_directory") {
        expect(result.documents.length).toBeGreaterThanOrEqual(2)
        const paths = result.documents.map((d) => d.path)
        expect([...paths].sort()).toEqual(paths)
      }
    } finally {
      cleanup()
    }
  })

  it("read: returns content with character count and truncation signal", async () => {
    const { root, cleanup } = createTempWorkspace()
    try {
      const result = await Promise.resolve(executeDocIntelligenceAction(root, { action: "read", path: "readme.md" }))
      expect(result.action).toBe("read")
      if (result.action === "read") {
        expect(result.content).toBeTruthy()
        expect(result.characterCount).toBeGreaterThan(0)
        expect(typeof result.truncated).toBe("boolean")
        expect(result.path).toBe("readme.md")
      }
    } finally {
      cleanup()
    }
  })

  it("chunk: returns heading-aware chunks with required fields", async () => {
    const { root, cleanup } = createTempWorkspace()
    try {
      const result = await Promise.resolve(executeDocIntelligenceAction(root, { action: "chunk", path: "readme.md" }))
      expect(result.action).toBe("chunk")
      if (result.action === "chunk") {
        expect(result.chunks.length).toBeGreaterThan(0)
        const chunk = result.chunks[0]
        expect(chunk.id).toBeDefined()
        expect(chunk.path).toBe("readme.md")
        expect(chunk.heading).toBeDefined()
        expect(chunk.characterCount).toBeGreaterThan(0)
        expect(chunk.estimatedTokens).toBeGreaterThan(0)
      }
    } finally {
      cleanup()
    }
  })

  it("search: returns matches with path, line, snippet, heading context", async () => {
    const { root, cleanup } = createTempWorkspace()
    try {
      const result = await Promise.resolve(executeDocIntelligenceAction(root, { action: "search", path: ".", query: "Content" }))
      expect(result.action).toBe("search")
      if (result.action === "search") {
        expect(result.matches.length).toBeGreaterThan(0)
        const match = result.matches[0]
        expect(match.path).toBeDefined()
        expect(match.line).toBeGreaterThan(0)
        expect(match.snippet).toBeDefined()
        expect(match).toHaveProperty("heading")
      }
    } finally {
      cleanup()
    }
  })
})
