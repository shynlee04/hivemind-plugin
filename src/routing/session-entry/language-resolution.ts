/**
 * @module language-resolution
 * @description SEI-02 — Detects the dominant language and script of user input
 * using Unicode range analysis.
 *
 * Supports Latin, CJK (Chinese/Japanese/Korean), Arabic, Cyrillic,
 * Devanagari, and Thai scripts with confidence scoring.
 */

/** Supported Unicode script categories */
export type ScriptType =
  | "latin"
  | "cjk"
  | "arabic"
  | "cyrillic"
  | "devanagari"
  | "thai"
  | "unknown"

/** Result of language detection */
export interface LanguageDetection {
  /** ISO 639-1 language code (e.g., "en", "zh", "ja", "ko") */
  language: string
  /** Detected Unicode script category */
  script: ScriptType
  /** Confidence score between 0 and 1 */
  confidence: number
}

/**
 * Unicode range definition for script detection.
 * Each range has a start/end codepoint and associated metadata.
 */
interface ScriptRange {
  /** Human-readable script name */
  script: ScriptType
  /** Start of the Unicode range (inclusive) */
  start: number
  /** End of the Unicode range (inclusive) */
  end: number
  /** Primary language associated with this range */
  primaryLanguage: string
}

/**
 * Defined Unicode ranges for multi-language detection.
 * Ordered by specificity — CJK ranges are checked before Latin.
 */
const SCRIPT_RANGES: readonly ScriptRange[] = [
  // CJK Unified Ideographs
  { script: "cjk", start: 0x4e00, end: 0x9fff, primaryLanguage: "zh" },
  // CJK Extension A
  { script: "cjk", start: 0x3400, end: 0x4dbf, primaryLanguage: "zh" },
  // CJK Compatibility Ideographs
  { script: "cjk", start: 0xf900, end: 0xfaff, primaryLanguage: "zh" },
  // Hiragana (Japanese)
  { script: "cjk", start: 0x3040, end: 0x309f, primaryLanguage: "ja" },
  // Katakana (Japanese)
  { script: "cjk", start: 0x30a0, end: 0x30ff, primaryLanguage: "ja" },
  // Hangul Syllables (Korean)
  { script: "cjk", start: 0xac00, end: 0xd7af, primaryLanguage: "ko" },
  // Arabic
  { script: "arabic", start: 0x0600, end: 0x06ff, primaryLanguage: "ar" },
  // Arabic Supplement
  { script: "arabic", start: 0x0750, end: 0x077f, primaryLanguage: "ar" },
  // Cyrillic
  { script: "cyrillic", start: 0x0400, end: 0x04ff, primaryLanguage: "ru" },
  // Cyrillic Supplement
  { script: "cyrillic", start: 0x0500, end: 0x052f, primaryLanguage: "ru" },
  // Devanagari
  { script: "devanagari", start: 0x0900, end: 0x097f, primaryLanguage: "hi" },
  // Thai
  { script: "thai", start: 0x0e00, end: 0x0e7f, primaryLanguage: "th" },
]

/**
 * Detects the dominant language and script of the input string
 * using Unicode codepoint range analysis.
 *
 * @param input - The raw user input string to analyze
 * @returns LanguageDetection with language code, script type, and confidence
 *
 * @example
 * ```typescript
 * const result = detectLanguage("你好世界")
 * // { language: "zh", script: "cjk", confidence: 0.95 }
 * ```
 */
export function detectLanguage(input: string): LanguageDetection {
  const trimmed = input.trim()

  if (trimmed.length === 0) {
    return { language: "unknown", script: "unknown", confidence: 0 }
  }

  const scriptCounts = new Map<ScriptType, { count: number; language: string }>()

  for (const char of trimmed) {
    const code = char.codePointAt(0)
    if (code === undefined) continue

    // Check against defined ranges first
    let matched = false
    for (const range of SCRIPT_RANGES) {
      if (code >= range.start && code <= range.end) {
        const existing = scriptCounts.get(range.script)
        if (existing) {
          existing.count++
        } else {
          scriptCounts.set(range.script, { count: 1, language: range.primaryLanguage })
        }
        matched = true
        break
      }
    }

    // Default to Latin for ASCII and extended Latin
    if (!matched && code >= 0x0020 && code <= 0x024f) {
      const existing = scriptCounts.get("latin")
      if (existing) {
        existing.count++
      } else {
        scriptCounts.set("latin", { count: 1, language: "en" })
      }
    }
  }

  if (scriptCounts.size === 0) {
    return { language: "unknown", script: "unknown", confidence: 0 }
  }

  // Find the dominant script
  let dominant: { script: ScriptType; count: number; language: string } = {
    script: "unknown",
    count: 0,
    language: "unknown",
  }

  for (const [script, data] of scriptCounts) {
    if (data.count > dominant.count) {
      dominant = { script, count: data.count, language: data.language }
    }
  }

  const totalChars = [...scriptCounts.values()].reduce((sum, d) => sum + d.count, 0)
  const confidence = Math.round((dominant.count / totalChars) * 100) / 100

  return {
    language: dominant.language,
    script: dominant.script,
    confidence,
  }
}
