import { existsSync } from "node:fs"

import { resolveDocPath, toRootRelativePath, assertWritableExtension, assertGovernanceWriteAllowed, checkChunkThreshold, assertFileSizeWithinLimit } from "./safety.js"
import { lockedTransform } from "./concurrency.js"
import { renderInitialContent, validateContentFormat } from "./format.js"
import type { ChunkRequiredSignal, DeleteResult, SectionWriteResult, WriteReceipt } from "./types.js"

const HEADING_PATTERN = /^(#{1,6})\s+(.+?)\s*#*\s*$/

/**
 * Create a new document with format-appropriate content scaffolding.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param title - Document title.
 * @param metadata - Optional metadata for frontmatter.
 * @param initialContent - Optional custom initial content (overrides scaffolding).
 * @returns Write receipt with verification data.
 */
export async function createDocument(
  projectRoot: string,
  filePath: string,
  title: string,
  metadata?: Record<string, unknown>,
  initialContent?: string,
): Promise<WriteReceipt> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  // Fail if file already exists
  if (existsSync(absPath)) {
    throw new Error(`[Harness] File already exists: ${filePath}`)
  }

  const ext = filePath.split(".").pop() || ""
  const content = initialContent ?? renderInitialContent(`.${ext}`, title, metadata)

  // Validate created content
  if (!validateContentFormat(`.${ext}`, content)) {
    throw new Error(`[Harness] Created content failed format validation for: ${filePath}`)
  }

  const result = await lockedTransform(absPath, () => content)

  return {
    opId: result.opId,
    hash: result.hash,
    path: toRootRelativePath(projectRoot, absPath),
    created: true,
  }
}

/**
 * Write (replace) the body of a section identified by heading.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param heading - Heading text to find.
 * @param body - New body content.
 * @param expectedHash - Optional stale-file detection hash.
 * @returns Section write result or chunk-required signal.
 */
export async function writeSectionBody(
  projectRoot: string,
  filePath: string,
  heading: string,
  body: string,
  expectedHash?: string,
): Promise<SectionWriteResult | ChunkRequiredSignal> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  // Check chunk threshold before locking
  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) return thresholdCheck

  assertFileSizeWithinLimit(absPath)

  const result = await lockedTransform(absPath, (content) => {
    const newContent = patchSectionBody(content, heading, body)
    if (newContent === content) {
      // Try search-and-replace if exact heading match fails
      throw new Error(`[Harness] Heading not found: ${heading}`)
    }
    return newContent
  }, expectedHash ? { expectedHash } : undefined)

  return {
    opId: result.opId,
    hash: result.hash,
    path: toRootRelativePath(projectRoot, absPath),
    heading,
    changed: result.changed,
    bytesChanged: result.bytesChanged,
  }
}

/**
 * Upsert a section: replace if heading exists, create if absent.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param heading - Heading text.
 * @param body - Section body content.
 * @param level - Heading level for creation (default 2).
 * @param expectedHash - Optional stale-file detection hash.
 * @returns Section write result.
 */
export async function upsertSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  body: string,
  level = 2,
  expectedHash?: string,
): Promise<SectionWriteResult | ChunkRequiredSignal> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) return thresholdCheck

  assertFileSizeWithinLimit(absPath)

  const result = await lockedTransform(absPath, (content) => {
    // Try to patch existing section
    const patched = patchSectionBody(content, heading, body)
    if (patched !== content) return patched

    // Heading not found — create new section at end
    return appendNewSection(content, heading, body, level)
  }, expectedHash ? { expectedHash } : undefined)

  return {
    opId: result.opId,
    hash: result.hash,
    path: toRootRelativePath(projectRoot, absPath),
    heading,
    changed: result.changed,
    bytesChanged: result.bytesChanged,
  }
}

/**
 * Append content to the end of an existing section body.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param heading - Heading text.
 * @param content - Content to append.
 * @param expectedHash - Optional stale-file detection hash.
 * @returns Section write result.
 */
export async function appendSection(
  projectRoot: string,
  filePath: string,
  heading: string,
  content: string,
  expectedHash?: string,
): Promise<SectionWriteResult | ChunkRequiredSignal> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) return thresholdCheck

  assertFileSizeWithinLimit(absPath)

  const result = await lockedTransform(absPath, (currentContent) => {
    const sectionRange = findSectionRange(currentContent, heading)
    if (!sectionRange) {
      throw new Error(`[Harness] Heading not found: ${heading}`)
    }

    const lines = currentContent.split(/\r?\n/)
    const appendLine = lines[sectionRange.endLine] !== undefined ? sectionRange.endLine : lines.length
    lines.splice(appendLine, 0, "", content)
    return lines.join("\n")
  }, expectedHash ? { expectedHash } : undefined)

  return {
    opId: result.opId,
    hash: result.hash,
    path: toRootRelativePath(projectRoot, absPath),
    heading,
    changed: result.changed,
    bytesChanged: result.bytesChanged,
  }
}

/**
 * Insert a new section after a target heading.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param afterHeading - Target heading to insert after.
 * @param newHeading - New heading text.
 * @param level - Heading level for the new section.
 * @param body - New section body.
 * @param expectedHash - Optional stale-file detection hash.
 * @returns Section write result.
 */
