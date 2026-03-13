/**
 * Read operations for document intelligence.
 * 
 * Stateless read-only operations that use projectRoot parameter injection.
 * All functions are pure and side-effect free (except for file reads).
 * 
 * @module doc-intel/read-ops
 */

import { readFile, stat, readdir } from "node:fs/promises"
import { join, extname, relative, dirname, basename } from "node:path"
import { createHash } from "node:crypto"

import { getWeaver, estimateTokens } from "./index.js"
import type { HeadingHierarchy, DocumentChunk, FormatWeaver } from "./types.js"
import { safePath, isDocument, relativeProjectPath } from "./safety.js"

//─── Types ──────────────────────────────────────────────────────────────────────

/**
 * Document skim result — lightweight metadata and outline extraction.
 */
export interface DocumentSkim {
  /** Workspace-relative file path */
  path: string
  /** Parsed YAML frontmatter (null if absent) */
  metadata: Record<string, string> | null
  /** Heading hierarchy tree */
  outline: HeadingHierarchy[]
  /** Total line count of the file */
  lineCount: number
  /** Estimated token count for the entire file */
  tokenEstimate: number
}

/**
 * Document list entry — summary metadata for a file.
 */
export interface DocumentListEntry {
  /** Workspace-relative file path */
  path: string
  /** Title extracted from first H1 or frontmatter title field, or filename */
  title: string
  /** Total line count */
  lineCount: number
  /** File size in bytes */
  sizeBytes: number
  /** Number of headings */
  headingCount: number
  /** Last modified ISO timestamp */
  lastModified: string
}

/**
 * Document search result — single match in a document.
 */
export interface DocumentSearchResult {
  /** Workspace-relative file path */
  path: string
  /** Heading under which the match was found (or "(body)" for body matches) */heading: string
  /** 1-indexed line number of the match */
  line: number
  /** Snippet of the matching line */
  snippet: string
}

/**
 * Cross-reference result — link reference between documents.
 */
export interface XrefResult {
  /** Source file */
  from: string
  /** Target link/reference */
  to: string
  /** Line number of the reference */
  line: number
  /** Whether the target exists */
  valid: boolean
  /** Link text */
  text: string
}

/**
 * Document index entry — comprehensive document metadata.
 */
export interface DocumentIndexEntry {
  path: string
  title: string
  headingPath: string[]
  lineCount: number
  sizeBytes: number
  hash: string
  lastModified: string
  headingCount: number
  linkCount: number
  outline: HeadingHierarchy[]
}

/**
 * Smart context chunk — relevant section with score.
 */
export interface ContextChunk {
  path: string
  heading: string
  content: string
  relevanceScore: number
  tokenEstimate: number
}

//─── Infrastructure Utilities ───────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of content.
 *
 * @param text - Content to hash.
 * @returns Hex-encoded SHA-256 hash.
 */
export function contentHash(text: string): string {
  return createHash("sha256").update(text, "utf-8").digest("hex")
}

/**
 * Read a file as UTF-8 text.
 *
 * @param absPath - Absolute file path.
 * @returns File content as string.
 * @throws If the file does not exist or cannot be read.
 */
async function readTextFile(absPath: string): Promise<string> {
  return readFile(absPath, "utf-8")
}

/**
 * Recursively scan a directory for document files.
 *
 * @param dirPath - Absolute directory path.
 * @param globFilter - Optional extension filter (e.g., ".md").
 * @returns Array of absolute file paths.
 */
async function scanDirectory(dirPath: string, globFilter?: string): Promise<string[]> {
  const results: string[] = []
  
  async function walk(dir: string): Promise<void> {
    let entries: import("node:fs").Dirent[]
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        // Skip hidden directories and node_modules
        if (entry.name.startsWith(".") || entry.name === "node_modules") continue
        await walk(fullPath)
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase()
        if (globFilter) {
          if (ext === globFilter || entry.name.endsWith(globFilter)) {
            results.push(fullPath)
          }
        } else if (isDocument(fullPath)) {
          results.push(fullPath)
        }
      }
    }
  }

  await walk(dirPath)
  return results
}

/**
 * Get the appropriate weaver for a file extension, with markdown as fallback.
 *
 * @param filePath - File path to get weaver for.
 * @returns FormatWeaver for the file type.
 */
