import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createHivemindDocTool } from "../../../src/tools/hivemind/hivemind-doc.js"

/**
 * NF-04 — `delete` cascade warning.
 *
 * Before the fix, deleting a section that other documents xref'd was
 * silent: the file was modified, and the agent had no way to know
 * that the in-memory xref graph now contained dangling references.
 * The user spec says the warning is INFORMATIONAL — the delete
 * succeeds, the file is modified, but the result carries a
 * `warnings: string[]` field listing the source files + line numbers
 * of the now-dangling xrefs.
 *
 * The fix runs `analyzeCrossReferences` (Wave-3 xref infrastructure)
 * after a successful section/file delete and diffs the result against
 * the deleted scope. Any xref whose `to` now points to a missing
 * heading or missing file (and whose `from` is NOT the file we just
 * deleted) becomes a warning string.
 *
 * Evidence label: `runtime-truthful` — every test exercises the real
 * `createHivemindDocTool` wrapper against real `mkdtempSync` directories
 * with real markdown files and real markdown links.
 * Test size: `small` — focused on a single delete + cascade pair.
 */
describe("NF-04: delete cascade warning", () => {
  const mockCtx = {
    sessionID: "parent-session",
    agent: "gsd-executor",
    directory: process.cwd(),
    worktree: process.cwd(),
    abort: new AbortController().signal,
    metadata: () => ({}),
    ask: async () => ({ state: "approved" as const }),
  } as never

  let root: string

  function parseResult(raw: string): Record<string, unknown> {
    return JSON.parse(raw) as Record<string, unknown>
  }

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "nf04-cascade-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("emits a warnings array listing docB when a section that docB xrefs is deleted", async () => {
    writeFileSync(
      join(root, "docA.md"),
      ["# Top", "", "## Auth", "", "auth body", "", "## Cache", "", "cache body"].join("\n"),
      "utf-8",
    )
    writeFileSync(
      join(root, "docB.md"),
      ["# Overview", "", "See [Auth](docA.md#auth) and [Cache](docA.md#cache).", ""].join("\n"),
      "utf-8",
    )

    const tool = createHivemindDocTool(root)
    const raw = await tool.execute(
      {
        action: "delete",
        path: "docA.md",
        heading: "Auth",
      } as never,
      mockCtx,
    ) as string
    const result = parseResult(raw)
    expect(result.kind).toBe("success")

    // The router returns `{ action: "delete", result: DeleteResult }` —
    // the DeleteResult (which carries the optional `warnings` field) is
    // at `data.result`, not at `data` itself.
    const data = (result.data ?? {}) as { result?: { warnings?: string[] } }
    const inner = data.result ?? {}
    expect(Array.isArray(inner.warnings)).toBe(true)
    const warnings = inner.warnings ?? []
    expect(warnings.length).toBeGreaterThan(0)
    // At least one warning mentions docB (the file with the dangling xref).
    expect(warnings.some((w) => w.includes("docB.md"))).toBe(true)
    // And the warning should mention the deleted heading.
    expect(warnings.some((w) => w.toLowerCase().includes("auth"))).toBe(true)
  })

  it("does NOT emit a cascade warning when no other file xrefs the deleted section", async () => {
    writeFileSync(
      join(root, "docA.md"),
      ["# Top", "", "## Lonely", "", "lonely body"].join("\n"),
      "utf-8",
    )
    writeFileSync(join(root, "docB.md"), "# No xrefs here\n", "utf-8")

    const tool = createHivemindDocTool(root)
    const raw = await tool.execute(
      {
        action: "delete",
        path: "docA.md",
        heading: "Lonely",
      } as never,
      mockCtx,
    ) as string
    const result = parseResult(raw)
    expect(result.kind).toBe("success")
    const data = (result.data ?? {}) as { result?: { warnings?: string[] } }
    const inner = data.result ?? {}
    const warnings = inner.warnings ?? []
    expect(warnings).toEqual([])
  })

  it("emits a cascade warning when a file (not just a section) is deleted and other docs xref it", async () => {
    writeFileSync(join(root, "target.md"), "# Target\n\n## Detail\n", "utf-8")
    writeFileSync(join(root, "referrer.md"), "See [Detail](target.md#detail).", "utf-8")

    const tool = createHivemindDocTool(root)
    const raw = await tool.execute(
      {
        action: "delete",
        path: "target.md",
        mode: "file",
      } as never,
      mockCtx,
    ) as string
    const result = parseResult(raw)
    expect(result.kind).toBe("success")
    // Cascade warning mentions the referrer.
    const data = (result.data ?? {}) as { result?: { warnings?: string[] } }
    const inner = data.result ?? {}
    const warnings = inner.warnings ?? []
    expect(warnings.some((w) => w.includes("referrer.md"))).toBe(true)
  })

  it("the cascade warning does NOT block the delete — the file is still modified", async () => {
    const docAContent = ["# Top", "", "## Auth", "", "auth body"].join("\n")
    writeFileSync(join(root, "docA.md"), docAContent, "utf-8")
    writeFileSync(join(root, "docB.md"), "See [Auth](docA.md#auth).", "utf-8")

    const tool = createHivemindDocTool(root)
    const raw = await tool.execute(
      {
        action: "delete",
        path: "docA.md",
        heading: "Auth",
      } as never,
      mockCtx,
    ) as string
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    // The file content is actually modified — the section is gone.
    const after = readFileSync(join(root, "docA.md"), "utf-8")
    expect(after).not.toContain("auth body")
    expect(after).toContain("Top") // other content preserved
  })
})
