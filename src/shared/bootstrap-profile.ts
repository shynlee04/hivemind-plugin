import {
  SupportedLanguage as SupportedLanguageValues,
  type SupportedLanguage,
} from '../schema-kernel/config-records.js'

type BootstrapSupportedLanguage = SupportedLanguage extends string
  ? SupportedLanguage
  : (typeof SupportedLanguageValues)[keyof typeof SupportedLanguageValues]

export interface BootstrapProfile {
  preferredUserName?: string
  chatLanguage: BootstrapSupportedLanguage
  artifactLanguage: BootstrapSupportedLanguage
  expertiseLevel: string
  governanceMode: string
  automationLevel: string
  outputStyle: string
}

const LANGUAGE_ALIASES: Record<string, string> = {
  en: 'en',
  eng: 'en',
  english: 'en',
  vi: 'vi',
  vn: 'vi',
  vietnamese: 'vi',
  vietnam: 'vi',
  // Chinese
  zh: 'zh',
  chinese: 'zh',
  '中文': 'zh',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  // Korean
  ko: 'ko',
  korean: 'ko',
  '한국어': 'ko',
  'ko-kr': 'ko',
  // Japanese
  ja: 'ja',
  japanese: 'ja',
  '日本語': 'ja',
  'ja-jp': 'ja',
}

const SUPPORTED_PROFILE_LANGUAGES = new Set<string>(Object.values(SupportedLanguageValues))

/**
 * Trims an optional string and collapses empty values to undefined.
 *
 * @param value - Raw user-provided string value.
 * @returns The trimmed string when non-empty; otherwise undefined.
 */
export function normalizeStringValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function isSupportedLanguage(value: unknown): value is BootstrapSupportedLanguage {
  return typeof value === 'string' && SUPPORTED_PROFILE_LANGUAGES.has(value)
}

export function normalizeProfileLanguage(
  value: string | undefined,
  fallback: unknown = 'en',
): BootstrapSupportedLanguage {
  const normalized = normalizeStringValue(value)?.toLowerCase()
  if (!normalized) {
    return isSupportedLanguage(fallback) ? fallback : 'en'
  }

  const resolved = LANGUAGE_ALIASES[normalized] ?? normalized
  if (isSupportedLanguage(resolved)) {
    return resolved
  }

  return isSupportedLanguage(fallback) ? fallback : 'en'
}

export function normalizePreferredUserName(value: string | undefined): string | undefined {
  return normalizeStringValue(value)
}

export function createBootstrapProfile(input: {
  preferredUserName?: string
  language?: string
  artifactLanguage?: string
  expertLevel?: string
  governanceMode?: string
  automationLevel?: string
  outputStyle?: string
}): BootstrapProfile {
  const chatLanguage = normalizeProfileLanguage(input.language, 'en')
  const artifactLanguage = normalizeProfileLanguage(input.artifactLanguage, chatLanguage)

  return {
    preferredUserName: normalizePreferredUserName(input.preferredUserName),
    chatLanguage,
    artifactLanguage,
    expertiseLevel: normalizeStringValue(input.expertLevel) ?? 'advanced',
    governanceMode: normalizeStringValue(input.governanceMode) ?? 'assisted',
    automationLevel: normalizeStringValue(input.automationLevel) ?? 'assisted',
    outputStyle: normalizeStringValue(input.outputStyle) ?? 'concise',
  }
}