function getWeaverForFile(filePath: string): FormatWeaver {
  const ext = extname(filePath).toLowerCase()
  const weaver = getWeaver(ext)
  if (!weaver) {
    throw new Error(`Unsupported file extension: ${ext}`)
  }
  return weaver
}

//─── Read Operations ────────────────────────────────────────────────────────────

/**
 * Skim a single document — extract hierarchy, metadata, and size metrics.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path to the document.
 * @returns Document skim with outline, metadata, and token estimate.
 */
export async function skimDocument(projectRoot: string, filePath: string): Promise<DocumentSkim> {
  const abs = safePath(projectRoot, filePath)
  const content = await readTextFile(abs)
  const lines = content.split("\n")
  const weaver = getWeaverForFile(abs)

  return {
    path: relative(projectRoot, abs),
    metadata: weaver.readMetadata(content) as Record<string, string> | null,
    outline: weaver.readOutline(content),
    lineCount: lines.length,
    tokenEstimate: estimateTokens(content),
  }
}

/**
 * Batch skim across all documents in a directory.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory path.
 * @param globFilter - Optional extension filter (e.g., ".md").
 * @returns Array of document skims.
 */
export async function skimDirectory(projectRoot: string, dirPath: string, globFilter?: string): Promise<DocumentSkim[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, globFilter)
  const results: DocumentSkim[] = []

  for (const file of files) {
    try {
      const content = await readTextFile(file)
      const lines = content.split("\n")
      const weaver = getWeaverForFile(file)
      results.push({
        path: relative(projectRoot, file),
        metadata: weaver.readMetadata(content) as Record<string, string> | null,
        outline: weaver.readOutline(content),
        lineCount: lines.length,
        tokenEstimate: estimateTokens(content),
      })
    } catch {
      // Skip unreadable files
    }
  }

  return results
}

/**
 * Read the body content of a specific section by heading.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to extract.
 * @returns Section body content, or null if the heading is not found.
 */
export async function readSection(projectRoot: string, filePath: string, heading: string): Promise<string | null> {
  const abs = safePath(projectRoot, filePath)
  const content = await readTextFile(abs)
  const weaver = getWeaverForFile(abs)
  return weaver.readSection(content, heading)
}

/**
 * Read a file or section in token-budget-aware chunks.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Optional heading to scope the chunking to a single section.
 * @param maxTokens - Maximum tokens per chunk (default 2000).
 * @returns Array of document chunks.
 */
export async function readChunked(projectRoot: string, filePath: string, heading?: string, maxTokens?: number): Promise<DocumentChunk[]> {
  const abs = safePath(projectRoot, filePath)
  const content = await readTextFile(abs)
  const weaver = getWeaverForFile(abs)
  const budget = maxTokens ?? 2000

  if (heading) {
    const sectionContent = weaver.readSection(content, heading)
    if (!sectionContent) return []
    return weaver.chunkBySections(sectionContent, budget)
  }

  return weaver.chunkBySections(content, budget)
}

/**
 * Extract YAML frontmatter from a document.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @returns Parsed frontmatter record, or null if absent.
 */
export async function readMetadata(projectRoot: string, filePath: string): Promise<Record<string, string> | null> {
  const abs = safePath(projectRoot, filePath)
  const content = await readTextFile(abs)
  const weaver = getWeaverForFile(abs)
  return weaver.readMetadata(content) as Record<string, string> | null
}

/**
 * Read a specific range of lines from any file.
 * Not restricted by file-type guard — reads any text file.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param startLine - 1-indexed start line (inclusive).
 * @param endLine - 1-indexed end line (inclusive).
 * @returns Object with content, actualStart, actualEnd, totalLines.
 */
export async function readLines(
  projectRoot: string,
  filePath: string,
  startLine: number,
  endLine: number,
): Promise<{ content: string; startLine: number; endLine: number; totalLines: number; hash: string }> {
  const abs = safePath(projectRoot, filePath)
  const content = await readTextFile(abs)
  const lines = content.split("\n")
  const total = lines.length
  const start = Math.max(1, Math.min(startLine, total))
  const end = Math.max(start, Math.min(endLine, total))

  const slice = lines.slice(start - 1, end)
  return {
    content: slice.join("\n"),
    startLine: start,
    endLine: end,
    totalLines: total,
    hash: contentHash(content),
  }
}

