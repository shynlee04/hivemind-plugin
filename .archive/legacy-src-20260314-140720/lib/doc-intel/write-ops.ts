/**
 * Write operations for document intelligence.
 *
 * Stateless write operations that use projectRoot parameter injection.
 * All functions enforce:
 *   - Read-before-write invariant
 *   - File locking via proper-lockfile
 *   - Content hashing (SHA-256)
 *   - Large file chunking guard (400+ LOC returns chunk_required signal)
 *   - Format-aware dispatch based on file extension
 *
 * @module doc-intel/write-ops
 */

import { readFile, writeFile, access, mkdir, rename, unlink } from "node:fs/promises"
import { extname, dirname, relative, basename } from "node:path"
import { createHash, randomBytes } from "node:crypto"
import * as lockfile from "proper-lockfile"

import { getWeaver } from "./index.js"
import type { FormatWeaver, WriteResult, ChunkWriteSignal, CreateVerificationReceipt, CreateDocumentResult, BatchEditOp, BatchFileResult, BatchFileOp } from "./types.js"
import { safePath, isWritable, relativeProjectPath, matchGovernanceWriteDenylist } from "./safety.js"

// ─── Constants ────────────────────────────────────────────────────────────────────

/**
 * Line count threshold above which single-shot writes are rejected.
 * Agent must write section-by-section using chunked operations.
 */
const CHUNK_WRITE_THRESHOLD = 400

// ─── Infrastructure Utilities ───────────────────────────────────────────────────

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
    try { await unlink(tmpPath) } catch {/* ignore */}
    throw err
  }
}

/**
 * Acquire an advisory file lock using proper-lockfile.
 * Provides cross-process safety for concurrent writes.
 *
 * @param absPath - Absolute path of the file to lock.
 * @param timeoutMs - Max wait time in ms (default 5000).
 * @returns A release function.
 */
