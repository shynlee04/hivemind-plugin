import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parse as parseYaml } from "yaml"
import {
  SkillRegistrySchema,
  type SkillMetadata,
  type SkillRegistry,
  type SkillBundle,
  type ProgressiveDisclosureLevel,
} from "../schemas/skill-registry.js"

const DISCLOSURE_ORDER: ProgressiveDisclosureLevel[] = ["L0", "L1", "L2", "L3"]

export interface SkillResolutionOptions {
  requestedSkills?: string[]
  allowedBundles?: SkillBundle[]
  maxDisclosureLevel?: ProgressiveDisclosureLevel
  tokenBudget?: number
  estimatedTokensPerSkill?: number
  includeExperimental?: boolean
}

export interface SkillResolutionResult {
  selected: SkillMetadata[]
  skipped: Array<{ name: string; reason: string }>
  estimatedTokenUsage: number
}

export function loadSkillRegistry(projectRoot: string): SkillRegistry {
  const registryPath = join(projectRoot, "skills", "registry.yaml")
  if (!existsSync(registryPath)) {
    throw new Error("Missing skill registry at skills/registry.yaml")
  }

  const raw = readFileSync(registryPath, "utf-8")
  const parsed = parseYaml(raw)
  return SkillRegistrySchema.parse(parsed)
}

export function isDisclosureAllowed(
  level: ProgressiveDisclosureLevel,
  maxLevel: ProgressiveDisclosureLevel,
): boolean {
  return DISCLOSURE_ORDER.indexOf(level) <= DISCLOSURE_ORDER.indexOf(maxLevel)
}

export function resolveLocalFirstSkillPath(
  projectRoot: string,
  skillName: string,
  mirrorRoot = join(projectRoot, ".opencode", "skills"),
): string | null {
  const rootPath = join(projectRoot, "skills", skillName, "SKILL.md")
  if (existsSync(rootPath)) return rootPath

  const mirrorPath = join(mirrorRoot, skillName, "SKILL.md")
  if (existsSync(mirrorPath)) return mirrorPath

  return null
}

export function resolveSkills(
  registry: SkillRegistry,
  options: SkillResolutionOptions = {},
): SkillResolutionResult {
  const requestedSkills = options.requestedSkills ?? []
  const allowedBundles = options.allowedBundles ?? []
  const maxDisclosureLevel = options.maxDisclosureLevel ?? "L2"
  const tokenBudget = options.tokenBudget ?? Number.POSITIVE_INFINITY
  const estimatedTokensPerSkill = options.estimatedTokensPerSkill ?? 600
  const includeExperimental = options.includeExperimental ?? false

  const skipped: Array<{ name: string; reason: string }> = []

  const basePool = registry.skills.filter((skill) => {
    if (skill.status === "deprecated") return false
    if (!includeExperimental && skill.status === "experimental") return false
    if (!isDisclosureAllowed(skill.disclosure_level, maxDisclosureLevel)) return false
    if (allowedBundles.length > 0 && !allowedBundles.includes(skill.bundle)) return false
    return true
  })

  const requestedSet = new Set(requestedSkills)
  const sorted = basePool.sort((a, b) => {
    const aPriority = requestedSet.has(a.name) ? 1 : 0
    const bPriority = requestedSet.has(b.name) ? 1 : 0
    if (aPriority !== bPriority) return bPriority - aPriority
    return b.knowledge_delta_score - a.knowledge_delta_score
  })

  const selected: SkillMetadata[] = []
  let estimatedTokenUsage = 0

  for (const skill of sorted) {
    if (requestedSet.size > 0 && !requestedSet.has(skill.name)) {
      continue
    }

    if (estimatedTokenUsage + estimatedTokensPerSkill > tokenBudget) {
      skipped.push({
        name: skill.name,
        reason: `token_budget_exceeded(${tokenBudget})`,
      })
      continue
    }

    selected.push(skill)
    estimatedTokenUsage += estimatedTokensPerSkill
  }

  for (const requested of requestedSet) {
    if (!selected.some((item) => item.name === requested)) {
      const existsInRegistry = registry.skills.some((skill) => skill.name === requested)
      skipped.push({
        name: requested,
        reason: existsInRegistry ? "filtered_by_constraints" : "not_in_registry",
      })
    }
  }

  return { selected, skipped, estimatedTokenUsage }
}
