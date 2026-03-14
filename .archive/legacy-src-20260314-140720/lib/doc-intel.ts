/**
 * doc-intel — Document intelligence library for hierarchy-aware agentic operations.
 *
 * Core Functions:
 *   skimDocument   — parse one file's heading hierarchy + metadata
 *   skimDirectory  — batch skim across multiple files
 *   readSection    — extract a single section by heading
 *   readChunked    — token-budget-aware chunked read
 *   upsertSection  — replace a section body or create the section if absent
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

import { readFile, writeFile, readdir, stat, access, mkdir, rename, unlink } from "node:fs/promises"
import { join, extname, relative, isAbsolute, resolve, dirname, basename } from "node:path"
import { createHash, randomBytes } from "node:crypto"
import { parse as parseYaml, stringify as stringifyYaml } from "yaml"

import { DocWeaver, estimateTokens } from "./code-intel/doc-weaver.js"
import type { HeadingHierarchy, DocumentChunk, BatchSectionOp } from "./code-intel/doc-weaver.js"
export type { BatchSectionOp }

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
 * Governance-owned paths that remain read-only unless a privileged caller opts in.
 * Supports exact file matches and directory prefixes via `/**` suffix.
 */
export const GOVERNANCE_WRITE_DENYLIST = [
  ".hivemind/**",
  ".opencode/**",
  "opencode.json",
  "AGENTS.md",
  "CLAUDE.md",
  "src/AGENTS.md",
] as const

/**
 * Line count threshold above which single-shot writes are rejected.
 * Agent must write section-by-section using chunked operations.
 */
const CHUNK_WRITE_THRESHOLD = 400

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

/** Result from writing — includes hash and operation ID for swarm traceability */
export interface WriteResult {
  changed: boolean
  bytesChanged: number
  /** SHA-256 hash of the file after write */
  hash: string
  /** Unique operation ID for audit trail */
  opId: string
}

/** Read-after-write verification receipt for create operations */
export interface CreateVerificationReceipt {
  bytes: number
  lineCount: number
  retrieved: boolean
  readBackHash: string
  formatValidated: boolean
  nonEmptySatisfied: boolean
}

/** Result from creating a new document */
export interface CreateDocumentResult {
  path: string
  created: boolean
  hash: string
  opId: string
  receipt: CreateVerificationReceipt
}

/** Result from a code inspection */
export interface CodeInspectionResult {
  path: string
  /** Extracted JSDoc blocks */
  jsdocBlocks: Array<{ name: string; line: number; text: string }>
  /** Extracted single-line comments */
  comments: Array<{ line: number; text: string }>
  /** Exported symbols */
  exports: Array<{ name: string; line: number; kind: string }>
  /** Function/method signatures */
  signatures: Array<{ name: string; line: number; signature: string }>
}

/** An operation for batch editing a single file */
export interface BatchEditOp {
  heading: string
  op: "write" | "append" | "delete" | "upsert"
  body?: string
  level?: number
}

/** An operation for batch multi-file editing */
export interface BatchFileOp {
  path: string
  ops: BatchEditOp[]
}

/** Result of a batch file operation */
export interface BatchFileResult {
  path: string
  changed: boolean
  bytesChanged: number
  hash: string
  opId: string
  error?: string
}

/** Cross-reference result */
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

/** Document index entry */
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

/** Smart context chunk */
export interface ContextChunk {
  path: string
  heading: string
  content: string
  relevanceScore: number
  tokenEstimate: number
}

// ─── Shared DocWeaver Instance ──────────────────────────────────────────────────

const weaver = new DocWeaver()

// ─── Infrastructure Utilities ───────────────────────────────────────────────────

/** Lock file TTL in milliseconds (60 seconds) */
const LOCK_TTL_MS = 60_000

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
 * Generate a 12-character random operation ID.
 *
 * @returns Random hex string for audit trail.
 */
export function generateOpId(): string {
  return randomBytes(6).toString("hex")
}

/**
 * Write file atomically via temp file + rename.
 * Prevents partial writes from corrupting documents.
 *
 * @param absPath - Absolute file path.
 * @param content - Content to write.
 */
