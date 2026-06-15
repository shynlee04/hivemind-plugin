/**
 * Intent-classification barrel export (P27.2 D-08, P27.2-LANG-SUPPLEMENT T2b).
 *
 * Public surface of the `src/features/intent-classification/`
 * module. Per `src/AGENTS.md` "Module Size & File Layout", barrel
 * files are allowed but must not re-export everything; this barrel
 * is hand-curated to expose the types and function that downstream
 * modules need.
 */

export { classifyIntent } from "./engine.js"
export type { ClassificationResult } from "./engine.js"
export {
  ALL_LOCALES,
  DEFAULT_CATEGORY,
  INTENT_CATEGORIES,
  INTENT_CATEGORY_DESCRIPTIONS,
  P27_1_PURPOSE_TO_CATEGORY_MAP,
} from "./vocabulary.js"
export type { IntentCategory, Locale } from "./vocabulary.js"
export { loadLocaleKeywords } from "./locales/index.js"
