/**
 * Main Session Start Hook — First-turn prompt transformation
 *
 * Hook: experimental.chat.messages.transform
 * Trigger: First turn of session (turn_count === 0)
 *
 * Action:
 * - Detect first turn
 * - Load last session context
 * - Transform user message with context
 * - Inject as synthetic part (prepend)
 *
 * P3: try/catch — never break message flow
 */

import { createStateManager } from "../../lib/persistence.js"
import { detectFirstTurn, loadLastSessionContext, buildTransformedPrompt } from "../../lib/session_coherence.js"
import type { Message, Part } from "@opencode-ai/sdk"

type MessagePart = {
  id?: string
  sessionID?: string
  messageID?: string
  type?: string
  text?: string
  synthetic?: boolean
  [key: string]: unknown
}

type MessageWithParts = {
  info: Message
  parts: Part[]
}

type LegacyMessage = {
  role?: string
  content?: string | MessagePart[]
  synthetic?: boolean
  [key: string]: unknown
}

type MessageV2 = MessageWithParts | LegacyMessage

// Budget for transformed prompt
const MAX_TRANSFORMED_PROMPT_CHARS = 2500

/**
 * Check if message has parts (V2 format)
 */
function isMessageWithParts(message: MessageV2): message is MessageWithParts {
  return (
    typeof message === "object" &&
    message !== null &&
    "info" in message &&
    "parts" in message &&
    Array.isArray((message as MessageWithParts).parts)
  )
}

/**
 * Check if message is synthetic
 */
function isSyntheticMessage(message: MessageV2): boolean {
  if (isMessageWithParts(message)) {
    return message.parts.some(part => {
      if (part.type !== "text") return false
      return Boolean((part as MessagePart).synthetic)
    })
  }

  if (message.synthetic === true) return true
  if (!Array.isArray(message.content)) return false
  return message.content.some(part => part.synthetic === true)
}

/**
 * Find last non-synthetic user message index
 */
function getLastNonSyntheticUserMessageIndex(messages: MessageV2[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i]
    const role = isMessageWithParts(message) ? message.info.role : message.role
    if (role === "user" && !isSyntheticMessage(message)) {
      return i
    }
  }
  return -1
}

/**
 * Extract user message text from message object
 */
function extractUserMessageText(message: MessageV2): string {
  if (isMessageWithParts(message)) {
    const textParts = message.parts.filter(p => p.type === "text")
    return textParts.map(p => p.text || "").join(" ")
  }

  if (typeof message.content === "string") {
    return message.content
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter(p => p.type === "text")
      .map(p => (p as MessagePart).text || "")
      .join(" ")
  }

  return ""
}

/**
 * Prepend synthetic part to message
 */
function prependSyntheticPart(message: MessageV2, text: string, sessionID: string): void {
  const syntheticPart: MessagePart = {
    id: `hm_session_coherence_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionID,
    messageID: undefined,
    type: "text",
    text,
    synthetic: true,
  }

  if (isMessageWithParts(message)) {
    message.parts = [syntheticPart as Part, ...message.parts]
  } else {
    // Legacy format
    if (Array.isArray(message.content)) {
      message.content = [syntheticPart, ...message.content]
    } else {
      message.content = [syntheticPart]
    }
  }
}

/**
 * Factory: Create main session start hook
 */
export function createMainSessionStartHook(
  _log: { warn: (message: string) => Promise<void> },
  directory: string
) {
  const stateManager = createStateManager(directory)

  return async (_input: {}, output: { messages: MessageV2[] }): Promise<void> => {
    // P3: never break message flow
    try {
      // Load state
      const state = await stateManager.load()

      // Only act on first turn
      if (!detectFirstTurn(state)) {
        return
      }

      // Find last user message
      const index = getLastNonSyntheticUserMessageIndex(output.messages)
      if (index === -1) {
        return
      }

      const userMessage = output.messages[index]
      const userMessageText = extractUserMessageText(userMessage)

      // Get session ID for synthetic part
      const sessionID = state?.session?.id || "unknown"

      // Load last session context
      const lastSessionContext = await loadLastSessionContext(directory)

      // Build transformed prompt
      const transformedPrompt = buildTransformedPrompt(userMessageText, lastSessionContext, {
        maxTasks: 5,
        maxMems: 3,
        maxTodos: 10,
        includeAnchors: true,
        budget: MAX_TRANSFORMED_PROMPT_CHARS,
      })

      // Inject as synthetic part (prepend)
      prependSyntheticPart(output.messages[index], transformedPrompt, sessionID)
    } catch {
      // P3: never break message flow
      // Silently fail - the message will proceed without transformation
    }
  }
}
