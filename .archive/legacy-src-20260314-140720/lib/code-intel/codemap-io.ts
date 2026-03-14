import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join, relative, sep } from "node:path"

// ─── Types ──────────────────────────────────────────────────────────────

export interface CodeMapEntry {
  filePath: string
  language: string
  hash: string
  size: number
  lineCount: number
  tokenCount: number
  hasSecrets: boolean
  secretTypes: string[]
  lastModified: string
  summary?: string
}

export interface CodeMap {
  version: string
  projectRoot: string
  generatedAt: string
  gitCommit?: string
  totalFiles: number
  totalTokens: number
  totalSize: number
  files: CodeMapEntry[]
}

// ─── Legacy types (backward compat with existing tests) ─────────────────

type LegacyCodeMapEntry = { path: string }
type LegacyCodeMap = { files: LegacyCodeMapEntry[] }

const CODEMAP_FILENAME = "codemap.json"

// ─── Functions ──────────────────────────────────────────────────────────

export function createEmptyCodeMap(projectRoot: string): CodeMap {
  return {
    version: "1.0.0",
    projectRoot,
    generatedAt: new Date().toISOString(),
    totalFiles: 0,
    totalTokens: 0,
    totalSize: 0,
    files: [],
  }
}

export async function saveCodeMap(filePath: string, codemap: CodeMap): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  const content = JSON.stringify(codemap, null, 2) + "\n"
  await writeFile(filePath, content, "utf-8")
}

export async function loadCodeMap(pathOrDir: string): Promise<CodeMap> {
  // Handle both file path and directory path (legacy compat)
  const resolvedPath = pathOrDir.endsWith(".json") ? pathOrDir : join(pathOrDir, CODEMAP_FILENAME)
  const raw = await readFile(resolvedPath, "utf-8")
  return JSON.parse(raw) as CodeMap
}

export function computeCodeMapStats(files: CodeMapEntry[]): Pick<CodeMap, "totalFiles" | "totalTokens" | "totalSize"> {
  return {
    totalFiles: files.length,
    totalTokens: files.reduce((sum, f) => sum + f.tokenCount, 0),
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
  }
}

// ─── Legacy compat (expected by codemap-red.test.ts) ────────────────────

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

/**
 * Legacy scanner — scans project and writes codemap.json to codemapRoot dir.
 * Returns `{ files: [{ path }] }` shape for backward compatibility.
 */
export async function scanProjectToCodeMap(projectRoot: string, codemapRoot: string): Promise<LegacyCodeMap> {
  const files = await collectProjectFiles(projectRoot, projectRoot)
  const codemap: LegacyCodeMap = {
    files: files.map((path) => ({ path })),
  }

  await mkdir(codemapRoot, { recursive: true })
  await writeFile(join(codemapRoot, CODEMAP_FILENAME), `${JSON.stringify(codemap, null, 2)}\n`, "utf-8")
  return codemap
}

/**
 * Legacy loader — loads codemap.json from a codemapRoot directory.
 */
export async function loadCodeMapFromDir(codemapRoot: string): Promise<LegacyCodeMap> {
  const raw = await readFile(join(codemapRoot, CODEMAP_FILENAME), "utf-8")
  return JSON.parse(raw) as LegacyCodeMap
}
