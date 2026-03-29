import { SupportedLanguage } from '../../../schema-kernel/config-records.js'

export interface LanguageOptionCopy {
  label: string
  nativeLabel: string
}

export interface LanguageFieldCopy {
  label: string
  description: string
}

export interface LanguageSelectorCopy {
  title: string
  description: string
  localizedMessage: string
  fields: Record<'communication_language' | 'document_language', LanguageFieldCopy>
  options: Record<string, LanguageOptionCopy>
}

const ENGLISH_COPY: LanguageSelectorCopy = {
  title: 'Language settings',
  description: 'Choose how Hivefiver communicates with you and writes documents.',
  localizedMessage: 'Review or update Hivefiver language preferences.',
  fields: {
    communication_language: {
      label: 'Communication language',
      description: 'Controls the language Hivefiver uses when chatting with you.',
    },
    document_language: {
      label: 'Document language',
      description: 'Controls the default language for generated plans and artifacts.',
    },
  },
  options: {
    en: { label: 'English', nativeLabel: 'English' },
    vi: { label: 'Vietnamese', nativeLabel: 'Tiếng Việt' },
    zh: { label: 'Chinese', nativeLabel: '中文' },
    ko: { label: 'Korean', nativeLabel: '한국어' },
    ja: { label: 'Japanese', nativeLabel: '日本語' },
  },
}

const VIETNAMESE_COPY: LanguageSelectorCopy = {
  title: 'Cài đặt ngôn ngữ',
  description: 'Chọn cách Hivefiver giao tiếp với bạn và soạn tài liệu.',
  localizedMessage: 'Xem lại hoặc cập nhật tuỳ chọn ngôn ngữ của Hivefiver.',
  fields: {
    communication_language: {
      label: 'Ngôn ngữ giao tiếp',
      description: 'Quy định ngôn ngữ Hivefiver dùng khi trò chuyện với bạn.',
    },
    document_language: {
      label: 'Ngôn ngữ tài liệu',
      description: 'Quy định ngôn ngữ mặc định cho kế hoạch và tạo phẩm được sinh ra.',
    },
  },
  options: {
    en: { label: 'Tiếng Anh', nativeLabel: 'English' },
    vi: { label: 'Tiếng Việt', nativeLabel: 'Tiếng Việt' },
    zh: { label: 'Tiếng Trung', nativeLabel: '中文' },
    ko: { label: 'Tiếng Hàn', nativeLabel: '한국어' },
    ja: { label: 'Tiếng Nhật', nativeLabel: '日本語' },
  },
}

const LANGUAGE_SELECTOR_COPY_BY_LOCALE: Record<string, LanguageSelectorCopy> = {
  en: ENGLISH_COPY,
  vi: VIETNAMESE_COPY,
}

export const SUPPORTED_LANGUAGE_VALUES = Object.values(SupportedLanguage)

export function resolveLanguageSelectorCopy(locale?: string): {
  locale: string
  copy: LanguageSelectorCopy
} {
  const normalizedLocale = locale?.trim().toLowerCase()
  const baseLocale = normalizedLocale?.split(/[-_]/)[0] ?? 'en'
  const resolvedLocale = LANGUAGE_SELECTOR_COPY_BY_LOCALE[baseLocale] ? baseLocale : 'en'

  return {
    locale: resolvedLocale,
    copy: LANGUAGE_SELECTOR_COPY_BY_LOCALE[resolvedLocale] ?? ENGLISH_COPY,
  }
}
