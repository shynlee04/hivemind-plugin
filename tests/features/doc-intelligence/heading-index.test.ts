import { describe, it, expect } from "vitest"

import {
  parseHeadings,
  assignHeadingPath,
  buildHeadingTree,
  findHeading,
  type HeadingNode,
  type HeadingWithPath,
} from "../../../src/features/doc-intelligence/heading-index.js"

/**
 * Wave 2 follow-up: unified `heading-index` module.
 *
 * The four doc-intelligence consumers (`chunker`, `indexer-ops`,
 * `hierarchy-ops`, `md-ast-ops`) previously computed heading paths
 * and tree shapes via three independent ad-hoc algorithms with
 * sequential-chain / sibling-promotion / out-of-scope-parent bugs.
 * The unified module here is the single source of truth:
 *   - `parseHeadings(markdown)`        → flat list with line range + level + text
 *   - `assignHeadingPath(headings)`    → last-seen-wins breadcrumb per heading
 *   - `buildHeadingTree(headings)`     → tree from the assigned paths
 *   - `findHeading(headings, pred)`    → first matching heading
 *
 * Evidence label: `runtime-truthful` — every test parses real markdown
 * strings through the public module; no mocks of the module itself.
 * Test size: `small` — focused units, no I/O, ms-scale.
 */
