/**
 * HiveMind Governance Plugin — Messages Transform Hook
 *
 * Implements experimental.chat.messages.transform for message deduplication.
 *
 * Purpose: reduce token waste by deduplicating consecutive identical tool
 * results and suppressing redundant read-after-write patterns.
 *
 * SDK Reference: experimental.chat.messages.transform
 * Signature: (input: { sessionID?: string; model: Model }, output: { messages: Message[] }) => Promise<void>
 * Message type: UserMessage | AssistantMessage (NO system role — use system.transform for that)
 *
 * Safety: This hook NEVER adds messages, only removes duplicates.
 * It mutates output.messages in-place by splicing out duplicates.
 */

import type { EnforcementState } from "../types"

/** Simple content hash for dedup comparison */
function contentHash(content: string): string {
  // Fast hash — not cryptographic, just for equality comparison
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return hash.toString(36)
}

/** Extract text content from a message (handles string and structured content) */
function extractContent(msg: any): string {
  if (typeof msg.content === "string") return msg.content
  if (Array.isArray(msg.content)) {
    return msg.content
      .map((part: any) => {
        if (typeof part === "string") return part
        if (part.text) return part.text
        if (part.type === "tool_result" && part.content) return String(part.content)
        return ""
      })
      .join("")
  }
  return ""
}

/**
 * Build the experimental.chat.messages.transform hook.
 *
 * Deduplication strategies:
 * 1. Consecutive identical content: If two adjacent messages have identical
 *    content hashes and the same role, remove the later one.
 * 2. Budget: Only process the last 50 messages to avoid blocking on long histories.
 */
export function buildMessagesTransformHook(state: {
  current: EnforcementState
  save: (s: EnforcementState) => void
  worktree: string
}) {
  return async (_input: any, output: any) => {
    if (!output.messages || !Array.isArray(output.messages)) return
    if (output.messages.length < 2) return

    try {
      const messages = output.messages
      // Only scan the tail — never touch old history beyond 50 messages
      const scanStart = Math.max(0, messages.length - 50)
      const indicesToRemove: number[] = []
      let prevHash = ""
      let prevRole = ""

      for (let i = scanStart; i < messages.length; i++) {
        const msg = messages[i]
        if (!msg || !msg.role) continue

        const content = extractContent(msg)
        if (!content) {
          prevHash = ""
          prevRole = ""
          continue
        }

        const hash = contentHash(content)

        // Strategy 1: Consecutive identical content with same role
        if (hash === prevHash && msg.role === prevRole) {
          indicesToRemove.push(i)
        }

        prevHash = hash
        prevRole = msg.role
      }

      // Remove duplicates in reverse order to preserve indices
      if (indicesToRemove.length > 0) {
        for (let i = indicesToRemove.length - 1; i >= 0; i--) {
          messages.splice(indicesToRemove[i], 1)
        }
        // Track dedup count in enforcement state (non-critical)
        state.current = {
          ...state.current,
          turnCount: state.current.turnCount, // preserve
          lastCheckpoint: Date.now(),
        }
      }
    } catch {
      // NEVER crash message processing — dedup is best-effort
    }
  }
}
