import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { loadTasks, saveTasks } from "./manifest.js"
import type { TaskItem } from "../schemas/manifest.js"

export const HIVEFIVER_LEGACY_COMMANDS = [
  "hivefiver-start",
  "hivefiver-intake",
  "hivefiver-specforge",
  "hivefiver-research",
  "hivefiver-skillforge",
  "hivefiver-gsd-bridge",
  "hivefiver-ralph-bridge",
  "hivefiver-doctor",
] as const

export const HIVEFIVER_ACTIONS = [
  "init",
  "spec",
  "architect",
  "workflow",
  "build",
  "validate",
  "deploy",
  "research",
  "audit",
  "tutor",
] as const

export const HIVEFIVER_ALIAS_COMMANDS = [
  "hivefiver-init",
  "hivefiver-spec",
  "hivefiver-architect",
  "hivefiver-workflow",
  "hivefiver-build",
  "hivefiver-validate",
  "hivefiver-deploy",
  "hivefiver-audit",
  "hivefiver-tutor",
] as const

export const HIVEFIVER_COMMANDS = [
  "hivefiver",
  ...HIVEFIVER_LEGACY_COMMANDS,
  ...HIVEFIVER_ALIAS_COMMANDS,
] as const

const HIVEFIVER_REQUIRED_COMMAND_FILES = [
  "hivefiver.md",
  "hivefiver-start.md",
  "hivefiver-intake.md",
  "hivefiver-specforge.md",
  "hivefiver-research.md",
  "hivefiver-skillforge.md",
  "hivefiver-gsd-bridge.md",
  "hivefiver-ralph-bridge.md",
  "hivefiver-doctor.md",
  "hivefiver-init.md",
  "hivefiver-spec.md",
  "hivefiver-architect.md",
  "hivefiver-workflow.md",
  "hivefiver-build.md",
  "hivefiver-validate.md",
  "hivefiver-deploy.md",
  "hivefiver-audit.md",
  "hivefiver-tutor.md",
] as const

const HIVEFIVER_SKILLS = [
  "hivefiver-persona-routing",
  "hivefiver-spec-distillation",
  "hivefiver-mcp-research-loop",
  "hivefiver-gsd-compat",
  "hivefiver-ralph-tasking",
  "hivefiver-bilingual-tutor",
  "hivefiver-skill-auditor",
  "hivefiver-domain-pack-router",
] as const

const HIVEFIVER_WORKFLOWS = [
  "hivefiver-vibecoder.yaml",
  "hivefiver-enterprise.yaml",
  "hivefiver-mcp-fallback.yaml",
  "hivefiver-floppy-engineer.yaml",
  "hivefiver-enterprise-architect.yaml",
] as const

const MANDATORY_RESEARCH_GATE_SKILLS = [
  "hivefiver-persona-routing",
  "hivefiver-bilingual-tutor",
  "hivefiver-mcp-research-loop",
  "hivefiver-skill-auditor",
  "hivefiver-domain-pack-router",
] as const

const ACTION_HINTS: Array<{ action: (typeof HIVEFIVER_ACTIONS)[number]; keywords: string[] }> = [
  { action: "research", keywords: ["research", "mcp", "deepwiki", "context7", "tavily", "exa", "repomix"] },
  { action: "audit", keywords: ["audit", "doctor", "check", "health", "alignment", "config", "setup"] },
  { action: "deploy", keywords: ["deploy", "release", "environment", "production", "launch"] },
  { action: "validate", keywords: ["validate", "test", "qa", "quality", "verify"] },
  { action: "tutor", keywords: ["learn", "guide", "tutorial", "explain", "mentor", "teach"] },
  { action: "workflow", keywords: ["workflow", "orchestrate", "pipeline", "swarm", "automation"] },
  { action: "architect", keywords: ["architect", "design", "subagent", "agent", "topology"] },
  { action: "spec", keywords: ["spec", "requirements", "prd", "clarify", "scope"] },
  { action: "build", keywords: ["build", "implement", "develop", "code"] },
]

type HiveFiverAction = (typeof HIVEFIVER_ACTIONS)[number]

const ACTIONS_REQUIRING_PERMISSION = new Set<HiveFiverAction>(["build", "validate", "deploy"])

const ACTION_LABELS: Record<HiveFiverAction, string> = {
  init: "Initialize + profile",
  spec: "Build specification",
  architect: "Design agent system",
  workflow: "Configure workflow",
  build: "Implement with TDD",
  validate: "Run quality gates",
  deploy: "Prepare deployment",
  research: "Run MCP research",
  audit: "Audit alignment",
  tutor: "Tutor mode",
}

