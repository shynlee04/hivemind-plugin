import { describe, it, expect } from "vitest"
import { afterEach, beforeEach } from "vitest"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { searchDocuments } from "../../../src/features/doc-intelligence/search-ops.js"

/**
 * Wave 5 — F-26: search token budget enforcement.
 *
 * The pre-Wave-5 `searchDocuments` had no upper bound on the result
 * size — a search across the whole `kb/` directory could return
 * megabytes of snippet text. The fix adds an optional `maxTokens`
 * parameter that truncates the result list when the accumulated
 * token estimate exceeds the budget.
 *
 * Truncation is signaled in the result envelope via:
 *   - `truncated: boolean`       — true when the result was truncated
 *   - `truncationReason: "token_budget" | "match_count"`
 *                              — "token_budget" when the result was cut
 *                                by the byte/token ceiling;
 *                                "match_count" when the result was cut
 *                                by `maxResults` (pre-existing behavior)
 *
 * A non-positive `maxTokens` is treated as no-budget (backward
 * compat with the pre-Wave-5 behavior of returning all matches up
 * to `maxResults`).
 *
 * Token estimation: `Math.ceil(snippet.length / 4)` per match,
 * matching the `read` action's `estimatedTokens` heuristic.
 *
 * Evidence label: `runtime-truthful` — every test exercises the real
 * `searchDocuments` against a real `mkdtempSync` directory with real
 * on-disk markdown content.
 * Test size: `small`.
 */
describe("F-26: searchDocuments token budget enforcement", () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "f26-search-budget-"))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it("truncates the result when accumulated token estimate exceeds maxTokens", () => {
    // 5 lines, each ~50 chars. Each line is ~13 tokens.
    // With maxTokens: 30, only the first 2 should fit.
    const lines = Array.from({ length: 5 }, (_, i) => `auth section ${i} content goes here`).join("\n")
    writeFileSync(join(root, "doc.md"), `# Top\n\n${lines}\n`, "utf-8")

    const result = searchDocuments(root, ".", "auth", 50, false, false, "regex", 30)
    expect(result.truncated).toBe(true)
    expect(result.truncationReason).toBe("token_budget")
    // The accumulated tokens should be <= maxTokens + the cost of the
    // last match (we accept it as a partial truncation).
    const accumulated = result.matches.reduce((sum, m) => sum + Math.ceil(m.snippet.length / 4), 0)
    expect(accumulated).toBeLessThanOrEqual(30 + 15) // tolerance for last-match overshoot
  })

  it("does NOT truncate when maxTokens is 0 (default = no budget)", () => {
    const lines = Array.from({ length: 5 }, (_, i) => `auth section ${i} content goes here`).join("\n")
    writeFileSync(join(root, "doc.md"), `# Top\n\n${lines}\n`, "utf-8")

    const result = searchDocuments(root, ".", "auth", 50, false, false, "regex", 0)
    expect(result.truncated).toBe(false)
    expect(result.truncationReason).toBeUndefined()
    expect(result.matches.length).toBe(5)
  })

  it("does NOT truncate when maxTokens is negative (backward compat)", () => {
    const lines = Array.from({ length: 3 }, (_, i) => `auth section ${i}`).join("\n")
    writeFileSync(join(root, "doc.md"), `# Top\n\n${lines}\n`, "utf-8")

    const result = searchDocuments(root, ".", "auth", 50, false, false, "regex", -1)
    expect(result.truncated).toBe(false)
    expect(result.matches.length).toBe(3)
  })

  it("does NOT truncate when the result fits comfortably under the budget", () => {
    writeFileSync(join(root, "doc.md"), "# Top\n\none auth hit\n", "utf-8")
    const result = searchDocuments(root, ".", "auth", 50, false, false, "regex", 10_000)
    expect(result.truncated).toBe(false)
    expect(result.truncationReason).toBeUndefined()
    expect(result.matches.length).toBe(1)
  })

  it("maxResults-based truncation carries truncationReason: 'match_count' when budget is large", () => {
    // 10 matches, maxResults: 3, maxTokens: 100000 (no token truncation).
    const lines = Array.from({ length: 10 }, (_, i) => `auth line ${i}`).join("\n")
    writeFileSync(join(root, "doc.md"), `# Top\n\n${lines}\n`, "utf-8")

    const result = searchDocuments(root, ".", "auth", 3, false, false, "regex", 100_000)
    expect(result.truncated).toBe(true)
    expect(result.truncationReason).toBe("match_count")
    expect(result.matches.length).toBe(3)
  })
})
