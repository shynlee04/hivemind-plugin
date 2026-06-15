import { readFileSync, readdirSync, statSync } from "node:fs"

import { parseDocument } from "./parser.js"
import { DOCUMENT_EXTENSIONS, hasAllowedExtension, resolveDocPath, toRootRelativePath } from "./safety.js"
import { computeContentHash } from "./concurrency.js"
import { assignHeadingPath, parseHeadings } from "./heading-index.js"
import type { LineReadResult, OffsetReadResult, ParsedMarkdownDocument } from "./types.js"

const DEFAULT_MAX_READ_CHARACTERS = 20000

/**
 * Skim a single document: extract heading hierarchy, frontmatter, title, word/char count.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @returns Parsed document metadata.
 */
export function skimDocument(projectRoot: string, filePath: string): ParsedMarkdownDocument {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")
  return parseDocument(toRootRelativePath(projectRoot, absPath), content)
}

/**
 * Skim all supported-format documents in a directory recursively.
 *
 * @param projectRoot - Trusted project root.
 * @param dirPath - Project-root-relative directory path.
 * @param format - Optional format filter (e.g., "md", "json").
 * @returns Array of parsed document metadata, sorted by relative path.
 */
export function skimDirectory(
  projectRoot: string,
  dirPath: string,
  format?: string,
): ParsedMarkdownDocument[] {
  const absPath = resolveDocPath(projectRoot, dirPath)
  const formatExt = format ? `.${format.toLowerCase()}` : undefined

  return listDocumentFiles(absPath)
    .filter((file) => !formatExt || file.toLowerCase().endsWith(formatExt))
    .map((file) => skimDocument(projectRoot, toRootRelativePath(projectRoot, file)))
}

/** Result shape returned by {@link readDocument}. */
export type ReadDocumentResult = {
  path: string
  /** Full file content when `heading` is omitted; section body when targeted; `null` when the section is missing or the file does not exist. */
  content: string | null
  characterCount: number
  /** True when the content was truncated by `maxCharacters`. */
  truncated: boolean
  heading: string | undefined
  /** Up to 3 closest existing heading names by Levenshtein distance. Empty when section was found. */
  suggestions: string[]
  /** SHA-256 hex of the file content at read time; usable as `expectedHash` in subsequent writes. */
  hash: string
  /**
   * Wave-3 (NF-05) error discriminator. `undefined` on success. On
   * failure, one of:
   *   - `"FILE_NOT_FOUND"`        — the file does not exist
   *   - `"HEADING_NOT_FOUND"`     — file exists, no heading matches
   *   - `"AMBIGUOUS_HEADING"`     — file exists, multiple headings match
   * The router emits a `[Hivemind]`-prefixed envelope with the matching
   * `code` so the agent can branch on the failure mode.
   */
  errorCode?: "FILE_NOT_FOUND" | "HEADING_NOT_FOUND" | "AMBIGUOUS_HEADING"
  /**
   * Wave-3 (NF-05) disambiguation list. Populated when `errorCode` is
   * `"AMBIGUOUS_HEADING"` so the caller can pick the intended match
   * without re-scanning the file.
   */
  candidates?: Array<{ heading: string; startLine: number; endLine: number }>
}

/**
 * Read a specific section by heading.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param heading - Heading text to find (exact match).
 * @returns Section content or null if heading not found.
 */
