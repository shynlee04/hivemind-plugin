import {
  normalizeProfileLanguage,
  normalizePreferredUserName as normalizeStringValue,
} from '../../shared/bootstrap-profile.js'
import type { RuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import type { CommandExecutionInput } from '../../commands/slash-command/command-types.js'

export { normalizeStringValue }

export type DisplayLanguage = 'en' | 'vi' | 'zh' | 'ko' | 'ja'

function toDisplayLanguage(value: string | undefined): DisplayLanguage | undefined {
  const normalized = normalizeStringValue(value)
  if (!normalized) {
    return undefined
  }

  const profileLanguage = normalizeProfileLanguage(normalized, 'en')

  switch (profileLanguage) {
    case 'en':
    case 'vi':
    case 'zh':
    case 'ko':
    case 'ja':
      return profileLanguage
    default:
      return undefined
  }
}

/**
 * Detects if a message appears to be Vietnamese based on character patterns.
 * Uses Unicode character ranges for Vietnamese diacritics and common words.
 * @param message - The message to analyze
 * @returns true if the message appears to be Vietnamese
 * @example
 * isVietnameseMessage('cho tôi biết cách sử dụng') // true
 * isVietnameseMessage('how do I use this') // false
 */
export function isVietnameseMessage(message: string | undefined): boolean {
  if (!message) {
    return false
  }

  return /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(message)
    || /\b(hay|cho|biet|toi|lam gi|giup)\b/i.test(message)
}

/**
 * Detects whether a message contains Chinese characters from the CJK Unified Ideographs block.
 * @param message - The message to analyze
 * @returns True when the message includes characters in the U+4E00–U+9FFF range
 */
export function isChineseMessage(message: string | undefined): boolean {
  const trimmed = normalizeStringValue(message)
  if (!trimmed) {
    return false
  }

  return /[\u4E00-\u9FFF]/.test(trimmed)
}

/**
 * Detects whether a message contains Korean Hangul syllables.
 * @param message - The message to analyze
 * @returns True when the message includes characters in the U+AC00–U+D7AF range
 */
export function isKoreanMessage(message: string | undefined): boolean {
  const trimmed = normalizeStringValue(message)
  if (!trimmed) {
    return false
  }

  return /[\uAC00-\uD7AF]/.test(trimmed)
}

/**
 * Detects whether a message contains Japanese kana characters.
 * @param message - The message to analyze
 * @returns True when the message includes Hiragana (U+3040–U+309F) or Katakana (U+30A0–U+30FF)
 */
export function isJapaneseMessage(message: string | undefined): boolean {
  const trimmed = normalizeStringValue(message)
  if (!trimmed) {
    return false
  }

  return /[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)
}

/**
 * Resolves the display language for questionnaire rendering.
 * Supports the following display languages: en, vi, zh, ko, ja.
 * Priority: explicit CLI flag > detected Vietnamese > detected Japanese >
 * detected Korean > detected Chinese > runtime snapshot > fallback 'en'.
 * @param userMessage - The user's input message for language detection
 * @param snapshot - Runtime bindings snapshot for fallback language
 * @param input - Full command execution input with explicit language flag
 * @returns Resolved display language code
 * @example
 * const lang = resolveDisplayLanguage('xin chào', undefined, { language: 'vi' }) // 'vi'
 */
export function resolveDisplayLanguage(
  userMessage: string | undefined,
  snapshot: RuntimeBindingsSnapshot | undefined,
  input: CommandExecutionInput,
): DisplayLanguage {
  const explicitLanguage = toDisplayLanguage(input.language)
  if (explicitLanguage) {
    return explicitLanguage
  }

  if (isVietnameseMessage(userMessage)) {
    return 'vi'
  }

  if (isJapaneseMessage(userMessage)) {
    return 'ja'
  }

  if (isKoreanMessage(userMessage)) {
    return 'ko'
  }

  if (isChineseMessage(userMessage)) {
    return 'zh'
  }

  return toDisplayLanguage(snapshot?.language) ?? 'en'
}
