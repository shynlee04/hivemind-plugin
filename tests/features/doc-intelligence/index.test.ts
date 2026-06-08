import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { buildDocumentIndex } from "../../../src/features/doc-intelligence/index.js"

describe("index", () => {
  it("builds index with all required fields", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "---\ntitle: My Doc\n---\n# My Doc\n\nContent\n\n## Section\n\nMore [link](other.md)", "utf-8")
    writeFileSync(join(dir, "other.md"), "# Other", "utf-8")

    const entries = buildDocumentIndex(dir, ".")
    expect(entries.length).toBe(2)
    const entry = entries.find((e) => e.path === "doc.md")
    expect(entry).toBeDefined()
    if (entry) {
      expect(entry.title).toBe("My Doc")
      expect(entry.lineCount).toBeGreaterThan(0)
      expect(entry.sizeBytes).toBeGreaterThan(0)
      expect(entry.hash).toMatch(/^[a-f0-9]{64}$/)
      expect(entry.lastModified).toBeDefined()
      expect(entry.headingCount).toBeGreaterThan(0)
    }

    rmSync(dir, { recursive: true, force: true })
  })
})
