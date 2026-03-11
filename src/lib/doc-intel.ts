/**
 * doc-intel — Document intelligence library for hierarchy-aware agentic operations.
 *
 * Core Functions:
 *   skimDocument   — parse one file's heading hierarchy + metadata
 *   skimDirectory  — batch skim across multiple files
 *   readSection    — extract a single section by heading
 *   readChunked    — token-budget-aware chunked read
 *   writeSection   — replace a section body
 *   appendSection  — append to a section body
 *   insertSection  — insert a new section after a heading
 *   deleteSection  — delete a section by heading
 *   readMetadata   — extract YAML frontmatter
 *   writeMetadata  — set/update YAML frontmatter fields
 *   searchDocuments — keyword/regex search across document headings and body
 *   listDocuments  — list document files with summary metadata
 *   createDocument — create a new document with frontmatter template
 *   generateTOC    — render a markdown table of contents from headings
 *
 * Safety:
 *   - Write operations only on .md, .xml, .json, .yaml, .yml
 *   - Write operations on files >600 LOC return a chunk_required signal
 *   - All write operations read the file first (read-before-write invariant)
 *
 * @module doc-intel
 */

import { readFile, writeFile, readdir, stat, access, mkdir } from "node:fs/promises"
import { join, extname, relative, isAbsolute, resolve, dirname } from "node:path"

import { DocWeaver, estimateTokens } from "./code-intel/doc-weaver.js"
import type { HeadingHierarchy, DocumentChunk } from "./code-intel/doc-weaver.js"

// ─── Constants ──────────────────────────────────────────────────────────────────

/**
 * File extensions that write operations are allowed on.
 * All other extensions are read-only.
 */
const WRITABLE_EXTENSIONS = new Set([".md", ".xml", ".json", ".yaml", ".yml"])

/**
 * File extensions recognized as "documents" for skim/list/search.
 */
const DOCUMENT_EXTENSIONS = new Set([".md", ".xml", ".json", ".yaml", ".yml", ".txt"])

/**
 * Line count threshold above which single-shot writes are rejected.
 * Agent must write section-by-section using chunked operations.
 */
const CHUNK_WRITE_THRESHOLD = 600

// ─── Types ──────────────────────────────────────────────────────────────────────

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

export interface DocumentSearchResult {
  /** Workspace-relative file path */
  path: string
  /** Heading under which the match was found (or "(body)" for body matches) */
  heading: string
  /** 1-indexed line number of the match */
  line: number
  /** Snippet of the matching line */
  snippet: string
}

export interface ChunkWriteSignal {
  status: "chunk_required"
  message: string
  lineCount: number
  threshold: number
  outline: HeadingHierarchy[]
}

// ─── Shared DocWeaver Instance ──────────────────────────────────────────────────

const weaver = new DocWeaver()

// ─── Path Safety ────────────────────────────────────────────────────────────────

/**
 * Resolve a path relative to the project root, preventing directory traversal.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param filePath - Workspace-relative or absolute file path.
 * @returns Resolved absolute path.
 * @throws If the resolved path escapes the project root.
 */
function safePath(projectRoot: string, filePath: string): string {
  const abs = isAbsolute(filePath) ? resolve(filePath) : resolve(projectRoot, filePath)
  if (!abs.startsWith(resolve(projectRoot))) {
    throw new Error(`Path traversal blocked: ${filePath} escapes project root`)
  }
  return abs
}

/**
 * Check whether the file extension permits write operations.
 *
 * @param filePath - File path to check.
 * @returns True if the extension is in the writable allowlist.
 */
function isWritable(filePath: string): boolean {
  return WRITABLE_EXTENSIONS.has(extname(filePath).toLowerCase())
}

/**
 * Check whether the file extension is a recognized document type.
 *
 * @param filePath - File path to check.
 * @returns True if the extension is in the document extensions set.
 */
function isDocument(filePath: string): boolean {
  return DOCUMENT_EXTENSIONS.has(extname(filePath).toLowerCase())
}

// ─── File Helpers ───────────────────────────────────────────────────────────────

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

