/**
 * i18n barrel — translation loader
 */

import { en } from "./en.js"
import { vi } from "./vi.js"

export type I18nStrings = typeof en
export type SupportedLanguage = "en" | "vi"

const translations: Record<SupportedLanguage, I18nStrings> = {
  en,
  vi,
}

export function getTranslations(lang: SupportedLanguage = "en"): I18nStrings {
  return translations[lang] ?? translations.en
}

export { en, vi }