async function atomicWrite(absPath: string, content: string): Promise<void> {
  const tmpPath = `${absPath}.${generateOpId()}.tmp`
  try {
    await writeFile(tmpPath, content, "utf-8")
    await rename(tmpPath, absPath)
  } catch (err) {
    // Clean up temp file on failure
    try { await unlink(tmpPath) } catch { /* ignore */ }
    throw err
  }
}

/**
 * Acquire an advisory file lock (sidecar .lock file).
 * Auto-expires stale locks older than LOCK_TTL_MS.
 *
 * @param absPath - Absolute path of the file to lock.
 * @param timeoutMs - Max wait time in ms (default 5000).
 * @returns A release function.
 */
async function acquireLock(absPath: string, timeoutMs = 5000): Promise<() => Promise<void>> {
  const lockPath = `${absPath}.lock`
  const start = Date.now()
  const opId = generateOpId()
  const lockContent = JSON.stringify({ pid: process.pid, opId, timestamp: Date.now() })

  while (true) {
    try {
      // Try to read existing lock
      const existing = await readFile(lockPath, "utf-8").catch(() => null)
      if (existing) {
        try {
          const lock = JSON.parse(existing)
          if (Date.now() - lock.timestamp < LOCK_TTL_MS) {
            // Lock is still valid
            if (Date.now() - start > timeoutMs) {
              throw new Error(`Lock timeout on ${basename(absPath)} (held by pid ${lock.pid}, op ${lock.opId})`)
            }
            await new Promise(r => setTimeout(r, 100))
            continue
          }
          // Lock expired — fall through to acquire
        } catch {
          // Corrupt lock file — fall through to acquire
        }
      }

      // Acquire lock
      await writeFile(lockPath, lockContent, "utf-8")
      return async () => {
        try { await unlink(lockPath) } catch { /* ignore */ }
      }
    } catch (err) {
      if ((err as Error).message?.includes("Lock timeout")) throw err
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Lock timeout on ${basename(absPath)}`)
      }
      await new Promise(r => setTimeout(r, 100))
    }
  }
}

/**
 * Read a file, apply a transform, and write atomically with lock.
 * Standard pattern for all write operations.
 *
 * @param absPath - Absolute file path.
 * @param transform - Function that transforms original content.
 * @param expectedHash - Optional expected hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult with hash, opId, and change info.
 */
async function lockedTransform(
  projectRoot: string,
  absPath: string,
  transform: (original: string) => string,
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult> {
  assertGovernanceWriteAllowed(projectRoot, absPath, allowGovernance)
  const release = await acquireLock(absPath)
  try {
    const original = await readTextFile(absPath)

    if (expectedHash) {
      const currentHash = contentHash(original)
      if (currentHash !== expectedHash) {
        throw new Error(`Stale file: expected hash ${expectedHash.slice(0, 12)}…, got ${currentHash.slice(0, 12)}…. Re-read the file first.`)
      }
    }

    const patched = transform(original)
    const opId = generateOpId()

    if (patched === original) {
      return { changed: false, bytesChanged: 0, hash: contentHash(original), opId }
    }

    await atomicWrite(absPath, patched)
    return {
      changed: true,
      bytesChanged: Math.abs(Buffer.byteLength(patched) - Buffer.byteLength(original)),
      hash: contentHash(patched),
      opId,
    }
  } finally {
    await release()
  }
}

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

/**
 * Convert an absolute path to a normalized project-relative path.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param absPath - Absolute path to normalize.
 * @returns Project-relative path with forward slashes.
 */
function relativeProjectPath(projectRoot: string, absPath: string): string {
  return relative(resolve(projectRoot), absPath).replace(/\\/g, "/")
}

/**
 * Check whether a normalized project-relative path matches the governance denylist.
 *
 * @param normalizedPath - Project-relative path using forward slashes.
 * @returns Matching denylist pattern, if any.
 */
function matchGovernanceWriteDenylist(normalizedPath: string): string | undefined {
  return GOVERNANCE_WRITE_DENYLIST.find((pattern) => {
    if (pattern.endsWith("/**")) {
      const prefix = pattern.slice(0, -3)
      return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
    }
    return normalizedPath === pattern
  })
}

/**
 * Enforce the governance write boundary for privileged and non-privileged callers.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param absPath - Absolute target path.
 * @param allowGovernance - Whether the caller may bypass governance denylist checks.
 */
function assertGovernanceWriteAllowed(projectRoot: string, absPath: string, allowGovernance = false): void {
  if (allowGovernance) return

  const normalizedPath = relativeProjectPath(projectRoot, absPath)
  const matchedPattern = matchGovernanceWriteDenylist(normalizedPath)
  if (matchedPattern) {
    throw new Error(
      `Write blocked for governance-owned path: ${normalizedPath} (matched ${matchedPattern}). Pass allowGovernance=true only for privileged callers.`,
    )
  }
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
 * Normalize caller-provided markdown body content for document creation.
 *
 * @param body - Optional markdown body content.
 * @returns Normalized body with trailing blank line, or empty string.
 */
function normalizeMarkdownBody(body?: string): string {
  if (!body?.trim()) {
    return ""
  }
  return `${body.trim()}\n\n`
}

/**
 * Render YAML content for a newly created document.
 *
 * @param title - Title used when scaffolding YAML content.
 * @param metadata - Optional metadata to merge into scaffolded YAML.
 * @param initialContent - Optional caller-provided YAML content.
 * @returns Canonical YAML string with trailing newline.
 */
function renderYamlContent(
  title: string,
  metadata?: Record<string, string>,
  initialContent?: string,
): string {
  const parsed = initialContent !== undefined
    ? parseYaml(initialContent)
    : { title, ...(metadata ?? {}) }
  return `${stringifyYaml(parsed).trimEnd()}\n`
}

/**
 * Escape XML text content.
 *
 * @param value - Raw text value.
 * @returns Escaped XML-safe text.
 */
function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/**
 * Escape XML attribute values.
 *
 * @param value - Raw attribute value.
 * @returns Escaped XML-safe attribute text.
 */
function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value)
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Perform minimal XML well-formedness validation.
 *
 * @param content - XML content to validate.
 * @returns True when the content looks well formed.
 */
function isWellFormedXml(content: string): boolean {
  const trimmed = content.trim()
  if (!trimmed.startsWith("<?xml") || !/<[A-Za-z_][\w:.-]*[\s>]/.test(trimmed)) {
    return false
  }

  const stack: string[] = []
  const tagMatches = trimmed.matchAll(/<\/?([A-Za-z_][\w:.-]*)(?:\s[^<>]*)?\s*(\/?)>/g)
  for (const match of tagMatches) {
    const [fullTag, tagName, selfClosingMarker] = match
    if (fullTag.startsWith("</")) {
      if (stack.pop() !== tagName) {
        return false
      }
      continue
    }
    if (selfClosingMarker === "/") {
      continue
    }
    stack.push(tagName)
  }

  return stack.length === 0
}

/**
 * Render XML content for a newly created document.
 *
 * @param title - Title used when scaffolding XML content.
 * @param metadata - Optional metadata to include in deterministic XML scaffold.
 * @param initialContent - Optional caller-provided XML content.
 * @returns XML string with trailing newline.
 */
function renderXmlContent(
  title: string,
  metadata?: Record<string, string>,
  initialContent?: string,
): string {
  if (initialContent !== undefined) {
    if (!isWellFormedXml(initialContent)) {
      throw new Error("Invalid XML initialContent: content must be minimally well formed")
    }
    return initialContent
  }

  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<document>",
    `  <title>${escapeXmlText(title)}</title>`,
  ]

  const entries = Object.entries(metadata ?? {}).sort(([left], [right]) => left.localeCompare(right))
  if (entries.length > 0) {
    lines.push("  <metadata>")
    for (const [key, value] of entries) {
      lines.push(`    <item key="${escapeXmlAttribute(key)}">${escapeXmlText(value)}</item>`)
    }
    lines.push("  </metadata>")
  }

  lines.push("</document>")
  return `${lines.join("\n")}\n`
}

/**
 * Render initial file content for a new document.
 *
 * @param absPath - Absolute file path being created.
 * @param title - Title for the created document.
 * @param metadata - Optional metadata/frontmatter values.
 * @param initialContent - Optional caller-provided body content.
 * @returns Rendered file content matching the target format.
 */
function renderInitialDocumentContent(
  absPath: string,
  title: string,
  metadata?: Record<string, string>,
  initialContent?: string,
): string {
  const extension = extname(absPath).toLowerCase()

  if (extension === ".json") {
    const parsed = initialContent?.trim()
      ? JSON.parse(initialContent)
      : { title, ...(metadata ?? {}) }
    return `${JSON.stringify(parsed, null, 2)}\n`
  }

  if (extension === ".yaml" || extension === ".yml") {
    return renderYamlContent(title, metadata, initialContent)
  }

  if (extension === ".xml") {
    return renderXmlContent(title, metadata, initialContent)
  }

  let content = ""
  if (metadata && Object.keys(metadata).length > 0) {
    content += weaver.writeFrontmatter("", metadata)
  }
  content += `# ${title}\n\n`
  content += normalizeMarkdownBody(initialContent)
  return content
}

/**
 * Validate created content against the target file format.
 *
 * @param absPath - Absolute file path being created.
 * @param content - Read-back file content.
 * @returns True when the content matches basic format expectations.
 */
function validateCreatedContentFormat(absPath: string, content: string): boolean {
  const extension = extname(absPath).toLowerCase()

  if (extension === ".json") {
    try {
      JSON.parse(content)
      return true
    } catch {
      return false
    }
  }

  if (extension === ".yaml" || extension === ".yml") {
    try {
      parseYaml(content)
      return true
    } catch {
      return false
    }
  }

  if (extension === ".xml") {
    return isWellFormedXml(content)
  }

  if (extension === ".md") {
    return /^(?:---\n[\s\S]*?\n---\n\n)?#\s+.+/m.test(content)
  }

  return content.trim().length > 0
}

/**
 * Read the created file back and produce a verification receipt.
 *
 * @param absPath - Absolute path to the created file.
 * @param expectedContent - Content that was written.
 * @returns Verification receipt for the created file.
 * @throws If the read-back content differs or fails validation.
 */
async function verifyCreatedDocument(absPath: string, expectedContent: string): Promise<CreateVerificationReceipt> {
  const retrievedContent = await readTextFile(absPath)
  const readBackHash = contentHash(retrievedContent)
  const formatValidated = validateCreatedContentFormat(absPath, retrievedContent)
  const nonEmptySatisfied = retrievedContent.trim().length > 0

  if (readBackHash !== contentHash(expectedContent)) {
    throw new Error(`Create verification failed for ${basename(absPath)}: read-back hash mismatch`)
  }
  if (!formatValidated) {
    throw new Error(`Create verification failed for ${basename(absPath)}: format validation failed`)
  }
  if (!nonEmptySatisfied) {
    throw new Error(`Create verification failed for ${basename(absPath)}: file is empty after write`)
  }

  return {
    bytes: Buffer.byteLength(retrievedContent),
    lineCount: retrievedContent.split("\n").length,
    retrieved: true,
    readBackHash,
    formatValidated,
    nonEmptySatisfied,
  }
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
 * Check the chunk-write threshold for a file and return signal if exceeded.
 *
 * @param abs - Absolute file path.
 * @returns ChunkWriteSignal if over threshold, null otherwise.
 */
async function checkChunkThreshold(abs: string): Promise<ChunkWriteSignal | null> {
  const content = await readTextFile(abs)
  const lineCount = content.split("\n").length
  if (lineCount > CHUNK_WRITE_THRESHOLD) {
    return {
      status: "chunk_required",
      message: `File has ${lineCount} lines (threshold: ${CHUNK_WRITE_THRESHOLD}). Write section-by-section using the section heading as target.`,
      lineCount,
      threshold: CHUNK_WRITE_THRESHOLD,
      outline: weaver.readOutline(content),
    }
  }
  return null
}

/**
 * Replace a section body, or create the section if the heading is absent.
 * Uses atomic locked writes. Enforces file-type guard and chunk-write threshold.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to target or create.
 * @param content - Replacement section body.
 * @param level - Heading level to use when creating a missing section.
 * @param expectedHash - Optional hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult or chunk_required signal.
 */
export async function upsertSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  content: string,
  level = 2,
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult | ChunkWriteSignal> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const chunkSignal = await checkChunkThreshold(abs)
  if (chunkSignal) return chunkSignal

  return lockedTransform(projectRoot, abs, (original) => weaver.upsertSection(original, heading, content, level), expectedHash, allowGovernance)
}

/**
 * Replace the body of a section identified by heading.
 * Uses atomic locked writes. Enforces file-type guard and chunk-write threshold.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to target.
 * @param content - Replacement section body.
 * @param expectedHash - Optional hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult or chunk_required signal.
 */
export async function writeSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  content: string,
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult | ChunkWriteSignal> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const chunkSignal = await checkChunkThreshold(abs)
  if (chunkSignal) return chunkSignal

  return lockedTransform(projectRoot, abs, (original) => weaver.patchSection(original, heading, content), expectedHash, allowGovernance)
}

/**
 * Append content to a section body without replacing existing content.
 * Uses atomic locked writes. Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to target.
 * @param content - Content to append.
 * @param expectedHash - Optional hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult with changed flag, hash, opId.
 */
export async function appendSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  content: string,
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  return lockedTransform(projectRoot, abs, (original) => weaver.appendToSection(original, heading, content), expectedHash, allowGovernance)
}

