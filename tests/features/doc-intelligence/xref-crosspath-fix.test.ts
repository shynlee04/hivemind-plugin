import { describe, it, expect } from "vitest"
import { join } from "node:path"
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"

import { analyzeCrossReferences } from "../../../src/features/doc-intelligence/index.js"

/**
 * F-04 / NF-07 — Cross-document xref path resolution anchored at /.
 *
 * The stress test re-run (2026-06-09) confirmed that ALL cross-doc links
 * in deployment.md returned `valid: false` even when the target file
 * exists at the relative path.
 *
 * Root cause: `xref-ops.ts:resolveTargetPath` (line 92) returns
 * `"/" + resolved.join("/")` which anchors the path at the filesystem
 * root, not at the source file's directory. When `projectRoot` is
 * `/Users/x/work` and a source file is `/Users/x/work/kb/deploy.md`
 * linking to `architecture.md`, the resolved path is
 * `/Users/x/work/kb/architecture.md` (wrong — should be
 * `/Users/x/work/kb/architecture.md` if `sourceDir` is
 * `/Users/x/work/kb/`).
 *
 * The fix: change `resolveTargetPath` to anchor at `sourceDir` (the
 * directory of the source file) instead of `"/"`. Then `existsSync`
 * in the caller resolves correctly relative to the filesystem root.
 *
 * Evidence label: runtime-truthful — real `mkdtempSync`, real FS
 * layout, real `analyzeCrossReferences` call.
 */
describe("F-04 / NF-07: cross-document xref resolves against source dir", () => {
  it("finds a valid cross-doc link when source is in a subdirectory and target is in the same subdir", () => {
    const dir = mkdtempSync(join(tmpdir(), "f04-crosspath-"))
    const sub = join(dir, "kb")
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(sub, "source.md"), "See [Architecture](architecture.md) for details.", "utf-8")
    writeFileSync(join(sub, "architecture.md"), "# Architecture", "utf-8")

    const links = analyzeCrossReferences(dir, ".")
    const arch = links.find((l) => l.to === "architecture.md")

    expect(links.length).toBeGreaterThan(0)
    expect(arch).toBeDefined()
    expect(arch?.valid).toBe(true)

    rmSync(dir, { recursive: true, force: true })
  })

  it("finds a valid cross-doc link with parent-dir traversal from subdir", () => {
    const dir = mkdtempSync(join(tmpdir(), "f04-crosspath-"))
    const sub = join(dir, "docs", "sub")
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(sub, "source.md"), "See [Top](../TOP.md).", "utf-8")
    writeFileSync(join(dir, "docs", "TOP.md"), "# Top", "utf-8")

    const links = analyzeCrossReferences(dir, ".")
    const top = links.find((l) => l.to === "../TOP.md")

    expect(top).toBeDefined()
    expect(top?.valid).toBe(true)

    rmSync(dir, { recursive: true, force: true })
  })

  it("returns valid: false for a truly missing cross-doc target", () => {
    const dir = mkdtempSync(join(tmpdir(), "f04-crosspath-"))
    const sub = join(dir, "kb")
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(sub, "source.md"), "See [Missing](does-not-exist.md).", "utf-8")

    const links = analyzeCrossReferences(dir, ".")
    const missing = links.find((l) => l.to === "does-not-exist.md")

    expect(missing).toBeDefined()
    expect(missing?.valid).toBe(false)

    rmSync(dir, { recursive: true, force: true })
  })
})
