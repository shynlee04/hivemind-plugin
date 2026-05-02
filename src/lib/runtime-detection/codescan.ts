import { readdir, stat } from "node:fs/promises"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

/**
 * Complexity classification based on source file count.
 *
 * - `"low"` — fewer than 5 source files
 * - `"medium"` — 5–19 source files
 * - `"high"` — 20 or more source files
 */
export type ComplexityLevel = "low" | "medium" | "high"

/**
 * Result of scanning a project's codebase for language, frameworks, and complexity.
 *
 * @property language - Detected primary language (e.g. "typescript", "javascript", "unknown").
 * @property frameworks - Detected framework names (e.g. "react", "nextjs").
 * @property complexity - File-count-based complexity classification.
 * @property warnings - Non-fatal issues encountered during scanning.
 */
export type CodeScanResult = {
  language: string
  frameworks: string[]
  complexity: ComplexityLevel
  warnings: string[]
}

/**
 * Classify a project's complexity from its source file count.
 *
 * @param count - Number of source files found.
 * @returns The complexity level.
 *
 * @example
 * ```typescript
 * classifyComplexity(3)  // "low"
 * classifyComplexity(10) // "medium"
 * classifyComplexity(25) // "high"
 * ```
 */
function classifyComplexity(count: number): ComplexityLevel {
  if (count >= 20) return "high"
  if (count >= 5) return "medium"
  return "low"
}

/** Maps language names to dependency-name markers for detection. */
const LANGUAGE_MARKERS: Record<string, string[]> = {
  typescript: ["typescript", "ts-node"],
  javascript: ["express", "fastify", "koa"],
  python: ["django", "flask", "fastapi"],
  rust: ["tokio", "serde"],
  go: ["gin", "echo"],
}

/** Maps framework names to dependency-name markers for detection. */
const FRAMEWORK_MARKERS: Record<string, string[]> = {
  react: ["react"],
  nextjs: ["next"],
  vue: ["vue"],
  svelte: ["svelte"],
  angular: ["@angular/core"],
  express: ["express"],
  fastify: ["fastify"],
  nestjs: ["@nestjs/core"],
}

/**
 * Scan a project root for language, frameworks, and source-file complexity.
 *
 * Reads `package.json` to detect languages/frameworks, then recursively
 * counts source files to classify complexity. All filesystem operations
 * are fully async to avoid blocking the event loop.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns A {@link CodeScanResult} with detection results and any warnings.
 *
 * @example
 * ```typescript
 * const result = await scanCodebase("/path/to/project")
 * console.log(result.language, result.complexity)
 * ```
 */
export async function scanCodebase(projectRoot: string): Promise<CodeScanResult> {
  const warnings: string[] = []
  let rawPackage: unknown

  try {
    const content = await readFile(join(projectRoot, "package.json"), "utf8")
    rawPackage = JSON.parse(content)
  } catch {
    warnings.push("Missing or unreadable package.json — language detection defaulted to 'unknown'")
    return { language: "unknown", frameworks: [], complexity: "low", warnings }
  }

  const pkg =
    typeof rawPackage === "object" && rawPackage !== null
      ? (rawPackage as Record<string, unknown>)
      : {}

  const deps = extractDeps(pkg, "dependencies")
  const devDeps = extractDeps(pkg, "devDependencies")
  const peerDeps = extractDeps(pkg, "peerDependencies")
  const allDeps = new Set([...deps, ...devDeps, ...peerDeps])

  let language = "javascript"
  for (const [lang, markers] of Object.entries(LANGUAGE_MARKERS)) {
    if (markers.some((m) => allDeps.has(m))) {
      language = lang
      break
    }
  }

  const frameworks: string[] = []
  for (const [name, markers] of Object.entries(FRAMEWORK_MARKERS)) {
    if (markers.some((m) => allDeps.has(m))) {
      frameworks.push(name)
    }
  }

  const fileCount = await countSourceFiles(projectRoot)
  const complexity = classifyComplexity(fileCount)

  return { language, frameworks, complexity, warnings }
}

/**
 * Extract dependency names from a package.json-like object field.
 *
 * @param pkg - Parsed package.json object.
 * @param field - The dependency field to read (e.g. "dependencies", "devDependencies").
 * @returns An array of dependency package names, or an empty array if the field is missing or invalid.
 *
 * @example
 * ```typescript
 * extractDeps(parsedPkg, "devDependencies") // ["typescript", "vitest"]
 * ```
 */
function extractDeps(
  pkg: Record<string, unknown>,
  field: string,
): string[] {
  const value = pkg[field]
  if (typeof value !== "object" || value === null || Array.isArray(value)) return []
  return Object.keys(value as Record<string, unknown>)
}

/**
 * Recursively count source files in a directory using async filesystem APIs.
 *
 * Skips hidden directories (starting with `.`) and `node_modules`.
 * Returns 0 on any filesystem error instead of throwing.
 *
 * @param projectRoot - Absolute path to the directory to scan.
 * @returns The total number of files found.
 */
async function countSourceFiles(projectRoot: string): Promise<number> {
  let count = 0
  try {
    const entries = await readdir(projectRoot)
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue
      const full = join(projectRoot, entry)
      const st = await stat(full)
      if (st.isDirectory()) {
        count += await countSourceFiles(full)
      } else if (st.isFile()) {
        count++
      }
    }
  } catch {
    return 0
  }
  return count
}
