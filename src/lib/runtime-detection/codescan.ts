import { readdirSync, statSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export type ComplexityLevel = "low" | "medium" | "high"

export type CodeScanResult = {
  language: string
  frameworks: string[]
  complexity: ComplexityLevel
  warnings: string[]
}

function classifyComplexity(count: number): ComplexityLevel {
  if (count >= 20) return "high"
  if (count >= 5) return "medium"
  return "low"
}

const LANGUAGE_MARKERS: Record<string, string[]> = {
  typescript: ["typescript", "ts-node"],
  javascript: ["express", "fastify", "koa"],
  python: ["django", "flask", "fastapi"],
  rust: ["tokio", "serde"],
  go: ["gin", "echo"],
}

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

  const fileCount = countSourceFiles(projectRoot)
  const complexity = classifyComplexity(fileCount)

  return { language, frameworks, complexity, warnings }
}

function extractDeps(
  pkg: Record<string, unknown>,
  field: string,
): string[] {
  const value = pkg[field]
  if (typeof value !== "object" || value === null || Array.isArray(value)) return []
  return Object.keys(value as Record<string, unknown>)
}

function countSourceFiles(projectRoot: string): number {
  let count = 0
  try {
    const entries = readdirSync(projectRoot)
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue
      const full = join(projectRoot, entry)
      const st = statSync(full)
      if (st.isDirectory()) {
        count += countSourceFiles(full)
      } else if (st.isFile()) {
        count++
      }
    }
  } catch {
    return 0
  }
  return count
}
