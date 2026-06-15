import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  extractHeadingsAst,
  findSectionByPathAst,
  insertSectionAst,
  stringifyAst,
  type AstHeading,
} from "../../../src/features/doc-intelligence/index.js"

/**
 * Tests for the remark-based Markdown AST operations module.
 *
 * These tests use REAL remark/remark-parse/remark-stringify/unist-util-visit
 * (no mocks) and real temp files for round-trip verification. They cover:
 *  - extractHeadingsAst: heading tree with path[], depth, line
 *  - findSectionByPathAst: locate section by breadcrumb path
 *  - insertSectionAst: insert new section after a target heading
 *  - stringifyAst: round-trip with frontmatter preserved
 *  - Heading path reconstruction: H1 -> H2 -> H3 -> H4 deep nesting
 */
describe("md-ast-ops (remark AST)", () => {
  let tmpDir: string
  let fixturePath: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "md-ast-ops-"))
    fixturePath = join(tmpDir, "doc.md")
  })

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  describe("extractHeadingsAst", () => {
    it("returns heading tree with path[], depth, line, text, slug", () => {
      const content = [
        "# Chapter 1: Getting Started",
        "",
        "Intro text",
        "",
        "## Installation",
        "",
        "Install steps",
        "",
        "## Configuration",
        "",
        "Config details",
        "",
        "# Chapter 2: Architecture",
        "",
        "## Components",
        "",
        "### API Service",
        "",
        "#### Endpoints",
        "",
        "Endpoint list",
      ].join("\n")

      const headings = extractHeadingsAst(content)

      expect(headings.length).toBe(7)
      const first = headings[0] as AstHeading
      expect(first.depth).toBe(1)
      expect(first.text).toBe("Chapter 1: Getting Started")
      expect(first.line).toBe(1)
      expect(first.path).toEqual(["Chapter 1: Getting Started"])
      expect(first.parentHeading).toBeNull()

      const second = headings[1] as AstHeading
      expect(second.depth).toBe(2)
      expect(second.text).toBe("Installation")
      expect(second.path).toEqual(["Chapter 1: Getting Started", "Installation"])
      expect(second.parentHeading).toBe("Chapter 1: Getting Started")
    })

    it("reconstructs deeply nested heading path H1 -> H2 -> H3 -> H4", () => {
      const content = [
        "# Chapter 2: Architecture",
        "",
        "## Components",
        "",
        "### API Service",
        "",
        "#### Endpoints",
        "",
        "List of endpoints.",
      ].join("\n")

      const headings = extractHeadingsAst(content)

      expect(headings.length).toBe(4)
      const h4 = headings[3] as AstHeading
      expect(h4.depth).toBe(4)
      expect(h4.path).toEqual([
        "Chapter 2: Architecture",
        "Components",
        "API Service",
        "Endpoints",
      ])
      expect(h4.parentHeading).toBe("API Service")
    })

    it("preserves line numbers from source", () => {
      const content = [
        "preamble",
        "",
        "# First",
        "",
        "body",
        "",
        "## Second",
        "",
        "more body",
      ].join("\n")

      const headings = extractHeadingsAst(content)

      expect(headings[0]?.line).toBe(3)
      expect(headings[1]?.line).toBe(7)
    })

    it("returns empty array when no headings exist", () => {
      const content = "Just plain text\nwith no headings at all.\n"
      const headings = extractHeadingsAst(content)
      expect(headings).toEqual([])
    })

    it("ignores frontmatter delimiter lines", () => {
      const content = [
        "---",
        "title: My Doc",
        "---",
        "",
        "# Heading After Frontmatter",
        "",
        "Body",
      ].join("\n")

      const headings = extractHeadingsAst(content)

      expect(headings.length).toBe(1)
      const h = headings[0] as AstHeading
      expect(h.text).toBe("Heading After Frontmatter")
      // Line should be after frontmatter (4 closing --- + blank = 5)
      expect(h.line).toBeGreaterThan(3)
    })
  })

  describe("findSectionByPathAst", () => {
    const nestedContent = [
      "# Top Level",
      "",
      "Top body",
      "",
      "## Second Level",
      "",
      "Second body",
      "",
      "## Other Second",
      "",
      "Other body",
      "",
      "# Another Top",
      "",
      "Another top body",
    ].join("\n")

    it("finds a section by single-element path", () => {
      const result = findSectionByPathAst(nestedContent, ["Top Level"])
      expect(result).not.toBeNull()
      expect(result?.content).toContain("Top body")
      expect(result?.content).toContain("## Second Level")
    })

    it("finds a nested section by full breadcrumb path", () => {
      const result = findSectionByPathAst(nestedContent, ["Top Level", "Other Second"])
      expect(result).not.toBeNull()
      expect(result?.content).toContain("Other body")
      expect(result?.content).not.toContain("Second body")
    })

    it("returns null when path does not match", () => {
      const result = findSectionByPathAst(nestedContent, ["Top Level", "Missing Section"])
      expect(result).toBeNull()
    })

    it("returns null for empty path", () => {
      const result = findSectionByPathAst(nestedContent, [])
      expect(result).toBeNull()
    })

    it("bounds section to the next heading at same or shallower depth", () => {
      const result = findSectionByPathAst(nestedContent, ["Top Level", "Second Level"])
      expect(result).not.toBeNull()
      expect(result?.content).toContain("Second body")
      // Should NOT include content from "Other Second" section
      expect(result?.content).not.toContain("Other body")
    })
  })

  describe("insertSectionAst", () => {
    const baseContent = [
      "# Top",
      "",
      "Top body",
      "",
      "## Child A",
      "",
      "A body",
      "",
      "## Child B",
      "",
      "B body",
    ].join("\n")

    it("inserts a new section after the target heading at same level", () => {
      const result = insertSectionAst(baseContent, "Child A", "Child A.5", "New content", 2)
      expect(result).toContain("## Child A.5")
      expect(result).toContain("New content")
      // Original sections preserved
      expect(result).toContain("## Child A")
      expect(result).toContain("## Child B")
    })

    it("preserves the order: new section between A and B", () => {
      const result = insertSectionAst(baseContent, "Child A", "Child A.5", "New content", 2)
      const aPos = result.indexOf("## Child A")
      const newPos = result.indexOf("## Child A.5")
      const bPos = result.indexOf("## Child B")
      expect(aPos).toBeGreaterThan(-1)
      expect(newPos).toBeGreaterThan(aPos)
      expect(bPos).toBeGreaterThan(newPos)
    })

    it("inserts a nested H3 under a section", () => {
      const result = insertSectionAst(baseContent, "Child A", "Sub Item", "Nested content", 3)
      expect(result).toContain("### Sub Item")
      expect(result).toContain("Nested content")
    })

    it("throws [Hivemind] prefixed error when target heading not found", () => {
      expect(() => {
        insertSectionAst(baseContent, "Nonexistent", "New", "Body", 2)
      }).toThrow(/^\[Hivemind\]/)
    })

    it("round-trips through a real temp file", () => {
      writeFileSync(fixturePath, baseContent, "utf-8")
      const readBack = readFileSync(fixturePath, "utf-8")
      const result = insertSectionAst(readBack, "Child A", "Child A.5", "Persisted", 2)
      writeFileSync(fixturePath, result, "utf-8")
      const final = readFileSync(fixturePath, "utf-8")
      expect(final).toContain("## Child A.5")
      expect(final).toContain("Persisted")
    })
  })

  describe("stringifyAst (round-trip)", () => {
    it("round-trips markdown content preserving structure", () => {
      const content = [
        "# Title",
        "",
        "Paragraph with **bold** and *italic*.",
        "",
        "## Section",
        "",
        "- item 1",
        "- item 2",
      ].join("\n")

      const result = stringifyAst(content)
      expect(result).toContain("# Title")
      expect(result).toContain("## Section")
      expect(result).toContain("**bold**")
      // remark-stringify may canonicalize bullet markers (- <-> *); accept either
      expect(result).toMatch(/[-*] item 1/)
      expect(result).toMatch(/[-*] item 2/)
    })

    it("preserves frontmatter through parse/stringify round-trip", () => {
      const content = [
        "---",
        "title: My Document",
        "author: tester",
        "tags:",
        "  - alpha",
        "  - beta",
        "---",
        "",
        "# Heading",
        "",
        "Body text.",
      ].join("\n")

      const result = stringifyAst(content)
      expect(result).toContain("title: My Document")
      expect(result).toContain("author: tester")
      expect(result).toContain("alpha")
      expect(result).toContain("beta")
      expect(result).toContain("# Heading")
    })

    it("handles content without frontmatter", () => {
      const content = "# Plain\n\nNo frontmatter here.\n"
      const result = stringifyAst(content)
      expect(result).toContain("# Plain")
      expect(result).toContain("No frontmatter here.")
    })
  })

  describe("integration: extract + find + insert", () => {
    it("end-to-end: extract headings, find a section, insert a new one", () => {
      const content = [
        "---",
        "title: Integration Test",
        "---",
        "",
        "# Chapter 1",
        "",
        "Intro",
        "",
        "## Subsection A",
        "",
        "A content",
        "",
        "## Subsection B",
        "",
        "B content",
      ].join("\n")

      // 1. Extract headings
      const headings = extractHeadingsAst(content)
      expect(headings.length).toBe(3)

      // 2. Find Subsection A
      const section = findSectionByPathAst(content, ["Chapter 1", "Subsection A"])
      expect(section?.content).toContain("A content")

      // 3. Insert new section after Subsection A
      const updated = insertSectionAst(content, "Subsection A", "Subsection A.5", "Inserted body", 2)
      expect(updated).toContain("Subsection A.5")
      expect(updated).toContain("Inserted body")
      // Frontmatter preserved
      expect(updated).toContain("title: Integration Test")
    })
  })
})
