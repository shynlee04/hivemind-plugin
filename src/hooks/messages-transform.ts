import { extractAllAssistantText, isObject, getNestedValue } from "../lib/helpers.js"

export type MessageSummary = {
  assistantTextLength: number
  turnCount: number
  lastAssistantText: string
  hasToolCalls: boolean
}

export function summarizeMessages(messages: unknown[]): MessageSummary {
  const allAssistantText = extractAllAssistantText(messages)
  const turnCount = messages.filter((m) => {
    const role = getNestedValue(m, ["info", "role"]) ?? getNestedValue(m, ["role"])
    return role === "user" || role === "assistant"
  }).length

  const hasToolCalls = messages.some((m) => {
    const parts = getNestedValue(m, ["parts"])
    if (!Array.isArray(parts)) return false
    return parts.some(
      (part: unknown) =>
        isObject(part) &&
        (getNestedValue(part, ["type"]) === "tool_call" ||
          getNestedValue(part, ["type"]) === "tool-result"),
    )
  })

  return {
    assistantTextLength: allAssistantText.length,
    turnCount,
    lastAssistantText: extractLastAssistantText(messages),
    hasToolCalls,
  }
}

function extractLastAssistantText(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    const role =
      (typeof getNestedValue(msg, ["info", "role"]) === "string"
        ? getNestedValue(msg, ["info", "role"])
        : undefined) ??
      (typeof getNestedValue(msg, ["role"]) === "string" ? getNestedValue(msg, ["role"]) : undefined)
    if (role === "assistant") {
      const parts = getNestedValue(msg, ["parts"])
      if (!Array.isArray(parts)) continue
      const texts: string[] = []
      for (const part of parts) {
        if (getNestedValue(part, ["type"]) === "text") {
          const text = getNestedValue(part, ["text"])
          if (typeof text === "string") texts.push(text)
        }
      }
      return texts.join("").trim()
    }
  }
  return ""
}
