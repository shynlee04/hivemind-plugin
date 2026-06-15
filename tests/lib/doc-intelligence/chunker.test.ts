import { describe, expect, it } from "vitest"

import { chunkMarkdownDocument } from "../../../src/features/doc-intelligence/chunker.js"

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

    // Wave 2 (commit 537a853bf) unified the heading-extraction algorithm
    // via `src/features/doc-intelligence/heading-index.ts`. The current
    // chunker:
    //   1. Skips the synthetic `#document-1` preamble chunk when the source
    //      starts with a heading (the H1 itself becomes chunk 1).
    //   2. Builds the ID breadcrumb from the section's OWN headingPath
    //      (heading included), not the parent breadcrumb. So the
    //      "Install" section (headingPath=["Overview","Install"]) gets
    //      id `#Overview-Install-2`, not `#Overview-2`.
    //   3. Sibling-promotes correctly: "Verify" is a sibling of "Install"
    //      (both H2 under H1 "Overview"), so its headingPath resets to
    //      ["Overview","Verify"] and id is `#Overview-Verify-3`.
    expect(chunks.map((chunk) => chunk.id)).toEqual([
      "docs/guide.md#Overview-1",
      "docs/guide.md#Overview-Install-2",
      "docs/guide.md#Overview-Verify-3",
    ])
    expect(chunks[1]).toMatchObject({ heading: "Install", startLine: 3, endLine: 4 })
  })
})