const ACTION_PURPOSE: Record<HiveFiverAction, string> = {
  init: "Detect context, profile lane, and lock startup flow.",
  spec: "Distill requirements and close ambiguity.",
  architect: "Shape agents, subagents, and interfaces.",
  workflow: "Define orchestrated execution steps and guards.",
  build: "Move from approved plan into implementation.",
  validate: "Check tests, evidence gates, and schema quality.",
  deploy: "Prepare runtime environment and rollout steps.",
  research: "Gather evidence from MCP providers and synthesize findings.",
  audit: "Check config drift and governance integrity.",
  tutor: "Guide through next decisions with interactive coaching.",
}

const ACTION_MENU_TEMPLATES: Record<HiveFiverAction, HiveFiverAction[]> = {
  init: ["spec", "research", "tutor"],
  spec: ["research", "architect", "workflow"],
  architect: ["workflow", "spec", "build"],
  workflow: ["architect", "build", "validate"],
  build: ["validate", "deploy", "audit"],
  validate: ["build", "deploy", "audit"],
  deploy: ["validate", "audit", "tutor"],
  research: ["spec", "audit", "validate"],
  audit: ["research", "spec", "tutor"],
  tutor: ["spec", "research", "init"],
}

interface IntentClassification {
  command: string
  action: (typeof HIVEFIVER_ACTIONS)[number]
  skills: string[]
  domain: TaskItem["domain"]
  persona: TaskItem["persona"]
  workflow: string
}

export interface AutoNextStepOption {
  id: string
  command: string
  action: HiveFiverAction
  label: string
  description: string
  requiresPermission: boolean
}

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

function pickDomain(lower: string): TaskItem["domain"] {
  if (
    lower.includes("campaign") ||
    lower.includes("seo") ||
    lower.includes("ads") ||
    lower.includes("social") ||
    lower.includes("marketing")
  ) {
    return "marketing"
  }

  if (
    lower.includes("budget") ||
    lower.includes("forecast") ||
    lower.includes("p&l") ||
    lower.includes("finance") ||
    lower.includes("cashflow")
  ) {
    return "finance"
  }

  if (
    lower.includes("office") ||
    lower.includes("operations") ||
    lower.includes("workspace") ||
    lower.includes("spreadsheet") ||
    lower.includes("pdf") ||
    lower.includes("report")
  ) {
    return "office-ops"
  }

  if (lower.includes("saas") || lower.includes("api") || lower.includes("backend") || lower.includes("frontend")) {
    return "dev"
  }

  return "hybrid"
}

function pickPersona(lower: string): NonNullable<TaskItem["persona"]> {
  const enterpriseSignals = ["enterprise", "compliance", "soc2", "iso", "sla", "corporate", "governance", "risk"]
  if (enterpriseSignals.some((signal) => lower.includes(signal))) {
    return "enterprise_architect"
  }

  const messySignals = ["messy", "dump", "wall of text", "hit and miss", "chunk", "mixed ideas", "chaotic"]
  if (messySignals.some((signal) => lower.includes(signal)) || (lower.includes("```") && lower.length > 600)) {
    return "floppy_engineer"
  }

  const techKeywords = [
    "typescript",
    "python",
    "postgres",
    "kubernetes",
    "microservice",
    "schema",
    "orm",
    "sdk",
    "docker",
  ]
  const hasLowTechPrompt = (lower.includes("i want to build") || lower.includes("help me build") || lower.includes("make app")) &&
    !techKeywords.some((keyword) => lower.includes(keyword))

  if (hasLowTechPrompt || lower.includes("vibecoder") || lower.includes("beginner")) {
    return "vibecoder"
  }

  return "floppy_engineer"
}

function pickAction(lower: string): (typeof HIVEFIVER_ACTIONS)[number] {
  for (const hint of ACTION_HINTS) {
    if (hint.keywords.some((keyword) => lower.includes(keyword))) {
      return hint.action
    }
  }
  return "init"
}

function classifyIntent(message: string): IntentClassification {
  const lower = message.toLowerCase()
  const action = pickAction(lower)
  const domain = pickDomain(lower)
  const persona = pickPersona(lower)

  const skills = ["hivefiver-persona-routing", "hivefiver-bilingual-tutor"]

  if (action === "spec") {
    skills.push("hivefiver-spec-distillation")
  }

  if (action === "research" || lower.includes("mcp")) {
    skills.push("hivefiver-mcp-research-loop", "hivefiver-skill-auditor")
  }

  if (action === "workflow" || action === "architect") {
    skills.push("hivefiver-domain-pack-router")
  }

  if (action === "validate") {
    skills.push("hivefiver-ralph-tasking", "hivefiver-gsd-compat")
  }

  if (action === "audit") {
    skills.push("hivefiver-skill-auditor")
  }

  if (domain !== "dev") {
    skills.push("hivefiver-domain-pack-router")
  }

  const uniqueSkills = [...new Set(skills)]

  let workflow = "hivefiver-vibecoder.yaml"
  if (persona === "enterprise_architect") {
    workflow = "hivefiver-enterprise-architect.yaml"
  } else if (persona === "floppy_engineer") {
    workflow = "hivefiver-floppy-engineer.yaml"
  }

  return {
    command: `hivefiver ${action}`,
    action,
    skills: uniqueSkills,
    domain,
    persona,
    workflow,
  }
}

