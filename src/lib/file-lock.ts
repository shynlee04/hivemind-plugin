/**
 * File Locking Utility — Cross-Process Concurrency Safety
 *
 * Uses proper-lockfile to prevent TOCTOU race conditions when multiple
 * processes or agent swarms access the same JSON files concurrently.
 *
 * @see PATCH-US-014
 */

import lockfile from "proper-lockfile"

export interface LockOptions {
  /** Maximum retry attempts when lock is held by another process */
  retries?: number
  /** Time in ms before a lock is considered stale (lock holder may have crashed) */
  stale?: number
  /** Time in ms between lock file updates while held (prevents stale lock) */
  update?: number
}

/**
 * Execute a function with file lock protection.
 * Uses proper-lockfile for cross-process safety.
 *
 * @param filePath - Absolute path to the file to lock (the data file, not lock file)
 * @param fn - Async function to execute while holding the lock
 * @param options - Lock configuration options
 * @returns The return value of fn
 *
 * @example
 * ```typescript
 * await withFileLock(tasksPath, async () => {
 *   const tasks = await loadTasks()
 *   tasks.push(newTask)
 *   await saveTasks(tasks)
 * })
 * ```
 */
export async function withFileLock<T>(
  filePath: string,
  fn: () => Promise<T>,
  options: LockOptions = {},
): Promise<T> {
  const { retries = 5, stale = 10000, update = 5000 } = options

  const release = await lockfile.lock(filePath, { retries, stale, update })
  try {
    return await fn()
  } finally {
    await release()
  }
}
