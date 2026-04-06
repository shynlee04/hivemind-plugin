/**
 * Parse a comma-separated string into a trimmed, non-empty string array.
 * Returns empty array for undefined, null, or whitespace-only input.
 * @param value - Comma-separated string or undefined
 * @returns Array of trimmed, non-empty strings
 */
export function parseList(value?: string): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Parse a JSON array string into a typed array.
 * Returns empty array for undefined, null, or malformed input.
 * @param json - JSON array string or undefined
 * @returns Parsed array (type-unsafe — caller must validate)
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
 * Render an arbitrary tool result as a JSON string for returning
 * from a tool's execute function.
 * @param result - Any serializable value
 * @returns JSON string representation
 */
export function renderToolResult(result: unknown): string {
  return JSON.stringify(result, null, 2)
}
