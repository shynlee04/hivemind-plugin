import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"

import { createDocument, writeSectionBody, upsertSection, appendSection, insertSection, deleteSection, deleteFile, searchAndReplace } from "../../../src/features/doc-intelligence/index.js"

describe("write", () => {
  it("creates a Markdown file with title heading", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    const result = await createDocument(dir, "test.md", "Test Title")
    expect(result.created).toBe(true)
    expect(result.path).toBe("test.md")
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(result.opId).toMatch(/^[a-f0-9]{12}$/)
    expect(readFileSync(join(dir, "test.md"), "utf-8")).toContain("# Test Title")
    rmSync(dir, { recursive: true, force: true })
  })

  it("creates a JSON file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    await createDocument(dir, "config.json", "Config", { version: "1" })
    const content = readFileSync(join(dir, "config.json"), "utf-8")
    expect(JSON.parse(content).title).toBe("Config")
    rmSync(dir, { recursive: true, force: true })
  })

  it("writes section body", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Doc\n\n## Overview\n\nOld content\n\n## Other\n\nOther content", "utf-8")

    const result = (await writeSectionBody(dir, "doc.md", "Overview", "New content")) as { changed: boolean; hash: string }
    expect(result.changed).toBe(true)
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toContain("New content")
    expect(content).not.toContain("Old content")
    rmSync(dir, { recursive: true, force: true })
  })

  it("upserts a section (creates if missing)", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Doc\n\n## Existing\n\nBody", "utf-8")

    const result = (await upsertSection(dir, "doc.md", "NewSection", "New body content", 2)) as { changed: boolean }
    expect(result.changed).toBe(true)
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toContain("New body content")
    rmSync(dir, { recursive: true, force: true })
  })

  it("appends to a section", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Doc\n\n## Notes\n\nLine 1", "utf-8")

    const result = (await appendSection(dir, "doc.md", "Notes", "Line 2")) as { changed: boolean }
    expect(result.changed).toBe(true)
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toContain("Line 2")
    rmSync(dir, { recursive: true, force: true })
  })

  it("inserts a section after target heading", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Doc\n\n## A\n\nContent A\n\n## B\n\nContent B", "utf-8")

    const result = (await insertSection(dir, "doc.md", "A", "C", 2, "Content C")) as { changed: boolean }
    expect(result.changed).toBe(true)
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    // C should be between A and B
    const aIdx = content.indexOf("Content A")
    const cIdx = content.indexOf("Content C")
    const bIdx = content.indexOf("Content B")
    expect(aIdx).toBeLessThan(cIdx)
    expect(cIdx).toBeLessThan(bIdx)
    rmSync(dir, { recursive: true, force: true })
  })

  it("deletes a section", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Doc\n\n## Keep\n\nKeep content\n\n## Remove\n\nRemove content", "utf-8")

    await deleteSection(dir, "doc.md", "Remove")
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toContain("Keep")
    expect(content).not.toContain("Remove content")
    rmSync(dir, { recursive: true, force: true })
  })

  it("deletes a file with explicit mode", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# To Delete", "utf-8")

    await deleteFile(dir, "doc.md")
    expect(existsSync(join(dir, "doc.md"))).toBe(false)
    rmSync(dir, { recursive: true, force: true })
  })

  it("search and replaces in document body", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Doc\n\nold-text here and old-text there", "utf-8")

    const result = (await searchAndReplace(dir, "doc.md", "old-text", "new-text")) as { changed: boolean }
    expect(result.changed).toBe(true)
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toContain("new-text")
    expect(content).not.toContain("old-text")
    rmSync(dir, { recursive: true, force: true })
  })
})
