import { readFileSync, readdirSync, statSync } from "node:fs"

import { resolveDocPath, toRootRelativePath, DOCUMENT_EXTENSIONS, hasAllowedExtension } from "./safety.js"
import { levenshtein } from "./read-ops.js"
import type { DocSearchMatch, SearchDocumentsResult } from "./types.js"

const DEFAULT_MAX_SEARCH_RESULTS = 50

/**
 * Interpretation mode for the search `query`. F-18 separates the three
 * interpretation paths so the agent can opt out of regex semantics
 * (which would otherwise silently choke on queries like `foo(bar)`).
 */
export type SearchMode = "literal" | "regex" | "fuzzy"

/**
 * Search across all supported-format documents in a directory tree.
 *
 * Wave-5 changes (F-18 + F-26 + NF-03):
 *   - Adds a `mode` parameter to disambiguate literal / regex / fuzzy
 *     interpretation. Default is `"regex"` for backward compat with the
 *     pre-Wave-5 implicit `regex: true` behavior.
 *   - Drops the stateful `g` flag from the regex path. `.test()` doesn't
 *     need it, and the flag was a code smell (NF-03) — a future refactor
 *     that shared a RegExp instance across lines would silently break.
 *   - Throws a `[Hivemind]`-prefixed error for invalid regex in
 *     `mode: "regex"` (the pre-Wave-5 behavior was to silently skip).
 *   - Adds a `maxTokens` budget (F-26). When the accumulated token
 *     estimate across matches exceeds the budget, the result is cut
 *     short and `truncated: true` + `truncationReason: "token_budget"`
 *     are returned. `maxTokens <= 0` means no budget.
 *
 * The `regex` boolean parameter is kept for backward compat with the
 * pre-Wave-5 API: if `mode` is specified it wins; otherwise the
 * `regex` boolean determines the interpretation (and falls back to
 * `mode: "regex"` when neither is set, per the F-18 spec).
 *
 * @param projectRoot - Trusted project root.
 * @param startPath - Project-root-relative file or directory path.
 * @param query - Search query (literal substring, regex pattern, or fuzzy target).
 * @param maxResults - Maximum matches to return (default 50).
 * @param regex - If true (and `mode` is unset), treat query as regex. Deprecated by `mode`.
 * @param headingOnly - If true, restrict matches to heading lines.
 * @param mode - Query interpretation mode (default `"regex"`).
 * @param maxTokens - Token-budget ceiling; non-positive means no budget.
 * @returns Search matches plus a truncated flag + reason envelope.
 */
export function searchDocuments(
  projectRoot: string,
  startPath: string,
  query: string,
  maxResults: number = DEFAULT_MAX_SEARCH_RESULTS,
  regex?: boolean,
  headingOnly: boolean = false,
  mode?: SearchMode,
  maxTokens: number = 0,
): SearchDocumentsResult {
  const absPath = resolveDocPath(projectRoot, startPath)
  const matches: DocSearchMatch[] = []

  // Wave-5: resolve the effective mode. `mode` (when set) wins over the
  // legacy `regex` boolean. `regex: true` is the pre-Wave-5 way to
  // opt into regex semantics; `regex: false` opt into literal; both
  // unset defaults to "regex" (F-18).
  const effectiveMode: SearchMode = mode ?? legacyRegexToMode(regex)

/**
 * Map the legacy `regex: boolean` parameter to the new `mode` union.
 * `regex: true` → "regex", `regex: false` → "literal", default →
 * "regex" (per F-18 acceptance criteria).
 */
function legacyRegexToMode(regex: boolean | undefined): SearchMode {
  if (regex === true) return "regex"
  if (regex === false) return "literal"
  return "regex"
}

  // Collect files recursively
  const files = collectDocumentFiles(absPath)

  // Pre-compile the regex once (NF-03: no `g` flag → not stateful).
  // Invalid regex in `mode: "regex"` throws a [Hivemind]-prefixed error.
  let compiledPattern: RegExp | null = null
  if (effectiveMode === "regex") {
    try {
      compiledPattern = new RegExp(query, "i")
    } catch (cause) {
      throw new Error(`[Hivemind] search: invalid regex: ${query}`)
    }
  }

  // Pre-compute the fuzzy-match threshold (Levenshtein distance / 4 of
  // the query length, minimum 1). Lines with a substring within that
  // distance of the query are considered a fuzzy match.
  const fuzzyMaxDistance = Math.max(1, Math.floor(query.length / 4))

  for (const filePath of files) {
    const lines = readFileSync(filePath, "utf-8").split(/\r?\n/)
    const relPath = toRootRelativePath(projectRoot, filePath)

    for (let i = 0; i < lines.length; i++) {
      if (matches.length >= maxResults) break

      const line = lines[i] ?? ""
      const matched = lineMatches(line, query, effectiveMode, compiledPattern, headingOnly, fuzzyMaxDistance)

      if (matched) {
        const heading = findNearestHeading(lines, i)
        matches.push({
          path: relPath,
          line: i + 1,
          snippet: line.trim(),
          heading,
        })
      }
    }
    if (matches.length >= maxResults) break
  }

  // F-26: token-budget truncation. Drop trailing matches when the
  // accumulated token estimate exceeds the budget. We accept the
  // last match as a partial over-shoot (the budget is a soft ceiling
  // to avoid splitting a match mid-snippet).
  if (maxTokens > 0) {
    let totalTokens = 0
    let kept = 0
    for (const m of matches) {
      const tokens = Math.ceil(m.snippet.length / 4)
      if (totalTokens + tokens > maxTokens && kept > 0) break
      totalTokens += tokens
      kept++
    }
    if (kept < matches.length) {
      const truncatedMatches = matches.slice(0, kept)
      return {
        matches: truncatedMatches,
        truncated: true,
        truncationReason: "token_budget",
      }
    }
  }

  // Pre-existing: maxResults truncation (pre-Wave-5 behavior).
  if (matches.length >= maxResults) {
    return {
      matches,
      truncated: true,
      truncationReason: "match_count",
    }
  }

  return {
    matches,
    truncated: false,
  }
}

