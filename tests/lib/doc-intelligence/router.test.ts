import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { executeDocIntelligenceAction } from "../../../src/features/doc-intelligence/router.js"

describe("doc intelligence router", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "doc-intel-"))
    mkdirSync(join(root, "docs", "nested"), { recursive: true })
    writeFileSync(join(root, "docs", "b.md"), "# Beta\nFind this needle.")
    writeFileSync(join(root, "docs", "a.md"), "---\ntitle: Alpha\n---\n# Alpha")
    writeFileSync(join(root, "docs", "nested", "c.md"), "# Gamma")
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("returns deterministic directory skims using root-relative POSIX paths", () => {
    const result = executeDocIntelligenceAction(root, { action: "skim_directory", path: "docs" })

    expect(result.action).toBe("skim_directory")
    expect(result.documents.map((document) => document.path)).toEqual([
      "docs/a.md",
      "docs/b.md",
      "docs/nested/c.md",
    ])
  })

  it("rejects paths that escape the project root", () => {
    expect(() => executeDocIntelligenceAction(root, { action: "read", path: "../outside.md" }))
      .toThrow("[Harness] doc intelligence path escapes allowed root")
  })

  it("searches markdown content without persistent indexes", () => {
    const result = executeDocIntelligenceAction(root, { action: "search", path: "docs", query: "needle" })

    expect(result.action).toBe("search")
    expect(result.matches).toEqual([
      expect.objectContaining({ path: "docs/b.md", line: 2 }),
    ])
  })
})
