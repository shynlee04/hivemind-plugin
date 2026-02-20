import { readdir, readFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"

import { isBinaryPathSafe as defaultBinaryPathSafe } from "./binary-detector.js"
import { createGitignoreFilter } from "./gitignore-filter.js"
import { countTokens as defaultCountTokens } from "./token-counter.js"

type CodeMapEntry = { path: string }
type CodeMap = { files: CodeMapEntry[] }

type ScanOptions = {
  createFilter?: (root: string) => { isIgnored: (path: string) => boolean; getPatterns: () => string[] }
  isBinaryPathSafe?: (path: string) => boolean
  countTokens?: (content: string, path: string) => number
}

function normalizePath(filePath: string): string {
  return filePath.split(sep).join("/")
}

async function collectProjectFiles(projectRoot: string, currentDir: string): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true })
  const orderedEntries = [...entries].sort((left, right) => left.name.localeCompare(right.name))
  const files: string[] = []

  for (const entry of orderedEntries) {
    const absolutePath = join(currentDir, entry.name)
    if (entry.isDirectory()) {
      const nestedFiles = await collectProjectFiles(projectRoot, absolutePath)
      files.push(...nestedFiles)
      continue
    }

    if (entry.isFile()) {
      files.push(normalizePath(relative(projectRoot, absolutePath)))
    }
  }

  return files
}

export async function scanFilesToCodeMap(projectRoot: string, options: ScanOptions = {}): Promise<CodeMap> {
  const filter = (options.createFilter ?? createGitignoreFilter)(projectRoot)
  const isBinaryPathSafe = options.isBinaryPathSafe ?? defaultBinaryPathSafe
  const countTokens = options.countTokens ?? ((content: string) => defaultCountTokens(content))

  const filePaths = await collectProjectFiles(projectRoot, projectRoot)
  const includedPaths: string[] = []

  for (const path of filePaths) {
    if (filter.isIgnored(path)) {
      continue
    }

    if (!isBinaryPathSafe(path)) {
      continue
    }

    const content = await readFile(join(projectRoot, path), "utf-8")
    countTokens(content, path)
    includedPaths.push(path)
  }

  return {
    files: includedPaths.map((path) => ({ path })),
  }
}
