/**
 * `classifyIntent` — pure keyword/regex 4-category classifier
 * (P27.2-SPEC REQ-1, D-04, D-16, P27.2-LANG-SUPPLEMENT T2b).
 *
 * Per D-16, the engine is **pure**:
 * - No I/O.
 * - No LLM call.
 * - No new npm dependencies.
 *
 * Locale support (P27.2-LANG-SUPPLEMENT T2b):
 * - `classifyIntent(prompt, locale)` uses the locale-specific keyword
 *   map from `locales/{locale}.ts`.
 * - For mixed-language detection, runs MAX confidence across locales
 *   when no single locale produces a confident match (Pitfall 5).
 * - Input is NFC-normalized for diacritic-insensitive matching
 *   (Pitfall 1).
 *
 * Per `src/AGENTS.md` "JSDoc Style": exported functions MUST have a
 * JSDoc block. Per "Naming Conventions": functions use camelCase.
 */

import { loadLocaleKeywords } from "./locales/index.js"
import {
  DEFAULT_CATEGORY,
  INTENT_CATEGORIES,
  type IntentCategory,
  type Locale,
} from "./vocabulary.js"

/**
 * Public return shape of `classifyIntent`. Mirrors the locked
 * signature from P27.2-SPEC REQ-1 + CONTEXT D-04.
 */
export type ClassificationResult = {
  /** The dominant intent category for the prompt. */
  type: IntentCategory
  /**
   * Confidence in the classification, in `[0, 1]`. Computed as
   * `min(1, 0.6 + 0.1 * distinctMatches)`. Returns `0.3` when no
   * category matches (the default-category fallback).
   */
  confidence: number
  /**
   * The matched keyword labels that drove the classification.
   * Each entry is a lowercase string from the keyword map. Useful
   * for C1.3 confirmation: "Classified intent: CODE_TOUCH (evidence:
   * implement, fix)".
   */
  evidence: string[]
  /** The locale that produced this classification. */
  locale: Locale
}

/**
 * Score a prompt against a keyword map for a single locale.
 *
 * @returns The best category, match count, and evidence labels for
 *   this locale, or `null` if no category matched.
 */
function scoreLocale(
  normalizedPrompt: string,
  keywords: ReadonlyArray<readonly [IntentCategory, ReadonlyArray<readonly [string, RegExp]>]>,
): { category: IntentCategory; matches: number; evidence: string[] } | null {
  const scores = new Map<IntentCategory, { matches: number; evidence: string[] }>()

  for (const [category, entries] of keywords) {
    for (const [label, regex] of entries) {
      if (regex.test(normalizedPrompt)) {
        const current = scores.get(category) ?? { matches: 0, evidence: [] }
        if (!current.evidence.includes(label)) {
          current.evidence.push(label)
          current.matches += 1
        }
        scores.set(category, current)
      }
    }
  }

  let best: IntentCategory | null = null
  let bestMatches = -1
  for (const category of INTENT_CATEGORIES) {
    const score = scores.get(category)
    if (score && score.matches > bestMatches) {
      best = category
      bestMatches = score.matches
    }
  }

  if (best === null || bestMatches <= 0) return null
  return { category: best, matches: bestMatches, evidence: scores.get(best)?.evidence ?? [] }
}

/**
 * Compute confidence from a distinct-match count.
 *
 * Formula: `min(1, 0.6 + 0.1 * matches)`. Yields:
 * - 0 matches → 0.6 (floor — used internally; the no-match fallback
 *   returns 0.3 to make the "I don't know" case obvious).
 * - 1 match → 0.7
 * - 2 matches → 0.8
 * - 3+ matches → 0.9..1.0
 *
 * REQ-1 acceptance requires `confidence >= 0.6` for the 8 sample
 * prompts; this formula satisfies that bound for any single match.
 */
function confidenceFromMatches(matches: number): number {
  if (matches <= 0) return 0.3
  return Math.min(1, 0.6 + 0.1 * matches)
}

/**
 * Convert a locale keyword map to the internal scoring format.
 */
function toScoringTuples(
  map: Record<IntentCategory, ReadonlyArray<readonly [string, RegExp]>>,
): ReadonlyArray<readonly [IntentCategory, ReadonlyArray<readonly [string, RegExp]>]> {
  return INTENT_CATEGORIES.map((cat) => [cat, map[cat]] as const)
}

/**
 * Classify a user prompt into one of 4 intent categories.
 *
 * @param userPrompt - The raw user prompt text. May contain any
 *   casing, punctuation, or whitespace. NFC-normalized internally.
 * @param locale - Optional locale code for the keyword map to use.
 *   Defaults to `"en"`. When the primary locale produces a low-confidence
 *   result (< 0.6), the classifier runs a MAX-confidence scan across
 *   all registered locales (P27.2-LANG-SUPPLEMENT Pitfall 5).
 * @returns A `ClassificationResult` with `type` (one of the 4
 *   categories), `confidence` in `[0, 1]`, and `evidence` (matched
 *   keyword labels), and the `locale` that produced the result.
 *
 * @example
 * ```ts
 * const r = classifyIntent("implement the new feature");
 * // r.type === "CODE_TOUCH"
 * // r.confidence >= 0.6
 * // r.evidence contains "implement"
 * ```
 */
export function classifyIntent(
  userPrompt: string,
  locale: Locale = "en",
): ClassificationResult {
  // Defensive: empty / whitespace-only prompts fall back to the
  // default category with low confidence.
  if (typeof userPrompt !== "string" || userPrompt.trim().length === 0) {
    return { type: DEFAULT_CATEGORY, confidence: 0.3, evidence: [], locale }
  }

  // NFC-normalize for diacritic-insensitive matching (Pitfall 1).
  const normalized = userPrompt.normalize("NFC")

  // Score using the primary locale's keyword map.
  const primaryMap = loadLocaleKeywords(locale)
  const primaryScore = scoreLocale(normalized, toScoringTuples(primaryMap))

  // If the primary locale produced a confident result, return it.
  if (primaryScore && primaryScore.matches >= 1) {
    return {
      type: primaryScore.category,
      confidence: confidenceFromMatches(primaryScore.matches),
      evidence: primaryScore.evidence,
      locale,
    }
  }

  // Mixed-language fallback (Pitfall 5): run MAX confidence across
  // all locales when the primary locale produces weak or no matches.
  // Only considers locales with >= 1 match to filter out noise.
  let bestLocale = locale
  let bestScore: { category: IntentCategory; matches: number; evidence: string[] } | null = primaryScore

  for (const alt of ["en", "vi", "zh", "ja", "ko", "fr", "de", "es", "th", "id"] as Locale[]) {
    if (alt === locale) continue // Already scored above as primary.
    const altMap = loadLocaleKeywords(alt)
    const altScore = scoreLocale(normalized, toScoringTuples(altMap))
    if (altScore && (!bestScore || altScore.matches > bestScore.matches)) {
      bestScore = altScore
      bestLocale = alt
    }
  }

  if (!bestScore) {
    return { type: DEFAULT_CATEGORY, confidence: 0.3, evidence: [], locale }
  }

  return {
    type: bestScore.category,
    confidence: confidenceFromMatches(bestScore.matches),
    evidence: bestScore.evidence,
    locale: bestLocale,
  }
}
