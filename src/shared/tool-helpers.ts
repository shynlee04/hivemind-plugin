/**
 * Render an arbitrary tool result as a JSON string for returning
 * from a tool's execute function.
 * @param result - Any serializable value
 * @returns JSON string representation
 */
export function renderToolResult(result: unknown): string {
  return JSON.stringify(result, null, 2)
}
