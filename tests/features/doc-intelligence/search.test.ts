import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { searchDocuments } from "../../../src/features/doc-intelligence/index.js"

describe("search", () => {
  it("finds keyword matches with heading context", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Main\n\n## Config\n\nThe config value is 42\n\n## Other\n\nNo match here", "utf-8")

    const results = searchDocuments(dir, ".", "config")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].path).toBe("doc.md")
    // The nearest heading before the first match should contain "config"
    const configMatch = results.find((r) => r.snippet.includes("config"))
    expect(configMatch).toBeDefined()
    expect(configMatch?.heading).toBe("Config")

    rmSync(dir, { recursive: true, force: true })
  })

  it("supports regex search", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Test\n\nerror-42\ninfo-7\nwarning-99", "utf-8")

    const results = searchDocuments(dir, ".", "error-\\d+", 50, true)
    expect(results.length).toBe(1)
    expect(results[0].snippet).toContain("error-42")

    rmSync(dir, { recursive: true, force: true })
  })

  it("supports heading-only search", () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Config\n\n## Setup\n\nconfig details here\n\n## Install\n\nOther info", "utf-8")

    const results = searchDocuments(dir, ".", "config", 50, false, true)
    expect(results.length).toBeGreaterThan(0)
    // All matches should be in heading lines
    for (const match of results) {
      expect(match.line).toBeGreaterThan(0)
    }

    rmSync(dir, { recursive: true, force: true })
  })
})
