/**
 * Intent-classification vocabulary (P27.2 D-04, P27.2-LANG-SUPPLEMENT T2b).
 *
 * Defines the 4 coarse-grained user-facing intent categories that
 * `classifyIntent` (engine.ts) returns. Distinct from P27.1's 8
 * fine-grained `purpose` enum — the new taxonomy is coarser for
 * C1.3 user confirmation and has a 1:1..N mapping back to P27.1's
 * purposes via `P27_1_PURPOSE_TO_CATEGORY_MAP`.
 *
 * Per P27.2-LANG-SUPPLEMENT T2b / T22: keyword maps are locale-keyed
 * via a `Locale` type and per-locale modules in `locales/{lang}.ts`.
 *
 * Per `src/AGENTS.md` "JSDoc Style": exported types and constants
 * have JSDoc blocks.
 */

import type { IntentPurpose } from "../../schema-kernel/intent-lock.schema.js"

/**
 * Supported locales (P27.2-LANG-SUPPLEMENT T22). The 10 languages
 * matching `.hivemind/configs.json` conversation_language support.
 *
 * Extending this list: add the code here, create `locales/{code}.ts`,
 * and add keyword entries to the locale file.
 */
export type Locale =
  | "en"
  | "vi"
  | "zh"
  | "ja"
  | "ko"
  | "fr"
  | "de"
  | "es"
  | "th"
  | "id"

/**
 * All supported locale codes. Iterable form of {@link Locale}.
 */
export const ALL_LOCALES: Locale[] = [
  "en",
  "vi",
  "zh",
  "ja",
  "ko",
  "fr",
  "de",
  "es",
  "th",
  "id",
] as const

/**
 * A per-locale keyword entry: `[label, regex]` tuple.
 * The label is a human-readable key (e.g., "implement"); the regex
 * is the matcher for the locale's keywords.
 */
export type LocaleKeywordEntry = readonly [label: string, regex: RegExp]

/**
 * Per-locale keyword map shape. Each exported file assigns this type.
 */
export type LocaleKeywordMap = Record<IntentCategory, LocaleKeywordEntry[]>

/**
 * The 4 user-facing intent categories (P27.2-SPEC REQ-1, D-04).
 *
 * - `CODE_TOUCH` — user wants to write/edit code (default for
 *   "implement X", "fix bug Y").
 * - `RESEARCH` — user wants to investigate without making changes
 *   ("how does X work", "explain Y").
 * - `INVESTIGATION` — user wants to diagnose ("why is X broken",
 *   "find root cause of Y").
 * - `EXPLORATION` — user wants to brainstorm ("what if we tried X",
 *   "design ideas for Y").
 */
export type IntentCategory =
  | "CODE_TOUCH"
  | "RESEARCH"
  | "INVESTIGATION"
  | "EXPLORATION"

/**
 * Tuple of the 4 categories. Use this to iterate (e.g., in
 * schema-kernel Zod enums) without redefining the literal.
 */
export const INTENT_CATEGORIES = [
  "CODE_TOUCH",
  "RESEARCH",
  "INVESTIGATION",
  "EXPLORATION",
] as const satisfies ReadonlyArray<IntentCategory>

/**
 * Human-readable description for each category. Surfaced in the C1.3
 * confirmation prompt so the user can decide whether the
 * classification matches their intent (REQ-4).
 */
export const INTENT_CATEGORY_DESCRIPTIONS: Record<IntentCategory, string> = {
  CODE_TOUCH: "Code change (write/edit files)",
  RESEARCH: "Research only (read/explain, no changes)",
  INVESTIGATION: "Diagnose a problem (find root cause)",
  EXPLORATION: "Brainstorm / design ideas",
}

/**
 * Default category when no keywords match.
 *
 * `CODE_TOUCH` is chosen so the gate's conservative posture applies
 * (the user is treated as wanting to modify code, which the gate
 * checks more strictly). REQ-1 acceptance covers 8 sample prompts;
 * non-matching prompts fall back to this default.
 */
export const DEFAULT_CATEGORY: IntentCategory = "CODE_TOUCH"

/**
 * Mapping from P27.1's 8 fine-grained `IntentPurpose` values to the
 * new 4 coarse-grained `IntentCategory`. Used by downstream P27.1
 * callers that want to translate a P27.1 purpose into the new
 * taxonomy without re-classifying.
 *
 * Source: P27.2-CONTEXT.md D-04.
 */
export const P27_1_PURPOSE_TO_CATEGORY_MAP: Record<IntentPurpose, IntentCategory> = {
  research: "RESEARCH",
  brainstorming: "EXPLORATION",
  discovery: "RESEARCH",
  planning: "EXPLORATION",
  implementation: "CODE_TOUCH",
  tdd: "CODE_TOUCH",
  gatekeeping: "INVESTIGATION",
  "course-correction": "CODE_TOUCH",
}
