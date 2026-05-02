import { isObject, getNestedValue } from "../helpers.js"

/**
 * A supervisor-friendly view of a session message.
 *
 * Summarizes a raw message into a compact view with role, text preview,
 * and tool call information for dashboard rendering.
 *
 * @property role - The message role (e.g. "user", "assistant", "unknown").
 * @property text_preview - First 120 characters of text content.
 * @property truncated - Whether the text preview was truncated.
 * @property has_tool_call - Whether the message contains a tool call or result.
 * @property tool_name - Name of the tool called, or null if no tool call.
 */
export type SupervisorMessageView = {
  role: string
  text_preview: string
  truncated: boolean
  has_tool_call: boolean
  tool_name: string | null
}

/**
 * Transform raw session messages into supervisor-friendly views.
 *
 * Extracts role, text preview (truncated to 120 chars), and tool call
 * information from each message. Handles both the `info.role` and
 * top-level `role` field formats.
 *
 * @param messages - Array of raw message objects (unknown shape).
 * @returns An array of {@link SupervisorMessageView} summaries.
 *
 * @example
 * ```typescript
 * const views = transformMessagesForSupervisor(rawMessages)
 * for (const view of views) {
 *   console.log(view.role, view.text_preview)
 * }
 * ```
 */
export function transformMessagesForSupervisor(messages: unknown[]): SupervisorMessageView[] {
  return messages.map((msg) => {
    const role =
      (typeof getNestedValue(msg, ["info", "role"]) === "string"
        ? (getNestedValue(msg, ["info", "role"]) as string)
        : undefined) ??
      (typeof getNestedValue(msg, ["role"]) === "string"
        ? (getNestedValue(msg, ["role"]) as string)
        : "unknown")

    const parts = getNestedValue(msg, ["parts"])
    const partArray = Array.isArray(parts) ? parts : []

    let textPreview = ""
    let hasToolCall = false
    let toolName: string | null = null

    for (const part of partArray) {
      if (!isObject(part)) continue
      const type = getNestedValue(part, ["type"])
      if (type === "text") {
        const text = getNestedValue(part, ["text"])
        if (typeof text === "string") textPreview += text
      } else if (type === "tool_call" || type === "tool-result") {
        hasToolCall = true
        const name = getNestedValue(part, ["name"])
        if (typeof name === "string") toolName = name
      }
    }

    const maxPreview = 120
    const truncated = textPreview.length > maxPreview
    const preview = textPreview.slice(0, maxPreview)

    return {
      role,
      text_preview: preview,
      truncated,
      has_tool_call: hasToolCall,
      tool_name: toolName,
    }
  })
}
