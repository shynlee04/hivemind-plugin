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

import type { ClassificationResult, PurposeClass } from "./purpose-classifier.js"
import { classifyPurpose } from "./purpose-classifier.js"
import type { LanguageDetection } from "./language-resolution.js"
import { detectLanguage } from "./language-resolution.js"
import type { ProfileMatch } from "./profile-resolver.js"
import { resolveProfile } from "./profile-resolver.js"

/**
 * Maps each purpose class to the agent that should handle it.
 * This is the routing table for session intake.
 */
export const PURPOSE_TO_ROUTING_TARGET: Record<PurposeClass, string> = {
  discovery: "hm-l2-scout",
  brainstorming: "hm-l2-brainstorm",
  research: "hm-l3-research-chain",
  planning: "gsd-planner",
  implementation: "gsd-executor",
  gatekeeping: "hm-l2-critic",
  tdd: "hm-l2-test-driven-execution",
  "course-correction": "gsd-debugger",
}

/** Complete result of the intake gate resolution */
export interface IntakeResult {
  /** Purpose classification result */
  purpose: ClassificationResult
  /** Language detection result */
  language: LanguageDetection
  /** Profile match result */
  profile: ProfileMatch
  /** Target agent name for routing */
  routingTarget: string
  /** Warnings from registry validation (empty when target is verified) */
  warnings: string[]
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
 * resolution, and optional registry validation to produce a routing
 * decision. When a registry validator is provided, the routing target
 * is checked against known primitives and a warning is added if the
 * target is not found — routing proceeds regardless.
 *
 * @param input - The raw user input string
 * @param context - Optional session context for profile resolution
 * @param registryValidator - Optional validator to check routing target existence
 * @returns IntakeResult with purpose, language, profile, routing target, and warnings
 *
 * @example
 * ```typescript
 * const result = resolveIntake("implement the caching layer", {
 *   messageLength: 35,
 *   technicalTerms: ["caching", "layer"],
 * })
 * // {
 * //   purpose: { purpose: "implementation", confidence: 0.85, alternatives: [] },
 * //   language: { language: "en", script: "latin", confidence: 1 },
 * //   profile: { communicationStyle: "concise", decisionSpeed: "fast",
 * //             expertise: "mid", matchConfidence: 0.45 },
 * //   routingTarget: "gsd-executor",
 * //   warnings: []
 * // }
 * ```
 */
export function resolveIntake(
  input: string,
  context?: Record<string, unknown>,
  registryValidator?: RegistryValidator,
): IntakeResult {
  const purpose = classifyPurpose(input)
  const language = detectLanguage(input)
  const profile = resolveProfile(context)
  const routingTarget = PURPOSE_TO_ROUTING_TARGET[purpose.purpose]
  const warnings: string[] = []

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
  }
}
