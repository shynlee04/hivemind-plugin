import type {
  DelegationCategory,
  DelegationRouteResolution,
  SpecialistAgent,
} from "./types.js"
import { VALID_DELEGATION_CATEGORIES } from "./types.js"

type CategoryConfig = {
  category: DelegationCategory
  agent: SpecialistAgent
  model?: string
  temperature?: number
  guidanceText?: string
}

const AGENT_TEMPERATURES: Record<SpecialistAgent, number> = {
  researcher: 0.1,
  builder: 0.15,
  critic: 0.05,
}

const CATEGORY_CONFIGS: Record<DelegationCategory, CategoryConfig> = {
  research: {
    category: "research",
    agent: "researcher",
    model: "openai/gpt-5.4",
    temperature: 0.1,
    guidanceText:
      "Favor evidence gathering, source triangulation, and crisp uncertainty handling. Avoid implementation changes unless the prompt explicitly asks for them.",
  },
  implementation: {
    category: "implementation",
    agent: "builder",
    model: "openai/gpt-5.4",
    temperature: 0.15,
    guidanceText:
      "Prefer the smallest safe code change, preserve existing harness layers, and keep behavior portable and OpenCode-native.",
  },
  review: {
    category: "review",
    agent: "critic",
    model: "openai/gpt-5.4",
    temperature: 0.05,
    guidanceText:
      "Act as a verifier. Look for correctness gaps, regressions, and contract mismatches before suggesting further changes.",
  },
  "visual-engineering": {
    category: "visual-engineering",
    agent: "builder",
    model: "openai/gpt-5.4",
    temperature: 0.25,
    guidanceText:
      "Optimize for interface polish, layout fidelity, and deliberate visual decisions while keeping the implementation practical.",
  },
}

export function getTemperatureForAgent(agentName: SpecialistAgent): number {
  return AGENT_TEMPERATURES[agentName]
}

export function isDelegationCategory(value: string): value is DelegationCategory {
  return VALID_DELEGATION_CATEGORIES.includes(value as DelegationCategory)
}

function clampTemperature(value: number): number {
  return Math.max(0, Math.min(1, value))
}

export function resolveDelegationRoute(args: {
  agent?: SpecialistAgent
  model?: string
  category?: DelegationCategory
}): DelegationRouteResolution {
  const requestedModel = args.model?.trim() || undefined
  const requestedCategory = args.category
  const requestedCategoryConfig = requestedCategory ? CATEGORY_CONFIGS[requestedCategory] : undefined
  const warnings: string[] = []
  const conflictingAgent =
    args.agent && requestedCategoryConfig && args.agent !== requestedCategoryConfig.agent
  const categoryConfig = conflictingAgent ? undefined : requestedCategoryConfig
  const effectiveAgent = args.agent ?? categoryConfig?.agent

  if (!effectiveAgent) {
    throw new Error(
      "[Harness] Delegation requires either an explicit agent or a supported category."
    )
  }

  if (conflictingAgent && requestedCategoryConfig && args.agent) {
    warnings.push(
      `[Harness] Category "${requestedCategoryConfig.category}" expects agent "${requestedCategoryConfig.agent}", but explicit agent "${args.agent}" was requested. Category-specific routing guidance was ignored.`
    )
  }

  return {
    requestedCategory,
    category: categoryConfig?.category,
    requestedAgent: args.agent,
    effectiveAgent,
    requestedModel,
    effectiveModel: requestedModel ?? categoryConfig?.model,
    temperature: clampTemperature(categoryConfig?.temperature ?? getTemperatureForAgent(effectiveAgent)),
    guidanceText: categoryConfig?.guidanceText,
    modelSource: requestedModel ? "explicit" : categoryConfig?.model ? "category" : "none",
    agentSource: args.agent ? "explicit" : "category",
    temperatureSource: categoryConfig?.temperature !== undefined ? "category" : "agent",
    warnings,
  }
}

export function listDelegationCategories(): CategoryConfig[] {
  return VALID_DELEGATION_CATEGORIES.map((category) => ({ ...CATEGORY_CONFIGS[category] }))
}
