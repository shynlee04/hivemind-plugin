import { normalizeProfileLanguage } from '../../shared/bootstrap-profile.js'
import type { RuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import type { CommandExecutionInput } from '../../commands/slash-command/command-types.js'

/**
 * Normalizes a string value, returning undefined for empty/whitespace-only strings.
 * @param value - The value to normalize
 * @returns The trimmed value if non-empty, otherwise undefined
 */
export function normalizeStringValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
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
 * Resolves the display language for questionnaire rendering.
 * Priority: explicit CLI flag > detected Vietnamese > runtime snapshot > 'en'
 * @param userMessage - The user's input message for language detection
 * @param snapshot - Runtime bindings snapshot for fallback language
 * @param input - Full command execution input with explicit language flag
 * @returns Resolved language code ('en' or 'vi')
 * @example
 * const lang = resolveDisplayLanguage('xin chào', undefined, { language: 'vi' }) // 'vi'
 */
export function resolveDisplayLanguage(
  userMessage: string | undefined,
  snapshot: RuntimeBindingsSnapshot | undefined,
  input: CommandExecutionInput,
): string {
  const explicitLanguage = normalizeProfileLanguage(input.language, '')
  if (explicitLanguage) {
    return explicitLanguage
  }

  if (isVietnameseMessage(userMessage)) {
    return 'vi'
  }

  const fallbackLanguage = normalizeProfileLanguage(snapshot?.language, 'en')
  return fallbackLanguage || 'en'
}
