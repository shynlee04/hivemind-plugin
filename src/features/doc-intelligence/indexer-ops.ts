import { readFileSync, readdirSync, statSync } from "node:fs"

import { resolveDocPath, toRootRelativePath, DOCUMENT_EXTENSIONS, hasAllowedExtension } from "./safety.js"
import { parseDocument } from "./parser.js"
import { computeContentHash } from "./concurrency.js"
import type { DocumentIndexEntry } from "./types.js"

const MARKDOWN_LINK_PATTERN = /\[([^\]]*)\]\(([^)]+)\)/g

/**
 * Build a document index for all supported documents under a directory.
 * Ephemeral — no persistence, rebuilt on every call.
 *
 * @param projectRoot - Trusted project root.
 * @param dirPath - Project-root-relative directory path.
 * @returns Array of document index entries.
 */
export function buildDocumentIndex(
  projectRoot: string,
  dirPath: string,
): DocumentIndexEntry[] {
  const absPath = resolveDocPath(projectRoot, dirPath)
  const entries: DocumentIndexEntry[] = []

  const files = collectDocumentFiles(absPath)

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, "utf-8")
      const stats = statSync(filePath)
      const relPath = toRootRelativePath(projectRoot, filePath)
      const parsed = parseDocument(relPath, content)
      const lines = content.split(/\r?\n/)

      // Derive title: frontmatter > first H1 > filename
      const title = parsed.title || relPath.split("/").pop()?.replace(/\.[^.]+$/, "") || null

      // Determine heading path (simplified)
      const headingPath = parsed.outline.length > 0
        ? parsed.outline.slice(0, 3).map((h) => h.text).join(" > ")
        : ""

      // Count links
      let linkCount = 0
      let m: RegExpExecArray | null
      MARKDOWN_LINK_PATTERN.lastIndex = 0
      while ((m = MARKDOWN_LINK_PATTERN.exec(content)) !== null) {
        if (!m[2].startsWith("http") && !m[2].startsWith("#")) {
          linkCount++
        }
      }

      entries.push({
        path: relPath,
        title,
        headingPath,
        lineCount: lines.length,
        sizeBytes: stats.size,
        hash: computeContentHash(content),
        lastModified: stats.mtime.toISOString(),
        headingCount: parsed.outline.length,
        linkCount,
      })
    } catch {
      // Skip unreadable files — don't fail the entire index
      continue
    }
  }

  // Sort by path for deterministic output
  entries.sort((a, b) => a.path.localeCompare(b.path))

  return entries
}

/**
 * Collect all document files recursively from a path.
 */
function collectDocumentFiles(startPath: string): string[] {
  const files: string[] = []

  const s = statSync(startPath)
  if (s.isFile()) {
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
