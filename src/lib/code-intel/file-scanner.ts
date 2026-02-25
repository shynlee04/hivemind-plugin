import { readFile, stat, readdir } from "node:fs/promises"
import { join, relative, sep, extname } from "node:path"
import { createHash } from "node:crypto"

import { createGitignoreFilter } from "./gitignore-filter.js"
import { isBinaryPathSafe as defaultIsBinaryPathSafe } from "./binary-detector.js"
import { countTokens as defaultCountTokens } from "./token-counter.js"
import { hasSecrets, getSecretTypes } from "./secret-detector.js"
import { computeCodeMapStats } from "./codemap-io.js"
import type { CodeMap, CodeMapEntry } from "./codemap-io.js"

// ─── Types ──────────────────────────────────────────────────────────────

/** Legacy options shape — backward compatible with existing tests */
export type ScanOptions = {
  createFilter?: (root: string) => { isIgnored: (path: string) => boolean; getPatterns: () => string[] }
  isBinaryPathSafe?: (path: string) => boolean
  countTokens?: (content: string, path: string) => number
}

/** New options for full code map scanning */
export type FullScanOptions = {
  gitCommit?: string
  createFilter?: (root: string) => { isIgnored: (path: string) => boolean; getPatterns: () => string[] }
  isBinaryCheck?: (path: string) => boolean
}

// ─── Language Detection ─────────────────────────────────────────────────

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescript",
  ".js": "javascript",
  ".jsx": "javascript",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".json": "json",
  ".md": "markdown",
  ".css": "css",
  ".scss": "css",
  ".less": "css",
  ".html": "html",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".sh": "shell",
  ".bash": "shell",
  ".sql": "sql",
  ".toml": "toml",
}

export function detectLanguage(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  return EXTENSION_LANGUAGE_MAP[ext] ?? "unknown"
}

// ─── File Collection ────────────────────────────────────────────────────

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

// ─── Legacy Scanner (backward compatible) ───────────────────────────────

type LegacyCodeMapEntry = { path: string }
type LegacyCodeMap = { files: LegacyCodeMapEntry[] }

/**
 * Legacy scanner — returns `{ files: [{ path }] }` shape.
 * Backward compatible with existing tests and consumers.
 */
export async function scanFilesToCodeMap(projectRoot: string, options: ScanOptions = {}): Promise<LegacyCodeMap> {
  const filter = (options.createFilter ?? createGitignoreFilter)(projectRoot)
  const isBinaryPathSafe = options.isBinaryPathSafe ?? defaultIsBinaryPathSafe
  const countTokens = options.countTokens ?? ((_content: string) => defaultCountTokens(_content))

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

// ─── Full Scanner (new — returns rich CodeMap) ──────────────────────────

/**
 * Full scanner — returns complete CodeMap with hash, size, lineCount,
 * tokenCount, hasSecrets, secretTypes, lastModified, language per file.
 */
export async function scanToFullCodeMap(projectRoot: string, options: FullScanOptions = {}): Promise<CodeMap> {
  const filter = (options.createFilter ?? createGitignoreFilter)(projectRoot)
  const isBinary = options.isBinaryCheck ?? defaultIsBinaryPathSafe

  const filePaths = await collectProjectFiles(projectRoot, projectRoot)
  const entries: CodeMapEntry[] = []

  for (const relativePath of filePaths) {
    if (filter.isIgnored(relativePath)) {
      continue
    }

    if (!isBinary(relativePath)) {
      continue
    }

    const absolutePath = join(projectRoot, relativePath)

    let content: string
    try {
      content = await readFile(absolutePath, "utf-8")
    } catch {
      continue
    }

    let fileStat: { size: number; mtime: Date }
    try {
      fileStat = await stat(absolutePath)
    } catch {
      continue
    }

    const hash = createHash("sha256").update(content).digest("hex")
    const lineCount = content.length === 0 ? 0 : content.split("\n").length
    const tokenCount = defaultCountTokens(content)
    const fileHasSecrets = hasSecrets(content)
    const fileSecretTypes = fileHasSecrets ? getSecretTypes(content) : []

    entries.push({
      filePath: relativePath,
      language: detectLanguage(relativePath),
      hash,
      size: fileStat.size,
      lineCount,
      tokenCount,
      hasSecrets: fileHasSecrets,
      secretTypes: fileSecretTypes,
      lastModified: fileStat.mtime.toISOString(),
    })
  }

  const stats = computeCodeMapStats(entries)

  return {
    version: "1.0.0",
    projectRoot,
    generatedAt: new Date().toISOString(),
    gitCommit: options.gitCommit,
    totalFiles: stats.totalFiles,
    totalTokens: stats.totalTokens,
    totalSize: stats.totalSize,
    files: entries,
  }
}
