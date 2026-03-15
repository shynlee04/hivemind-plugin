export interface BootstrapProfile {
  preferredUserName?: string
  chatLanguage: string
  artifactLanguage: string
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
}

function normalizeStringValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

export function normalizeProfileLanguage(value: string | undefined, fallback = 'en'): string {
  const normalized = normalizeStringValue(value)?.toLowerCase()
  if (!normalized) {
    return fallback
  }

  return LANGUAGE_ALIASES[normalized] ?? normalized
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
