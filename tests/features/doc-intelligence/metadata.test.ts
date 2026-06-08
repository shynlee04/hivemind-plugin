import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { readDocumentMetadata, writeDocumentMetadata, deleteDocumentMetadataField } from "../../../src/features/doc-intelligence/index.js"

describe("metadata", () => {
  it("reads metadata from Markdown frontmatter", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "---\ntitle: Test\nauthor: Me\n---\n# Content", "utf-8")

    const meta = readDocumentMetadata(dir, "doc.md")
    expect(meta).not.toBeNull()
    expect(meta?.title).toBe("Test")
    expect(meta?.author).toBe("Me")

    rmSync(dir, { recursive: true, force: true })
  })

  it("returns null for files without frontmatter", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# No frontmatter", "utf-8")

    const meta = readDocumentMetadata(dir, "doc.md")
    expect(meta).toBeNull()

    rmSync(dir, { recursive: true, force: true })
  })

  it("writes metadata preserving existing fields", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "---\ntitle: Old\n---\n# Content", "utf-8")

    await writeDocumentMetadata(dir, "doc.md", { title: "New", extra: "added" })
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toContain("title: New")
    expect(content).toContain("extra: added")

    rmSync(dir, { recursive: true, force: true })
  })

  it("deletes a metadata field", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "---\ntitle: Test\ndraft: true\n---\n# Content", "utf-8")

    await deleteDocumentMetadataField(dir, "doc.md", "draft")
    const meta = readDocumentMetadata(dir, "doc.md")
    expect(meta).not.toBeNull()
    expect(meta?.title).toBe("Test")
    expect(meta).not.toHaveProperty("draft")

    rmSync(dir, { recursive: true, force: true })
  })
})
