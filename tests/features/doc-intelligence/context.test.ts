import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { extractContext } from "../../../src/features/doc-intelligence/index.js"

describe("context", () => {
  it("returns relevance-scored sections within token budget", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Config Guide\n\n## Delegation Config\n\nThe delegation configuration system handles routing.\n\n## Other\n\nUnrelated content about installation.\n", "utf-8")

    const sections = extractContext(dir, ".", "delegation configuration", 500)
    expect(sections.length).toBeGreaterThan(0)

    // Sections should be sorted by descending relevance
    for (let i = 1; i < sections.length; i++) {
      expect(sections[i - 1].relevanceScore).toBeGreaterThanOrEqual(sections[i].relevanceScore)
    }

    // Token budget respected
    const totalTokens = sections.reduce((sum, s) => sum + s.tokenEstimate, 0)
    expect(totalTokens).toBeLessThanOrEqual(500)

    // First result should contain query terms
    expect(sections[0].relevanceScore).toBeGreaterThan(0)

    rmSync(dir, { recursive: true, force: true })
  })
})
