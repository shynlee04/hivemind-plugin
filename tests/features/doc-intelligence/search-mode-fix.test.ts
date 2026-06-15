import { describe, it, expect } from "vitest"
import { afterEach, beforeEach } from "vitest"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { searchDocuments } from "../../../src/features/doc-intelligence/search-ops.js"

/**
 * Wave 5 — search mode (F-18) + stateful-g fix (NF-03).
 *
 * Part A (F-18): The search action's `mode` parameter distinguishes
 * between three interpretation modes for the `query`:
 *   - `mode: "literal"` → `String.prototype.includes` (no regex)
 *   - `mode: "regex"`  → `new RegExp(query, "i").test(line)` (no `g` flag)
 *   - `mode: "fuzzy"`  → Levenshtein-distance-based line match
 *   - default          → `mode: "regex"` (backward compat with the
 *                        pre-Wave-5 implicit "regex on `regex: true`"
 *                        behavior, after the stateful-`g` fix)
 *
 * Part C (NF-03): The pre-Wave-5 regex path constructed
 * `new RegExp(query, "gi")` with a stateful `g` flag. While the
 * current code happens to re-create the RegExp per line (avoiding
 * the bug in practice), the `g` flag is a code smell and would
 * silently break if a future refactor shared a RegExp across lines.
 * The fix drops the `g` flag entirely (`.test()` doesn't need it).
 *
 * Invalid regex in `mode: "regex"` throws a `[Hivemind]`-prefixed
 * error so the agent gets a structured error envelope.
 *
 * Evidence label: `runtime-truthful` — every test exercises the real
 * `searchDocuments` seam against real `mkdtempSync` directories and
 * real on-disk markdown content.
 * Test size: `small`.
 */
describe("F-18 / NF-03: searchDocuments mode + stateful-g fix", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "f18-search-mode-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  describe("mode: 'literal'", () => {
    it("matches the exact substring including regex metacharacters like parens", () => {
      writeFileSync(join(root, "doc.md"), "# Top\n\nfoo(bar) is a function call\n\nno match here\n", "utf-8")
      const result = searchDocuments(root, ".", "foo(bar)", 50, false, false, "literal")
      expect(result.matches.length).toBe(1)
      expect(result.matches[0]?.snippet).toContain("foo(bar)")
    })

    it("does NOT interpret regex metacharacters", () => {
      writeFileSync(join(root, "doc.md"), "# Top\n\nfoo*bar\n\nfooanythingbar\n", "utf-8")
      // In regex mode, "foo*bar" would match "foo" + zero or more "o" + "bar".
      // In literal mode, "foo*bar" must match the literal string "foo*bar".
      const result = searchDocuments(root, ".", "foo*bar", 50, false, false, "literal")
      expect(result.matches.length).toBe(1)
      expect(result.matches[0]?.snippet).toContain("foo*bar")
    })
  })

  describe("mode: 'regex'", () => {
    it("matches a valid regex pattern (default mode backward compat)", () => {
      writeFileSync(join(root, "doc.md"), "# Test\n\nerror-42\ninfo-7\nwarning-99\n", "utf-8")
      const result = searchDocuments(root, ".", "error-\\d+", 50, false, false, "regex")
      expect(result.matches.length).toBe(1)
      expect(result.matches[0]?.snippet).toContain("error-42")
    })

    it("is the default mode (omitted `mode` and `regex` parameters matches `mode: 'regex'`)", () => {
      writeFileSync(join(root, "doc.md"), "# Test\n\nerror-42\ninfo-7\n", "utf-8")
      // When BOTH `mode` and `regex` are omitted, the default is "regex" (F-18).
      const withDefault = searchDocuments(root, ".", "error-\\d+", 50)
      const withExplicitRegex = searchDocuments(root, ".", "error-\\d+", 50, false, false, "regex")
      expect(withDefault.matches.length).toBe(withExplicitRegex.matches.length)
    })

    it("throws a [Hivemind]-prefixed error for an invalid regex", () => {
      writeFileSync(join(root, "doc.md"), "# Test\n\nany line\n", "utf-8")
      // Unbalanced paren — invalid regex.
      expect(() => {
        searchDocuments(root, ".", "foo(", 50, false, false, "regex")
      }).toThrow(/^\[Hivemind\]/)
    })
  })

  describe("mode: 'fuzzy'", () => {
    it("finds lines with close Levenshtein-distance matches", () => {
      writeFileSync(join(root, "doc.md"), "# Top\n\nThe configuration is set\n\nOther text\n", "utf-8")
      // Typo: "configuraton" (1 deletion) should fuzzy-match "configuration".
      const result = searchDocuments(root, ".", "configuraton", 50, false, false, "fuzzy")
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0]?.snippet.toLowerCase()).toContain("configuration")
    })
  })

  describe("NF-03: stateful 'g' flag regression guard", () => {
    it("does not skip lines across 100 sequential calls with the same regex pattern", () => {
      writeFileSync(join(root, "doc.md"), "match\nmatch\nmatch\nmatch\nmatch\n", "utf-8")
      // The pre-fix bug: a stateful `g` flag on a shared RegExp instance
      // would advance `lastIndex` across `.test()` calls, eventually
      // returning false even when the pattern matches. The current
      // implementation recreates the RegExp per line so the bug
      // doesn't manifest in practice, but the `g` flag is still a
      // code smell. This test guards against a future refactor that
      // shares the RegExp instance across calls.
      for (let i = 0; i < 100; i++) {
        const result = searchDocuments(root, ".", "match", 50, true, false, "regex")
        expect(result.matches.length).toBe(5)
      }
    })

    it("source file does not construct RegExp with the stateful 'gi' flag pattern", () => {
      // Static check: the search-ops source must not use `new RegExp(query, "gi")`
      // (or any `gi` literal-flag pair). The fix drops the `g` flag.
      const sourcePath = join(import.meta.dirname, "../../../src/features/doc-intelligence/search-ops.ts")
      const source = readFileSync(sourcePath, "utf-8")
      // The `g` flag combined with `.test()` is the stateful pattern.
      expect(source).not.toMatch(/new\s+RegExp\s*\([^)]*,\s*["'][^"']*g[^"']*["']\s*\)/)
    })
  })
})
