import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { readDocument } from "../../../src/features/doc-intelligence/read-ops.js"

/**
 * F-05 / NF-05 — `read` honors the `heading` parameter.
 * F-24          — `read` returns a `hash` field.
 *
 * Before the fix, `readDocument` ignored `heading` entirely and returned
 * the whole file. The router at `src/features/doc-intelligence/router.ts`
 * also never forwarded `input.heading` to `readDocument`. After the fix:
 *
 *   - `readDocument(root, path)`            → full file + hash (back-compat)
 *   - `readDocument(root, path, max, "X")`  → section under "X" + hash
 *   - `readDocument(root, path, max, "???")` → `content: null` so the
 *     router can emit a `HEADING_NOT_FOUND` envelope with fuzzy
 *     suggestions.
 *
 * Evidence label: `runtime-truthful` — exercises the real `readDocument`
 * seam against a real `mkdtempSync` directory.
 *
 * Test size: `small`.
 */
describe("F-05 / F-24: readDocument honors heading + returns hash", () => {
  let root: string
  let filePath: string

  const SAMPLE = [
    "# Top", //
    "",
    "intro paragraph",
    "",
    "## First",
    "",
    "first body",
    "",
    "## Second",
    "",
    "second body line 1",
    "second body line 2",
    "",
    "## Third",
    "",
    "third body",
    "",
  ].join("\n")

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "f05-read-heading-"))
    filePath = join(root, "doc.md")
    writeFileSync(filePath, SAMPLE, "utf-8")
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("returns only the named section's body when heading is provided", () => {
    const result = readDocument(root, "doc.md", 20000, "Second")

    expect(result.content).not.toBeNull()
    expect(result.content).toContain("second body line 1")
    expect(result.content).toContain("second body line 2")
    // Must NOT leak content from siblings or unrelated sections.
    expect(result.content).not.toContain("first body")
    expect(result.content).not.toContain("third body")
    // Must NOT include the heading line itself.
    expect(result.content).not.toMatch(/^## Second/m)
    // Back-compat surface: section is exposed, hash is exposed.
    expect(result.heading).toBe("Second")
    expect(typeof result.hash).toBe("string")
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("returns content: null and a suggestions list when heading does not exist", () => {
    const result = readDocument(root, "doc.md", 20000, "Nonexistent")

    expect(result.content).toBeNull()
    expect(result.heading).toBe("Nonexistent")
    // hash is still computed over the FILE content, not the section
    expect(typeof result.hash).toBe("string")
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("returns the full file when heading is omitted (back-compat)", () => {
    const result = readDocument(root, "doc.md")

    expect(result.content).toContain("intro paragraph")
    expect(result.content).toContain("first body")
    expect(result.content).toContain("second body line 1")
    expect(result.content).toContain("third body")
    // heading field is undefined (not a string) when not requested
    expect(result.heading).toBeUndefined()
    // hash is present in the back-compat path too
    expect(typeof result.hash).toBe("string")
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it("stops the section at the next heading of equal or shallower depth", () => {
    // First H2 must end at Second; Second must end at Third; Third runs to EOF.
    const first = readDocument(root, "doc.md", 20000, "First")
    expect(first.content).toContain("first body")
    expect(first.content).not.toContain("second body")

    const third = readDocument(root, "doc.md", 20000, "Third")
    expect(third.content).toContain("third body")
    // Third is the last section, so no next-heading boundary — it runs to EOF.
    expect(third.content?.endsWith("third body")).toBe(true)
  })
})

/**
 * Wave 3 — NF-05: read-section edge cases.
 *
 * The `read` action's `heading` parameter has six failure modes that
 * previously surfaced as silent null returns or unhandled throws:
 *
 *   1. Ambiguous heading (multiple matches)        → return candidates list
 *   2. Leading/trailing whitespace in `heading`     → trim, then match
 *   3. Breadcrumb path match ("Foo > Bar")         → match the full path
 *   4. Regex special chars in `heading`             → literal match (not regex)
 *   5. `filePath` with trailing slash / `..`        → normalize before resolve
 *   6. File does not exist + heading requested     → FILE_NOT_FOUND, not
 *                                                   HEADING_NOT_FOUND
 *
 * The new result shape adds:
 *   - `errorCode: "FILE_NOT_FOUND" | "HEADING_NOT_FOUND" | "AMBIGUOUS_HEADING"`
 *   - `candidates: Array<{ heading, startLine, endLine }>` when ambiguous
 *
 * Evidence label: `runtime-truthful` — exercises the real `readDocument`
 * seam against real `mkdtempSync` directories.
 * Test size: `small`.
 */
describe("NF-05: read-section edge cases", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "nf05-read-edge-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("returns errorCode:'AMBIGUOUS_HEADING' with candidates when the heading matches multiple sections", () => {
    const path = join(root, "doc.md")
    writeFileSync(
      path,
      [
        "# Top",
        "",
        "## Deploy",
        "",
        "first deploy body",
        "",
        "## Other",
        "",
        "## Deploy", // second heading with the same text
        "",
        "second deploy body",
      ].join("\n"),
      "utf-8",
    )

    const result = readDocument(root, "doc.md", 20000, "Deploy")

    expect(result.content).toBeNull()
    expect(result.errorCode).toBe("AMBIGUOUS_HEADING")
    expect(result.heading).toBe("Deploy")
    expect(Array.isArray(result.candidates)).toBe(true)
    const candidates = result.candidates ?? []
    expect(candidates.length).toBe(2)
    expect(candidates[0]?.heading).toBe("Deploy")
    expect(candidates[1]?.heading).toBe("Deploy")
    // The two candidates are on different lines.
    expect(candidates[0]?.startLine).not.toBe(candidates[1]?.startLine)
  })

  it("trims leading and trailing whitespace on the heading before matching", () => {
    const path = join(root, "doc.md")
    writeFileSync(
      path,
      ["# Top", "", "## First", "", "first body"].join("\n"),
      "utf-8",
    )

    const result = readDocument(root, "doc.md", 20000, "   First   ")

    expect(result.content).not.toBeNull()
    expect(result.content).toContain("first body")
    expect(result.heading).toBe("First") // echoed back as the trimmed form
  })

  it("matches a breadcrumb path 'Parent > Child' against the full breadcrumb chain", () => {
    const path = join(root, "doc.md")
    writeFileSync(
      path,
      [
        "# Parent",
        "",
        "intro",
        "",
        "## Child",
        "",
        "child body",
        "",
        "## Sibling",
        "",
        "sibling body",
      ].join("\n"),
      "utf-8",
    )

    const result = readDocument(root, "doc.md", 20000, "Parent > Child")

    expect(result.content).not.toBeNull()
    expect(result.content).toContain("child body")
    expect(result.content).not.toContain("sibling body")
    expect(result.heading).toBe("Parent > Child")
  })

  it("treats regex special characters in the heading as literal (no regex eval)", () => {
    const path = join(root, "doc.md")
    writeFileSync(
      path,
      [
        "# Top",
        "",
        "## Foo (bar)",
        "",
        "literal-paren body",
        "",
        "## Other",
        "",
        "other body",
      ].join("\n"),
      "utf-8",
    )

    // Parentheses are regex metacharacters. Without literal escaping, the
    // matcher would treat "(bar)" as a regex group. The fix passes the
    // heading through `escapeRegex` so it matches as a literal string.
    const result = readDocument(root, "doc.md", 20000, "Foo (bar)")

    expect(result.content).not.toBeNull()
    expect(result.content).toContain("literal-paren body")
    expect(result.content).not.toContain("other body")
  })

  it("returns errorCode:'FILE_NOT_FOUND' when the file does not exist (precedes HEADING_NOT_FOUND)", () => {
    // File doesn't exist; heading is also nonsense. File-not-found wins.
    const result = readDocument(root, "does-not-exist.md", 20000, "Anything")

    expect(result.content).toBeNull()
    expect(result.errorCode).toBe("FILE_NOT_FOUND")
    expect(result.heading).toBeUndefined() // no point echoing a heading when the file is gone
  })

  it("normalizes a filePath with a trailing slash", () => {
    const subDir = join(root, "kb")
    const { mkdirSync } = require("node:fs")
    mkdirSync(subDir, { recursive: true })
    writeFileSync(
      join(subDir, "doc.md"),
      ["# Top", "", "intro"].join("\n"),
      "utf-8",
    )

    // Trailing slash on the filePath — should still resolve to the same file.
    const result = readDocument(root, "kb/doc.md/", 20000)
    expect(result.content).toContain("intro")
    expect(result.path).toBe("kb/doc.md")
  })
})
