/**
 * Child session backfill from SDK messages.
 *
 * Extracted from EventCapture to reduce module size and enable independent
 * testing. Handles backfilling turns and lastMessage from OpenCode SDK
 * messages when a child session completes.
 *
 * @module session-tracker/capture/child-backfiller
 */

import type { OpenCodeClient } from "../../../shared/session-api.js"
import { getSessionMessages } from "../../../shared/session-api.js"
import type { ChildWriter } from "../persistence/child-writer.js"
import type { Turn } from "../types.js"
import { asString, getNestedValue } from "../../../shared/helpers.js"

/**
 * Dependencies for child session backfill operations.
 */
export interface ChildBackfillerDeps {
  client: OpenCodeClient
  childWriter: ChildWriter
}

/**
 * Handles backfilling turns and lastMessage from OpenCode SDK messages
 * when a child session completes.
 *
 * This is a pure utility class with no mutable state — safe to share
 * across concurrent child session completions (up to 10 parallel children).
 */
export class ChildBackfiller {
  private client: OpenCodeClient
  private childWriter: ChildWriter

  constructor(deps: ChildBackfillerDeps) {
    this.client = deps.client
    this.childWriter = deps.childWriter
  }

  /**
   * Backfills turns from SDK messages for a completed child session.
   *
   * Called from session.idle, session.deleted, and session.error handlers
   * when the completed session is a child (has parentID). The backfill is
   * fire-and-forget — errors are logged, never thrown.
   *
   * @param parentID - The parent session ID.
   * @param childSessionID - The completed child session ID.
   */
  async backfillChildTurnsFromSdk(
    parentID: string,
    childSessionID: string,
  ): Promise<void> {
    try {
      const messages = await getSessionMessages(this.client, childSessionID)
      if (!messages || messages.length === 0) return

      // Find the index of the last assistant message
      let lastAssistantIndex = -1
      for (let i = messages.length - 1; i >= 0; i--) {
        if (this.messageRole(messages[i]) === "assistant") {
          lastAssistantIndex = i
          break
        }
      }

      const turns: Turn[] = []
      let turnNumber = 1
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        const role = this.messageRole(message)
        const isLastAssistant = i === lastAssistantIndex
        const content = this.extractTextFromSdkMessage(message, isLastAssistant)
        if (!content) continue

        turns.push({
          turn: turnNumber++,
          actor: (getNestedValue(message, ["agent"]) as string) || (role === "user" ? "user" : "unknown"),
          content,
          tools: [],
          role,
        })
      }

      if (turns.length > 0) {
        await this.childWriter.backfillChildTurns(parentID, childSessionID, turns)
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to backfill child turns for "${childSessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Extracts the role from an SDK message object.
   * Handles both `{ info: { role } }` and `{ role }` shapes.
   */
  messageRole(message: unknown): string | undefined {
    return asString(getNestedValue(message, ["info", "role"])) ?? asString(getNestedValue(message, ["role"]))
  }

  /**
   * Extracts text content from an SDK message's parts array.
   * Handles text parts, thinking parts (optional), and tool-only fallback.
   */
  extractTextFromSdkMessage(message: unknown, includeThinking = false): string | undefined {
    const parts = getNestedValue(message, ["parts"]) as unknown[] | undefined
    if (!Array.isArray(parts) || parts.length === 0) return undefined

    const textParts = parts
      .filter((part: unknown) => {
        const type = getNestedValue(part, ["type"])
        return type === "text" || (includeThinking && type === "thinking")
      })
      .map((part: unknown) => {
        const type = getNestedValue(part, ["type"])
        const text = asString(getNestedValue(part, ["text"]))
        const content = asString(getNestedValue(part, ["content"]))
        const val = text || content || ""
        if (type === "thinking" && val.trim().length > 0) {
          return `<thinking>\n${val.trim()}\n</thinking>`
        }
        return val
      })
      .filter((text): text is string => typeof text === "string" && text.length > 0)

    if (textParts.length > 0) return textParts.join("\n")

    // Fallback: extract tool names for tool-only messages
    const toolParts = parts
      .filter((part: unknown) => getNestedValue(part, ["type"]) === "tool")
      .map((part: unknown): string => {
        const toolName = asString(getNestedValue(part, ["tool"])) || asString(getNestedValue(part, ["name"])) || "tool"
        return toolName
      })
      .filter((name): name is string => name.length > 0)

    if (toolParts.length > 0) return "Tools: " + toolParts.join(", ")

    return undefined
  }
}
