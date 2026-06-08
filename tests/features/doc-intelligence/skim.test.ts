import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { skimDocument, skimDirectory } from "../../../src/features/doc-intelligence/index.js"

describe("skim", () => {
  it("skims a single Markdown document", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "---\ntitle: Doc\n---\n# Doc\n\nContent", "utf-8")

    const result = skimDocument(dir, "doc.md")
    expect(result.title).toBe("Doc")
    expect(result.outline.length).toBe(1)
    expect(result.characterCount).toBeGreaterThan(0)

    rmSync(dir, { recursive: true, force: true })
  })

  it("skims a JSON document", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "data.json"), '{"title":"JSON Doc","key":"val"}', "utf-8")

    const result = skimDocument(dir, "data.json")
    expect(result.title).toBe("JSON Doc")
    expect(result.characterCount).toBeGreaterThan(0)

    rmSync(dir, { recursive: true, force: true })
  })

  it("skims a directory with format filter", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "a.md"), "# A", "utf-8")
    writeFileSync(join(dir, "b.json"), '{"title":"B"}', "utf-8")

    const results = skimDirectory(dir, ".", "json")
    expect(results.length).toBe(1)
    expect(results[0].path).toContain(".json")

    rmSync(dir, { recursive: true, force: true })
  })
})
