import { readFileSync, readdirSync, statSync } from "node:fs"

import { resolveDocPath, toRootRelativePath, DOCUMENT_EXTENSIONS, hasAllowedExtension } from "./safety.js"
import type { DocSearchMatch } from "./types.js"

const DEFAULT_MAX_SEARCH_RESULTS = 50

/**
 * Search across all supported-format documents in a directory tree.
 *
 * @param projectRoot - Trusted project root.
 * @param startPath - Project-root-relative file or directory path.
 * @param query - Search query string or regex pattern.
 * @param maxResults - Maximum matches to return (default 50).
 * @param regex - If true, treat query as regex pattern.
 * @param headingOnly - If true, restrict matches to heading lines.
 * @returns Search matches with path, line, snippet, and heading context.
 */
export function searchDocuments(
  projectRoot: string,
  startPath: string,
  query: string,
  maxResults = DEFAULT_MAX_SEARCH_RESULTS,
  regex = false,
  headingOnly = false,
): DocSearchMatch[] {
  const absPath = resolveDocPath(projectRoot, startPath)
  const matches: DocSearchMatch[] = []

  // Collect files recursively
  const files = collectDocumentFiles(absPath)

  for (const filePath of files) {
    const lines = readFileSync(filePath, "utf-8").split(/\r?\n/)
    const relPath = toRootRelativePath(projectRoot, filePath)

    for (let i = 0; i < lines.length; i++) {
      if (matches.length >= maxResults) break

      const line = lines[i]
      let matched = false

      if (regex) {
        try {
          const pattern = new RegExp(query, "gi")
          matched = pattern.test(line)
        } catch {
          // Invalid regex — skip
        }
      } else if (headingOnly) {
        matched = /^#{1,6}\s/.test(line) && line.toLowerCase().includes(query.toLowerCase())
      } else {
        matched = line.toLowerCase().includes(query.toLowerCase())
      }

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

  return matches
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
