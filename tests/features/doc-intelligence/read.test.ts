import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { readDocument, readSectionByHeading, readLines, readOffset } from "../../../src/features/doc-intelligence/index.js"

describe("read", () => {
  it("reads full document content", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Test\n\nHello world", "utf-8")

    const result = readDocument(dir, "doc.md")
    expect(result.content).toContain("Hello world")
    expect(result.truncated).toBe(false)
    expect(result.characterCount).toBeGreaterThan(0)

    rmSync(dir, { recursive: true, force: true })
  })

  it("truncates content over maxCharacters", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Test\n\n" + "x".repeat(30000), "utf-8")

    const result = readDocument(dir, "doc.md", 20000)
    expect(result.truncated).toBe(true)
    expect(result.content.length).toBeLessThanOrEqual(20000)

    rmSync(dir, { recursive: true, force: true })
  })

  it("reads section by heading", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Main\n\nIntro\n\n## Section\n\nBody content\n\n## Other\n\nOther body", "utf-8")

    const result = readSectionByHeading(dir, "doc.md", "Section")
    expect(result.content).toContain("Body content")
    expect(result.heading).toBe("Section")

    rmSync(dir, { recursive: true, force: true })
  })

  it("returns null for non-existent heading", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Only", "utf-8")

    const result = readSectionByHeading(dir, "doc.md", "Missing")
    expect(result.content).toBeNull()

    rmSync(dir, { recursive: true, force: true })
  })

  it("reads line range with clamping", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "line1\nline2\nline3\nline4\nline5", "utf-8")

    const result = readLines(dir, "doc.md", 2, 4)
    expect(result.content).toContain("line2")
    expect(result.content).toContain("line4")
    expect(result.startLine).toBe(2)
    expect(result.endLine).toBe(4)
    expect(result.totalLines).toBe(5)

    rmSync(dir, { recursive: true, force: true })
  })

  it("reads character offset", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "Hello World Foo Bar", "utf-8")

    const result = readOffset(dir, "doc.md", 6, 5)
    expect(result.content).toBe("World")

    rmSync(dir, { recursive: true, force: true })
  })
})
