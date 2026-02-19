import { existsSync } from "node:fs"
import { join } from "node:path"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { loadTasks, saveTasks } from "./manifest.js"
import type { TaskItem } from "../schemas/manifest.js"

export const HIVEFIVER_COMMANDS = [
  "hivefiver-start",
  "hivefiver-intake",
  "hivefiver-specforge",
  "hivefiver-research",
  "hivefiver-skillforge",
  "hivefiver-gsd-bridge",
  "hivefiver-ralph-bridge",
  "hivefiver-doctor",
] as const

const HIVEFIVER_SKILLS = [
  "hivefiver-persona-routing",
  "hivefiver-spec-distillation",
  "hivefiver-mcp-research-loop",
  "hivefiver-gsd-compat",
  "hivefiver-ralph-tasking",
  "hivefiver-bilingual-tutor",
  "hivefiver-skill-auditor",
] as const

const HIVEFIVER_WORKFLOWS = [
  "hivefiver-vibecoder.yaml",
  "hivefiver-enterprise.yaml",
  "hivefiver-mcp-fallback.yaml",
] as const

export interface HiveFiverAssetAudit {
  sourceRoot: string
  rootMissing: {
    commands: string[]
    skills: string[]
    workflows: string[]
  }
  opencodeMissing: {
    commands: string[]
    skills: string[]
    workflows: string[]
  }
  hasCriticalGaps: boolean
  recommendations: string[]
}

function missingPaths(baseDir: string, relPaths: string[]): string[] {
  return relPaths.filter((filePath) => !existsSync(join(baseDir, filePath)))
}

function resolvePackSourceRoot(projectRoot: string): string {
  const moduleRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..")
  const hasPackAssets = existsSync(join(moduleRoot, "commands", "hivefiver-start.md"))
  return hasPackAssets ? moduleRoot : projectRoot
}

function classifyIntent(message: string): {
  command: string
  skills: string[]
  domain: TaskItem["domain"]
} {
  const lower = message.toLowerCase()

  if (lower.includes("mcp") || lower.includes("research") || lower.includes("context7") || lower.includes("deepwiki")) {
    return {
      command: "hivefiver-research",
      skills: ["hivefiver-mcp-research-loop", "hivefiver-skill-auditor"],
      domain: "dev",
    }
  }

  if (lower.includes("audit") || lower.includes("config") || lower.includes("doctor") || lower.includes("setup")) {
    return {
      command: "hivefiver-doctor",
      skills: ["hivefiver-skill-auditor", "hivefiver-persona-routing"],
      domain: "office-ops",
    }
  }

  if (lower.includes("spec") || lower.includes("requirement") || lower.includes("prd")) {
    return {
      command: "hivefiver-specforge",
      skills: ["hivefiver-spec-distillation", "hivefiver-bilingual-tutor"],
      domain: "dev",
    }
  }

  if (lower.includes("marketing") || lower.includes("campaign") || lower.includes("content")) {
    return {
      command: "hivefiver-intake",
      skills: ["hivefiver-persona-routing", "hivefiver-bilingual-tutor"],
      domain: "marketing",
    }
  }

  if (lower.includes("finance") || lower.includes("budget") || lower.includes("forecast")) {
    return {
      command: "hivefiver-intake",
      skills: ["hivefiver-persona-routing", "hivefiver-skill-auditor"],
      domain: "finance",
    }
  }

  return {
    command: "hivefiver-start",
    skills: ["hivefiver-persona-routing", "hivefiver-bilingual-tutor"],
    domain: "hybrid",
  }
}

export interface AutoRealignmentDecision {
  shouldRealign: boolean
  reason: string
  unknownCommands: string[]
  recommendedCommand: string
  recommendedSkills: string[]
  domain: TaskItem["domain"]
}

export function detectAutoRealignment(message: string): AutoRealignmentDecision {
  const normalized = message.trim()
  const fallback = classifyIntent(normalized)

  if (normalized.length === 0) {
    return {
      shouldRealign: true,
      reason: "empty_or_whitespace_message",
      unknownCommands: [],
      recommendedCommand: fallback.command,
      recommendedSkills: fallback.skills,
      domain: fallback.domain,
    }
  }

  const matches = [...normalized.matchAll(/\/([a-z0-9-]+)/gi)].map((m) => m[1]?.toLowerCase() ?? "")
  const slashCommands = matches.filter((value) => value.length > 0)

  if (slashCommands.length === 0) {
    return {
      shouldRealign: true,
      reason: "no_command_detected",
      unknownCommands: [],
      recommendedCommand: fallback.command,
      recommendedSkills: fallback.skills,
      domain: fallback.domain,
    }
  }

  const known = new Set(HIVEFIVER_COMMANDS)
  const unknownCommands = slashCommands.filter((cmd) => !known.has(cmd as (typeof HIVEFIVER_COMMANDS)[number]))

  if (unknownCommands.length > 0) {
    return {
      shouldRealign: true,
      reason: "unknown_command_detected",
      unknownCommands,
      recommendedCommand: fallback.command,
      recommendedSkills: fallback.skills,
      domain: fallback.domain,
    }
  }

  return {
    shouldRealign: false,
    reason: "known_command_detected",
    unknownCommands: [],
    recommendedCommand: fallback.command,
    recommendedSkills: fallback.skills,
    domain: fallback.domain,
  }
}