export async function insertSection(
  projectRoot: string,
  filePath: string,
  afterHeading: string,
  newHeading: string,
  level: number,
  body: string,
  expectedHash?: string,
): Promise<SectionWriteResult | ChunkRequiredSignal> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) return thresholdCheck

  assertFileSizeWithinLimit(absPath)

  const result = await lockedTransform(absPath, (currentContent) => {
    const sectionRange = findSectionRange(currentContent, afterHeading)
    if (!sectionRange) {
      throw new Error(`[Harness] Target heading not found: ${afterHeading}`)
    }

    const lines = currentContent.split(/\r?\n/)
    const insertLine = sectionRange.endLine
    const newSectionLines = createSectionLines(newHeading, body, level)
    lines.splice(insertLine, 0, ...newSectionLines)
    return lines.join("\n")
  }, expectedHash ? { expectedHash } : undefined)

  return {
    opId: result.opId,
    hash: result.hash,
    path: toRootRelativePath(projectRoot, absPath),
    heading: newHeading,
    changed: result.changed,
    bytesChanged: result.bytesChanged,
  }
}

/**
 * Delete a section (heading + body) from a document.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param heading - Heading text to remove.
 * @returns Delete result.
 */
export async function deleteSection(
  projectRoot: string,
  filePath: string,
  heading: string,
): Promise<DeleteResult | ChunkRequiredSignal> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) return thresholdCheck

  assertFileSizeWithinLimit(absPath)

  await lockedTransform(absPath, (currentContent) => {
    const sectionRange = findSectionRange(currentContent, heading)
    if (!sectionRange) {
      throw new Error(`[Harness] Heading not found: ${heading}`)
    }

    const lines = currentContent.split(/\r?\n/)
    lines.splice(sectionRange.startLine - 1, sectionRange.endLine - sectionRange.startLine + 1)
    return lines.join("\n")
  })

  return {
    opId: "",
    path: toRootRelativePath(projectRoot, absPath),
    deleted: true,
    mode: "section",
  }
}

/**
 * Delete an entire file.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @returns Delete result.
 */
export async function deleteFile(
  projectRoot: string,
  filePath: string,
): Promise<DeleteResult> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const { unlinkSync } = await import("node:fs")
  unlinkSync(absPath)

  return {
    opId: "",
    path: toRootRelativePath(projectRoot, absPath),
    deleted: true,
    mode: "file",
  }
}

/**
 * Search and replace in document body (preserving headings and frontmatter).
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param searchPattern - Search string or regex pattern.
 * @param replacement - Replacement text.
 * @returns Section write result.
 */
export async function searchAndReplace(
  projectRoot: string,
  filePath: string,
  searchPattern: string,
  replacement: string,
): Promise<SectionWriteResult | ChunkRequiredSignal> {
  const absPath = resolveDocPath(projectRoot, filePath)
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)

  const thresholdCheck = checkChunkThreshold(absPath)
  if (thresholdCheck) return thresholdCheck

  assertFileSizeWithinLimit(absPath)

  const result = await lockedTransform(absPath, (content) => {
    // Find body start (skip frontmatter)
    const bodyStart = findBodyStart(content)
    const body = content.slice(bodyStart)
    const header = content.slice(0, bodyStart)

    const regex = new RegExp(searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
    const newBody = body.replace(regex, replacement)

    return header + newBody
  })

  return {
    opId: result.opId,
    hash: result.hash,
    path: toRootRelativePath(projectRoot, absPath),
    heading: "",
    changed: result.changed,
    bytesChanged: result.bytesChanged,
  }
}

// ─── Internal Section-Patching Helpers ────────────────────────────────

/**
 * Find the line range of a section identified by heading.
 * Returns { startLine, endLine } (1-based) or null.
 */
function findSectionRange(content: string, heading: string): { startLine: number; endLine: number } | null {
  const lines = content.split(/\r?\n/)

  let startLine = -1
  let headingDepth = 0
  const headingTrimmed = heading.trim()

  for (let i = 0; i < lines.length; i++) {
    const match = HEADING_PATTERN.exec(lines[i])
    if (!match) continue
    if (match[2]?.trim() === headingTrimmed) {
      startLine = i + 1 // 1-based
      headingDepth = match[1].length
      break
    }
  }

  if (startLine === -1) return null

  // Find end: next heading of equal or higher (lower number) depth
  for (let i = startLine; i < lines.length; i++) {
    const match = HEADING_PATTERN.exec(lines[i])
    if (match && match[1].length <= headingDepth) {
      return { startLine, endLine: i }
    }
  }

  return { startLine, endLine: lines.length }
}

/**
 * Patch (replace) the body of a section identified by heading.
 * Returns new content string, or original content if heading not found.
 */
function patchSectionBody(content: string, heading: string, body: string): string {
  const sectionRange = findSectionRange(content, heading)
  if (!sectionRange) return content

  const lines = content.split(/\r?\n/)
  // Replace from after heading line to end of section
  const beforeLines = lines.slice(0, sectionRange.startLine)
  const afterLines = lines.slice(sectionRange.endLine)

  return [...beforeLines, body, ...afterLines].join("\n")
}

/**
 * Create section lines for a new heading + body.
 */
function createSectionLines(heading: string, body: string, level: number): string[] {
  const prefix = "#".repeat(level)
  const lines: string[] = []
  lines.push("")
  lines.push(`${prefix} ${heading}`)
  if (body.trim()) {
    lines.push("")
    lines.push(body)
  }
  return lines
}

/**
 * Append a new section to the end of a document.
 */
function appendNewSection(content: string, heading: string, body: string, level: number): string {
  const lines = content.split(/\r?\n/)
  // Ensure trailing newline
  if (lines[lines.length - 1] !== "") {
    lines.push("")
  }
  lines.push(`${"#".repeat(level)} ${heading}`)
  if (body.trim()) {
    lines.push("")
    lines.push(body)
  }
  lines.push("")
  return lines.join("\n")
}

/**
 * Find the start of the document body (after frontmatter).
 */
function findBodyStart(content: string): number {
  if (!content.startsWith("---")) return 0
  const endIndex = content.indexOf("\n---", 3)
  if (endIndex === -1) return 0
  return endIndex + 5 // after closing --- + newline
}
