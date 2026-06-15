/**
 * @module session-entry
 * @description Session entry intake pipeline — classifies user input,
 * detects language, resolves developer profile, and produces a routing decision.
 *
 * Public API:
 * - `resolveIntake()` — full intake gate resolution
 * - `classifyPurpose()` — purpose classification only
 * - `detectLanguage()` — language detection only
 * - `resolveProfile()` — profile resolution only
 */

export { classifyPurpose, PURPOSE_CLASSES } from "./purpose-classifier.js"
export type { PurposeClass, ClassificationResult } from "./purpose-classifier.js"

export { detectLanguage } from "./language-resolution.js"
export type { LanguageDetection, ScriptType } from "./language-resolution.js"

export { resolveProfile } from "./profile-resolver.js"
export type { ProfileMatch, CommunicationStyle, DecisionSpeed, Expertise } from "./profile-resolver.js"

export { resolveIntake, PURPOSE_TO_ROUTING_TARGET } from "./intake-gate.js"
export type { IntakeResult } from "./intake-gate.js"
