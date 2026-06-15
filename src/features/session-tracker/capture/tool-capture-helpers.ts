/**
 * Pure utility helpers for ToolCapture.
 *
 * Extracted from tool-capture.ts to satisfy the ≤500 LOC gate (GA-4).
 * All functions are stateless and do not reference `this`.
 *
 * @module session-tracker/capture/tool-capture-helpers
 */

/**
 * Extracts the first markdown header line (`# ...`) from tool output.
 *
 * @param output - The raw tool output.
 * @returns The first header line, or `undefined` if none found.
 */
export function extractFirstHeader(output: unknown, asString: (v: unknown) => string | undefined): string | undefined {
  const str = asString(output)
  if (!str) return undefined

  const match = str.match(/^# .+$/m)
  return match ? match[0] : undefined
}

/**
 * Extracts a task_id from the output string.
 *
 * Recognizes two formats:
 * - `task_id: ses_abc123` (the canonical format from Plan 01 task tool output)
 * - A standalone session ID starting with `ses_` that appears in the output
 *
 * @param output - The raw tool output.
 * @returns The extracted task/session ID, or `null` if none found.
 */
export function extractTaskId(output: unknown, asString: (v: unknown) => string | undefined): string | null {
  const str = asString(output)
  if (!str) return null

  const match = str.match(/task_id:\s*(ses_[a-zA-Z0-9_]+)/)
  if (match) return match[1]

  const sesMatch = str.match(/(ses_[a-zA-Z0-9_]{6,})/)
  if (sesMatch) return sesMatch[1]

  return null
}

/**
 * Extracts the completed child-session result from a task tool output.
 *
 * OpenCode only emits hook events for the parent session, so child-session
 * content is captured from the parent's completed `task` tool result.
 * Outputs that only contain the task identifier are dispatch-only signals
 * and intentionally return `undefined`.
 *
 * @param output - Raw task tool output.
 * @param taskID - Child task/session identifier to remove from the payload.
 * @returns Child result content, or `undefined` when no result is present.
 */
export function extractTaskResult(output: unknown, taskID: string, asString: (v: unknown) => string | undefined): string | undefined {
  const str = asString(output)
  if (!str) return undefined

  const tagged = str.match(/<task_result>\s*([\s\S]*?)\s*<\/task_result>/)
  if (tagged?.[1]?.trim()) {
    return tagged[1].trim()
  }

  const withoutTaskID = str
    .replace(new RegExp(`task_id:\\s*${taskID}`, "g"), "")
    .trim()

  return withoutTaskID.length > 0 ? withoutTaskID : undefined
}

/**
 * Safely converts unknown output to a string.
 *
 * @param value - The value to convert.
 * @returns The string representation, or `undefined` if not representable.
 */
export function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (value === null || value === undefined) return undefined
  try {
    return JSON.stringify(value)
  } catch {
    return `[unserializable: ${typeof value}]`
  }
}
