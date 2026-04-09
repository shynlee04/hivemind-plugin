import { getCategoryConfig, resolveModel } from "./categories.js"
import type { DelegationCategory, DelegationRouteResolution, SpecialistAgent } from "./types.js"
import { VALID_AGENTS, VALID_DELEGATION_CATEGORIES } from "./types.js"

type SpecialistPreset = {
  key: string
  agent: SpecialistAgent
  temperature: number
  guidanceText: string
  keywords: readonly string[]
}

type ResolveSpecialistRouteArgs = {
  description: string
  prompt: string
  category?: string
  agent?: string
  model?: string
  availableModels?: readonly string[]
}

const SPECIALIST_PRESETS: Readonly<Record<string, SpecialistPreset>> = {
  researcher: {
    key: "researcher",
    agent: "researcher",
    temperature: 0.1,
    guidanceText: "Focus on evidence gathering, synthesis, and clear source-backed findings.",
    keywords: ["research", "investigate", "analyze", "explore", "compare", "evidence", "synthesize"],
  },
  builder: {
    key: "builder",
    agent: "builder",
    temperature: 0.15,
    guidanceText: "Implement the requested change directly and keep the patch focused.",
    keywords: ["implement", "build", "fix", "refactor", "create", "write", "update", "ship"],
  },
  critic: {
    key: "critic",
    agent: "critic",
    temperature: 0.05,
    guidanceText: "Review for regressions, correctness, and unmet requirements before approving.",
    keywords: ["review", "critic", "audit", "verify", "regression", "compliance", "quality"],
  },
  general: {
    key: "general",
    agent: "general",
    temperature: 0.2,
    guidanceText: "Handle general-purpose tasks that don't fit specialist categories. Read, analyze, and report findings.",
    keywords: ["general", "task", "process", "handle", "cycle", "mapping", "analysis"],
  },
  "generalist-builder": {
    key: "generalist-builder",
    agent: "builder",
    temperature: 0.15,
    guidanceText: "Act as the broad fallback specialist when no stronger domain signal exists.",
    keywords: [],
  },
}

function isValidAgent(value: string): value is SpecialistAgent {
  return VALID_AGENTS.includes(value as SpecialistAgent)
}

function normalizeCategory(value: string | undefined): DelegationCategory | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }
  if (!VALID_DELEGATION_CATEGORIES.includes(normalized as DelegationCategory)) {
    throw new Error(
      `[Harness] Invalid category "${value}". Allowed categories: ${VALID_DELEGATION_CATEGORIES.join(", ")}.`,
    )
  }
  return normalized as DelegationCategory
}

function normalizeAgent(value: string | undefined): SpecialistAgent | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }
  if (!isValidAgent(normalized)) {
    throw new Error(
      `[Harness] Invalid target agent "${value}". Allowed agents: ${VALID_AGENTS.join(", ")}.`,
    )
  }
  return normalized
}

function scorePreset(signal: string, preset: SpecialistPreset): number {
  return preset.keywords.reduce((score, keyword) => {
    return signal.includes(keyword) ? score + 1 : score
  }, 0)
}

function getPresetForAgent(agent: SpecialistAgent): SpecialistPreset {
  return SPECIALIST_PRESETS[agent]
}

function resolvePresetFromSignal(signal: string): { preset: SpecialistPreset; fallbackUsed: boolean; rationale: string } {
  const ranked = [SPECIALIST_PRESETS.researcher, SPECIALIST_PRESETS.critic, SPECIALIST_PRESETS.builder]
    .map((preset) => ({ preset, score: scorePreset(signal, preset) }))
    .sort((left, right) => right.score - left.score)

  const strongest = ranked[0]
  const second = ranked[1]
  const strongEnough = strongest.score >= 2 && strongest.score > second.score

  if (strongEnough) {
    return {
      preset: strongest.preset,
      fallbackUsed: false,
      rationale: `Selected ${strongest.preset.key} from task wording keyword match score ${strongest.score}.`,
    }
  }

  return {
    preset: SPECIALIST_PRESETS["generalist-builder"],
    fallbackUsed: true,
    rationale: "Used the explicit generalist fallback because the task wording did not strongly match a specialist preset.",
  }
}

export function resolveSpecialistRoute(args: ResolveSpecialistRouteArgs): DelegationRouteResolution {
  const requestedAgent = normalizeAgent(args.agent)
  const category = normalizeCategory(args.category)
  const signal = `${args.description} ${args.prompt}`.toLowerCase()

  let preset = SPECIALIST_PRESETS["generalist-builder"]
  let fallbackUsed = true
  let rationale = "Used the explicit generalist fallback because no category or strong specialist signal was provided."
  let agentSource: DelegationRouteResolution["agentSource"] = "category"

  if (requestedAgent) {
    preset = getPresetForAgent(requestedAgent)
    fallbackUsed = false
    rationale = `Used the explicitly requested ${requestedAgent} specialist preset.`
    agentSource = "explicit"
  } else if (category) {
    const categoryConfig = getCategoryConfig(category)
    preset = getPresetForAgent(categoryConfig.toolProfile)
    fallbackUsed = false
    rationale = `Used the ${preset.key} preset from the ${category} category configuration.`
  } else {
    const resolved = resolvePresetFromSignal(signal)
    preset = resolved.preset
    fallbackUsed = resolved.fallbackUsed
    rationale = resolved.rationale
  }

  const categoryConfig = category ? getCategoryConfig(category) : undefined
  const effectiveModel = category ? resolveModel(category, args.model, args.availableModels) : args.model

  return {
    requestedCategory: category,
    category,
    requestedAgent,
    effectiveAgent: preset.agent,
    presetKey: preset.key,
    requestedModel: args.model,
    effectiveModel,
    temperature: requestedAgent ? preset.temperature : (categoryConfig?.temperature ?? preset.temperature),
    fallbackUsed,
    rationale,
    guidanceText: preset.guidanceText,
    modelSource: args.model ? "explicit" : category ? "category" : "none",
    agentSource,
    temperatureSource: requestedAgent || !category ? "agent" : "category",
    warnings: fallbackUsed ? ["Specialist routing used the generalist fallback."] : [],
  }
}
