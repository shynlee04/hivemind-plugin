import { describe, expect, it } from "vitest"

import { chunkMarkdownDocument } from "../../../src/lib/doc-intelligence/chunker.js"

describe("doc intelligence chunker", () => {
  it("creates stable heading-aware chunks with deterministic ids", () => {
    const chunks = chunkMarkdownDocument("docs/guide.md", [
      "# Overview",
      "Intro paragraph.",
      "## Install",
      "Install paragraph.",
      "## Verify",
      "Verify paragraph.",
    ].join("\n"), { maxCharacters: 80 })

    expect(chunks.map((chunk) => chunk.id)).toEqual([
      "docs/guide.md#overview-1",
      "docs/guide.md#install-2",
      "docs/guide.md#verify-3",
    ])
    expect(chunks[1]).toMatchObject({ heading: "Install", startLine: 3, endLine: 4 })
  })
})
