import type { DelegationCategory, SpecialistAgent } from "./types.js"

// ---------------------------------------------------------------------------
// CategoryConfig — per-category model routing and tool assignment
// ---------------------------------------------------------------------------

export interface CategoryConfig {
  readonly model: string
  readonly fallbackChain: readonly string[]
  readonly temperature: number
  readonly maxTokens: number
  readonly toolProfile: SpecialistAgent
}

// ---------------------------------------------------------------------------
// CATEGORY_DEFAULTS — canonical config for each DelegationCategory.
// TypeScript enforces exhaustiveness: all four DelegationCategory values must
// be present. Add a new category to VALID_DELEGATION_CATEGORIES in types.ts
// and this object will fail to compile until a config is added here.
// ---------------------------------------------------------------------------

export const CATEGORY_DEFAULTS: Readonly<Record<DelegationCategory, CategoryConfig>> = {
  research: {
    model: "claude-sonnet-4-6",
    fallbackChain: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    temperature: 0.3,
    maxTokens: 16384,
    toolProfile: "researcher",
  },
  implementation: {
    model: "claude-sonnet-4-6",
    fallbackChain: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    temperature: 0.1,
    maxTokens: 16384,
    toolProfile: "builder",
  },
  review: {
    model: "claude-sonnet-4-6",
    fallbackChain: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    temperature: 0.2,
    maxTokens: 8192,
    toolProfile: "critic",
  },
  "visual-engineering": {
    model: "claude-sonnet-4-6",
    fallbackChain: ["claude-sonnet-4-6"],
    temperature: 0.1,
    maxTokens: 16384,
    toolProfile: "builder",
  },
  deep: {
    model: "claude-sonnet-4-6",
    fallbackChain: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    temperature: 0.3,
    maxTokens: 16384,
    toolProfile: "researcher",
  },
  quick: {
    model: "claude-sonnet-4-6",
    fallbackChain: ["claude-sonnet-4-6", "claude-haiku-4-5"],
    temperature: 0.1,
    maxTokens: 16384,
    toolProfile: "builder",
  },
}

// ---------------------------------------------------------------------------
// getCategoryConfig — look up config or throw a [Harness]-prefixed error
// ---------------------------------------------------------------------------

export function getCategoryConfig(category: string): CategoryConfig {
  const config = CATEGORY_DEFAULTS[category as DelegationCategory]
  if (config === undefined) {
    throw new Error(`[Harness] Unknown delegation category: "${category}"`)
  }
  return config
}

// ---------------------------------------------------------------------------
// resolveModel — resolve the effective model for a category dispatch
//
// Resolution order:
//   1. agentOverride — caller-specified model; returned as-is without filtering
//   2. availableModels filter — walk fallbackChain, return first match
//   3. category default — returned when no availableModels constraint given
//   4. throw — when availableModels is provided but none match the chain
// ---------------------------------------------------------------------------

export function resolveModel(
  category: DelegationCategory,
  agentOverride?: string,
  availableModels?: readonly string[],
): string {
  if (agentOverride !== undefined) {
    return agentOverride
  }

  const config = getCategoryConfig(category)

  if (availableModels === undefined) {
    return config.model
  }

  const resolved = config.fallbackChain.find((m) => availableModels.includes(m))
  if (resolved === undefined) {
    throw new Error(
      `[Harness] No available model for category "${category}". Tried: ${config.fallbackChain.join(", ")}`,
    )
  }

  return resolved
}

// ---------------------------------------------------------------------------
// getToolProfile — return the SpecialistAgent toolProfile for a category
// ---------------------------------------------------------------------------

export function getToolProfile(category: DelegationCategory): SpecialistAgent {
  return getCategoryConfig(category).toolProfile
}
