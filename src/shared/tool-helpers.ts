/**
 * Shared tool helpers — extracted from duplicated implementations
 * across task/, trajectory/, and handoff/ tools.
 *
 * Authority: src/shared/AGENTS.md
 */

/**
 * Parse a comma-separated string into a trimmed, non-empty array.
 * @param value - Comma-separated string (e.g. "a, b, c")
 * @returns Array of trimmed non-empty strings
 * @example parseList('a, b, c') // ['a', 'b', 'c']
 * @example parseList(undefined)  // []
 */
export function parseList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Parse a JSON array string, falling back to empty array.
 * @param json - JSON array string
 * @returns Parsed array or empty array on parse failure
 */
export function parseJsonArray<T>(json?: string): T[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Render a tool result as pretty-printed JSON.
 * @param result - Any serializable value
 * @returns JSON string with 2-space indentation
 */
export function renderToolResult(result: unknown): string {
  return JSON.stringify(result, null, 2)
}