async function acquireLock(absPath: string, timeoutMs = 5000): Promise<() => Promise<void>> {
  return lockfile.lock(absPath, { retries: { retries: Math.ceil(timeoutMs / 200), minTimeout: 100 }, stale: 10000, update: 2000 })
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
 * Get the appropriate weaver for a file extension, with markdown as fallback.
 *
 * @param filePath - File path to get weaver for.
 * @returns FormatWeaver for the file type.
 * @throws If the extension is not supported.
 */
function getWeaverForFile(filePath: string): FormatWeaver {
  const ext = extname(filePath).toLowerCase()
  const weaver = getWeaver(ext)
  if (!weaver) {
    throw new Error(`Unsupported file extension: ${ext}`)
  }
  return weaver
}

// ─── Content Rendering Utilities ─────────────────────────────────────────────────

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
 * Render initial file content for a new document.
 * Dispatches to format-specific renderers based on extension.
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
  const weaver = getWeaverForFile(absPath)

  // JSON format
  if (extension === ".json") {
    const parsed = initialContent?.trim()
      ? JSON.parse(initialContent)
      : { title, ...(metadata ?? {}) }
    return `${JSON.stringify(parsed, null, 2)}\n`
  }

  // For markdown and other formats, use the weaver's capabilities
  // plus format-specific handling

  // XML format - use basic scaffold (full XML weaver not yet implemented for writes)
  if (extension === ".xml") {
    return renderXmlContent(title, metadata, initialContent)
  }

  // YAML format
  if (extension === ".yaml" || extension === ".yml") {
    return renderYamlContent(title, metadata, initialContent)
  }

  // Markdown format (default)
  let content = ""
  if (metadata && Object.keys(metadata).length > 0) {
    content += weaver.writeMetadata("", metadata)
  }
  content += `# ${title}\n\n`
  content += normalizeMarkdownBody(initialContent)
  return content
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
  // Inline YAML render to avoid importing parse/stringify from yaml package
  // Simple key-value YAML output
  const entries: Record<string, string> = { title, ...(metadata ?? {}) }

  if (initialContent !== undefined) {
    // If initialContent provided, just normalize it
    return initialContent.trimEnd() + "\n"
  }

  const lines = Object.entries(entries).map(([key, value]) => `${key}: ${value}`)
  return `${lines.join("\n")}\n`
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

  // Simple tag stack validation
  const stack: string[] = []
  // Use RegExp exec instead of matchAll for better compatibility
  const tagRegex = /<\/?([A-Za-z_][\w:.-]*)(?:\s[^<>]*)?\s*(\/?)>/g
  let match: RegExpExecArray | null
  while ((match = tagRegex.exec(trimmed)) !== null) {
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
    // Basic YAML validation - check it's not empty and has valid structure
    const trimmed = content.trim()
    return trimmed.length > 0 && !trimmed.includes("\t")
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

// ─── Core Lock-and-Transform Pattern ─────────────────────────────────────────────

/**
 * Enforce the governance write boundary for privileged and non-privileged callers.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param absPath - Absolute target path.
 * @param allowGovernance - Whether the caller may bypass governance denylist checks.
 * @throws If the path is governance-owned and allowGovernance is false.
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
    const weaver = getWeaverForFile(abs)
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
 * Read a file, apply a transform, and write atomically with lock.
 * Standard pattern for all write operations.
 *
 * @param projectRoot - Absolute project root path.
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

// ─── Write Operations ─────────────────────────────────────────────────────────────

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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const chunkSignal = await checkChunkThreshold(abs)
  if (chunkSignal) return chunkSignal

  const weaver = getWeaverForFile(abs)
  return lockedTransform(
    projectRoot,
    abs,
    (original) => weaver.upsertSection(original, heading, content, level),
    expectedHash,
    allowGovernance,
  )
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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const chunkSignal = await checkChunkThreshold(abs)
  if (chunkSignal) return chunkSignal

  const weaver = getWeaverForFile(abs)
  return lockedTransform(
    projectRoot,
    abs,
    (original) => weaver.writeSection(original, heading, content),
    expectedHash,
    allowGovernance,
  )
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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const weaver = getWeaverForFile(abs)
  return lockedTransform(
    projectRoot,
    abs,
    (original) => weaver.appendSection(original, heading, content),
    expectedHash,
    allowGovernance,
  )
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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const weaver = getWeaverForFile(abs)
  return lockedTransform(
    projectRoot,
    abs,
    (original) => weaver.insertSection(original, afterHeading, newHeading, level, body),
    expectedHash,
    allowGovernance,
  )
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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const weaver = getWeaverForFile(abs)
  return lockedTransform(
    projectRoot,
    abs,
    (original) => weaver.deleteSection(original, heading),
    expectedHash,
    allowGovernance,
  )
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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const weaver = getWeaverForFile(abs)
  return lockedTransform(
    projectRoot,
    abs,
    (original) => weaver.writeMetadata(original, metadata),
    expectedHash,
    allowGovernance,
  )
}

/**
 * Create a new document with optional frontmatter and title.
 * Enforces file-type guard and provides read-after-write verification.
 *
 * @param projectRoot - Project root for path resolution.
 * @param filePath - Workspace-relative or absolute path for the new file.
 * @param title - Title for the document (becomes the H1 for markdown).
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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
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

// ─── Batch Operations ────────────────────────────────────────────────────────────

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
    throw new Error(`File type not writable: ${extname(abs)}. Only .md, .xml, .json, .yaml, .yml are allowed.`)
  }

  assertGovernanceWriteAllowed(projectRoot, abs, allowGovernance)

  const chunkSignal = await checkChunkThreshold(abs)
  if (chunkSignal) return chunkSignal

  const weaver = getWeaverForFile(abs)
  return lockedTransform(
    projectRoot,
    abs,
    (original) => {
      let result = original
      for (const op of ops) {
        switch (op.op) {
          case "write":
            result = weaver.writeSection(result, op.heading, op.body ?? "")
            break
          case "append":
            result = weaver.appendSection(result, op.heading, op.body ?? "")
            break
          case "delete":
            result = weaver.deleteSection(result, op.heading)
            break
          case "upsert":
            result = weaver.upsertSection(result, op.heading, op.body ?? "", op.level ?? 2)
            break
        }
      }
      return result
    },
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

      const weaver = getWeaverForFile(abs)
      const result = await lockedTransform(
        projectRoot,
        abs,
        (original) => {
          let result = original
          for (const op of fileOp.ops) {
            switch (op.op) {
              case "write":
                result = weaver.writeSection(result, op.heading, op.body ?? "")
                break
              case "append":
                result = weaver.appendSection(result, op.heading, op.body ?? "")
                break
              case "delete":
                result = weaver.deleteSection(result, op.heading)
                break
              case "upsert":
                result = weaver.upsertSection(result, op.heading, op.body ?? "", op.level ?? 2)
                break
            }
          }
          return result
        },
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