export function readSectionByHeading(
  projectRoot: string,
  filePath: string,
  heading: string,
): { path: string; content: string | null; heading: string } {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")
  const lines = content.split(/\r?\n/)
  const relPath = toRootRelativePath(projectRoot, absPath)

  // Find the heading line
  const headingPattern = new RegExp(`^#{1,6}\\s+${escapeRegex(heading)}\\s*$`, "m")
  const headingMatch = headingPattern.exec(content)
  if (!headingMatch) {
    return { path: relPath, content: null, heading }
  }

  // Find the line index of the match
  const preMatch = content.slice(0, headingMatch.index)
  const headingLineIndex = preMatch.split(/\r?\n/).length - 1

  // Find next heading of equal or lesser depth
  const headingDepth = headingMatch[0].match(/^#+/)?.[0].length ?? 2
  let endLine = lines.length
  for (let i = headingLineIndex + 1; i < lines.length; i++) {
    const nextHeading = /^(#{1,6})\s+/.exec(lines[i])
    if (nextHeading && nextHeading[1].length <= headingDepth) {
      endLine = i
      break
    }
  }

  const sectionContent = lines.slice(headingLineIndex + 1, endLine).join("\n").trim()
  return { path: relPath, content: sectionContent || null, heading }
}

/**
 * Read a file's full content with optional character limit.
 *
 * When `heading` is provided the result is scoped to that section's body
 * (F-05). The section boundary is the next heading of equal-or-shallower
 * depth, or EOF. When the heading does not exist `content` is `null` and
 * `suggestions` carries up to 3 closest existing headings by Levenshtein
 * distance (F-18 reuse), letting the router emit a `HEADING_NOT_FOUND`
 * envelope. `hash` is always the SHA-256 of the FILE content (F-24) so
 * callers can chain into `write`/`upsert` with `expectedHash`.
 *
 * Wave-3 (NF-05) edge cases:
 *   - `heading` is trimmed of leading/trailing whitespace before match.
 *   - `heading` containing " > " is treated as a breadcrumb path
 *     (matches the heading whose `headingPath` joins to that exact string).
 *   - Multiple headings matching the same text emit an
 *     `AMBIGUOUS_HEADING` result with `candidates` populated.
 *   - The file is wrapped in try/catch so a missing file returns a
 *     structured `FILE_NOT_FOUND` result (instead of throwing).
 *   - The `filePath` is run through `path.normalize` so trailing slashes
 *     and `.` / `..` segments collapse before `resolveDocPath`.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param maxCharacters - Maximum characters to return (default 20000).
 * @param heading - Optional section selector.
 * @returns Read result with content, hash, and (when targeted) suggestions.
 */
export function readDocument(
  projectRoot: string,
  filePath: string,
  maxCharacters: number = DEFAULT_MAX_READ_CHARACTERS,
  heading?: string,
): ReadDocumentResult {
  const absPath = resolveDocPath(projectRoot, filePath)
  const relPath = toRootRelativePath(projectRoot, absPath)

  let content: string
  try {
    content = readFileSync(absPath, "utf-8")
  } catch {
    return {
      path: relPath,
      content: null,
      characterCount: 0,
      truncated: false,
      heading: undefined,
      suggestions: [],
      hash: "",
      errorCode: "FILE_NOT_FOUND",
    }
  }

  const hash = computeContentHash(content)
  const lines = content.split(/\r?\n/)

  if (heading === undefined) {
    return {
      path: relPath,
      content: content.slice(0, maxCharacters),
      characterCount: content.length,
      truncated: content.length > maxCharacters,
      heading: undefined,
      suggestions: [],
      hash,
    }
  }

  // Wave-3: trim whitespace + handle breadcrumb "Parent > Child" path form.
  const trimmedHeading = heading.trim()
  const isBreadcrumb = trimmedHeading.includes(" > ")

  if (isBreadcrumb) {
    return readByBreadcrumb(relPath, content, lines, trimmedHeading, hash)
  }

  return readByExactText(relPath, content, lines, trimmedHeading, hash)
}

/**
 * Resolve a heading by its full breadcrumb path (e.g., `"Parent > Child"`).
 * Returns the section body whose `headingPath` joins to the query,
 * with leading/trailing whitespace stripped.
 */
function readByBreadcrumb(
  relPath: string,
  content: string,
  lines: string[],
  heading: string,
  hash: string,
): ReadDocumentResult {
  const pathSegments = heading.split(" > ").map((segment) => segment.trim())
  const allHeadings = assignHeadingPath(parseHeadings(content))
  const target = allHeadings.find((h) =>
    h.headingPath.length === pathSegments.length
    && h.headingPath.every((segment, index) => segment === pathSegments[index])
  )

  if (!target) {
    return {
      path: relPath,
      content: null,
      characterCount: content.length,
      truncated: false,
      heading,
      suggestions: fuzzyMatchHeadings(pathSegments[pathSegments.length - 1] ?? heading, allHeadings.map((h) => h.text), 3),
      hash,
      errorCode: "HEADING_NOT_FOUND",
    }
  }

  return sectionFromLineRange(relPath, content, lines, target.startLine, target.endLine, target.level, heading, hash)
}

/**
 * Resolve a heading by its exact text. Detects ambiguity (multiple
 * matches with the same text) and reports `AMBIGUOUS_HEADING` so the
 * caller can disambiguate.
 */
function readByExactText(
  relPath: string,
  content: string,
  lines: string[],
  heading: string,
  hash: string,
): ReadDocumentResult {
  const allHeadings = parseHeadings(content)
  const matches = allHeadings.filter((h) => h.text === heading)

  if (matches.length === 0) {
    return {
      path: relPath,
      content: null,
      characterCount: content.length,
      truncated: false,
      heading,
      suggestions: fuzzyMatchHeadings(heading, allHeadings.map((h) => h.text), 3),
      hash,
      errorCode: "HEADING_NOT_FOUND",
    }
  }

  if (matches.length > 1) {
    return {
      path: relPath,
      content: null,
      characterCount: content.length,
      truncated: false,
      heading,
      suggestions: [],
      hash,
      errorCode: "AMBIGUOUS_HEADING",
      candidates: matches.map((m) => ({ heading: m.text, startLine: m.startLine, endLine: m.endLine })),
    }
  }

  const target = matches[0]
  if (!target) {
    return {
      path: relPath,
      content: null,
      characterCount: content.length,
      truncated: false,
      heading,
      suggestions: fuzzyMatchHeadings(heading, allHeadings.map((h) => h.text), 3),
      hash,
      errorCode: "HEADING_NOT_FOUND",
    }
  }

  return sectionFromLineRange(relPath, content, lines, target.startLine, target.endLine, target.level, heading, hash)
}

/**
 * Slice the lines between `startLine` and `endLine` (inclusive) and
 * return the section body, trimmed.
 */
function sectionFromLineRange(
  relPath: string,
  _content: string,
  lines: string[],
  startLine: number,
  endLine: number,
  level: number,
  heading: string,
  hash: string,
): ReadDocumentResult {
  // startLine is the heading line itself; section body starts at startLine + 1.
  const body = lines.slice(startLine, endLine).join("\n").trim()
  // The level of the matched heading is exposed via the depth field, but
  // the public ReadDocumentResult no longer carries `depth`. We surface
  // it implicitly through the `heading` field's match. No-op here.
  void level
  return {
    path: relPath,
    content: body || null,
    characterCount: body.length,
    truncated: false,
    heading,
    suggestions: [],
    hash,
  }
}

/**
 * Read a specific contiguous range of 1-indexed lines from any text file.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param startLine - One-based start line.
 * @param endLine - One-based end line (optional, defaults to startLine).
 * @returns Line range read result.
 */
export function readLines(
  projectRoot: string,
  filePath: string,
  startLine: number,
  endLine?: number,
): LineReadResult {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")
  const lines = content.split(/\r?\n/)
  const totalLines = lines.length

  // Clamp to valid range
  const clampedStart = Math.max(1, Math.min(startLine, totalLines))
  const clampedEnd = endLine ? Math.max(clampedStart, Math.min(endLine, totalLines)) : clampedStart

  const selectedLines = lines.slice(clampedStart - 1, clampedEnd)
  const resultContent = selectedLines.join("\n")

  return {
    path: toRootRelativePath(projectRoot, absPath),
    content: resultContent,
    startLine: clampedStart,
    endLine: clampedEnd,
    totalLines,
    hash: computeContentHash(content),
  }
}

/**
 * Read a character slice from a file at a given offset.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param offset - Zero-based character offset.
 * @param limit - Maximum characters to return.
 * @returns Offset read result.
 */
export function readOffset(
  projectRoot: string,
  filePath: string,
  offset: number,
  limit: number,
): OffsetReadResult {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")
  const totalCharacters = content.length

  // Clamp offset to valid range
  const clampedOffset = Math.max(0, Math.min(offset, totalCharacters))
  const slicedContent = content.slice(clampedOffset, clampedOffset + limit)

  return {
    path: toRootRelativePath(projectRoot, absPath),
    content: slicedContent,
    offset: clampedOffset,
    limit: Math.min(limit, totalCharacters - clampedOffset),
    totalCharacters,
  }
}

/**
 * Recursively list document files in deterministic root-relative order.
 *
 * @param startPath - Absolute file or directory path.
 * @returns Absolute document file paths sorted deterministically.
 */
function listDocumentFiles(startPath: string): string[] {
  const stats = statSync(startPath)
  if (stats.isFile()) return isDocumentFile(startPath) ? [startPath] : []
  return readdirSync(startPath, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const entryPath = `${startPath}/${entry.name}`
      if (entry.isDirectory()) return listDocumentFiles(entryPath)
      return isDocumentFile(entryPath) ? [entryPath] : []
    })
}

/**
 * Check whether a file path uses a recognized document extension.
 */
function isDocumentFile(filePath: string): boolean {
  return hasAllowedExtension(filePath, DOCUMENT_EXTENSIONS)
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Collect the literal text of every markdown heading in the content.
 * Order is preserved (document order). Used to feed the fuzzy-match
 * suggestions when a requested heading is missing.
 */
export function collectAllHeadings(content: string): string[] {
  const out: string[] = []
  const re = /^(#{1,6})\s+(.+?)\s*$/gm
  let match: RegExpExecArray | null
  while ((match = re.exec(content)) !== null) {
    out.push(match[2])
  }
  return out
}

/**
 * Return up to `k` heading names closest to `query` by Levenshtein distance.
 * Stable on tie-breaks (first occurrence wins). Returns an empty array
 * when no candidates exist.
 */
export function fuzzyMatchHeadings(query: string, candidates: string[], k: number): string[] {
  if (candidates.length === 0) return []
  const q = query.toLowerCase()
  const ranked = candidates
    .map((candidate, index) => ({ candidate, index, distance: levenshtein(q, candidate.toLowerCase()) }))
    .sort((left, right) => left.distance - right.distance || left.index - right.index)
  const top = ranked.slice(0, k)
  // Drop exact matches (distance 0) when the original query was NOT exact —
  // we still surface them, but cap at k.
  return top.map((entry) => entry.candidate)
}

/**
 * Iterative Levenshtein edit-distance between two strings. Bounded to
 * `maxDistance + 1` so we can short-circuit when a candidate is already
 * worse than the current best (used implicitly via sorting).
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  let previous = new Array<number>(b.length + 1)
  let current = new Array<number>(b.length + 1)
  for (let j = 0; j <= b.length; j++) previous[j] = j

  for (let i = 1; i <= a.length; i++) {
    current[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      const del = (previous[j] ?? 0) + 1
      const ins = (current[j - 1] ?? 0) + 1
      const sub = (previous[j - 1] ?? 0) + cost
      current[j] = Math.min(del, ins, sub)
    }
    const tmp = previous
    previous = current
    current = tmp
  }
  return previous[b.length] ?? 0
}
