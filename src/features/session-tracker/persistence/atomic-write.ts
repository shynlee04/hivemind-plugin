/**
 * Crash-safe atomic write helpers for the session tracker persistence layer.
 *
 * All writes use write-to-temp + fs.rename() to ensure files are either
 * complete or nonexistent — never truncated (D-03).
 *
 * @module session-tracker/persistence/atomic-write
 */

import { mkdir, rename, writeFile, readFile, unlink, stat } from "node:fs/promises"
import { dirname, resolve, sep } from "node:path"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Atomically writes JSON data to a file.
 *
 * Writes to a temporary file (`.tmp.{timestamp}`), then renames over the
 * target path. If the process crashes mid-write, only the temp file exists —
 * the target is either complete or untouched.
 *
 * @param filePath - Absolute path to the target file.
 * @param data - Data to serialize as JSON.
 * @returns Promise that resolves when the write is complete.
 *
 * @example
 * ```typescript
 * await atomicWriteJson("/path/to/file.json", { key: "value" })
 * ```
 */
export async function atomicWriteJson(
  filePath: string,
  data: unknown,
): Promise<void> {
  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`
  const content = JSON.stringify(data, null, 2)
  await ensureDirectory(dirname(filePath))
  await writeFile(tmpPath, content, "utf-8")
  // Cross-volume rename detection (G-5 / REQ-21-02)
  const tmpDev = await stat(tmpPath).then(s => s.dev).catch(() => null)
  const targetDev = await stat(dirname(filePath)).then(s => s.dev).catch(() => null)
  if (tmpDev !== null && targetDev !== null && tmpDev !== targetDev) {
    process.emitWarning(
      `[Hivemind] Cross-volume rename detected: tmp dev=${tmpDev} !== target dev=${targetDev} — rename NOT atomic for "${filePath}"`,
    )
  }
  await rename(tmpPath, filePath)
  // Post-rename cleanup: prevent temp file accumulation (F-01 / REQ-21-01)
  try {
    await unlink(tmpPath)
  } catch {
    // Best-effort: temp file will be cleaned on next startup by orphanCleanup
  }
}

/**
 * Atomically appends markdown content to a file.
 *
 * If the file does not exist, it is created. If it exists, the content
 * is appended with a preceding newline separator. Uses atomic rename to
 * avoid truncated files on crash.
 *
 * @param filePath - Absolute path to the target markdown file.
 * @param content - Markdown content to append.
 * @returns Promise that resolves when the append is complete.
 *
 * @example
 * ```typescript
 * await atomicAppendMarkdown("/path/to/session.md", "## USER (turn 1)\n\nHello!")
 * ```
 */
export async function atomicAppendMarkdown(
  filePath: string,
  content: string,
): Promise<void> {
  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`
  let existing = ""

  try {
    existing = await readFile(filePath, "utf-8")
  } catch {
    // File does not exist — start fresh
  }

  const merged = existing ? `${existing}\n${content}` : content
  await ensureDirectory(dirname(filePath))
  await writeFile(tmpPath, merged, "utf-8")
  await rename(tmpPath, filePath)
  // Post-rename cleanup (F-01 / REQ-21-01)
  try {
    await unlink(tmpPath)
  } catch {
    // Best-effort
  }
}

/**
 * Ensures a directory exists, creating it and any needed parent directories.
 *
 * @param dirPath - Absolute path to the directory.
 * @returns Promise that resolves when the directory exists.
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true })
}

/**
 * Sanitizes a session ID by stripping characters that are not alphanumeric,
 * underscore, or hyphen.
 *
 * @param sessionID - Raw session ID to sanitize.
 * @returns The sanitized session ID.
 * @throws {Error} If the sanitized ID is shorter than 3 characters.
 */
export function sanitizeSessionID(sessionID: string): string {
  const sanitized = sessionID.replace(/[^a-zA-Z0-9_-]/g, "")
  if (sanitized.length < 3) {
    throw new Error(
      `[Hivemind] Invalid session ID after sanitization: "${sessionID}" (result: "${sanitized}")`,
    )
  }
  return sanitized
}

const SESSION_TRACKER_DIR = ".hivemind/session-tracker"

/**
 * Constructs a safe filesystem path under the session tracker root.
 *
 * Sanitizes the session ID and validates that the resolved path does not
 * escape the `.hivemind/session-tracker/` root (prevents path traversal).
 *
 * @param projectRoot - Absolute path to the project root.
 * @param sessionID - Session identifier to use as the subdirectory name.
 * @param filename - The filename within the session directory.
 * @returns Absolute, validated path under the session tracker root.
 * @throws {Error} If the resolved path escapes the tracker root.
 */
export function safeSessionPath(
  projectRoot: string,
  sessionID: string,
  filename: string,
): string {
  // Detect path traversal in raw inputs BEFORE sanitization
  if (sessionID.includes("/") || sessionID.includes("\\") || sessionID.includes("..")) {
    throw new Error(
      `[Hivemind] Path traversal detected in sessionID: "${sessionID}"`,
    )
  }
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    throw new Error(
      `[Hivemind] Path traversal detected in filename: "${filename}"`,
    )
  }

  const safe = sanitizeSessionID(sessionID)
  const trackerRoot = resolve(projectRoot, SESSION_TRACKER_DIR)
  const resolved = resolve(trackerRoot, safe, filename)

  const prefix = trackerRoot.endsWith(sep) ? trackerRoot : trackerRoot + sep
  if (!resolved.startsWith(prefix) && resolved !== trackerRoot) {
    throw new Error(
      `[Hivemind] Path traversal detected — resolved path "${resolved}" is outside tracker root "${trackerRoot}"`,
    )
  }

  return resolved
}

/**
 * Returns the absolute path to the session tracker root for a given project.
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns Absolute path to `.hivemind/session-tracker/`.
 */
export function sessionTrackerRoot(projectRoot: string): string {
  return resolve(projectRoot, SESSION_TRACKER_DIR)
}