/**
 * Insert a new section after a specified heading.
 * Uses atomic locked writes. Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param afterHeading - Heading text after which to insert.
 * @param newHeading - Heading text for the new section.
 * @param level - Heading level (1–6).
 * @param body - Body content for the new section.
 * @param expectedHash - Optional hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult with changed flag.
 */
export async function insertSection(
  projectRoot: string,
  filePath: string,
  afterHeading: string,
  newHeading: string,
  level: number,
  body: string,
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  return lockedTransform(projectRoot, abs, (original) => weaver.insertAfterSection(original, afterHeading, newHeading, level, body), expectedHash, allowGovernance)
}

/**
 * Delete an entire section (heading + body) from a document.
 * Uses atomic locked writes. Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param heading - Exact heading text to delete.
 * @param expectedHash - Optional hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult with changed flag.
 */
export async function deleteSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  return lockedTransform(projectRoot, abs, (original) => weaver.deleteSection(original, heading), expectedHash, allowGovernance)
}

/**
 * Set or update YAML frontmatter fields on a document.
 * Uses atomic locked writes. Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param metadata - Key/value pairs to set in the frontmatter.
 * @param expectedHash - Optional hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult with changed flag.
 */
export async function writeMetadata(
  projectRoot: string,
  filePath: string,
  metadata: Record<string, string>,
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  return lockedTransform(projectRoot, abs, (original) => weaver.writeFrontmatter(original, metadata), expectedHash, allowGovernance)
}

