import ignore from "ignore"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const DEFAULT_PATTERNS = [".git/", "node_modules/", ".hivemind/", "dist/", ".next/", "coverage/", ".nyc_output/", "*.min.js", "*.min.css"]

export function createGitignoreFilter(projectRoot: string): {
  isIgnored: (path: string) => boolean
  getPatterns: () => string[]
} {
  const ig = ignore().add(DEFAULT_PATTERNS)

  try {
    const raw = readFileSync(join(projectRoot, ".gitignore"), "utf-8")
    ig.add(raw)
  } catch {
    // No .gitignore, use defaults only
  }

  return {
    isIgnored(path: string): boolean {
      const normalized = path.replace(/\\/g, "/").replace(/^\.\//, "")
      if (normalized === "" || normalized === ".") return false
      return ig.ignores(normalized)
    },
    getPatterns(): string[] {
      return [...DEFAULT_PATTERNS]
    },
  }
}
