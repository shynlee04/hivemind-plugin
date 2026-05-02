import { isObject, getNestedValue } from "../helpers.js"

export type SupervisorMessageView = {
  role: string
  text_preview: string
  truncated: boolean
  has_tool_call: boolean
  tool_name: string | null
}

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
