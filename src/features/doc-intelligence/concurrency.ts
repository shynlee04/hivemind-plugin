import { randomBytes, createHash } from "node:crypto"
import { readFileSync, renameSync, writeFileSync } from "node:fs"
import { lockSync, unlockSync } from "proper-lockfile"

/**
 * Generate a 12-character hex operation identifier.
 *
 * @returns A unique 12-char hex string.
 */
export function generateOpId(): string {
  return randomBytes(6).toString("hex")
}

/**
 * Compute a SHA-256 hex digest of the provided content.
 *
 * @param content - String content to hash.
 * @returns Lowercase 64-character hex hash.
 */
export function computeContentHash(content: string): string {
  return createHash("sha256").update(content, "utf-8").digest("hex")
}

/**
 * Result of a lockedTransform operation.
 */
export type LockedTransformResult = {
  changed: boolean
  hash: string
  opId: string
  bytesChanged: number
}

/**
 * Execute a read-lock-transform-write cycle for a single file.
 *
 * 1. Acquires advisory lock via `proper-lockfile`
 * 2. Reads current file content
 * 3. Computes content hash (SHA-256)
 * 4. Optionally checks `expectedHash` for stale-file detection
 * 5. Calls `transform(currentContent, currentHash)` to get new content
 * 6. If unchanged → skips write, returns `{ changed: false, hash }`
 * 7. Writes to temp file → atomic rename to target
 * 8. Releases lock
 * 9. Returns `{ changed: true, hash: newHash, opId, bytesChanged }`
 *
 * @param filePath - Absolute path to the target file.
 * @param transform - Transform function receiving current content + hash.
 * @param options - Optional stale-file detection (`expectedHash`).
 * @returns Write result with change signal and verification data.
 */
export async function lockedTransform(
  filePath: string,
  transform: (content: string, currentHash: string) => string | Promise<string>,
  options?: { expectedHash?: string },
): Promise<LockedTransformResult> {
  const opId = generateOpId()

  // Acquire lock — use lockSync for simplicity, single attempt
  try {
    lockSync(filePath, { realpath: false })
  } catch (e) {
    throw new Error(`[Harness] Failed to acquire lock for ${filePath}: ${e instanceof Error ? e.message : String(e)}`)
  }

  try {
    // Read current content
    let currentContent: string
    try {
      currentContent = readFileSync(filePath, "utf-8")
    } catch {
      currentContent = ""
    }
    const currentHash = computeContentHash(currentContent)

    // Stale-file detection
    if (options?.expectedHash && currentHash !== options.expectedHash) {
      throw new Error(`[Harness] Stale file: hash mismatch for ${filePath}`)
    }

    // Transform
    const newContent = await Promise.resolve(transform(currentContent, currentHash))
    const newHash = computeContentHash(newContent)

    // No change — skip write
    if (newContent === currentContent) {
      return { changed: false, hash: currentHash, opId, bytesChanged: 0 }
    }

    // Atomic write: temp file → rename
    const tmpPath = `${filePath}.${opId}.tmp`
    writeFileSync(tmpPath, newContent, "utf-8")
    renameSync(tmpPath, filePath)

    const bytesChanged = Math.abs(Buffer.byteLength(newContent, "utf-8") - Buffer.byteLength(currentContent, "utf-8"))
    return { changed: true, hash: newHash, opId, bytesChanged }
  } finally {
    try {
      unlockSync(filePath)
    } catch {
      // Lock already released or never acquired — safe to ignore
    }
  }
}

/**
 * Sync variant of lockedTransform for hot-path single-section writes.
 *
 * Identical flow but uses sync FS exclusively. No async/await.
 * Note: lockSync does not support retries — fails immediately if lock held.
 *
 * @param filePath - Absolute path to the target file.
 * @param transform - Transform function receiving current content + hash.
 * @param options - Optional stale-file detection (`expectedHash`).
 * @returns Write result with change signal and verification data.
 */
export function lockedTransformSync(
  filePath: string,
  transform: (content: string, currentHash: string) => string,
  options?: { expectedHash?: string },
): LockedTransformResult {
  const opId = generateOpId()

  // Acquire lock (sync — single attempt, no retries)
  lockSync(filePath, { realpath: false })

  try {
    // Read current content
    let currentContent: string
    try {
      currentContent = readFileSync(filePath, "utf-8")
    } catch {
      currentContent = ""
    }
    const currentHash = computeContentHash(currentContent)

    // Stale-file detection
    if (options?.expectedHash && currentHash !== options.expectedHash) {
      throw new Error(`[Harness] Stale file: hash mismatch for ${filePath}`)
    }

    // Transform
    const newContent = transform(currentContent, currentHash)
    const newHash = computeContentHash(newContent)

    // No change — skip write
    if (newContent === currentContent) {
      return { changed: false, hash: currentHash, opId, bytesChanged: 0 }
    }

    // Atomic write: temp file → rename
    const tmpPath = `${filePath}.${opId}.tmp`
    writeFileSync(tmpPath, newContent, "utf-8")
    renameSync(tmpPath, filePath)

    const bytesChanged = Math.abs(Buffer.byteLength(newContent, "utf-8") - Buffer.byteLength(currentContent, "utf-8"))
    return { changed: true, hash: newHash, opId, bytesChanged }
  } finally {
    try {
      unlockSync(filePath)
    } catch {
      // Lock already released or never acquired — safe to ignore
    }
  }
}
