import { readFileSync } from "node:fs"

const DEFAULT_PATTERNS = [".git/", "node_modules/", ".hivemind/", "dist/"]

function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/^\.\//, "")
}

function loadPatterns(projectRoot: string): string[] {
  const gitignorePath = `${projectRoot}/.gitignore`
  let filePatterns: string[] = []

  try {
    const raw = readFileSync(gitignorePath, "utf-8")
    filePatterns = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
  } catch {
    filePatterns = []
  }

  return [...DEFAULT_PATTERNS, ...filePatterns]
}

function matchesPattern(filePath: string, pattern: string): boolean {
  const normalizedPath = normalizePath(filePath)
  let normalizedPattern = normalizePath(pattern)
  const anchored = normalizedPattern.startsWith("/")
  if (anchored) {
    normalizedPattern = normalizedPattern.slice(1)
  }

  const directoryOnly = normalizedPattern.endsWith("/")
  if (directoryOnly) {
    normalizedPattern = normalizedPattern.slice(0, -1)
  }

  if (normalizedPattern.length === 0) {
    return false
  }

  const regexSafePattern = normalizedPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&")
  const withGlobstar = regexSafePattern.replace(/\*\*/g, "__HM_GLOBSTAR__")
  const withSingleStar = withGlobstar.replace(/\*/g, "[^/]*")
  const wildcardBody = withSingleStar.replace(/__HM_GLOBSTAR__/g, ".*")
  let regexSource = wildcardBody

  if (!anchored) {
    if (normalizedPattern.includes("/")) {
      regexSource = `(?:.*/)?${regexSource}`
    } else {
      regexSource = `(?:^|.*/)${regexSource}`
    }
  }

  if (directoryOnly) {
    regexSource = `${regexSource}(?:/.*)?`
  }

  const matcher = new RegExp(`^${regexSource}$`)
  return matcher.test(normalizedPath)
}

function parsePattern(rawPattern: string): { negated: boolean; pattern: string } {
  if (rawPattern.startsWith("\\!")) {
    return { negated: false, pattern: rawPattern.slice(1) }
  }

  if (rawPattern.startsWith("!")) {
    return { negated: true, pattern: rawPattern.slice(1) }
  }

  return { negated: false, pattern: rawPattern }
}

export function createGitignoreFilter(projectRoot: string): {
  isIgnored: (path: string) => boolean
  getPatterns: () => string[]
} {
  const patterns = loadPatterns(projectRoot)

  return {
    isIgnored(path: string): boolean {
      let ignored = false
      for (const rawPattern of patterns) {
        const { negated, pattern } = parsePattern(rawPattern)
        if (!pattern || !matchesPattern(path, pattern)) {
          continue
        }

        ignored = !negated
      }

      return ignored
    },
    getPatterns(): string[] {
      return [...patterns]
    },
  }
}
