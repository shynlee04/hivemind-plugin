/**
 * Messages transform hook.
 *
 * Scans message history for prompt-enhance triggers and injects context
 * packets (session state, hierarchy position, route hints) before the
 * first user message.
 */

import { getSessionContinuity } from "../lib/continuity.js"

const PROMPT_ENHANCE_TRIGGERS = [
  "enhance this prompt",
  "audit this prompt",
  "repack this prompt",
  "prompt-enhance",
  "/hf-prompt-enhance",
]

const CONTEXT_PACKET_TEMPLATE = [
  "## Context",
  "Session: {sessionID}",
  "Continuity Status: {status}",
  "Agent: {agent}",
  "Category: {category}",
  "---",
]

/**
 * Detects if the current message stream indicates a prompt-enhance session
 * by scanning for trigger phrases in user messages.
 */
function isPromptEnhanceSession(messages: Array<{ role: string; content: string }>): boolean {
  return messages.some(
    (msg) =>
      msg.role === "user" &&
      PROMPT_ENHANCE_TRIGGERS.some((trigger) =>
        msg.content.toLowerCase().includes(trigger.toLowerCase()),
      ),
  )
}

/**
 * Builds a context packet string from session continuity data.
 */
function buildContextPacket(sessionID: string): string {
  try {
    const continuity = getSessionContinuity(sessionID)
    const status = continuity?.metadata.status ?? "unknown"
    const agent = continuity?.metadata.delegation?.agent ?? "none"
    const category = continuity?.metadata.delegation?.category ?? "none"

    return CONTEXT_PACKET_TEMPLATE.join("\n")
      .replace("{sessionID}", sessionID)
      .replace("{status}", status)
      .replace("{agent}", agent)
      .replace("{category}", category)
  } catch {
    return CONTEXT_PACKET_TEMPLATE.join("\n")
      .replace("{sessionID}", sessionID)
      .replace("{status}", "unknown")
      .replace("{agent}", "none")
      .replace("{category}", "none")
  }
}

/**
 * Transforms message history by injecting context packets when
 * prompt-enhance triggers are detected.
 *
 * @param messages - Array of message parts from the conversation
 * @param sessionID - Current session identifier
 * @returns Transformed message array with context packets injected
 */
export function transformMessages(
  messages: Array<{ role: string; content: string }>,
  sessionID: string,
): Array<{ role: string; content: string }> {
  if (!isPromptEnhanceSession(messages)) {
    return messages
  }

  const packet = buildContextPacket(sessionID)

  const firstUserIndex = messages.findIndex((m) => m.role === "user")
  if (firstUserIndex === -1) {
    return messages
  }

  const result = [...messages]
  result.splice(firstUserIndex, 0, { role: "system", content: packet })
  return result
}
