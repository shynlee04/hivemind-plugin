/**
 * Keyword Matching Utilities
 *
 * Shared utility module for keyword matching across classifiers to eliminate code duplication.
 * Provides regex-based keyword matching with word boundary validation and special character escaping.
 *
 * @module shared/keyword-matcher
 */

/**
 * Escapes special regex characters in a keyword.
 * Allows for whitespace flexibility in multi-word patterns.
 *
 * @param keyword - The keyword to escape
 * @returns The escaped keyword with special characters properly escaped
 *
 * @example
 * ```typescript
 * const escaped = escapeKeyword('bug fix')
 * // Returns: 'bug\\s+fix'
 * ```
 */
export function escapeKeyword(keyword: string): string {
  return keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')
}

/**
 * Checks if a keyword matches in the input text.
 * Uses word boundary matching for accurate classification.
 *
 * @param input - The input text to search in
 * @param keyword - The keyword to search for
 * @returns True if the keyword matches, false otherwise
 *
 * @example
 * ```typescript
 * const matches = matchesKeyword('implement the feature', 'implement')
 * // Returns: true
 * ```
 */
export function matchesKeyword(input: string, keyword: string): boolean {
  const pattern = new RegExp(`\\b${escapeKeyword(keyword)}\\b`, 'i')
  return pattern.test(input)
}

/**
 * Finds all matching keywords from a list in the input text.
 *
 * @param input - The input text to search in
 * @param keywords - The list of keywords to search for
 * @returns The list of matching keywords
 *
 * @example
 * ```typescript
 * const matches = findMatchingKeywords('implement authentication feature', ['implement', 'feature', 'test'])
 * // Returns: ['implement', 'feature']
 * ```
 */
export function findMatchingKeywords(input: string, keywords: string[]): string[] {
  return keywords.filter((keyword) => matchesKeyword(input, keyword))
}