import { readdir } from "node:fs/promises"
import path from "node:path"

/**
 * A structural summary of a project's source tree.
 *
 * @property projectRoot - Absolute path to the project root.
 * @property fileCount - Total number of source files found (capped at `maxFiles`).
 * @property byExtension - File count keyed by lowercase extension (e.g. `.ts`, `.js`).
 * @property maxDepth - Maximum directory nesting depth encountered.
 * @property truncated - `true` if the scan stopped early due to the `maxFiles` limit.
 */
export type Codemap = {
  projectRoot: string
  fileCount: number
  byExtension: Record<string, number>
  maxDepth: number
  truncated: boolean
}

/**
 * Create an empty codemap for a project root with zero files.
 *
 * @param projectRoot - Absolute path to the project root.
 * @returns A codemap with zeroed counters and no extension data.
 *
 * @example
 * ```typescript
 * const empty = emptyCodemap("/tmp/my-project")
 * console.log(empty.fileCount) // 0
 * ```
 */
export function emptyCodemap(projectRoot: string): Codemap {
  return { projectRoot, fileCount: 0, byExtension: {}, maxDepth: 0, truncated: false }
}

/**
 * Build a codemap by recursively scanning a project's source tree.
 *
 * Skips hidden directories (starting with `.`) and `node_modules`.
 * Uses fully async filesystem operations to avoid blocking the event loop.
 * Stops early if the file count exceeds `maxFiles` and sets `truncated: true`.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param options - Optional configuration.
 * @param options.maxFiles - Maximum number of files to count before truncating (default 1000).
 * @returns A {@link Codemap} summarizing the project structure.
 *
 * @example
 * ```typescript
 * const map = await buildCodemap("/path/to/project", { maxFiles: 500 })
 * console.log(map.fileCount, map.byExtension)
 * ```
 */
export async function buildCodemap(
  projectRoot: string,
  options: { maxFiles?: number } = {},
): Promise<Codemap> {
  const maxFiles = options.maxFiles ?? 1000
  const root = path.resolve(projectRoot)
  const byExtension: Record<string, number> = {}
  let fileCount = 0
  let maxDepth = 0
  let truncated = false

  /**
   * Recursively walk a directory, counting files and tracking extensions.
   *
   * @param dir - Directory to scan.
   * @param depth - Current nesting depth (1-based from root).
   */
  async function walk(dir: string, depth: number): Promise<void> {
    if (truncated) return

    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (truncated) break
      if (entry.name.startsWith(".")) continue
      if (entry.name === "node_modules") continue

      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1)
      } else if (entry.isFile()) {
        fileCount++
        if (fileCount > maxFiles) {
          fileCount = maxFiles
          truncated = true
          break
        }
        const ext = path.extname(entry.name).toLowerCase()
        byExtension[ext] = (byExtension[ext] ?? 0) + 1
        if (depth > maxDepth) {
          maxDepth = depth
        }
      }
    }
  }

  await walk(root, 1)
  return { projectRoot: root, fileCount, byExtension, maxDepth, truncated }
}
