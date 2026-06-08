import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"

import { batchSectionEdits, batchMultiFileEdits, createDocument } from "../../../src/features/doc-intelligence/index.js"

describe("batch", () => {
  it("applies batch section edits atomically on single file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "doc.md"), "# Doc\n\n## A\n\nOld A\n\n## B\n\nOld B", "utf-8")

    const result = await batchSectionEdits(dir, "doc.md", [
      { op: "write" as const, heading: "A", body: "New A" },
      { op: "write" as const, heading: "B", body: "New B" },
    ])

    const batchResult = result as { results: Array<Record<string, unknown>>; hash: string }
    expect(batchResult.results.length).toBe(2)
    const content = readFileSync(join(dir, "doc.md"), "utf-8")
    expect(content).toContain("New A")
    expect(content).toContain("New B")

    rmSync(dir, { recursive: true, force: true })
  })

  it("handles multi-file batch with best-effort", async () => {
    const dir = mkdtempSync(join(tmpdir(), "doc-test-"))
    writeFileSync(join(dir, "a.md"), "# A\n\n## Section\n\nOld A", "utf-8")
    writeFileSync(join(dir, "b.md"), "# B\n\n## Section\n\nOld B", "utf-8")

    const result = await batchMultiFileEdits(dir, [
      { path: "a.md", ops: [{ op: "write" as const, heading: "Section", body: "New A" }] },
      { path: "b.md", ops: [{ op: "write" as const, heading: "Section", body: "New B" }] },
    ])

    expect(result.results.length).toBe(2)
    expect(readFileSync(join(dir, "a.md"), "utf-8")).toContain("New A")
    expect(readFileSync(join(dir, "b.md"), "utf-8")).toContain("New B")

    rmSync(dir, { recursive: true, force: true })
  })
})