function normalizeActionToken(value: string | undefined): string | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function parseSlashCommands(message: string): Array<{ command: string; action: string | null }> {
  // Match real slash-command tokens while ignoring URL/file-path segments.
  const matches = [...message.matchAll(/(?:^|\s)\/([a-z0-9-]+)(?!\/)(?:\s+([a-z0-9-]+))?/gi)]
  return matches
    .map((match) => ({
      command: (match[1] ?? "").toLowerCase(),
      action: normalizeActionToken(match[2]),
    }))
    .filter((entry) => entry.command.length > 0)
}

export interface AutoRealignmentDecision {
  shouldRealign: boolean
  reason: string
  unknownCommands: string[]
  recommendedCommand: string
  recommendedAction: string
  recommendedSkills: string[]
  recommendedWorkflow: string
  persona: TaskItem["persona"]
  domain: TaskItem["domain"]
  canAutoInitiate: boolean
  requiresPermission: boolean
  permissionPrompt?: string
  nextStepMenu: AutoNextStepOption[]
}

function commandForAction(action: HiveFiverAction): string {
  return `hivefiver ${action}`
}

function requiresPermissionForAction(action: HiveFiverAction): boolean {
  return ACTIONS_REQUIRING_PERMISSION.has(action)
}

function buildPermissionPrompt(command: string, requiresPermission: boolean): string | undefined {
  if (!requiresPermission) return undefined
  return `Approve next step: run /${command} now? (Yes/No)`
}

function buildNextStepMenu(action: HiveFiverAction, domain: TaskItem["domain"]): AutoNextStepOption[] {
  const seeded = [...ACTION_MENU_TEMPLATES[action]]
  if (domain !== "dev" && !seeded.includes("tutor")) {
    seeded.push("tutor")
  }

  const actions = [...new Set([action, ...seeded])].slice(0, 4)
  return actions.map((entryAction, index) => {
    const command = commandForAction(entryAction)
    const requiresPermission = requiresPermissionForAction(entryAction)
    return {
      id: `option-${index + 1}`,
      command,
      action: entryAction,
      label: ACTION_LABELS[entryAction],
      description: ACTION_PURPOSE[entryAction],
      requiresPermission,
    }
  })
}

function buildDecision(
  shouldRealign: boolean,
  reason: string,
  unknownCommands: string[],
  fallback: IntentClassification,
): AutoRealignmentDecision {
  const requiresPermission = requiresPermissionForAction(fallback.action)
  return {
    shouldRealign,
    reason,
    unknownCommands,
    recommendedCommand: fallback.command,
    recommendedAction: fallback.action,
    recommendedSkills: fallback.skills,
    recommendedWorkflow: fallback.workflow,
    persona: fallback.persona,
    domain: fallback.domain,
    canAutoInitiate: !requiresPermission,
    requiresPermission,
    permissionPrompt: buildPermissionPrompt(fallback.command, requiresPermission),
    nextStepMenu: buildNextStepMenu(fallback.action, fallback.domain),
  }
}

function buildMandatoryResearchFallback(base: IntentClassification): IntentClassification {
  return {
    ...base,
    command: "hivefiver research",
    action: "research",
    skills: [...MANDATORY_RESEARCH_GATE_SKILLS],
    workflow: "hivefiver-floppy-engineer.yaml",
  }
}

export function detectAutoRealignment(message: string): AutoRealignmentDecision {
  const normalized = message.trim()
  const fallback = classifyIntent(normalized)
  const mandatoryResearchFallback = buildMandatoryResearchFallback(fallback)
  const noCommandFallback = fallback.action === "build" ? fallback : mandatoryResearchFallback

  if (normalized.length === 0) {
    return buildDecision(true, "empty_or_whitespace_message", [], noCommandFallback)
  }

  const slashCommands = parseSlashCommands(normalized)

  if (slashCommands.length === 0) {
    return buildDecision(true, "no_command_detected", [], noCommandFallback)
  }

  const known = new Set(HIVEFIVER_COMMANDS)
  const validActions = new Set(HIVEFIVER_ACTIONS)
  const unknownCommands: string[] = []

  for (const entry of slashCommands) {
    if (!known.has(entry.command as (typeof HIVEFIVER_COMMANDS)[number])) {
      unknownCommands.push(entry.command)
      continue
    }

    if (entry.command === "hivefiver" && entry.action && !validActions.has(entry.action as (typeof HIVEFIVER_ACTIONS)[number])) {
      unknownCommands.push(`${entry.command} ${entry.action}`)
    }
  }

  if (unknownCommands.length > 0) {
    return buildDecision(true, "unknown_command_detected", unknownCommands, mandatoryResearchFallback)
  }

  return buildDecision(false, "known_command_detected", [], fallback)
}