/**
 * Create a new document with optional frontmatter and title.
 * Enforces file-type guard.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path for the new file.
 * @param title - Title for the document (becomes the H1).
 * @param metadata - Optional YAML frontmatter key/value pairs.
 * @param initialContent - Optional caller-provided body content.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns Result object with created path, hash, and verification receipt.
 */
export async function createDocument(
  projectRoot: string,
  filePath: string,
  title: string,
  metadata?: Record<string, string>,
  initialContent?: string,
  allowGovernance = false,
): Promise<CreateDocumentResult> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

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

  const content = renderInitialDocumentContent(abs, title, metadata, initialContent)

  const opId = generateOpId()
  await atomicWrite(abs, content)
  const receipt = await verifyCreatedDocument(abs, content)

  return {
    path: relative(projectRoot, abs),
    created: true,
    hash: contentHash(content),
    opId,
    receipt,
  }
}

// ─── Batch Operations ───────────────────────────────────────────────────────────

/**
 * Apply multiple section operations to a single file atomically.
 * All operations share one lock and one read/write cycle.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @param ops - Array of edit operations.
 * @param expectedHash - Optional hash for stale-file detection.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns WriteResult or chunk_required signal.
 */
export async function batchEdit(
  projectRoot: string,
  filePath: string,
  ops: BatchEditOp[],
  expectedHash?: string,
  allowGovernance = false,
): Promise<WriteResult | ChunkWriteSignal> {
  const abs = safePath(projectRoot, filePath)
  if (!isWritable(abs)) {
    throw new Error(`File type not writable: ${extname(abs)}. Only ${[...WRITABLE_EXTENSIONS].join(", ")} are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const chunkSignal = await checkChunkThreshold(abs)
  if (chunkSignal) return chunkSignal

  return lockedTransform(
    projectRoot,
    abs,
    (original) => weaver.batchPatchSections(original, ops.map(o => ({
      heading: o.heading,
      op: o.op,
      body: o.body,
      level: o.level,
    }))),
    expectedHash,
    allowGovernance,
  )
}

/**
 * Apply operations across multiple files.
 * Each file gets its own lock and atomic write cycle.
 * Best-effort: errors on individual files don't block others.
 *
 * @param projectRoot - Project root for path resolution.
 * @param ops - Array of per-file operations.
 * @param allowGovernance - Whether privileged callers may bypass governance denylist checks.
 * @returns Array of per-file results.
 */
export async function batchFiles(
  projectRoot: string,
  ops: BatchFileOp[],
  allowGovernance = false,
): Promise<BatchFileResult[]> {
  const results: BatchFileResult[] = []

  for (const fileOp of ops) {
    try {
      const abs = safePath(projectRoot, fileOp.path)
      if (!isWritable(abs)) {
        results.push({ path: fileOp.path, changed: false, bytesChanged: 0, hash: "", opId: "", error: `Not writable: ${extname(abs)}` })
        continue
      }

      assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

      const result = await lockedTransform(
        projectRoot,
        abs,
        (original) => weaver.batchPatchSections(original, fileOp.ops.map(o => ({
          heading: o.heading,
          op: o.op,
          body: o.body,
          level: o.level,
        }))),
        undefined,
        allowGovernance,
      )

      results.push({ path: fileOp.path, ...result })
    } catch (err) {
      results.push({
        path: fileOp.path,
        changed: false,
        bytesChanged: 0,
        hash: "",
        opId: "",
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return results
}

// ─── Line-Offset Reading ────────────────────────────────────────────────────────

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

// ─── Code Inspection ────────────────────────────────────────────────────────────

/** Extensions recognized for code inspection */
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".go", ".rs", ".java", ".c", ".cpp", ".h"])

/**
 * Inspect a code file — extract JSDoc blocks, comments, exports, and function signatures.
 * Read-only operation, no file-type restriction needed.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path.
 * @returns CodeInspectionResult with extracted elements.
 */
export async function inspectCode(
  projectRoot: string,
  filePath: string,
): Promise<CodeInspectionResult> {
  const abs = safePath(projectRoot, filePath)
  const ext = extname(abs).toLowerCase()
  if (!CODE_EXTENSIONS.has(ext)) {
    throw new Error(`Not a recognized code file: ${ext}. Supported: ${[...CODE_EXTENSIONS].join(", ")}`)
  }

  const content = await readTextFile(abs)
  const lines = content.split("\n")

  const jsdocBlocks: CodeInspectionResult["jsdocBlocks"] = []
  const comments: CodeInspectionResult["comments"] = []
  const exports: CodeInspectionResult["exports"] = []
  const signatures: CodeInspectionResult["signatures"] = []

  let inJSDoc = false
  let jsdocStart = 0
  let jsdocBuffer: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    const lineNum = i + 1

    // JSDoc block detection
    if (trimmed.startsWith("/**")) {
      inJSDoc = true
      jsdocStart = lineNum
      jsdocBuffer = [line]
    } else if (inJSDoc) {
      jsdocBuffer.push(line)
      if (trimmed.includes("*/")) {
        inJSDoc = false
        // Look at next non-empty line for the name
        let name = "(anonymous)"
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const next = lines[j].trim()
          if (!next) continue
          const nameMatch = next.match(/(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|const|let|var|enum)\s+(\w+)/)
          if (nameMatch) name = nameMatch[1]
          break
        }
        jsdocBlocks.push({ name, line: jsdocStart, text: jsdocBuffer.join("\n") })
        jsdocBuffer = []
      }
    }

    // Single-line comments (skip JSDoc lines)
    if (!inJSDoc && (trimmed.startsWith("//") || trimmed.startsWith("#"))) {
      comments.push({ line: lineNum, text: trimmed })
    }

    // Export detection (TypeScript/JavaScript)
    const exportMatch = trimmed.match(/^export\s+(?:default\s+)?(?:async\s+)?(function|class|interface|type|const|let|var|enum)\s+(\w+)/)
    if (exportMatch) {
      exports.push({ name: exportMatch[2], line: lineNum, kind: exportMatch[1] })
    }

    // Function/method signatures
    const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*(?:<[^>]*>)?\s*\([^)]*\)(?:\s*:\s*[^{]+)?/)
    if (funcMatch && (trimmed.includes("function") || trimmed.match(/^\w+\s*\(/))) {
      const sigEnd = trimmed.indexOf("{")
      const sig = sigEnd > 0 ? trimmed.slice(0, sigEnd).trim() : trimmed
      signatures.push({ name: funcMatch[1], line: lineNum, signature: sig })
    }
  }

  return {
    path: relative(projectRoot, abs),
    jsdocBlocks,
    comments,
    exports,
    signatures,
  }
}

// ─── Cross-Document Operations ──────────────────────────────────────────────────

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
          const targetAbs = resolve(sourceDir, linkTarget.split("#")[0])
          const targetRel = relative(projectRoot, targetAbs)

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
      const outline = weaver.readOutline(content)
      const metadata = weaver.readFrontmatter(content)

      // Extract title
      let title = metadata?.title || metadata?.name || ""
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

// ─── Context Extraction ─────────────────────────────────────────────────────────

/**
 * Smart context extraction — select the most relevant sections across documents
 * given a natural language query and a token budget.
 *
 * Relevance is scored by keyword density in each section.
 * Sections are returned in descending relevance order, filling the token budget.
 *
 * @param projectRoot - Project root for path resolution.
 * @param dirPath - Workspace-relative or absolute directory to search.
 * @param query - Natural language query for relevance scoring.
 * @param tokenBudget - Maximum total tokens to return.
 * @param globFilter - Optional extension filter.
 * @returns Array of context chunks ranked by relevance.
 */
export async function contextExtract(
  projectRoot: string,
  dirPath: string,
  query: string,
  tokenBudget = 4000,
  globFilter?: string,
): Promise<ContextChunk[]> {
  const abs = safePath(projectRoot, dirPath)
  const files = await scanDirectory(abs, globFilter)

  // Extract query terms (lowercase, de-duped)
  const queryTerms = [...new Set(
    query.toLowerCase().split(/\W+/).filter(t => t.length > 2)
  )]

  if (queryTerms.length === 0) {
    throw new Error("Query must contain at least one word with 3+ characters")
  }

  // Collect all sections across all files with relevance scoring
  const candidates: ContextChunk[] = []

  for (const file of files) {
    try {
      const content = await readTextFile(file)
      const chunks = weaver.chunkByHeadings(content, Math.min(tokenBudget, 2000))
      const filePath = relative(projectRoot, file)

      for (const chunk of chunks) {
        const lower = chunk.content.toLowerCase()
        let score = 0

        for (const term of queryTerms) {
          // Count occurrences of each query term
          let idx = 0
          let count = 0
          while ((idx = lower.indexOf(term, idx)) !== -1) {
            count++
            idx += term.length
          }
          score += count
        }

        // Bonus for matches in heading
        const headingLower = chunk.heading.toLowerCase()
        for (const term of queryTerms) {
          if (headingLower.includes(term)) score += 5
        }

        if (score > 0) {
          candidates.push({
            path: filePath,
            heading: chunk.heading,
            content: chunk.content,
            relevanceScore: score,
            tokenEstimate: chunk.tokenEstimate,
          })
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  // Sort by relevance (descending)
  candidates.sort((a, b) => b.relevanceScore - a.relevanceScore)

  // Fill token budget
  const selected: ContextChunk[] = []
  let tokensSoFar = 0

  for (const chunk of candidates) {
    if (tokensSoFar + chunk.tokenEstimate > tokenBudget) continue
    selected.push(chunk)
    tokensSoFar += chunk.tokenEstimate
  }

  return selected
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