export function auditHiveFiverAssets(
  projectRoot: string,
  options: { sourceRoot?: string } = {},
): HiveFiverAssetAudit {
  const sourceRoot = options.sourceRoot ?? resolvePackSourceRoot(projectRoot)
  const rootCommandPaths = HIVEFIVER_COMMANDS.map((name) => `commands/${name}.md`)
  const rootSkillPaths = HIVEFIVER_SKILLS.map((name) => `skills/${name}/SKILL.md`)
  const rootWorkflowPaths = HIVEFIVER_WORKFLOWS.map((name) => `workflows/${name}`)

  const opencodeCommandPaths = HIVEFIVER_COMMANDS.map((name) => `.opencode/commands/${name}.md`)
  const opencodeSkillPaths = HIVEFIVER_SKILLS.map((name) => `.opencode/skills/${name}/SKILL.md`)
  const opencodeWorkflowPaths = HIVEFIVER_WORKFLOWS.map((name) => `.opencode/workflows/${name}`)

  const rootMissing = {
    commands: missingPaths(sourceRoot, rootCommandPaths),
    skills: missingPaths(sourceRoot, rootSkillPaths),
    workflows: missingPaths(sourceRoot, rootWorkflowPaths),
  }

  const opencodeMissing = {
    commands: missingPaths(projectRoot, opencodeCommandPaths),
    skills: missingPaths(projectRoot, opencodeSkillPaths),
    workflows: missingPaths(projectRoot, opencodeWorkflowPaths),
  }

  const hasCriticalGaps =
    rootMissing.commands.length > 0 ||
    rootMissing.skills.length > 0 ||
    rootMissing.workflows.length > 0 ||
    opencodeMissing.commands.length > 0 ||
    opencodeMissing.skills.length > 0 ||
    opencodeMissing.workflows.length > 0

  const recommendations: string[] = []
  if (hasCriticalGaps) {
    recommendations.push("Run sync-assets with overwrite to realign HiveFiver assets")
    recommendations.push("Run hivefiver-doctor after sync to verify MCP + governance readiness")
  } else {
    recommendations.push("HiveFiver pack is fully integrated")
  }

  return {
    sourceRoot,
    rootMissing,
    opencodeMissing,
    hasCriticalGaps,
    recommendations,
  }
}

export async function seedHiveFiverOnboardingTasks(
  directory: string,
  sessionId: string,
): Promise<{ created: number; updated: boolean }> {
  const now = Date.now()
  const manifest = (await loadTasks(directory)) ?? {
    session_id: sessionId,
    updated_at: now,
    tasks: [],
  }

  const baseTasks: TaskItem[] = [
    {
      id: "hivefiver-bootstrap",
      text: "Run HiveFiver startup realignment and lane detection",
      status: "pending",
      priority: "high",
      domain: "hybrid",
      lane: "auto",
      source: "init.seed",
      canonical_command: "hivefiver-start",
      recommended_skills: ["hivefiver-persona-routing", "hivefiver-bilingual-tutor"],
      acceptance_criteria: [
        "Persona lane selected",
        "Project type detected (greenfield/brownfield)",
        "Governance mode locked",
      ],
      related_entities: {
        session_id: sessionId,
      },
      created_at: now,
    },
    {
      id: "hivefiver-mcp-readiness",
      text: "Audit and configure non-negotiable MCP providers",
      status: "pending",
      priority: "high",
      domain: "dev",
      lane: "auto",
      source: "init.seed",
      canonical_command: "hivefiver-doctor",
      recommended_skills: ["hivefiver-mcp-research-loop", "hivefiver-skill-auditor"],
      acceptance_criteria: [
        "Context7, DeepWiki, Repomix status captured",
        "Tavily API guidance emitted",
        "Confidence downgrade policy configured",
      ],
      dependencies: ["hivefiver-bootstrap"],
      related_entities: {
        session_id: sessionId,
      },
      created_at: now,
    },
    {
      id: "hivefiver-export-alignment",
      text: "Prepare TODO-to-Ralph export mapping and validation",
      status: "pending",
      priority: "medium",
      domain: "office-ops",
      lane: "auto",
      source: "init.seed",
      canonical_command: "hivefiver-ralph-bridge",
      recommended_skills: ["hivefiver-ralph-tasking", "hivefiver-gsd-compat"],
      acceptance_criteria: [
        "tasks/prd.json schema validated",
        "Dependency map generated",
        "Related entity links preserved",
      ],
      dependencies: ["hivefiver-mcp-readiness"],
      related_entities: {
        session_id: sessionId,
      },
      created_at: now,
    },
  ]

  const existingById = new Map(manifest.tasks.map((task) => [task.id, task]))
  let created = 0
  for (const task of baseTasks) {
    if (!existingById.has(task.id)) {
      manifest.tasks.push(task)
      created += 1
    }
  }

  const updated = created > 0 || manifest.session_id !== sessionId
  manifest.session_id = sessionId
  manifest.updated_at = now

  if (updated) {
    await saveTasks(directory, manifest)
  }

  return { created, updated }
}