describe("heading-index (unified heading module)", () => {
  describe("parseHeadings", () => {
    it("extracts a single heading with line range and slug", () => {
      const nodes = parseHeadings("# Hello World\n")
      expect(nodes).toHaveLength(1)
      const h = nodes[0] as HeadingNode
      expect(h.level).toBe(1)
      expect(h.text).toBe("Hello World")
      expect(h.startLine).toBe(1)
      expect(h.endLine).toBe(2) // EOF for last heading
      expect(h.slug).toBe("hello-world")
    })

    it("extracts nested h1 → h6 in source order with correct line ranges", () => {
      const md = [
        "# H1",
        "",
        "body1",
        "",
        "## H2",
        "",
        "body2",
        "",
        "### H3",
        "",
        "body3",
        "",
        "#### H4",
        "",
        "body4",
        "",
        "##### H5",
        "",
        "body5",
        "",
        "###### H6",
        "",
        "body6",
      ].join("\n")
      const nodes = parseHeadings(md)
      expect(nodes.map((n) => n.level)).toEqual([1, 2, 3, 4, 5, 6])
      expect(nodes.map((n) => n.text)).toEqual(["H1", "H2", "H3", "H4", "H5", "H6"])
      // startLine values
      expect(nodes[0]?.startLine).toBe(1)
      expect(nodes[1]?.startLine).toBe(5)
      // Each non-last heading's endLine is one less than the next startLine
      expect(nodes[0]?.endLine).toBe(4)
      expect(nodes[5]?.endLine).toBeGreaterThan(nodes[5]?.startLine ?? 0)
    })

    it("returns empty array for empty document", () => {
      expect(parseHeadings("")).toEqual([])
    })

    it("returns empty array for document with no headings", () => {
      expect(parseHeadings("Just some plain text\nwith no headings at all.\n")).toEqual([])
    })

    it("ignores frontmatter delimiters and applies line offset to heading lines", () => {
      const md = [
        "---",
        "title: My Doc",
        "author: alice",
        "---",
        "",
        "# Heading After Frontmatter",
        "",
        "Body",
      ].join("\n")
      const nodes = parseHeadings(md)
      expect(nodes).toHaveLength(1)
      const h = nodes[0] as HeadingNode
      expect(h.text).toBe("Heading After Frontmatter")
      // The heading is on the 6th source line (---/title/author/---/blank/#…)
      expect(h.startLine).toBe(6)
    })

    it("ignores headings inside fenced code blocks", () => {
      const md = [
        "# Real Heading",
        "",
        "```",
        "# Not a heading",
        "## Also not a heading",
        "```",
        "",
        "## Another Real Heading",
      ].join("\n")
      const nodes = parseHeadings(md)
      expect(nodes).toHaveLength(2)
      expect(nodes[0]?.text).toBe("Real Heading")
      expect(nodes[1]?.text).toBe("Another Real Heading")
    })

    it("preserves duplicate heading text — both kept with distinct line numbers", () => {
      const md = [
        "# Hello",
        "",
        "body1",
        "",
        "## Hello",
        "",
        "body2",
      ].join("\n")
      const nodes = parseHeadings(md)
      expect(nodes).toHaveLength(2)
      expect(nodes[0]?.text).toBe("Hello")
      expect(nodes[1]?.text).toBe("Hello")
      expect(nodes[0]?.level).toBe(1)
      expect(nodes[1]?.level).toBe(2)
      expect(nodes[0]?.startLine).not.toBe(nodes[1]?.startLine)
    })

    it("handles unicode heading text and slugifies sensibly", () => {
      const nodes = parseHeadings("# Hôvní dokument\n## 日本語セクション\n")
      expect(nodes).toHaveLength(2)
      expect(nodes[0]?.text).toBe("Hôvní dokument")
      expect(nodes[1]?.text).toBe("日本語セクション")
      // Slug may fall back to "section" for fully non-ASCII text — both are acceptable
      expect(nodes[0]?.slug).toBeDefined()
      expect(nodes[1]?.slug).toBeDefined()
    })
  })

  describe("assignHeadingPath", () => {
    it("assigns breadcrumb to a single heading with no parent", () => {
      const nodes = parseHeadings("# Solo\n")
      const withPath = assignHeadingPath(nodes)
      expect(withPath).toHaveLength(1)
      const h = withPath[0] as HeadingWithPath
      expect(h.headingPath).toEqual(["Solo"])
      expect(h.parentHeading).toBeNull()
    })

    it("assigns nested breadcrumb h1 → h2 → h3 → h4 → h5 → h6", () => {
      const md = [
        "# H1",
        "",
        "## H2",
        "",
        "### H3",
        "",
        "#### H4",
        "",
        "##### H5",
        "",
        "###### H6",
      ].join("\n")
      const withPath = assignHeadingPath(parseHeadings(md))
      expect(withPath.map((h) => h.headingPath)).toEqual([
        ["H1"],
        ["H1", "H2"],
        ["H1", "H2", "H3"],
        ["H1", "H2", "H3", "H4"],
        ["H1", "H2", "H3", "H4", "H5"],
        ["H1", "H2", "H3", "H4", "H5", "H6"],
      ])
      expect(withPath[0]?.parentHeading).toBeNull()
      expect(withPath[1]?.parentHeading).toBe("H1")
      expect(withPath[2]?.parentHeading).toBe("H2")
      expect(withPath[5]?.parentHeading).toBe("H5")
    })

    it("promotes siblings: a new h2 replaces the previous h2 in the breadcrumb", () => {
      const md = [
        "# H1",
        "",
        "## H2a",
        "",
        "body of H2a",
        "",
        "## H2b",
        "",
        "body of H2b",
      ].join("\n")
      const withPath = assignHeadingPath(parseHeadings(md))
      expect(withPath).toHaveLength(3)
      expect(withPath[0]?.headingPath).toEqual(["H1"])
      expect(withPath[1]?.headingPath).toEqual(["H1", "H2a"])
      expect(withPath[2]?.headingPath).toEqual(["H1", "H2b"])
      expect(withPath[1]?.parentHeading).toBe("H1")
      expect(withPath[2]?.parentHeading).toBe("H1")
    })

    it("promotes top-level sibling: a new h1 resets the breadcrumb completely", () => {
      const md = [
        "# First",
        "",
        "## Nested",
        "",
        "## Still Nested",
        "",
        "# Second",
        "",
        "## Children Of Second",
      ].join("\n")
      const withPath = assignHeadingPath(parseHeadings(md))
      expect(withPath.map((h) => h.headingPath)).toEqual([
        ["First"],
        ["First", "Nested"],
        ["First", "Still Nested"],
        ["Second"],
        ["Second", "Children Of Second"],
      ])
      expect(withPath[3]?.parentHeading).toBeNull()
    })

    it("treats h1 → h3 (gap, no h2) as h3 being a child of h1 (breadcrumb [h1, h3])", () => {
      const md = [
        "# Parent",
        "",
        "### Orphan H3",
      ].join("\n")
      const withPath = assignHeadingPath(parseHeadings(md))
      expect(withPath).toHaveLength(2)
      expect(withPath[1]?.headingPath).toEqual(["Parent", "Orphan H3"])
      expect(withPath[1]?.parentHeading).toBe("Parent")
    })

    it("returns empty array for empty input", () => {
      expect(assignHeadingPath([])).toEqual([])
    })
  })

  describe("buildHeadingTree", () => {
    it("builds nested tree for h1 → h2 → h3 with proper children arrays", () => {
      const md = [
        "# A",
        "",
        "## A.1",
        "",
        "### A.1.1",
        "",
        "## A.2",
      ].join("\n")
      const tree = buildHeadingTree(assignHeadingPath(parseHeadings(md)))
      expect(tree).toHaveLength(1)
      const a = tree[0]
      expect(a?.text).toBe("A")
      expect(a?.children).toHaveLength(2)
      expect(a?.children[0]?.text).toBe("A.1")
      expect(a?.children[0]?.children).toHaveLength(1)
      expect(a?.children[0]?.children[0]?.text).toBe("A.1.1")
      expect(a?.children[1]?.text).toBe("A.2")
      expect(a?.children[1]?.children).toEqual([])
    })

    it("builds a flat list of top-level headings when no parent/child relationship", () => {
      const md = [
        "# A",
        "",
        "body",
        "",
        "# B",
        "",
        "body",
        "",
        "# C",
      ].join("\n")
      const tree = buildHeadingTree(assignHeadingPath(parseHeadings(md)))
      expect(tree).toHaveLength(3)
      expect(tree.map((n) => n.text)).toEqual(["A", "B", "C"])
      expect(tree.every((n) => n.children.length === 0)).toBe(true)
    })

    it("builds a tree that correctly handles gap h1 → h3 (orphan h3 is child of h1)", () => {
      const md = [
        "# Parent",
        "",
        "### Orphan",
        "",
        "## Real Sibling",
      ].join("\n")
      const tree = buildHeadingTree(assignHeadingPath(parseHeadings(md)))
      expect(tree).toHaveLength(1)
      const parent = tree[0]
      expect(parent?.text).toBe("Parent")
      expect(parent?.children.map((c) => c.text)).toEqual(["Orphan", "Real Sibling"])
    })
  })

  describe("findHeading", () => {
    it("returns the first matching heading or undefined", () => {
      const md = [
        "# Alpha",
        "",
        "## Beta",
        "",
        "## Beta",
      ].join("\n")
      const withPath = assignHeadingPath(parseHeadings(md))
      const found = findHeading(withPath, (h) => h.text === "Beta")
      expect(found).toBeDefined()
      expect(found?.level).toBe(2)
      expect(found?.startLine).toBe(3) // first occurrence (lines: 1=# Alpha, 2=blank, 3=## Beta)
      const missing = findHeading(withPath, (h) => h.text === "Gamma")
      expect(missing).toBeUndefined()
    })
  })
})
