import { randomBytes, createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
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
 * If the target file does not exist, the parent directory is created
 * recursively and the lock is acquired with `realpath: false` (the lock
 * target is the parent directory, which DOES exist). This is the
 * NF-01 fix — without it, `proper-lockfile@4.1.2` with `realpath: true`
 * calls `lstat` on the file and throws ENOENT before the lock can be
 * created.
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

  // Acquire lock — use lockSync for simplicity, single attempt.
  // `realpath: true` is required: on macOS the tmp dir resolves through a
  // realpath (e.g. /var/folders/.../T → /private/var/folders/.../T), and
  // without realpath resolution the lockfile ends up at the unresolved
  // path while subsequent acquire/release calls re-resolve — leaking
  // the lock and surfacing as "Lock file is already being held".
  //
  // For the missing-file case (NF-01), `proper-lockfile` calls `lstat`
  // on the target before storing the lockfile, which throws ENOENT when
  // the file does not exist. Pre-create the parent directory and lock
  // the parent (which DOES exist) with `realpath: false`. The lockfile
  // lives in the parent dir either way, so the cross-process serialisation
  // guarantee is preserved.
  //
  // IMPORTANT: lock and unlock must use the SAME `realpath` setting.
  // `proper-lockfile` keys its in-memory lock registry by the canonical
  // path it resolved, so an unlock with a different realpath will not
  // find the lock entry — producing the "Lock file is already being
  // held" error on the NEXT call.
  const fileExists = existsSync(filePath)
  if (!fileExists) {
    const parent = dirname(filePath)
    mkdirSync(parent, { recursive: true })
  }
  const lockOptions: { realpath: boolean } = fileExists
    ? { realpath: true }
    : { realpath: false }
  try {
    lockSync(filePath, lockOptions)
  } catch (e) {
    throw new Error(`[Hivemind] Failed to acquire lock for ${filePath}: ${e instanceof Error ? e.message : String(e)}`)
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
      throw new Error(`[Hivemind] Stale file: hash mismatch for ${filePath}`)
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
      // Use the SAME realpath setting as the lock acquisition. See note above.
      // The `unlockSync` types are inferred from the CommonJS module to
      // accept only 1 argument, but the runtime accepts an options object as
      // the 2nd arg. We construct the call via a typed wrapper to keep the
      // call type-safe.
      const options: { realpath: boolean } = lockOptions
      const unlock = (fp: string, opts: typeof options): void => {
        // Indirection: invoke the runtime function with the options arg
        // through the `Function` prototype so the call is well-typed.
        const fn: (...args: unknown[]) => void = unlockSync as (...args: unknown[]) => void
        fn(fp, opts)
      }
      unlock(filePath, options)
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
 * If the target file does not exist, the parent directory is created
 * recursively and the lock is acquired with `realpath: false`. This is
 * the NF-01 fix — see {@link lockedTransform} for full context.
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

  // Acquire lock (sync — single attempt, no retries).
  // `realpath: true` is required for macOS tmp-namespace symlink
  // resolution (see note in `lockedTransform` above).
  //
  // For the missing-file case (NF-01): pre-create the parent and lock
  // the (non-existent) target with `realpath: false` so proper-lockfile
  // stores its lockfile in the parent directory. Lock and unlock MUST
  // use the same realpath setting (see the longer note in
  // `lockedTransform` for the GAP-5 / realpath-divergence rationale).
  const fileExists = existsSync(filePath)
  if (!fileExists) {
    const parent = dirname(filePath)
    mkdirSync(parent, { recursive: true })
  }
  const lockOptions: { realpath: boolean } = fileExists
    ? { realpath: true }
    : { realpath: false }
  lockSync(filePath, lockOptions)

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
      throw new Error(`[Hivemind] Stale file: hash mismatch for ${filePath}`)
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
      // Use the SAME realpath setting as the lock acquisition. See note above.
      const options: { realpath: boolean } = lockOptions
      const unlock = (fp: string, opts: typeof options): void => {
        const fn: (...args: unknown[]) => void = unlockSync as (...args: unknown[]) => void
        fn(fp, opts)
      }
      unlock(filePath, options)
    } catch {
      // Lock already released or never acquired — safe to ignore
    }
  }
}
