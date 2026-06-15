import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { analyzeCrossReferences } from "../../../src/features/doc-intelligence/index.js"

/**
 * Wave 3 — F-04 / REQ-W5-02: xref fragment (heading anchor) validation.
 *
 * Before the fix, `analyzeCrossReferences` validated only the file portion
 * of a Markdown link. A link like `[Auth](architecture.md#authentication)`
 * would report `valid: true` even when the target file existed but
 * contained no heading named "authentication" — the user would click the
 * link and land on a broken scroll target.
 *
 * The fix:
 *   1. Parse the link target as `path[#anchor]`.
 *   2. Resolve the path portion against `sourceDir` (unchanged).
 *   3. If the path resolves to an existing file AND an anchor is present,
 *      check the target file's headings via the Wave-2 `parseHeadings`
 *      module. If the anchor doesn't match any heading text (case
 *      insensitive, slugified), emit a `fragment_not_found` link with
 *      `data.suggestions: string[]` (Levenshtein-based, top 3).
 *
 * Evidence label: `runtime-truthful` — real `mkdtempSync`, real FS layout,
 * real `analyzeCrossReferences` call.
 * Test size: `small` — focused units per scenario.
 */
describe("F-04 / REQ-W5-02: xref fragment validation", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "f04-fragment-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("emits kind:'ok' with valid:true for a link with no fragment", () => {
    const sub = join(root, "kb")
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(sub, "source.md"), "See [Architecture](architecture.md).", "utf-8")
    writeFileSync(join(sub, "architecture.md"), "# Architecture\n\n## Auth\n", "utf-8")

    const links = analyzeCrossReferences(root, ".")
    const arch = links.find((l) => l.to === "architecture.md")

    expect(arch).toBeDefined()
    // The kind field is the new discriminator; valid: true confirms OK.
    expect(arch?.kind).toBe("ok")
    expect(arch?.valid).toBe(true)
    if (arch && arch.kind === "ok") {
      expect(arch.fragment).toBeNull()
    }
  })

  it("emits kind:'ok' with fragment set when the anchor matches a heading in the target file", () => {
    const sub = join(root, "kb")
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(sub, "source.md"), "See [Auth](architecture.md#auth).", "utf-8")
    writeFileSync(
      join(sub, "architecture.md"),
      ["# Architecture", "", "## Auth", "", "Auth body", "", "## Cache", ""].join("\n"),
      "utf-8",
    )

    const links = analyzeCrossReferences(root, ".")
    const auth = links.find((l) => l.to === "architecture.md#auth")

    expect(auth).toBeDefined()
    expect(auth?.kind).toBe("ok")
    expect(auth?.valid).toBe(true)
    if (auth && auth.kind === "ok") {
      expect(auth.fragment).toBe("auth")
    }
  })

  it("emits kind:'fragment_not_found' with data.suggestions when the anchor does not exist in the target file", () => {
    const sub = join(root, "kb")
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(sub, "source.md"), "See [X](architecture.md#authentcation).", "utf-8")
    writeFileSync(
      join(sub, "architecture.md"),
      ["# Architecture", "", "## Authentication", "", "## Authorization", "", "## Cache", ""].join("\n"),
      "utf-8",
    )

    const links = analyzeCrossReferences(root, ".")
    const link = links.find((l) => l.to === "architecture.md#authentcation")

    expect(link).toBeDefined()
    expect(link?.kind).toBe("fragment_not_found")
    expect(link?.valid).toBe(false)
    if (link && link.kind === "fragment_not_found") {
      expect(link.fragment).toBe("authentcation")
      // Top 3 closest heading names by Levenshtein distance.
      expect(Array.isArray(link.data.suggestions)).toBe(true)
      expect(link.data.suggestions.length).toBeGreaterThan(0)
      expect(link.data.suggestions.length).toBeLessThanOrEqual(3)
      // "Authentication" / "Authorization" are the closest; the misspelled
      // anchor "authentcation" should fuzzy-match "Authentication".
      expect(link.data.suggestions).toContain("Authentication")
    }
  })

  it("emits kind:'file_not_found' (not fragment_not_found) when the target file is missing entirely", () => {
    const sub = join(root, "kb")
    mkdirSync(sub, { recursive: true })
    writeFileSync(join(sub, "source.md"), "See [X](does-not-exist.md#anything).", "utf-8")

    const links = analyzeCrossReferences(root, ".")
    const link = links.find((l) => l.to === "does-not-exist.md#anything")

    expect(link).toBeDefined()
    // File-level check takes precedence over fragment-level check.
    expect(link?.kind).toBe("file_not_found")
    expect(link?.valid).toBe(false)
  })

  it("validates the fragment of a self-reference (same file #anchor) against that file's headings", () => {
    writeFileSync(
      join(root, "doc.md"),
      ["# Top", "", "## Deploy", "", "## Rollback", "", "See [Self](doc.md#deploy).", ""].join("\n"),
      "utf-8",
    )

    const links = analyzeCrossReferences(root, ".")
    const self = links.find((l) => l.to === "doc.md#deploy")
    expect(self).toBeDefined()
    expect(self?.kind).toBe("ok")
    expect(self?.valid).toBe(true)
  })

  it("flags a same-file self-reference with a missing fragment as fragment_not_found", () => {
    writeFileSync(
      join(root, "doc.md"),
      ["# Top", "", "## Deploy", "", "See [Self](doc.md#nonexistent).", ""].join("\n"),
      "utf-8",
    )

    const links = analyzeCrossReferences(root, ".")
    const self = links.find((l) => l.to === "doc.md#nonexistent")
    expect(self).toBeDefined()
    expect(self?.kind).toBe("fragment_not_found")
    if (self && self.kind === "fragment_not_found") {
      expect(self.fragment).toBe("nonexistent")
      expect(self.data.suggestions).toContain("Deploy")
    }
  })
})
