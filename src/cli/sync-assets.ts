import { existsSync } from "node:fs"
import { copyFile, mkdir, readdir, readFile } from "node:fs/promises"
import { homedir } from "node:os"
import { basename, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { parse as parseYaml } from "yaml"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type AssetSyncTarget = "project" | "global" | "both"

export type AssetGroup =
  | "commands"
  | "skills"
  | "agents"
  | "workflows"
  | "templates"
  | "prompts"
  | "references"

const DEFAULT_GROUPS: AssetGroup[] = [
  "commands",
  "skills",
  "agents",
  "workflows",
  "templates",
  "prompts",
  "references",
]

export interface GroupSyncReport {
  group: AssetGroup
  sourceDir: string
  targetDir: string
  sourceExists: boolean
  copied: number
  skipped: number
  invalid: number
}

export interface TargetSyncReport {
  target: "project" | "global"
  baseDir: string
  groups: GroupSyncReport[]
}

export interface SyncAssetsResult {
  targets: TargetSyncReport[]
  totalCopied: number
  totalSkipped: number
  totalInvalid: number
}

export interface SyncAssetsOptions {
  target?: AssetSyncTarget
  overwrite?: boolean
  groups?: AssetGroup[]
  sourceRootDir?: string
  globalBaseDir?: string
  silent?: boolean
  onLog?: (line: string) => void
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const out: string[] = []
  const stack = [dir]

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue

    const entries = await readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(fullPath)
      } else if (entry.isFile()) {
        out.push(fullPath)
      }
    }
  }

  return out
}

export function resolveGlobalOpencodeBaseDir(): string {
  if (process.platform === "win32") {
    const appData = process.env.APPDATA ?? join(homedir(), "AppData", "Roaming")
    return join(appData, "opencode")
  }

  const xdg = process.env.XDG_CONFIG_HOME
  if (xdg && xdg.trim().length > 0) {
    return join(xdg, "opencode")
  }

  return join(homedir(), ".config", "opencode")
}

function computeTargets(projectDir: string, options: SyncAssetsOptions): Array<{ target: "project" | "global"; baseDir: string }> {
  const target = options.target ?? "project"
  const globalBaseDir = options.globalBaseDir ?? resolveGlobalOpencodeBaseDir()

  if (target === "project") {
    return [{ target: "project", baseDir: join(projectDir, ".opencode") }]
  }
  if (target === "global") {
    return [{ target: "global", baseDir: globalBaseDir }]
  }
  return [
    { target: "project", baseDir: join(projectDir, ".opencode") },
    { target: "global", baseDir: globalBaseDir },
  ]
}

function logIfNeeded(options: SyncAssetsOptions, line: string) {
  if (options.silent) return
  options.onLog?.(line)
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---(?:\s*\n|$)/)
  if (!match) return null

  try {
    const parsed = parseYaml(match[1])
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

function isNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0
}

async function parseWorkflowFile(sourceFile: string): Promise<Record<string, unknown> | null> {
  const extension = extname(sourceFile).toLowerCase()
  const content = await readFile(sourceFile, "utf-8")

  if (extension === ".json") {
    try {
      const parsed = JSON.parse(content)
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, unknown>
      }
      return null
    } catch {
      return null
    }
  }

  try {
    const parsed = parseYaml(content)
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

function isValidWorkflowShape(workflow: Record<string, unknown>): boolean {
  if (!isNonEmptyString(workflow.name)) return false
  if (!Array.isArray(workflow.steps) || workflow.steps.length === 0) return false

  for (const step of workflow.steps) {
    if (!step || typeof step !== "object") return false
    const stepRecord = step as Record<string, unknown>
    if (!isNonEmptyString(stepRecord.name) || !isNonEmptyString(stepRecord.tool)) {
      return false
    }
  }
  return true
}

async function validateAssetForGroup(
  group: AssetGroup,
  sourceFile: string
): Promise<boolean> {
  const extension = extname(sourceFile).toLowerCase()

  if (group === "skills") {
    return basename(sourceFile) === "SKILL.md"
  }

  if (group === "commands") {
    if (!sourceFile.endsWith(".md")) return false
    const content = await readFile(sourceFile, "utf-8")
    const frontmatter = parseFrontmatter(content)
    return !!frontmatter && isNonEmptyString(frontmatter.description)
  }

  if (group === "workflows") {
    if (!(extension === ".yaml" || extension === ".yml" || extension === ".json")) {
      return false
    }
    const parsedWorkflow = await parseWorkflowFile(sourceFile)
    return !!parsedWorkflow && isValidWorkflowShape(parsedWorkflow)
  }

  if (group === "agents") {
    if (extension !== ".md") return false
    const content = await readFile(sourceFile, "utf-8")
    const frontmatter = parseFrontmatter(content)
    if (!frontmatter) return false
    return isNonEmptyString(frontmatter.name) && isNonEmptyString(frontmatter.description)
  }

  if (group === "templates" || group === "prompts" || group === "references") {
    const extensionOk = (
      extension === ".md" ||
      extension === ".txt" ||
      extension === ".yaml" ||
      extension === ".yml" ||
      extension === ".json"
    )
    if (!extensionOk) return false
    const content = await readFile(sourceFile, "utf-8")
    return content.trim().length > 0
  }

  return true
}

export async function syncOpencodeAssets(
  projectDir: string,
  options: SyncAssetsOptions = {}
): Promise<SyncAssetsResult> {
  const pkgRoot = join(__dirname, "..", "..")
  const sourceRoot = options.sourceRootDir ?? pkgRoot
  const groups = options.groups ?? DEFAULT_GROUPS
  const overwrite = options.overwrite ?? false
  const targetDefs = computeTargets(projectDir, options)

  const result: SyncAssetsResult = {
    targets: [],
    totalCopied: 0,
    totalSkipped: 0,
    totalInvalid: 0,
  }

  for (const targetDef of targetDefs) {
    const targetReport: TargetSyncReport = {
      target: targetDef.target,
      baseDir: targetDef.baseDir,
      groups: [],
    }

    for (const group of groups) {
      const sourceDir = join(sourceRoot, group)
      const targetGroupDir = join(targetDef.baseDir, group)

      const report: GroupSyncReport = {
        group,
        sourceDir,
        targetDir: targetGroupDir,
        sourceExists: existsSync(sourceDir),
        copied: 0,
        skipped: 0,
        invalid: 0,
      }

      if (!report.sourceExists) {
        targetReport.groups.push(report)
        continue
      }

      const files = await listFilesRecursive(sourceDir)
      for (const sourceFile of files) {
        const isValid = await validateAssetForGroup(group, sourceFile)
        if (!isValid) {
          report.invalid++
          continue
        }

        const rel = relative(sourceDir, sourceFile)
        const destFile = join(targetGroupDir, rel)

        await mkdir(dirname(destFile), { recursive: true })

        if (!overwrite && existsSync(destFile)) {
          report.skipped++
          continue
        }

        await copyFile(sourceFile, destFile)
        report.copied++
      }

      result.totalCopied += report.copied
      result.totalSkipped += report.skipped
      result.totalInvalid += report.invalid
      targetReport.groups.push(report)
    }

    result.targets.push(targetReport)
  }

  for (const targetReport of result.targets) {
    logIfNeeded(
      options,
      `  ✓ Synced OpenCode assets to ${targetReport.target} target: ${targetReport.baseDir}`
    )
    for (const group of targetReport.groups) {
      if (!group.sourceExists) continue
      logIfNeeded(
        options,
        `    - ${group.group}: copied ${group.copied}, skipped ${group.skipped}, invalid ${group.invalid}`
      )
    }
  }

  return result
}
