/**
 * @module intake-gate
 * @description SEI-03 — Combines purpose classification, language detection,
 * and profile resolution into a single intake gate decision.
 *
 * The intake gate is the entry point for session routing: it analyzes
 * the user's input, detects language, resolves the developer profile,
 * and returns a complete routing decision.
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
}

/**
 * Resolves the full intake gate for a session entry.
 *
 * Combines purpose classification, language detection, and profile
 * resolution to produce a routing decision.
 *
 * @param input - The raw user input string
 * @param context - Optional session context for profile resolution
 * @returns IntakeResult with purpose, language, profile, and routing target
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
 * //   routingTarget: "gsd-executor"
 * // }
 * ```
 */
export function resolveIntake(
  input: string,
  context?: Record<string, unknown>,
): IntakeResult {
  const purpose = classifyPurpose(input)
  const language = detectLanguage(input)
  const profile = resolveProfile(context)
  const routingTarget = PURPOSE_TO_ROUTING_TARGET[purpose.purpose]

  return {
    purpose,
    language,
    profile,
    routingTarget,
  }
}