/**
 * Generate a markdown table of contents from headings.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @returns Rendered markdown TOC string.
 */
export async function generateTOC(projectRoot: string, filePath: string): Promise<string> {
  const abs = safePath(projectRoot, filePath)
  const content = await readTextFile(abs)
  const weaver = getWeaverForFile(abs)
  const outline = weaver.readOutline(content)

  function renderTOC(entries: HeadingHierarchy[], indent: number): string[] {
    const lines: string[] = []
    for (const entry of entries) {
      const prefix = "  ".repeat(indent)
      const anchor = entry.text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-")
      lines.push(`${prefix}- [${entry.text}](#${anchor})`)
      if (entry.children.length > 0) {
        lines.push(...renderTOC(entry.children, indent + 1))
      }
    }
    return lines
  }

  return renderTOC(outline, 0).join("\n")
}

/**
 * Keyword or regex search across document headings and body.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory to search.
 * @param query - Search query (string for keyword, /regex/ for pattern).
 * @param globFilter - Optional extension filter.
 * @returns Array of search results.
 */
export async function searchDocuments(
  projectRoot: string,
  dirPath: string,
  query: string | RegExp,
  globFilter?: string,
): Promise<DocumentSearchResult[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, globFilter)
  const results: DocumentSearchResult[] = []
  const regex = typeof query === "string" ? new RegExp(query, "gi") : query

  for (const file of files) {
    try {
      const content = await readTextFile(file)
      const weaver = getWeaverForFile(file)
      const outline = weaver.readOutline(content)
      const lines = content.split("\n")
      const filePath = relative(projectRoot, file)

      // Build heading lookup for each line
      const headingByLine: Map<number, string> = new Map()
      let currentHeading = "(body)"

      for (const heading of flattenHeadings(outline)) {
        for (let i = heading.line; i < lines.length; i++) {
          if (headingByLine.has(i) && headingByLine.get(i) !== currentHeading) break
          headingByLine.set(i, heading.text)
        }
        currentHeading = heading.text
      }

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        regex.lastIndex = 0

        while (regex.exec(line) !== null) {
          results.push({
            path: filePath,
            heading: headingByLine.get(i) || "(body)",
            line: i + 1,
            snippet: line.trim().slice(0,200),
          })
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return results
}

/**
 * List documents in a directory with summary metadata.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory path.
 * @param globFilter - Optional extension filter.
 * @returns Array of document list entries.
 */
export async function listDocuments(
  projectRoot: string,
  dirPath: string,
  globFilter?: string,
): Promise<DocumentListEntry[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, globFilter)
  const results: DocumentListEntry[] = []

  for (const file of files) {
    try {
      const content = await readTextFile(file)
      const fileStat = await stat(file)
      const weaver = getWeaverForFile(file)
      const outline = weaver.readOutline(content)
      const metadata = weaver.readMetadata(content)

      // Extract title
      let title = (metadata?.title as string) || (metadata?.name as string) || ""
      if (!title) {
        for (const entry of outline) {
          if (entry.level === 1) {title = entry.text; break }
        }
      }
      if (!title) {
        title = basename(file).replace(/\.[^.]+$/, "")
      }

      // Count headings
      function countHeadings(entries: HeadingHierarchy[]): number {
        let count = entries.length
        for (const entry of entries) count += countHeadings(entry.children)
        return count
      }

      results.push({
        path: relative(projectRoot, file),
        title,
        lineCount: content.split("\n").length,
        sizeBytes: fileStat.size,
        headingCount: countHeadings(outline),
        lastModified: fileStat.mtime.toISOString(),
      })
    } catch {
      // Skip unreadable files
    }
  }

  return results
}

/**
 * Analyze cross-document references (markdown links) in a directory.
 * Checks whether targets exist and reports broken links.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory to analyze.
 * @param globFilter - Optional extension filter.
 * @returns Array of cross-reference results.
 */
export async function xrefDocuments(
  projectRoot: string,
  dirPath: string,
  globFilter?: string,
): Promise<XrefResult[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, globFilter)
  const results: XrefResult[] = []

  // Build a set of all known document paths for quick lookup
  const allPaths = new Set(files.map(f => relative(projectRoot, f)))
  const { access } = await import("node:fs/promises")

  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g

  for (const file of files) {
    try {
      const content = await readTextFile(file)
      const lines = content.split("\n")
      const filePath = relative(projectRoot, file)

      for (let i = 0; i < lines.length; i++) {
        let match: RegExpExecArray | null
        linkRegex.lastIndex = 0
        while ((match = linkRegex.exec(lines[i])) !== null) {
          const linkText = match[1]
          const linkTarget = match[2]

          // Skip external URLs and anchors
          if (linkTarget.startsWith("http://") || linkTarget.startsWith("https://") || linkTarget.startsWith("#")) {
            continue
          }

          // Resolve the target relative to the source file's directory
          const sourceDir = dirname(file)
          const targetAbs = join(sourceDir, linkTarget.split("#")[0])// Local path join
          // Convert to project-relative path
          const targetRel = relativeProjectPath(projectRoot, targetAbs)

          let valid = allPaths.has(targetRel)
          if (!valid) {
            // Also check if it exists on disk
            try {
              await access(targetAbs)
              valid = true
            } catch { /* does not exist */ }
          }

          results.push({
            from: filePath,
            to: targetRel,
            line: i + 1,
            valid,
            text: linkText,
          })
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return results
}

/**
 * Build a comprehensive document index for a directory.
 * Includes heading paths, link counts, content hashes, and outlines.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory to index.
 * @param globFilter - Optional extension filter.
 * @returns Array of document index entries.
 */
export async function indexDocuments(
  projectRoot: string,
  dirPath: string,
  globFilter?: string,
): Promise<DocumentIndexEntry[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, globFilter)
  const results: DocumentIndexEntry[] = []

  const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g

  for (const file of files) {
    try {
      const content = await readTextFile(file)
      const fileStat = await stat(file)
      const weaver = getWeaverForFile(file)
      const outline = weaver.readOutline(content)
      const metadata = weaver.readMetadata(content)

      // Extract title
      let title = (metadata?.title as string) || (metadata?.name as string) || ""
      if (!title) {
        for (const entry of outline) {
          if (entry.level === 1) { title = entry.text; break }
        }
      }
      if (!title) {
        title = basename(file).replace(/\.[^.]+$/, "")
      }

      // Build heading path (breadcrumb from all top-level headings)
      function flattenHeadings(entries: HeadingHierarchy[], prefix: string[] = []): string[] {
        const paths: string[] = []
        for (const entry of entries) {
          const path = [...prefix, entry.text]
          paths.push(path.join(" > "))
          if (entry.children.length > 0) {
            paths.push(...flattenHeadings(entry.children, path))
          }
        }
        return paths
      }
      const headingPath = flattenHeadings(outline)

      // Count headings
      function countHeadings(entries: HeadingHierarchy[]): number {
        let count = entries.length
        for (const entry of entries) count += countHeadings(entry.children)
        return count
      }

      // Count links
      let linkCount = 0
      linkRegex.lastIndex = 0
      while (linkRegex.exec(content) !== null) {
        linkCount++
      }

      results.push({
        path: relative(projectRoot, file),
        title,
        headingPath,
        lineCount: content.split("\n").length,
        sizeBytes: fileStat.size,
        hash: contentHash(content),
        lastModified: fileStat.mtime.toISOString(),
        headingCount: countHeadings(outline),
        linkCount,
        outline,
      })
    } catch {
      // Skip unreadable files
    }
  }

  return results
}

//─── Helper Functions ────────────────────────────────────────────────────────────

/**
 * Flatten heading hierarchy into a linear array.
 *
 * @param entries - Heading hierarchy entries.
 * @returns Flattened array of headings with accumulated depth.
 */
function flattenHeadings(entries: HeadingHierarchy[]): Array<{ text: string; level: number; line: number }> {
  const result: Array<{ text: string; level: number; line: number }> = []

  function walk(items: HeadingHierarchy[]) {
    for (const item of items) {
      result.push({ text: item.text, level: item.level, line: item.line })
      if (item.children.length > 0) {
        walk(item.children)
      }
    }
  }

  walk(entries)
  return result
}