// ─── Read Operations ────────────────────────────────────────────────────────────

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

  return {
    path: relative(projectRoot, abs),
    metadata: weaver.readFrontmatter(content),
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
      results.push({
        path: relative(projectRoot, file),
        metadata: weaver.readFrontmatter(content),
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
  return weaver.readSectionContent(content, heading)
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
  const budget = maxTokens ?? 2000

  if (heading) {
    const sectionContent = weaver.readSectionContent(content, heading)
    if (!sectionContent) return []
    return weaver.chunkByHeadings(sectionContent, budget)
  }

  return weaver.chunkByHeadings(content, budget)
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
  return weaver.readFrontmatter(content)
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

// ─── Write Operations ───────────────────────────────────────────────────────────

/**
 * Replace the body of a section identified by heading.
 * Enforces file-type guard and chunk-write threshold.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to target.
 * @param content - Replacement section body.
 * @returns Result object or chunk_required signal.
 */
export async function writeSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  content: string,
): Promise<{ changed: boolean; bytesChanged: number } | ChunkWriteSignal> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  const original = await readTextFile(abs)
  const lineCount = original.split("\n").length

  // Check chunk discipline
  if (lineCount > CHUNK_WRITE_THRESHOLD) {
    const outline = weaver.readOutline(original)
    return {
      status: "chunk_required",
      message: `File has ${lineCount} lines (threshold: ${CHUNK_WRITE_THRESHOLD}). Write section-by-section using the section heading as target.`,
      lineCount,
      threshold: CHUNK_WRITE_THRESHOLD,
      outline,
    }
  }

  const patched = weaver.patchSection(original, heading, content)
  if (patched === original) {
    return { changed: false, bytesChanged: 0 }
  }

  await writeFile(abs, patched, "utf-8")
  return { changed: true, bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(original)) }
}

/**
 * Append content to a section body without replacing existing content.
 * Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to target.
 * @param content - Content to append.
 * @returns Result object with changed flag.
 */
export async function appendSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  content: string,
): Promise<{ changed: boolean; bytesChanged: number }> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  const original = await readTextFile(abs)
  const patched = weaver.appendToSection(original, heading, content)
  if (patched === original) {
    return { changed: false, bytesChanged: 0 }
  }

  await writeFile(abs, patched, "utf-8")
  return { changed: true, bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(original)) }
}

/**
 * Insert a new section after a specified heading.
 * Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param afterHeading - Heading text after which to insert.
 * @param newHeading - Heading text for the new section.
 * @param level - Heading level (1–6).
 * @param body - Body content for the new section.
 * @returns Result object with changed flag.
 */
export async function insertSection(
  projectRoot: string,
  filePath: string,
  afterHeading: string,
  newHeading: string,
  level: number,
  body: string,
): Promise<{ changed: boolean; bytesChanged: number }> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  const original = await readTextFile(abs)
  const patched = weaver.insertAfterSection(original, afterHeading, newHeading, level, body)
  if (patched === original) {
    return { changed: false, bytesChanged: 0 }
  }

  await writeFile(abs, patched, "utf-8")
  return { changed: true, bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(original)) }
}

/**
 * Delete an entire section (heading + body) from a document.
 * Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to delete.
 * @returns Result object with changed flag.
 */
export async function deleteSection(
  projectRoot: string,
  filePath: string,
  heading: string,
): Promise<{ changed: boolean; bytesChanged: number }> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  const original = await readTextFile(abs)
  const patched = weaver.deleteSection(original, heading)
  if (patched === original) {
    return { changed: false, bytesChanged: 0 }
  }

  await writeFile(abs, patched, "utf-8")
  return { changed: true, bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(original)) }
}

/**
 * Set or update YAML frontmatter fields on a document.
 * Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param metadata - Key/value pairs to set in the frontmatter.
 * @returns Result object with changed flag.
 */
export async function writeMetadata(
  projectRoot: string,
  filePath: string,
  metadata: Record<string, string>,
): Promise<{ changed: boolean; bytesChanged: number }> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  const original = await readTextFile(abs)
  const patched = weaver.writeFrontmatter(original, metadata)
  if (patched === original) {
    return { changed: false, bytesChanged: 0 }
  }

  await writeFile(abs, patched, "utf-8")
  return { changed: true, bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(original)) }
}

/**
 * Create a new document with optional frontmatter and title.
 * Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path for the new file.
 * @param title - Title for the document (becomes the H1).
 * @param metadata - Optional YAML frontmatter key/value pairs.
 * @returns Result object with created path.
 */
