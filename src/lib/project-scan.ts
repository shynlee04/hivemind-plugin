import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"
import { detectFrameworkContext, type FrameworkContext } from "./framework-context.js"

interface PackageLike {
  name?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export interface ProjectScanSummary {
  project: {
    name: string
    topLevelDirs: string[]
    sourceDirs: string[]
    configFiles: string[]
  }
  framework: FrameworkContext & {
    hasBmad: boolean
  }
  stack: {
    hints: string[]
  }
  artifacts: {
    staleSignals: string[]
    notableFiles: string[]
  }
}

const SOURCE_DIRS = [
  "src",
  "lib",
  "app",
  "pages",
  "components",
  "server",
  "services",
  "packages",
] as const

const CONFIG_FILES = [
  "tsconfig.json",
  "vite.config.ts",
  "vite.config.js",
  "next.config.js",
  "next.config.mjs",
  "webpack.config.js",
  "turbo.json",
  "pnpm-workspace.yaml",
  "docker-compose.yml",
  "docker-compose.yaml",
] as const

const NOTABLE_FILES = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  ".planning/STATE.md",
  ".planning/ROADMAP.md",
  ".spec-kit",
  ".bmad",
] as const

const STACK_SIGNALS: Array<[string, string]> = [
  ["typescript", "TypeScript"],
  ["react", "React"],
  ["next", "Next.js"],
  ["vite", "Vite"],
  ["ink", "Ink TUI"],
  ["express", "Express"],
  ["fastify", "Fastify"],
  ["@nestjs/core", "NestJS"],
  ["vue", "Vue"],
  ["svelte", "Svelte"],
  ["angular", "Angular"],
  ["tailwindcss", "Tailwind CSS"],
]

function detectStaleSignals(topLevelDirs: string[]): string[] {
  const staleMatches = topLevelDirs.filter((entry) =>
    /(?:copy|backup|old|archive|legacy|tmp)$/i.test(entry)
  )

  const staleSignals: string[] = []
  if (staleMatches.length > 0) {
    staleSignals.push(`Possible stale directories: ${staleMatches.join(", ")}`)
  }

  return staleSignals
}

function detectStackHintsFromDeps(pkg: PackageLike): string[] {
  const deps = {
    ...(pkg.dependencies ?? {}),
    ...(pkg.devDependencies ?? {}),
    ...(pkg.peerDependencies ?? {}),
  }
  const dependencyKeys = Object.keys(deps)

  const hints = STACK_SIGNALS
    .filter(([dep]) => dependencyKeys.includes(dep))
    .map(([, label]) => label)

  if (dependencyKeys.some((dep) => dep.includes("opencode"))) {
    hints.push("OpenCode ecosystem")
  }

  return hints.length > 0 ? hints : ["Unknown stack"]
}

function detectBmad(directory: string): boolean {
  return (
    existsSync(join(directory, ".bmad")) ||
    existsSync(join(directory, "bmad")) ||
    existsSync(join(directory, "BMAD.md")) ||
    existsSync(join(directory, "bmad.config.yaml")) ||
    existsSync(join(directory, "bmad.config.yml"))
  )
}

export function buildBrownfieldRecommendations(summary: ProjectScanSummary): string[] {
  const recommendations: string[] = []

  if (summary.framework.mode === "both") {
    recommendations.push(
      "Framework conflict: .planning and .spec-kit are both present. Consolidate to one active framework before implementation."
    )
  } else if (summary.framework.mode === "none") {
    recommendations.push(
      "No framework artifacts detected. Start with a lightweight spec or task map before refactoring."
    )
  }

  if (summary.framework.hasBmad) {
    recommendations.push(
      "BMAD signals detected. Verify ownership boundaries and avoid mixing BMAD directives with another active framework."
    )
  }

  if (summary.artifacts.staleSignals.length > 0) {
    recommendations.push(
      "Potential context poisoning signals found. Quarantine stale/backup directories before any broad refactor."
    )
  }

  recommendations.push(
    "Run session lifecycle in order: declare_intent -> map_context(tactic) -> map_context(action) before edits."
  )
  recommendations.push(
    "Use scan_hierarchy include_drift=true at checkpoints to verify alignment before and after large changes."
  )

  return recommendations
}

export async function scanProjectContext(directory: string): Promise<ProjectScanSummary> {
  const entries = await readdir(directory, { withFileTypes: true })
  const topLevelDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const sourceDirs = SOURCE_DIRS.filter((name) => topLevelDirs.includes(name))
  const configFiles = CONFIG_FILES.filter((name) => existsSync(join(directory, name)))
  const notableFiles = NOTABLE_FILES.filter((name) => existsSync(join(directory, name)))

  let pkg: PackageLike = {}
  const packagePath = join(directory, "package.json")
  if (existsSync(packagePath)) {
    try {
      const raw = await readFile(packagePath, "utf-8")
      pkg = JSON.parse(raw) as PackageLike
    } catch {
      pkg = {}
    }
  }

  const framework = await detectFrameworkContext(directory)
  const hasBmad = detectBmad(directory)

  return {
    project: {
      name: pkg.name?.trim() || "(unknown project)",
      topLevelDirs,
      sourceDirs,
      configFiles,
    },
    framework: {
      ...framework,
      hasBmad,
    },
    stack: {
      hints: detectStackHintsFromDeps(pkg),
    },
    artifacts: {
      staleSignals: detectStaleSignals(topLevelDirs),
      notableFiles,
    },
  }
}
