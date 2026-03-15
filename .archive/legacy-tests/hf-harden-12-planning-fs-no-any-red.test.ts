import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

describe("HF-HARDEN-12 RED: planning-fs hotspot should not use as any", () => {
  it("fails deterministically at src/lib/planning-fs.ts:1009", () => {
    const path = "src/lib/planning-fs.ts"
    const source = readFileSync(path, "utf-8")
    const lines = source.split(/\r?\n/)
    const hotspotLineNumber = 1009
    const hotspot = lines[hotspotLineNumber - 1] ?? ""

    // Verify we're at the correct hotspot: parseSessionFrontmatter cast
    assert.ok(
      hotspot.includes("parseSessionFrontmatter") && hotspot.includes("fm"),
      `Expected hotspot anchor at ${path}:${hotspotLineNumber}; got: ${hotspot.trim()}`,
    )

    // RED: This assertion will FAIL because line 1009 contains 'as any'
    assert.equal(
      /\bas\s+any\b/.test(hotspot),
      false,
      `${path}:${hotspotLineNumber} contains banned 'as any': ${hotspot.trim()}`,
    )
  })
})