export function auditHiveFiverAssets(
  projectRoot: string,
  options: { sourceRoot?: string } = {},
): HiveFiverAssetAudit {
  const sourceRoot = options.sourceRoot ?? resolvePackSourceRoot(projectRoot)
  const rootCommandPaths = HIVEFIVER_REQUIRED_COMMAND_FILES.map((name) => `commands/${name}`)
  const rootSkillPaths = HIVEFIVER_SKILLS.map((name) => `skills/${name}/SKILL.md`)
  const rootWorkflowPaths = HIVEFIVER_WORKFLOWS.map((name) => `workflows/${name}`)

  const opencodeCommandPaths = HIVEFIVER_REQUIRED_COMMAND_FILES.map((name) => `.opencode/commands/${name}`)
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
    recommendations.push("Run /hivefiver audit after sync to verify MCP + governance readiness")
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
      persona: "vibecoder",
      source: "init.seed",
      hivefiver_action: "init",
      canonical_command: "hivefiver init",
      recommended_skills: ["hivefiver-persona-routing", "hivefiver-bilingual-tutor"],
      validation_attempts: 0,
      max_validation_attempts: 10,
      evidence_confidence: "partial",
      menu_step: 1,
      menu_total: 4,
      acceptance_criteria: [
        "Persona lane selected",
        "Project type detected (greenfield/brownfield)",
        "Governance mode locked",
      ],
      related_entities: {
        session_id: sessionId,
        workflow_id: "hivefiver-vibecoder.yaml",
        requirement_node_id: "rq-bootstrap",
      },
      created_at: now,
    },
    {
      id: "hivefiver-spec-routing",
      text: "Build intake baseline and generate first executable specification",
      status: "pending",
      priority: "high",
      domain: "hybrid",
      lane: "auto",
      persona: "floppy_engineer",
      source: "init.seed",
      hivefiver_action: "spec",
      canonical_command: "hivefiver spec",
      recommended_skills: ["hivefiver-spec-distillation", "hivefiver-bilingual-tutor"],
      validation_attempts: 0,
      max_validation_attempts: 10,
      evidence_confidence: "partial",
      menu_step: 2,
      menu_total: 4,
      acceptance_criteria: [
        "MCQ intake completed",
        "Ambiguity map emitted",
        "Spec candidate selected",
      ],
      dependencies: ["hivefiver-bootstrap"],
      related_entities: {
        session_id: sessionId,
        workflow_id: "hivefiver-floppy-engineer.yaml",
        requirement_node_id: "rq-spec",
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
      persona: "enterprise_architect",
      source: "init.seed",
      hivefiver_action: "research",
      canonical_command: "hivefiver research",
      recommended_skills: ["hivefiver-mcp-research-loop", "hivefiver-skill-auditor"],
      validation_attempts: 0,
      max_validation_attempts: 10,
      evidence_confidence: "partial",
      menu_step: 3,
      menu_total: 4,
      acceptance_criteria: [
        "Context7, DeepWiki, Repomix status captured",
        "Tavily API guidance emitted",
        "Confidence downgrade policy configured",
      ],
      dependencies: ["hivefiver-spec-routing"],
      related_entities: {
        session_id: sessionId,
        workflow_id: "hivefiver-mcp-fallback.yaml",
        mcp_provider_id: "stack-core",
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
      persona: "enterprise_architect",
      source: "init.seed",
      hivefiver_action: "validate",
      canonical_command: "hivefiver validate",
      recommended_skills: ["hivefiver-ralph-tasking", "hivefiver-gsd-compat"],
      validation_attempts: 0,
      max_validation_attempts: 10,
      evidence_confidence: "partial",
      menu_step: 4,
      menu_total: 4,
      acceptance_criteria: [
        "tasks/prd.json schema validated",
        "Dependency map generated",
        "Related entity links preserved",
      ],
      dependencies: ["hivefiver-mcp-readiness"],
      related_entities: {
        session_id: sessionId,
        workflow_id: "hivefiver-enterprise-architect.yaml",
        export_id: "ralph-prd",
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
