/**
 * @module profile-resolver
 * @description SEI-04 — Resolves developer profile attributes from session
 * context hints such as message length, technical terms, and interaction patterns.
 *
 * Provides a lightweight profile match that helps agents adapt their
 * communication style and level of detail.
 */

/** Communication style preference */
export type CommunicationStyle = "concise" | "detailed" | "mixed"

/** Decision-making speed */
export type DecisionSpeed = "fast" | "deliberate"

/** Assessed expertise level */
export type Expertise = "junior" | "mid" | "senior"

/** Result of profile resolution */
export interface ProfileMatch {
  /** How verbose or terse the developer prefers communication */
  communicationStyle: CommunicationStyle
  /** How quickly the developer makes decisions */
  decisionSpeed: DecisionSpeed
  /** Assessed technical expertise level */
  expertise: Expertise
  /** Confidence in the profile match, 0–1 */
  matchConfidence: number
}

/** Thresholds for communication style classification */
const MESSAGE_LENGTH_THRESHOLDS = {
  concise: 50,
  mixed: 200,
} as const

/** Threshold for fast vs deliberate decision speed (seconds) */
const RESPONSE_TIME_THRESHOLD = 30

/** Thresholds for expertise classification by technical term count */
const EXPERTISE_THRESHOLDS = {
  mid: 3,
  senior: 6,
} as const

/**
 * Resolves a developer profile from session context hints.
 *
 * Context can include any of the following optional fields:
 * - `messageLength`: Length of the current message in characters
 * - `technicalTerms`: Array of technical terms detected in the message
 * - `averageResponseTime`: Average response time in seconds
 * - `totalInteractions`: Total number of interactions in the session
 *
 * @param context - Optional session context with profiling hints
 * @returns ProfileMatch with communication style, decision speed, expertise, and confidence
 *
 * @example
 * ```typescript
 * const profile = resolveProfile({
 *   messageLength: 500,
 *   technicalTerms: ["api", "sdk", "tdd", "cqrs"]
 * })
 * // { communicationStyle: "detailed", decisionSpeed: "fast",
 * //   expertise: "mid", matchConfidence: 0.6 }
 * ```
 */
export function resolveProfile(context?: Record<string, unknown>): ProfileMatch {
  const messageLength = typeof context?.messageLength === "number" ? context.messageLength : 100
  const technicalTerms = Array.isArray(context?.technicalTerms)
    ? (context.technicalTerms as string[])
    : []
  const averageResponseTime = typeof context?.averageResponseTime === "number"
    ? context.averageResponseTime
    : 30

  const communicationStyle = resolveCommunicationStyle(messageLength)
  const decisionSpeed = resolveDecisionSpeed(averageResponseTime)
  const expertise = resolveExpertise(technicalTerms)
  const matchConfidence = computeConfidence(messageLength, technicalTerms, context)

  return {
    communicationStyle,
    decisionSpeed,
    expertise,
    matchConfidence,
  }
}

/**
 * Determines communication style from message length.
 *
 * @param length - Message length in characters
 * @returns CommunicationStyle classification
 */
function resolveCommunicationStyle(length: number): CommunicationStyle {
  if (length <= MESSAGE_LENGTH_THRESHOLDS.concise) return "concise"
  if (length <= MESSAGE_LENGTH_THRESHOLDS.mixed) return "mixed"
  return "detailed"
}

/**
 * Determines decision speed from average response time.
 *
 * @param responseTime - Average response time in seconds
 * @returns DecisionSpeed classification
 */
function resolveDecisionSpeed(responseTime: number): DecisionSpeed {
  return responseTime <= RESPONSE_TIME_THRESHOLD ? "fast" : "deliberate"
}

/**
 * Determines expertise level from technical term count.
 *
 * @param terms - Array of detected technical terms
 * @returns Expertise classification
 */
function resolveExpertise(terms: string[]): Expertise {
  const count = terms.length
  if (count >= EXPERTISE_THRESHOLDS.senior) return "senior"
  if (count >= EXPERTISE_THRESHOLDS.mid) return "mid"
  return "junior"
}

/**
 * Computes overall confidence in the profile match based on
 * the amount of context data available.
 *
 * @param messageLength - Message length
 * @param technicalTerms - Technical terms found
 * @param context - Full context object
 * @returns Confidence score between 0 and 1
 */
function computeConfidence(
  messageLength: number,
  technicalTerms: string[],
  context?: Record<string, unknown>,
): number {
  let signals = 0

  if (messageLength !== 100) signals++ // Non-default message length
  if (technicalTerms.length > 0) signals++ // Has technical terms
  if (typeof context?.averageResponseTime === "number") signals++ // Has response time
  if (typeof context?.totalInteractions === "number") signals++ // Has interaction count

  // 4 possible signals → max confidence 0.9 (never fully confident without explicit profile)
  return Math.round((signals / 4) * 0.9 * 100) / 100
}