/**
 * Test a single line against the query under the chosen mode.
 * Centralized so the three modes share a consistent code path.
 */
function lineMatches(
  line: string,
  query: string,
  mode: SearchMode,
  compiledPattern: RegExp | null,
  headingOnly: boolean,
  fuzzyMaxDistance: number,
): boolean {
  if (mode === "regex") {
    if (headingOnly && !/^#{1,6}\s/.test(line)) return false
    // compiledPattern is non-null when mode === "regex"; the caller
    // guarantees this via the [Hivemind]-prefixed throw at setup time.
    return compiledPattern !== null && compiledPattern.test(line)
  }
  if (mode === "literal") {
    if (headingOnly && !/^#{1,6}\s/.test(line)) return false
    return line.toLowerCase().includes(query.toLowerCase())
  }
  // mode === "fuzzy"
  if (headingOnly && !/^#{1,6}\s/.test(line)) return false
  return fuzzyLineMatch(query, line, fuzzyMaxDistance)
}

/**
 * Fuzzy-match the query against any substring of the line using
 * Levenshtein distance. A query of "configuraton" against a line
 * containing "configuration" matches because a 12-character sliding
 * window captures the typo within the distance threshold.
 */
function fuzzyLineMatch(query: string, line: string, maxDistance: number): boolean {
  const lowerQuery = query.toLowerCase()
  const lowerLine = line.toLowerCase()

  if (lowerLine.length <= lowerQuery.length) {
    return levenshtein(lowerQuery, lowerLine) <= maxDistance
  }
  if (lowerLine.includes(lowerQuery)) return true

  // Slide a window of query.length ± 2 characters across the line.
  // The ±2 tolerance handles small length mismatches between the
  // query and the actual substring the user is looking for.
  const windowTolerance = 2
  for (let offset = -windowTolerance; offset <= windowTolerance; offset++) {
    const winLen = lowerQuery.length + offset
    if (winLen <= 0 || winLen > lowerLine.length) continue
    for (let i = 0; i <= lowerLine.length - winLen; i++) {
      const window = lowerLine.slice(i, i + winLen)
      if (levenshtein(lowerQuery, window) <= maxDistance) return true
    }
  }
  return false
}

/**
 * Collect all document files recursively from a path.
 */
function collectDocumentFiles(startPath: string): string[] {
  const files: string[] = []

  const stat = statSync(startPath)
  if (stat.isFile()) {
    if (hasAllowedExtension(startPath, DOCUMENT_EXTENSIONS)) {
      files.push(startPath)
    }
    return files
  }

  function walk(dir: string): void {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const fullPath = `${dir}/${entry.name}`
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (hasAllowedExtension(fullPath, DOCUMENT_EXTENSIONS)) {
        files.push(fullPath)
      }
    }
  }

  walk(startPath)
  return files
}

/**
 * Find the nearest heading line above a given line index.
 */
function findNearestHeading(lines: string[], currentIndex: number): string | null {
  for (let i = currentIndex - 1; i >= 0; i--) {
    const headingMatch = /^#{1,6}\s+(.+)$/.exec(lines[i])
    if (headingMatch) return headingMatch[1].trim()
  }
  return null
}
