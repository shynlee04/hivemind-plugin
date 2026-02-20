import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { join, relative, sep } from "node:path"

export { createGitignoreFilter } from "./gitignore-filter.js"
export { isBinaryPathSafe } from "./binary-detector.js"
export { detectSecrets } from "./secret-detector.js"
export { countTokens } from "./token-counter.js"
export { scanFilesToCodeMap } from "./file-scanner.js"

type CodeMapEntry = { path: string }
type CodeMap = { files: CodeMapEntry[] }

const CODEMAP_FILENAME = "codemap.json"

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

function codemapPath(codemapRoot: string): string {
  return join(codemapRoot, CODEMAP_FILENAME)
}

export async function scanProjectToCodeMap(projectRoot: string, codemapRoot: string): Promise<CodeMap> {
  const files = await collectProjectFiles(projectRoot, projectRoot)
  const codemap: CodeMap = {
    files: files.map((path) => ({ path })),
  }

  await mkdir(codemapRoot, { recursive: true })
  await writeFile(codemapPath(codemapRoot), `${JSON.stringify(codemap, null, 2)}\n`, "utf-8")
  return codemap
}

export async function loadCodeMap(codemapRoot: string): Promise<CodeMap> {
  const raw = await readFile(codemapPath(codemapRoot), "utf-8")
  return JSON.parse(raw) as CodeMap
}
