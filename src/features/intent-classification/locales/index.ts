/**
 * Locale loader for intent-classification keyword maps (P27.2 T22/T2b).
 *
 * Loads the keyword map for a given locale. Unknown locales fall back
 * to English (`en`). All locale files are statically imported at init
 * time so there is no dynamic I/O at classification time.
 *
 * Per `src/AGENTS.md` "Module Size & File Layout": keep under 500 LOC.
 */

import type { Locale, LocaleKeywordMap } from "../vocabulary.js"
import { localeKeywords as en } from "./en.js"
import { localeKeywords as vi } from "./vi.js"
import { localeKeywords as zh } from "./zh.js"
import { localeKeywords as ja } from "./ja.js"
import { localeKeywords as ko } from "./ko.js"
import { localeKeywords as fr } from "./fr.js"
import { localeKeywords as de } from "./de.js"
import { localeKeywords as es } from "./es.js"
import { localeKeywords as th } from "./th.js"
import { localeKeywords as id } from "./id.js"

/**
 * Registry of all keyword maps, keyed by locale code.
 * Built at import time — no lazy loading.
 */
const LOCALE_REGISTRY: Record<string, LocaleKeywordMap> = {
  en,
  vi,
  zh,
  ja,
  ko,
  fr,
  de,
  es,
  th,
  id,
}

/**
 * Load the keyword map for a given locale.
 *
 * @param locale - Target locale code. Falls back to `"en"` if the
 *   locale is unknown or has no registered map.
 * @returns The keyword map for the locale (never undefined).
 */
export function loadLocaleKeywords(locale: Locale): LocaleKeywordMap {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return LOCALE_REGISTRY[locale] ?? LOCALE_REGISTRY.en
}