export async function createDocument(
  projectRoot: string,
  filePath: string,
  title: string,
  metadata?: Record<string, string>,
): Promise<{ path: string; created: boolean }> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  // Check if file already exists
  try {
    await access(abs)
    throw new Error(`File already exists: ${filePath}. Use write/append actions to modify.`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err
  }

  // Ensure parent directory exists
  const dir = dirname(abs)
  await mkdir(dir, { recursive: true })

  let content = ""
  if (metadata) {
    content += weaver.writeFrontmatter("", metadata)
  }
  content += `# ${title}\n\n`

  await writeFile(abs, content, "utf-8")
  return { path: relative(projectRoot, abs), created: true }
}

// ─── Search Operations ──────────────────────────────────────────────────────────

/**
 * Search across documents for a keyword or regex pattern.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory to search.
 * @param query - Search string or regex pattern.
 * @param options - Search options.
 * @returns Array of search results with file, heading, line, and snippet.
 */
export async function searchDocuments(
  projectRoot: string,
  dirPath: string,
  query: string,
  options?: { regex?: boolean; headingOnly?: boolean; glob?: string; maxResults?: number },
): Promise<DocumentSearchResult[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, options?.glob)
  const results: DocumentSearchResult[] = []
  const maxResults = options?.maxResults ?? 50
  const pattern = options?.regex ? new RegExp(query, "gi") : null

  for (const file of files) {
    if (results.length >= maxResults) break

    try {
      const content = await readTextFile(file)
      const lines = content.split("\n")
      const outline = weaver.readOutline(content)

      // Build a line→heading map
      const lineToHeading = new Map<number, string>()
      function mapHeadings(entries: HeadingHierarchy[]): void {
        for (const entry of entries) {
          lineToHeading.set(entry.line, entry.text)
          mapHeadings(entry.children)
        }
      }
      mapHeadings(outline)

      for (let i = 0; i < lines.length; i++) {
        if (results.length >= maxResults) break
        const lineNum = i + 1
        const lineContent = lines[i]

        // If heading-only mode, only match heading lines
        if (options?.headingOnly && !lineToHeading.has(lineNum)) continue

        const isMatch = pattern
          ? pattern.test(lineContent)
          : lineContent.toLowerCase().includes(query.toLowerCase())

        if (isMatch) {
          // Find the nearest heading above this line
          let currentHeading = "(body)"
          const headingLines = [...lineToHeading.entries()].sort((a, b) => b[0] - a[0])
          for (const [hLine, hText] of headingLines) {
            if (hLine <= lineNum) {
              currentHeading = hText
              break
            }
          }

          results.push({
            path: relative(projectRoot, file),
            heading: currentHeading,
            line: lineNum,
            snippet: lineContent.trim().slice(0, 200),
          })
        }

        // Reset regex lastIndex for global regex
        if (pattern) pattern.lastIndex = 0
      }
    } catch {
      // Skip unreadable files
    }
  }

  return results
}

/**
 * List document files in a directory with summary metadata.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory to list.
 * @param options - List options.
 * @returns Array of document list entries.
 */
export async function listDocuments(
  projectRoot: string,
  dirPath: string,
  options?: { glob?: string; sort?: "name" | "date" | "size" },
): Promise<DocumentListEntry[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, options?.glob)
  const results: DocumentListEntry[] = []

  for (const file of files) {
    try {
      const content = await readTextFile(file)
      const fileStat = await stat(file)
      const lines = content.split("\n")
      const outline = weaver.readOutline(content)
      const metadata = weaver.readFrontmatter(content)

      // Extract title: from frontmatter, first H1, or filename
      let title = metadata?.title || metadata?.name || ""
      if (!title) {
        function findFirstH1(entries: HeadingHierarchy[]): string {
          for (const entry of entries) {
            if (entry.level === 1) return entry.text
          }
          return ""
        }
        title = findFirstH1(outline)
      }
      if (!title) {
        title = file.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "Untitled"
      }

      function countHeadings(entries: HeadingHierarchy[]): number {
        let count = entries.length
        for (const entry of entries) {
          count += countHeadings(entry.children)
        }
        return count
      }

      results.push({
        path: relative(projectRoot, file),
        title,
        lineCount: lines.length,
        sizeBytes: fileStat.size,
        headingCount: countHeadings(outline),
        lastModified: fileStat.mtime.toISOString(),
      })
    } catch {
      // Skip unreadable files
    }
  }

  // Sort results
  const sortBy = options?.sort ?? "name"
  results.sort((a, b) => {
    switch (sortBy) {
      case "date":
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      case "size":
        return b.sizeBytes - a.sizeBytes
      default:
        return a.path.localeCompare(b.path)
    }
  })

  return results
}
