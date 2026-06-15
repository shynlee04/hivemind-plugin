/**
 * @module intake-gate
 * @description SEI-03 — Combines purpose classification, language detection,
 * profile resolution, and primitive-registry validation into a single
 * intake gate decision.
 *
 * The intake gate is the entry point for session routing: it analyzes
 * the user's input, detects language, resolves the developer profile,
 * validates the routing target against the primitive registry, and
 * returns a complete routing decision with optional warnings.
 */

import { existsSync } from "node:fs"
import { join } from "node:path"
import type { ClassificationResult, PurposeClass } from "./purpose-classifier.js"
import { classifyPurpose } from "./purpose-classifier.js"
import type { LanguageDetection } from "./language-resolution.js"
import { detectLanguage } from "./language-resolution.js"
import type { ProfileMatch } from "./profile-resolver.js"
import { resolveProfile } from "./profile-resolver.js"

/**
 * Maps each purpose class to the L0 orchestrator for dynamic, state-aware dispatch.
 * Decoupled from specific specialist agents to allow trajectory-based routing.
 */
export const PURPOSE_TO_ROUTING_TARGET: Record<PurposeClass, string> = {
  discovery: "hm-l0-orchestrator",
  brainstorming: "hm-l0-orchestrator",
  research: "hm-l0-orchestrator",
  planning: "hm-l0-orchestrator",
  implementation: "hm-l0-orchestrator",
  gatekeeping: "hm-l0-orchestrator",
  tdd: "hm-l0-orchestrator",
  "course-correction": "hm-l0-orchestrator",
}

/** Complete result of the intake gate resolution */
export interface IntakeResult {
  /** Purpose classification result */
  purpose: ClassificationResult
  /** Language detection result */
  language: LanguageDetection
  /** Profile match result */
  profile: ProfileMatch
  /** Target agent name for routing (now defaults to L0 orchestrator) */
  routingTarget: string
  /** Warnings from registry validation (empty when target is verified) */
  warnings: string[]
  /** Trajectory warnings (e.g., missing prerequisite artifacts) */
  trajectoryWarnings: string[]
  /** Just-in-time recommendations for skills/commands based on project state */
  jitRecommendations: string[]
}

/**
 * Resolves trajectory context by scanning .hivemind/ or .planning/ for prerequisite artifacts.
 *
 * @param projectRoot - Optional absolute path to the project root directory.
 * @returns Object containing trajectory warnings and JIT recommendations.
 */
function resolveTrajectoryContext(projectRoot?: string): { trajectoryWarnings: string[]; jitRecommendations: string[] } {
  const trajectoryWarnings: string[] = []
  const jitRecommendations: string[] = []

  if (!projectRoot) {
    return { trajectoryWarnings, jitRecommendations }
  }

  const planningDir = join(projectRoot, ".planning")
  const hivemindDir = join(projectRoot, ".hivemind", "planning")

  // Check for basic project initialization artifacts
  const hasRoadmap = existsSync(join(planningDir, "ROADMAP.md")) || existsSync(join(hivemindDir, "ROADMAP.md"))
  const hasCodebase = existsSync(join(planningDir, "codebase", "ARCHITECTURE.md")) || existsSync(join(hivemindDir, "codebase", "ARCHITECTURE.md"))

  if (!hasRoadmap) {
    trajectoryWarnings.push("Project roadmap (ROADMAP.md) not found.")
    jitRecommendations.push("Consider running `/hm-new-project` or `/hm-roadmap` to establish project scope before proceeding.")
  }

  if (!hasCodebase) {
    trajectoryWarnings.push("Codebase mapping (ARCHITECTURE.md) not found.")
    jitRecommendations.push("Consider running `/hm-map-codebase` to understand existing patterns before planning or implementation.")
  }

  return { trajectoryWarnings, jitRecommendations }
}

/**
 * Registry validator function type. Accepts a registry snapshot provider
 * and returns whether the target primitive exists.
 */
export type RegistryValidator = (target: string) => { exists: boolean; error?: string }

/**
 * Creates a registry validator from a primitive map.
 * The validator checks whether an agent primitive exists by name.
 *
 * @param primitives - Map of primitive entries keyed as "type:name"
 * @returns A validator function that checks target existence
 *
 * @example
 * ```typescript
 * const validator = createRegistryValidator(snapshot.primitives)
 * const check = validator("gsd-executor")
 * check.exists // true when agent:gsd-executor is in the snapshot
 * ```
 */
export function createRegistryValidator(
  primitives: Map<string, unknown>,
): RegistryValidator {
  return (target: string): { exists: boolean; error?: string } => {
    try {
      // Check for agent:<target> key in the registry
      return { exists: primitives.has(`agent:${target}`) }
    } catch (error) {
      return { exists: false, error: error instanceof Error ? error.message : String(error) }
    }
  }
}

/**
 * Resolves the full intake gate for a session entry.
 *
 * Combines purpose classification, language detection, profile
 * resolution, trajectory context analysis, and optional registry
 * validation to produce a state-aware routing decision. When a
 * registry validator is provided, the routing target is checked
 * against known primitives and a warning is added if not found.
 *
 * @param input - The raw user input string
 * @param context - Optional session context for profile resolution
 * @param registryValidator - Optional validator to check routing target existence
 * @param projectRoot - Optional absolute path to the project root for trajectory analysis
 * @returns IntakeResult with purpose, language, profile, routing target, warnings, and trajectory context
 *
 * @example
 * ```typescript
 * const result = resolveIntake("implement the caching layer", {
 *   messageLength: 35,
 *   technicalTerms: ["caching", "layer"],
 * }, undefined, "/path/to/project")
 * // {
 * //   purpose: { purpose: "implementation", confidence: 0.85, alternatives: [] },
 * //   language: { language: "en", script: "latin", confidence: 1 },
 * //   profile: { communicationStyle: "concise", decisionSpeed: "fast", expertise: "mid", matchConfidence: 0.45 },
 * //   routingTarget: "hm-l0-orchestrator",
 * //   warnings: [],
 * //   trajectoryWarnings: ["Codebase mapping (ARCHITECTURE.md) not found."],
 * //   jitRecommendations: ["Consider running `/hm-map-codebase`..."]
 * // }
 * ```
 */
export function resolveIntake(
  input: string,
  context?: Record<string, unknown>,
  registryValidator?: RegistryValidator,
  projectRoot?: string,
): IntakeResult {
  const purpose = classifyPurpose(input)
  const language = detectLanguage(input)
  const profile = resolveProfile(context)
  const routingTarget = PURPOSE_TO_ROUTING_TARGET[purpose.purpose]
  const warnings: string[] = []
  const { trajectoryWarnings, jitRecommendations } = resolveTrajectoryContext(projectRoot)

  if (registryValidator) {
    try {
      const check = registryValidator(routingTarget)
      if (!check.exists) {
        warnings.push(
          `Routing target "${routingTarget}" not found in primitive registry` +
          (check.error ? `: ${check.error}` : ""),
        )
      }
    } catch (error) {
      warnings.push(
        `Registry validation failed for "${routingTarget}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    }
  }

  return {
    purpose,
    language,
    profile,
    routingTarget,
    warnings,
    trajectoryWarnings,
    jitRecommendations,
  }
}
