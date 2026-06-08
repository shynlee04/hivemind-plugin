import { readFileSync, readdirSync, statSync } from "node:fs"

import { parseDocument } from "./parser.js"
import { DOCUMENT_EXTENSIONS, hasAllowedExtension, resolveDocPath, toRootRelativePath } from "./safety.js"
import { computeContentHash } from "./concurrency.js"
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

/**
 * Read a file's full content with optional character limit.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param maxCharacters - Maximum characters to return (default 20000).
 * @returns Read result with content and truncation signal.
 */
export function readDocument(
  projectRoot: string,
  filePath: string,
  maxCharacters = DEFAULT_MAX_READ_CHARACTERS,
): { path: string; content: string; characterCount: number; truncated: boolean } {
  const absPath = resolveDocPath(projectRoot, filePath)
  const content = readFileSync(absPath, "utf-8")

  return {
    path: toRootRelativePath(projectRoot, absPath),
    content: content.slice(0, maxCharacters),
    characterCount: content.length,
    truncated: content.length > maxCharacters,
  }
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
