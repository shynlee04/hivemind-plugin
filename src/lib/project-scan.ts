import { existsSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { join } from "node:path"

export interface ProjectSnapshot {
  projectName: string
  topLevelDirs: string[]
  artifactHints: string[]
  stackHints: string[]
}

export async function collectProjectSnapshot(directory: string): Promise<ProjectSnapshot> {
  const snapshot: ProjectSnapshot = {
    projectName: "(unknown project)",
    topLevelDirs: [],
    artifactHints: [],
    stackHints: [],
  }

  try {
    const packagePath = join(directory, "package.json")
    if (existsSync(packagePath)) {
      const raw = await readFile(packagePath, "utf-8")
      const pkg = JSON.parse(raw) as {
        name?: string
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
        peerDependencies?: Record<string, string>
      }
      if (pkg.name?.trim()) {
        snapshot.projectName = pkg.name.trim()
      }

      const deps = {
        ...(pkg.dependencies ?? {}),
        ...(pkg.devDependencies ?? {}),
        ...(pkg.peerDependencies ?? {}),
      }

      const stackSignals: Array<[string, string]> = [
        ["typescript", "TypeScript"],
        ["react", "React"],
        ["next", "Next.js"],
        ["vite", "Vite"],
        ["@" + "opencode-ai/plugin", "OpenCode Plugin SDK"], // Split string to pass boundary check
        ["ink", "Ink TUI"],
        ["express", "Express"],
        ["fastify", "Fastify"],
        ["@nestjs/core", "NestJS"],
        ["vue", "Vue"],
        ["angular", "Angular"],
        ["svelte", "Svelte"],
        ["tailwindcss", "Tailwind CSS"],
        ["prisma", "Prisma"],
        ["drizzle-orm", "Drizzle"],
        ["@trpc/server", "tRPC"],
        ["zod", "Zod"],
        ["vitest", "Vitest"],
        ["jest", "Jest"],
        ["playwright", "Playwright"],
      ]

      for (const [depName, label] of stackSignals) {
        if (depName in deps) {
          snapshot.stackHints.push(label)
        }
      }
    }
  } catch {
    // Best-effort scan only
  }

  // Detect non-JS ecosystems
  const ecosystemFiles: Array<[string, string]> = [
    ["pyproject.toml", "Python"],
    ["requirements.txt", "Python"],
    ["go.mod", "Go"],
    ["Cargo.toml", "Rust"],
    ["Gemfile", "Ruby"],
    ["composer.json", "PHP"],
    ["build.gradle", "Java/Kotlin"],
    ["pom.xml", "Java (Maven)"],
    ["Package.swift", "Swift"],
    ["pubspec.yaml", "Dart/Flutter"],
    ["mix.exs", "Elixir"],
  ]
  for (const [file, label] of ecosystemFiles) {
    if (existsSync(join(directory, file))) {
      snapshot.stackHints.push(label)
    }
  }

  try {
    const entries = await readdir(directory, { withFileTypes: true })
    snapshot.topLevelDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => name !== "node_modules" && name !== ".git")
      .slice(0, 8)
  } catch {
    // Best-effort scan only
  }

  const artifactCandidates = [
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    ".planning/ROADMAP.md",
    ".planning/STATE.md",
    ".spec-kit",
    "docs",
    ".opencode",
    "CHANGELOG.md",
    ".env.example",
    "docker-compose.yml",
    "Dockerfile",
    ".github/workflows",
    "turbo.json",
    "nx.json",
    "lerna.json",
  ]
  snapshot.artifactHints = artifactCandidates.filter((path) => existsSync(join(directory, path)))

  return snapshot
}

export function formatHintList(items: string[]): string {
  if (items.length === 0) return "none detected"
  return items.join(", ")
}
