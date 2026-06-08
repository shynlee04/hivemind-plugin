import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { analyzeCrossReferences } from "../../../src/features/doc-intelligence/index.js"

describe("xref", () => {
  it("finds valid and broken links", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "source.md"), "[Valid](exists.md) and [Broken](missing.md)", "utf-8")
    writeFileSync(join(dir, "exists.md"), "# Exists", "utf-8")

    const links = analyzeCrossReferences(dir, ".")
    expect(links.length).toBe(2)

    const validLink = links.find((l) => l.to === "exists.md")
    expect(validLink?.valid).toBe(true)

    const brokenLink = links.find((l) => l.to === "missing.md")
    expect(brokenLink?.valid).toBe(false)

    rmSync(dir, { recursive: true, force: true })
  })

  it("skips external URLs and anchors", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "[External](https://example.com) and [Anchor](#section)", "utf-8")

    const links = analyzeCrossReferences(dir, ".")
    expect(links.length).toBe(0)

    rmSync(dir, { recursive: true, force: true })
  })
})
