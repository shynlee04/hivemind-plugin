import { copyFile, mkdir, readdir, readFile, rm, stat } from "node:fs/promises"
import { existsSync } from "node:fs"
import { homedir } from "node:os"
import { basename, dirname, extname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { parse as parseYaml } from "yaml"

const __dirname = dirname(fileURLToPath(import.meta.url))

export type AssetSyncTarget = "project" | "global" | "both"
export type AssetSyncProfile = "core" | "balanced" | "full" | "legacy-compat"

export type AssetGroup =
  | "commands"
  | "skills"
  | "agents"
  | "workflows"
  | "templates"
  | "prompts"
  | "references"

const DEFAULT_PROFILE: AssetSyncProfile = "core"

const DEFAULT_PROFILE_GROUPS: Record<AssetSyncProfile, AssetGroup[]> = {
  core: ["commands", "skills", "agents", "workflows"],
  balanced: ["commands", "skills", "agents", "workflows", "templates", "references"],
  full: ["commands", "skills", "agents", "workflows", "templates", "prompts", "references"],
  "legacy-compat": ["commands", "skills", "agents", "workflows", "templates", "prompts", "references"],
}

const LEGACY_COMMAND_NAMES = new Set([
  "hivefiver-start",
  "hivefiver-intake",
  "hivefiver-specforge",
  "hivefiver-skillforge",
  "hivefiver-gsd-bridge",
  "hivefiver-ralph-bridge",
  "hivefiver-doctor",
])

interface ProfileManifest {
  profile?: string
  description?: string
  groups?: string[]
  include_legacy?: boolean
}

interface ResolvedProfile {
  profile: AssetSyncProfile
  groups: AssetGroup[]
  includeLegacy: boolean
}

export interface GroupSyncReport {
  group: AssetGroup
  sourceDir: string
  targetDir: string
  sourceExists: boolean
  copied: number
  skipped: number
  invalid: number
  pruned: number
  parityMismatches: number
  inventory: string[]
}

export interface TargetSyncReport {
  target: "project" | "global"
  baseDir: string
  groups: GroupSyncReport[]
}

export interface SyncAssetsResult {
  profile: AssetSyncProfile
  targets: TargetSyncReport[]
  totalCopied: number
  totalSkipped: number
  totalInvalid: number
  totalPruned: number
  totalParityMismatches: number
  parityPassed: boolean
  inventory?: Record<string, Record<string, string[]>>
}

export interface SyncAssetsOptions {
  target?: AssetSyncTarget
  profile?: AssetSyncProfile
  overwrite?: boolean
  backupOnOverwrite?: boolean
  backupSuffix?: string
  prune?: boolean
  strictParity?: boolean
  includeLegacy?: boolean
  emitInventory?: boolean
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
      } else if (entry.isSymbolicLink()) {
        try {
          const targetStat = await stat(fullPath)
          if (targetStat.isDirectory()) {
            stack.push(fullPath)
          } else if (targetStat.isFile()) {
            out.push(fullPath)
          }
        } catch {
          // Ignore broken symlinks; parity checks will surface missing artifacts.
        }
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

async function validateAssetForGroup(group: AssetGroup, sourceFile: string): Promise<boolean> {
  const extension = extname(sourceFile).toLowerCase()

  if (group === "skills") {
    if (basename(sourceFile) === "SKILL.md") {
      return true
    }

    if (basename(sourceFile) === "registry.yaml" || basename(sourceFile) === "registry.yml") {
      return true
    }

    const normalized = sourceFile.replaceAll("\\", "/")
    const extensionOk =
      extension === ".md" ||
      extension === ".txt" ||
      extension === ".yaml" ||
      extension === ".yml" ||
      extension === ".json" ||
      extension === ".sh" ||
      extension === ".bash" ||
      extension === ".js" ||
      extension === ".mjs" ||
      extension === ".ts" ||
      extension === ".py"

    if (!extensionOk) return false

    const inAllowedSubdir =
      normalized.includes("/references/") ||
      normalized.includes("/templates/") ||
      normalized.includes("/scripts/")

    return inAllowedSubdir
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
    const extensionOk =
      extension === ".md" ||
      extension === ".txt" ||
      extension === ".yaml" ||
      extension === ".yml" ||
      extension === ".json"

    if (!extensionOk) return false
    const content = await readFile(sourceFile, "utf-8")
    return content.trim().length > 0
  }

  return true
}

function isAssetGroup(value: string): value is AssetGroup {
  return ["commands", "skills", "agents", "workflows", "templates", "prompts", "references"].includes(value)
}

async function resolveProfile(sourceRoot: string, options: SyncAssetsOptions): Promise<ResolvedProfile> {
  const profile = options.profile ?? DEFAULT_PROFILE

  if (options.groups && options.groups.length > 0) {
    return {
      profile,
      groups: options.groups,
      includeLegacy: options.includeLegacy ?? (profile === "legacy-compat"),
    }
  }

  const profilePath = join(sourceRoot, "modules", "profiles", `${profile}.yaml`)
  if (existsSync(profilePath)) {
    try {
      const raw = await readFile(profilePath, "utf-8")
      const parsed = parseYaml(raw) as ProfileManifest
      const groups = Array.isArray(parsed?.groups)
        ? parsed.groups.filter(isAssetGroup)
        : DEFAULT_PROFILE_GROUPS[profile]

      return {
        profile,
        groups,
        includeLegacy: options.includeLegacy ?? Boolean(parsed?.include_legacy),
      }
    } catch {
      return {
        profile,
        groups: DEFAULT_PROFILE_GROUPS[profile],
        includeLegacy: options.includeLegacy ?? (profile === "legacy-compat"),
      }
    }
  }

  return {
    profile,
    groups: DEFAULT_PROFILE_GROUPS[profile],
    includeLegacy: options.includeLegacy ?? (profile === "legacy-compat"),
  }
}

function shouldIncludeRel(group: AssetGroup, rel: string, includeLegacy: boolean): boolean {
  if (group !== "commands") return true
  if (includeLegacy) return true

  const name = basename(rel, extname(rel)).toLowerCase()
  if (LEGACY_COMMAND_NAMES.has(name)) return false

  return true
}

async function backupBeforeOverwrite(destFile: string, suffix: string): Promise<void> {
  const normalizedSuffix = suffix.startsWith(".") ? suffix : `.${suffix}`
  let candidate = `${destFile}${normalizedSuffix}`
  let counter = 0

  while (existsSync(candidate)) {
    counter++
    candidate = `${destFile}${normalizedSuffix}.${counter}`
  }

  await mkdir(dirname(candidate), { recursive: true })
  await copyFile(destFile, candidate)
}

export async function syncOpencodeAssets(projectDir: string, options: SyncAssetsOptions = {}): Promise<SyncAssetsResult> {
  const pkgRoot = join(__dirname, "..", "..")
  const sourceRoot = options.sourceRootDir ?? pkgRoot
  const overwrite = options.overwrite ?? false
  const backupOnOverwrite = options.backupOnOverwrite ?? false
  const backupSuffix = options.backupSuffix ?? `.bak.${new Date().toISOString().replaceAll(":", "-")}`
  const prune = options.prune ?? false
  const strictParity = options.strictParity ?? false
  const emitInventory = options.emitInventory ?? false

  const resolvedProfile = await resolveProfile(sourceRoot, options)
  const groups = resolvedProfile.groups
  const targetDefs = computeTargets(projectDir, options)

  const result: SyncAssetsResult = {
    profile: resolvedProfile.profile,
    targets: [],
    totalCopied: 0,
    totalSkipped: 0,
    totalInvalid: 0,
    totalPruned: 0,
    totalParityMismatches: 0,
    parityPassed: true,
    inventory: emitInventory ? {} : undefined,
  }

  for (const targetDef of targetDefs) {
    const targetReport: TargetSyncReport = {
      target: targetDef.target,
      baseDir: targetDef.baseDir,
      groups: [],
    }

    const targetInventory: Record<string, string[]> = {}

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
        pruned: 0,
        parityMismatches: 0,
        inventory: [],
      }

      if (!report.sourceExists) {
        targetReport.groups.push(report)
        continue
      }

      const files = await listFilesRecursive(sourceDir)
      const validSourceRels = new Set<string>()

      for (const sourceFile of files) {
        const rel = relative(sourceDir, sourceFile)
        if (!shouldIncludeRel(group, rel, resolvedProfile.includeLegacy)) {
          continue
        }

        const isValid = await validateAssetForGroup(group, sourceFile)
        if (!isValid) {
          report.invalid++
          continue
        }

        validSourceRels.add(rel)
        report.inventory.push(rel)

        const destFile = join(targetGroupDir, rel)
        await mkdir(dirname(destFile), { recursive: true })

        if (!overwrite && existsSync(destFile)) {
          report.skipped++
          continue
        }

        if (overwrite && existsSync(destFile) && backupOnOverwrite) {
          await backupBeforeOverwrite(destFile, backupSuffix)
        }

        await copyFile(sourceFile, destFile)
        report.copied++
      }

      if (prune && existsSync(targetGroupDir)) {
        const targetFiles = await listFilesRecursive(targetGroupDir)
        for (const targetFile of targetFiles) {
          const rel = relative(targetGroupDir, targetFile)
          if (!shouldIncludeRel(group, rel, resolvedProfile.includeLegacy)) {
            continue
          }
          if (validSourceRels.has(rel)) continue
          await rm(targetFile)
          report.pruned++
        }
      }

      if (existsSync(targetGroupDir)) {
        for (const rel of validSourceRels) {
          const sourceFile = join(sourceDir, rel)
          const destFile = join(targetGroupDir, rel)
          if (!existsSync(destFile)) {
            report.parityMismatches++
            continue
          }

          const [sourceBuffer, targetBuffer] = await Promise.all([
            readFile(sourceFile),
            readFile(destFile),
          ])
          if (!sourceBuffer.equals(targetBuffer)) {
            report.parityMismatches++
          }
        }

        if (!prune) {
          const targetFiles = await listFilesRecursive(targetGroupDir)
          for (const targetFile of targetFiles) {
            const rel = relative(targetGroupDir, targetFile)
            if (!shouldIncludeRel(group, rel, resolvedProfile.includeLegacy)) {
              continue
            }
            if (!validSourceRels.has(rel)) {
              report.parityMismatches++
            }
          }
        }
      }

      result.totalCopied += report.copied
      result.totalSkipped += report.skipped
      result.totalInvalid += report.invalid
      result.totalPruned += report.pruned
      result.totalParityMismatches += report.parityMismatches
      targetReport.groups.push(report)
      targetInventory[group] = [...report.inventory].sort()
    }

    if (emitInventory && result.inventory) {
      result.inventory[targetDef.target] = targetInventory
    }

    result.targets.push(targetReport)
  }

  logIfNeeded(
    options,
    `  ✓ Synced OpenCode assets to profile '${resolvedProfile.profile}' (${resolvedProfile.includeLegacy ? "with legacy" : "canonical only"})`
  )

  for (const targetReport of result.targets) {
    logIfNeeded(options, `  ✓ Synced OpenCode assets to ${targetReport.target} target: ${targetReport.baseDir}`)
    for (const group of targetReport.groups) {
      if (!group.sourceExists) continue
      logIfNeeded(
        options,
        `    - ${group.group}: copied ${group.copied}, skipped ${group.skipped}, invalid ${group.invalid}, pruned ${group.pruned}, parity_mismatches ${group.parityMismatches}`
      )
    }
  }

  result.parityPassed = result.totalParityMismatches === 0
  if (strictParity && !result.parityPassed) {
    throw new Error(`Strict parity failed for profile '${resolvedProfile.profile}' with ${result.totalParityMismatches} mismatches`)
  }

  return result
}
