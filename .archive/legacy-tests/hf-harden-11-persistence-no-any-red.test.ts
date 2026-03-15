import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

describe("HF-HARDEN-11 RED: persistence hotspot should not use as any", () => {
  it("fails deterministically at src/lib/persistence.ts:201", () => {
    const path = "src/lib/persistence.ts"
    const source = readFileSync(path, "utf-8")
    const lines = source.split(/\r?\n/)
    const hotspotLineNumber = 201
    const hotspot = lines[hotspotLineNumber - 1] ?? ""

    // Verify we're at the correct hotspot: migration removing deprecated sentiment_signals
    assert.ok(
      hotspot.includes("delete") && hotspot.includes("sentiment_signals"),
      `Expected hotspot anchor at ${path}:${hotspotLineNumber}; got: ${hotspot.trim()}`,
    )

    // RED: This assertion will FAIL because line 201 contains 'as any'
    assert.equal(
      /\bas\s+any\b/.test(hotspot),
      false,
      `${path}:${hotspotLineNumber} contains banned 'as any': ${hotspot.trim()}`,
    )
  })
})
