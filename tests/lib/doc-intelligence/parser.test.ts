import { describe, expect, it } from "vitest"

import { parseMarkdownDocument } from "../../../src/features/doc-intelligence/parser.js"

describe("doc intelligence parser", () => {
  it("extracts frontmatter, title, and nested heading outline", () => {
    const parsed = parseMarkdownDocument("docs/guide.md", [
      "---",
      "title: Harness Guide",
      "tags:",
      "  - docs",
      "---",
      "# Overview",
      "Intro text for the guide.",
      "## Install",
      "Run npm install.",
      "### Verify",
      "Run npm test.",
    ].join("\n"))

    expect(parsed.path).toBe("docs/guide.md")
    expect(parsed.frontmatter).toMatchObject({ title: "Harness Guide", tags: ["docs"] })
    expect(parsed.title).toBe("Harness Guide")
    expect(parsed.outline).toEqual([
      { depth: 1, text: "Overview", line: 6, slug: "overview" },
      { depth: 2, text: "Install", line: 8, slug: "install" },
      { depth: 3, text: "Verify", line: 10, slug: "verify" },
    ])
    expect(parsed.wordCount).toBeGreaterThan(0)
  })
})
