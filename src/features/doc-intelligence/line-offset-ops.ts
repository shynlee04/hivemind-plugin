import { existsSync, readFileSync } from "node:fs"

import { resolveSafeDocPath, assertWritableExtension, assertGovernanceWriteAllowed, assertFileSizeWithinLimit } from "./safety.js"
import { lockedTransform } from "./concurrency.js"

/** Result type for line/offset write actions — verification data only. */
export type LineOffsetWriteResult = {
  /** SHA-256 hex digest of the new file content. */
  hash: string
  /** 12-character hex operation id assigned by `lockedTransform`. */
  opId: string
}

/**
 * Read the current file content for pre-flight range checks. Returns empty
 * string when the file does not exist yet (so the caller can perform
 * "line out of range" checks against an empty file).
 */
function readContentForPrecheck(absPath: string): string {
  if (!existsSync(absPath)) return ""
  return readFileSync(absPath, "utf-8")
}

/**
 * Pre-flight line-range check for `write_lines`. Runs before the lock is
 * acquired so invalid input fails fast without touching the lock.
 */
function precheckWriteLines(existing: string, startLine: number, endLine: number): void {
  const lines = existing.split("\n")
  if (startLine < 1 || startLine > lines.length) {
    throw new Error(
      `[Harness] write_lines: startLine ${startLine} out of range (1..${lines.length})`,
    )
  }
  if (endLine < startLine - 1 || endLine > lines.length) {
    throw new Error(
      `[Harness] write_lines: endLine ${endLine} out of range (${startLine}..${lines.length})`,
    )
  }
}

/**
 * Pre-flight offset-range check for `write_offset`. Runs before the lock.
 */
function precheckWriteOffset(existing: string, offset: number, limit: number): void {
  if (offset < 0 || offset > existing.length) {
    throw new Error(
      `[Harness] write_offset: offset ${offset} out of range (0..${existing.length})`,
    )
  }
  if (limit < 0 || offset + limit > existing.length) {
    throw new Error(
      `[Harness] write_offset: offset+limit ${offset + limit} out of range (0..${existing.length})`,
    )
  }
}

/**
 * Pre-flight line-position check for `insert_lines`. Runs before the lock.
 */
function precheckInsertLines(existing: string, startLine: number): void {
  const lines = existing.split("\n")
  if (startLine < 1 || startLine > lines.length + 1) {
    throw new Error(
      `[Harness] insert_lines: startLine ${startLine} out of range (1..${lines.length + 1})`,
    )
  }
}

/**
 * Pre-flight offset check for `insert_offset`. Runs before the lock.
 */
function precheckInsertOffset(existing: string, offset: number): void {
  if (offset < 0 || offset > existing.length) {
    throw new Error(
      `[Harness] insert_offset: offset ${offset} out of range (0..${existing.length})`,
    )
  }
}

/**
 * Pre-flight line-range check for `delete_lines`. Runs before the lock.
 */
function precheckDeleteLines(existing: string, startLine: number, endLine: number): void {
  const lines = existing.split("\n")
  if (startLine < 1 || startLine > lines.length) {
    throw new Error(
      `[Harness] delete_lines: startLine ${startLine} out of range (1..${lines.length})`,
    )
  }
  if (endLine < startLine || endLine > lines.length) {
    throw new Error(
      `[Harness] delete_lines: endLine ${endLine} out of range (${startLine}..${lines.length})`,
    )
  }
}

/**
 * Pre-flight offset-range check for `delete_offset`. Runs before the lock.
 */
function precheckDeleteOffset(existing: string, offset: number, limit: number): void {
  if (offset < 0 || offset > existing.length) {
    throw new Error(
      `[Harness] delete_offset: offset ${offset} out of range (0..${existing.length})`,
    )
  }
  if (limit < 0 || offset + limit > existing.length) {
    throw new Error(
      `[Harness] delete_offset: offset+limit ${offset + limit} out of range (0..${existing.length})`,
    )
  }
}

/**
 * Write (replace) a range of lines with new content. The range `[startLine, endLine]`
 * is inclusive and 1-based. Multi-line content is allowed (each `\n` in `content`
 * becomes a line break in the file).
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param startLine - First line to replace (1-based, inclusive).
 * @param endLine - Last line to replace (1-based, inclusive).
 * @param content - Replacement text; may contain `\n` to introduce multiple lines.
 * @param expectedHash - Optional SHA-256 hash for stale-file detection.
 * @returns Hash + opId of the resulting write.
 * @throws {Error} When path is unsafe, file extension is non-writable, governance
 *   denylist blocks, file exceeds size limit, or line range is invalid.
 */
export async function writeLines(
  projectRoot: string,
  filePath: string,
  startLine: number,
  endLine: number,
  content: string,
  expectedHash?: string,
): Promise<LineOffsetWriteResult> {
  const absPath = resolveSafeDocPath(projectRoot, filePath, "write_lines")
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)
  assertFileSizeWithinLimit(absPath)
  precheckWriteLines(readContentForPrecheck(absPath), startLine, endLine)

  const result = await lockedTransform(
    absPath,
    (existing) => {
      const lines = existing.split("\n")
      const newContentLines = content.split("\n")
      return [
        ...lines.slice(0, startLine - 1),
        ...newContentLines,
        ...lines.slice(endLine),
      ].join("\n")
    },
    expectedHash ? { expectedHash } : undefined,
  )
  return { hash: result.hash, opId: result.opId }
}

/**
 * Write (replace) a character range with new content. The range is `[offset, offset+limit)`.
 * Use `limit = 0` for pure insertion at the offset.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param offset - 0-based character offset to start the replacement.
 * @param limit - Number of characters to remove (0 = insert only).
 * @param content - Replacement text.
 * @param expectedHash - Optional SHA-256 hash for stale-file detection.
 * @returns Hash + opId of the resulting write.
 * @throws {Error} When path is unsafe, file extension is non-writable, governance
 *   denylist blocks, file exceeds size limit, or offset/limit is invalid.
 */
