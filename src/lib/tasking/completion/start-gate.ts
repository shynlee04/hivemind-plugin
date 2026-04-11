ee/**
 * Start gate verification for delegated sessions (D-10).
 *
 * Determines whether a delegated session has actually started substantive work
 * by checking for thinking/reasoning blocks AND tool calls in assistant messages.
 *
 * Self-contained — does not import from lifecycle-background-observer.
 * Reuses counting patterns but keeps its own implementation.
 */

import { getSessionMessages } from "../../session-api.js"
import type { OpenCodeClient } from "../../session-api.js"
import type { StartGateEvidence } from "./types.js"

// ── Pure counting helpers ────────────────────────────────────────────

/**
 * Count thinking/reasoning blocks in a single message.
 * Canonical type: `reasoning`. Compatibility aliases: `thinking`, `redacted_thinking`.
 */
export function countThinkingBlocks(message: unknown): number {
  if (!message || typeof message !== "object") {
    return 0
  }

  const parts = (message as { parts?: unknown }).parts
  if (!Array.isArray(parts)) {
    return 0
  }

  return parts.reduce((count: number, part: unknown) => {
    if (!part || typeof part !== "object") {
      return count
    }

    const type = (part as { type?: unknown }).type
    if (
      type === "reasoning" ||
      type === "thinking" ||
      type === "redacted_thinking"
    ) {
      return count + 1
    }
    return count
  }, 0)
}

/**
 * Count tool-call parts in a single message.
 * Recognized types: `tool-call`, `tool_call`, `tool`.
 */
function countToolCallParts(message: unknown): number {
  if (!message || typeof message !== "object") {
    return 0
  }

  const parts = (message as { parts?: unknown }).parts
  if (!Array.isArray(parts)) {
    return 0
  }

  return parts.reduce((count: number, part: unknown) => {
    if (!part || typeof part !== "object") {
      return count
    }

    const type = (part as { type?: unknown }).type
    return type === "tool-call" || type === "tool_call" || type === "tool"
      ? count + 1
      : count
  }, 0)
}

// ── Start gate verification ──────────────────────────────────────────

/**
 * Verify that a delegated session has started substantive work.
 *
 * Passes when assistant messages contain:
 * - ≥1 thinking/reasoning block (canonical or compatibility alias)
 * - ≥2 tool-call parts
 *
 * Gracefully handles malformed messages — returns 0 counts, never crashes.
 */
export async function verifyStartGate(
  client: OpenCodeClient,
  sessionID: string,
): Promise<StartGateEvidence> {
  const messages = await getSessionMessages(client, sessionID)

  // Filter to assistant messages only — user/system messages are not evidence
  const assistantMessages = messages.filter((msg: unknown) => {
    if (!msg || typeof msg !== "object") return false
    return (msg as { role?: string }).role === "assistant"
  })

  // Aggregate counts across ALL assistant messages
  let thinkingBlocks = 0
  let toolCalls = 0

  for (const msg of assistantMessages) {
    thinkingBlocks += countThinkingBlocks(msg)
    toolCalls += countToolCallParts(msg)
  }

  return {
    thinkingBlocks,
    toolCalls,
    assistantMessages: assistantMessages.length,
    passed: thinkingBlocks >= 1 && toolCalls >= 2,
  }
}
