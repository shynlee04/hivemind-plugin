import { readdir } from "node:fs/promises"
import path from "node:path"

export type Codemap = {
  projectRoot: string
  fileCount: number
  byExtension: Record<string, number>
  maxDepth: number
  truncated: boolean
}

export function emptyCodemap(projectRoot: string): Codemap {
  return { projectRoot, fileCount: 0, byExtension: {}, maxDepth: 0, truncated: false }
}

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