export async function writeOffset(
  projectRoot: string,
  filePath: string,
  offset: number,
  limit: number,
  content: string,
  expectedHash?: string,
): Promise<LineOffsetWriteResult> {
  const absPath = resolveSafeDocPath(projectRoot, filePath, "write_offset")
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)
  assertFileSizeWithinLimit(absPath)
  precheckWriteOffset(readContentForPrecheck(absPath), offset, limit)

  const result = await lockedTransform(
    absPath,
    (existing) => {
      return existing.slice(0, offset) + content + existing.slice(offset + limit)
    },
    expectedHash ? { expectedHash } : undefined,
  )
  return { hash: result.hash, opId: result.opId }
}

/**
 * Insert one or more lines at the given 1-based line position, shifting all
 * subsequent lines down. Use `startLine = totalLines + 1` to append.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param startLine - 1-based line position where the new lines are inserted.
 * @param content - Text to insert; may contain `\n` to introduce multiple lines.
 * @param expectedHash - Optional SHA-256 hash for stale-file detection.
 * @returns Hash + opId of the resulting write.
 * @throws {Error} When path is unsafe or `startLine` is out of range.
 */
export async function insertLines(
  projectRoot: string,
  filePath: string,
  startLine: number,
  content: string,
  expectedHash?: string,
): Promise<LineOffsetWriteResult> {
  const absPath = resolveSafeDocPath(projectRoot, filePath, "insert_lines")
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)
  assertFileSizeWithinLimit(absPath)
  precheckInsertLines(readContentForPrecheck(absPath), startLine)

  const result = await lockedTransform(
    absPath,
    (existing) => {
      const lines = existing.split("\n")
      return [
        ...lines.slice(0, startLine - 1),
        ...content.split("\n"),
        ...lines.slice(startLine - 1),
      ].join("\n")
    },
    expectedHash ? { expectedHash } : undefined,
  )
  return { hash: result.hash, opId: result.opId }
}

/**
 * Insert text at a 0-based character offset, shifting all subsequent characters
 * to the right. Use `offset = 0` to prepend, `offset = totalLength` to append.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param offset - 0-based character offset where the text is inserted.
 * @param content - Text to insert.
 * @param expectedHash - Optional SHA-256 hash for stale-file detection.
 * @returns Hash + opId of the resulting write.
 * @throws {Error} When path is unsafe or `offset` is out of range.
 */
export async function insertOffset(
  projectRoot: string,
  filePath: string,
  offset: number,
  content: string,
  expectedHash?: string,
): Promise<LineOffsetWriteResult> {
  const absPath = resolveSafeDocPath(projectRoot, filePath, "insert_offset")
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)
  assertFileSizeWithinLimit(absPath)
  precheckInsertOffset(readContentForPrecheck(absPath), offset)

  const result = await lockedTransform(
    absPath,
    (existing) => {
      return existing.slice(0, offset) + content + existing.slice(offset)
    },
    expectedHash ? { expectedHash } : undefined,
  )
  return { hash: result.hash, opId: result.opId }
}

/**
 * Delete a range of lines `[startLine, endLine]` (1-based, inclusive). Adjacent
 * lines are joined cleanly via array splice.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param startLine - First line to delete (1-based, inclusive).
 * @param endLine - Last line to delete (1-based, inclusive); must be >= startLine.
 * @param expectedHash - Optional SHA-256 hash for stale-file detection.
 * @returns Hash + opId of the resulting write.
 * @throws {Error} When path is unsafe or line range is invalid.
 */
export async function deleteLines(
  projectRoot: string,
  filePath: string,
  startLine: number,
  endLine: number,
  expectedHash?: string,
): Promise<LineOffsetWriteResult> {
  const absPath = resolveSafeDocPath(projectRoot, filePath, "delete_lines")
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)
  assertFileSizeWithinLimit(absPath)
  precheckDeleteLines(readContentForPrecheck(absPath), startLine, endLine)

  const result = await lockedTransform(
    absPath,
    (existing) => {
      const lines = existing.split("\n")
      return [...lines.slice(0, startLine - 1), ...lines.slice(endLine)].join("\n")
    },
    expectedHash ? { expectedHash } : undefined,
  )
  return { hash: result.hash, opId: result.opId }
}

/**
 * Delete a character range `[offset, offset+limit)`. Use `limit = 0` for a
 * no-op.
 *
 * @param projectRoot - Trusted project root.
 * @param filePath - Project-root-relative file path.
 * @param offset - 0-based character offset where deletion begins.
 * @param limit - Number of characters to delete.
 * @param expectedHash - Optional SHA-256 hash for stale-file detection.
 * @returns Hash + opId of the resulting write.
 * @throws {Error} When path is unsafe or offset/limit is invalid.
 */
export async function deleteOffset(
  projectRoot: string,
  filePath: string,
  offset: number,
  limit: number,
  expectedHash?: string,
): Promise<LineOffsetWriteResult> {
  const absPath = resolveSafeDocPath(projectRoot, filePath, "delete_offset")
  assertWritableExtension(absPath)
  assertGovernanceWriteAllowed(absPath, projectRoot)
  assertFileSizeWithinLimit(absPath)
  precheckDeleteOffset(readContentForPrecheck(absPath), offset, limit)

  const result = await lockedTransform(
    absPath,
    (existing) => {
      return existing.slice(0, offset) + existing.slice(offset + limit)
    },
    expectedHash ? { expectedHash } : undefined,
  )
  return { hash: result.hash, opId: result.opId }
}
