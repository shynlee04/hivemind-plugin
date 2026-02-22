import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

describe("HF-HARDEN-10 RED: event-handler hotspot should not use as any", () => {
  it("fails deterministically at src/hooks/event-handler.ts:387", () => {
    const path = "src/hooks/event-handler.ts"
    const source = readFileSync(path, "utf-8")
    const lines = source.split(/\r?\n/)
    const hotspotLineNumber = 387
    const hotspot = lines[hotspotLineNumber - 1] ?? ""

    assert.ok(
      hotspot.includes("log.debug") && hotspot.includes("(unhandled)"),
      `Expected hotspot anchor at ${path}:${hotspotLineNumber}; got: ${hotspot.trim()}`,
    )

    assert.equal(
      /\bas\s+any\b/.test(hotspot),
      false,
      `${path}:${hotspotLineNumber} contains banned 'as any': ${hotspot.trim()}`,
    )
  })
})
