import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { generateToc, generateOutline } from "../../../src/features/doc-intelligence/index.js"

describe("hierarchy", () => {
  it("generates TOC with correct indentation", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# H1\n\n## H2a\n\n## H2b\n\n### H3\n", "utf-8")

    const toc = generateToc(dir, "doc.md")
    expect(toc).toContain("- [H1](#h1)")
    expect(toc).toContain("- [H2a](#h2a)")
    expect(toc).toContain("- [H3](#h3)")

    rmSync(dir, { recursive: true, force: true })
  })

  it("generates outline with parent-child nesting", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# A\n\n## A1\n\n### A1i\n\n## A2\n", "utf-8")

    const outline = generateOutline(dir, "doc.md")
    // generateOutline returns flat heading list in source order (all headings)
    expect(outline.length).toBe(4)
    expect(outline[0]?.text).toBe("A")
    expect(outline[1]?.text).toBe("A1")
    expect(outline[2]?.text).toBe("A1i")
    expect(outline[3]?.text).toBe("A2")

    rmSync(dir, { recursive: true, force: true })
  })
})
