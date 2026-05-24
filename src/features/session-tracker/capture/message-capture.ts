/**
 * Chat message capture handler for user and assistant messages.
 *
 * Handles `chat.message` hook events from OpenCode. User messages are
 * captured as `## USER (turn N)` sections with sequential turn counters.
 * Assistant messages are transformed into `main_l0_agent` blocks via
 * {@link AgentTransform}. Thinking blocks are filtered out.
 *
 * Turn counters are maintained per-session in an instance-level Map.
 * All handlers are best-effort — errors are logged, never thrown.
 *
 * @module session-tracker/capture/message-capture
 */

import type { SessionWriter } from "../persistence/session-writer.js"
import type { AgentTransform } from "../transform/agent-transform.js"
import type { SessionIndexWriter } from "../persistence/session-index-writer.js"
import { isValidSessionID } from "../types.js"
import { safeSessionPath } from "../persistence/atomic-write.js"
import { readFile } from "node:fs/promises"
import { asString, getNestedValue } from "../../../shared/helpers.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import { getSessionMessages } from "../../../shared/session-api.js"

// ---------------------------------------------------------------------------
// Hook input/output shapes
// ---------------------------------------------------------------------------

/** Shape of the chat.message hook input. */
interface ChatMessageInput {
  sessionID: string
  agent?: string
  model?: {
    providerID: string
    modelID: string
  }
  messageID?: string
  variant?: string
}

/** Shape of a part within the hook output. */
interface OutputPart {
  type: string
  text?: string
  content?: string
}

/** Shape of the chat.message hook output. */
interface ChatMessageOutput {
  message: { role: string }
  parts: OutputPart[]
}

// ---------------------------------------------------------------------------
// MessageCapture class
// ---------------------------------------------------------------------------

/**
 * Captures user and assistant messages from the `chat.message` hook.
 *
 * Maintains per-session turn counters and delegates to {@link SessionWriter}
 * for persistence and {@link AgentTransform} for metadata extraction.
 */
export class MessageCapture {
  private client: OpenCodeClient
  private sessionWriter: SessionWriter
  private agentTransform: AgentTransform
  private projectRoot: string
  private sessionIndexWriter: SessionIndexWriter

  /**
   * Per-session turn counters. Keyed by sessionID, values are the next
   * turn number to assign (1-based).
   */
  private turnCounters: Map<string, number> = new Map()

  /** Sessions already backfilled from SDK messages during this process. */
  private backfilledSessions: Set<string> = new Set()

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for logging.
   * @param deps.sessionWriter - The session writer for persistence.
   * @param deps.agentTransform - The agent metadata transform utility.
   * @param deps.projectRoot - Absolute path to the project root for file reads.
   * @param deps.sessionIndexWriter - The session index writer for turn count persistence.
   */
  constructor(deps: {
    client: OpenCodeClient
    sessionWriter: SessionWriter
    agentTransform: AgentTransform
    projectRoot: string
    sessionIndexWriter: SessionIndexWriter
  }) {
    this.client = deps.client
    this.sessionWriter = deps.sessionWriter
    this.agentTransform = deps.agentTransform
    this.projectRoot = deps.projectRoot
    this.sessionIndexWriter = deps.sessionIndexWriter
  }

  /**
   * Handles a chat.message hook event.
   *
   * @param input - Hook input containing sessionID, agent, model metadata.
   * @param output - Hook output containing the message and response parts.
   * @returns Promise that resolves when the message has been captured.
   *
   * @remarks
   * - User messages (`role === "user"`) are captured as `## USER (turn N)`.
   * - Assistant messages (`role === "assistant"`) are transformed to
   *   `main_l0_agent` with name, model, and thinking_duration.
   * - Thinking blocks (`type === "thinking"`) are filtered out.
   * - All errors are caught and logged; the hook pipeline is never blocked.
   */
  async handleChatMessage(
    input: ChatMessageInput,
    output: ChatMessageOutput,
  ): Promise<void> {
    try {
      if (!input?.sessionID || !isValidSessionID(input.sessionID)) {
        return
      }
      if (!output?.message?.role) {
        return
      }

      // Validate parts is an array before processing — malformed hook payload guard.
      if (!Array.isArray(output.parts)) {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: "[Harness] Session tracker: chat.message output.parts is not an array — skipping",
          },
        })
        return
      }

      // Validate role is a recognized value.
      const validRoles = ["user", "assistant"]
      if (!validRoles.includes(output.message.role)) {
        void this.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: `[Harness] Session tracker: unexpected message role "${output.message.role}" — skipping`,
          },
        })
        return
      }

      const role = output.message.role

      if (role === "user") {
        await this.handleUserMessage(input.sessionID, output.parts)
      } else if (role === "assistant") {
        await this.handleAssistantMessage(input, output.parts)
      }
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: chat.message handler failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Captures a user message as `## USER (turn N)`.
   *
   * Increments the turn counter for the given session, appends
   * the user's text content to the main session `.md` file, and
   * persists the updated turn count to `session-continuity.json`.
   */
  private async handleUserMessage(
    sessionID: string,
    parts: OutputPart[],
  ): Promise<void> {
    const turnNumber = this.nextTurnNumber(sessionID)
    const textContent = this.extractTextContent(parts)
    await this.sessionWriter.appendUserTurn(
      sessionID,
      turnNumber,
      textContent,
    )
    await this.sessionIndexWriter.incrementTurnCount(sessionID)
  }

  /**
   * Transforms and captures an assistant message as `main_l0_agent`.
   *
   * Extracts agent metadata via {@link AgentTransform.extractAssistantMetadata},
   * filters out thinking blocks, and appends the agent block to the session `.md`.
   */
  private async handleAssistantMessage(
    input: ChatMessageInput,
    parts: OutputPart[],
  ): Promise<void> {
    const nonThinkingParts = (parts || []).filter(
      (p) => p.type !== "thinking",
    )

    const metadata = this.agentTransform.extractAssistantMetadata(input, {
      parts: nonThinkingParts,
    })

    const content = this.extractTextContent(nonThinkingParts)

    await this.sessionWriter.appendAgentBlock(
      input.sessionID,
      metadata.name,
      metadata.model,
      metadata.thinkingDuration,
      content || undefined,
    )

    const lastMessage = this.resolveLastMessage(nonThinkingParts, content, metadata)
    if (lastMessage) {
      await this.sessionWriter.updateFrontmatter(input.sessionID, {
        lastMessage,
      })
    }
  }

  /**
   * Resolves the lastMessage value for frontmatter update.
   *
   * Priority: text content > tool summary > model name fallback.
   * Ensures lastMessage is ALWAYS captured even when assistant
   * only outputs tool calls with no text content.
   */
  private resolveLastMessage(
    parts: OutputPart[],
    textContent: string,
    metadata: { name?: string; model?: string },
  ): string {
    if (textContent && textContent.trim().length > 0) {
      return textContent
    }

    const toolCalls = parts.filter((p) => p.type === "tool")
    if (toolCalls.length > 0) {
      const toolNames = toolCalls
        .map((p) => {
          const tu = p as { tool?: string; name?: string }
          return tu.tool || tu.name || "tool"
        })
        .filter(Boolean)
      const agentLabel = metadata.name || "agent"
      return `[${agentLabel}] Executed: ${toolNames.join(", ")}`
    }

    if (metadata.model) {
      return `[${metadata.model}] (no text output)`
    }

    return ""
  }

  /**
   * Returns the next turn number for a session and increments the counter.
   *
   * @param sessionID - The session identifier.
   * @returns The next one-based turn number.
   */
  private nextTurnNumber(sessionID: string): number {
    const current = this.turnCounters.get(sessionID) ?? 0
    const next = current + 1
    this.turnCounters.set(sessionID, next)
    return next
  }

  /**
   * Seeds in-memory turn counters from existing session .md file content.
   *
   * Prevents duplicate turn numbers on plugin restart by reading the
   * number of `## USER (turn N)` sections already present in the session file.
   * Call during SessionTracker.initialize() for each known active session.
   *
   * @param sessionID - The session identifier to seed.
   * @returns Promise that resolves when seeding is complete.
   */
  async seedTurnCounters(sessionID: string): Promise<void> {
    try {
      const filePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
      const raw = await readFile(filePath, "utf-8")
      const matches = raw.match(/## USER \(turn (\d+)\)/g)
      if (matches && matches.length > 0) {
        const lastTurn = matches.length
        this.turnCounters.set(sessionID, lastTurn)
      }
    } catch {
      // File may not exist — start at 0
    }
  }

  /**
   * Backfills missed real-human user messages from OpenCode session history.
   *
   * This repairs race windows where tool/event hooks are observed but the
   * initial `chat.message` hook was missed by the plugin process. Only
   * non-synthetic text from SDK user messages is persisted as human context.
   *
   * @param sessionID - Main session identifier to backfill.
   * @returns Promise that resolves after any missing real-human turns are appended.
   */
  async backfillUserTurnsFromSdk(sessionID: string): Promise<void> {
    if (this.backfilledSessions.has(sessionID)) return
    this.backfilledSessions.add(sessionID)

    try {
      const persistedTurns = await this.readPersistedUserTurnCount(sessionID)
      const messages = await getSessionMessages(this.client, sessionID)
      const humanMessages = messages
        .filter((message) => this.messageRole(message) === "user")
        .map((message) => this.extractHumanTextFromSdkMessage(message))
        .filter((content): content is string => Boolean(content))

      const missing = humanMessages.slice(persistedTurns)
      if (missing.length === 0) return

      let nextTurn = persistedTurns
      for (const content of missing) {
        nextTurn += 1
        await this.sessionWriter.appendUserTurn(sessionID, nextTurn, content)
        await this.sessionIndexWriter.incrementTurnCount(sessionID)
      }
      this.turnCounters.set(sessionID, nextTurn)
    } catch (err) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: SDK user-message backfill failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Extracts the concatenated text content from an array of output parts.
   *
   * FIX: Filter thinking blocks + lấy TOÀN BỘ text + content fields, join với \n
   *
   * @param parts - Array of hook output parts.
   * @returns The concatenated text content, or empty string if no text found.
   */
  private extractTextContent(parts: OutputPart[] | null | undefined): string {
    if (!Array.isArray(parts)) return ""

    const texts: string[] = []

    for (const p of parts) {
      if (!p || typeof p !== "object") continue

      // FILTER: Bỏ thinking blocks (thin line - không ghi ra)
      if ((p as { type?: string }).type === "thinking") {
        continue
      }

      // LẤY TOÀN BỘ text fields (text + content)
      if (p.text && typeof p.text === "string" && p.text.trim().length > 0) {
        texts.push(p.text)
      }

      if (p.content && typeof p.content === "string" && p.content.trim().length > 0) {
        texts.push(p.content)
      }
    }

    const result = texts.join("\n")

    if (parts.length > 0 && texts.length === 0) {
      void this.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "debug",
          message: "[Harness] extractTextContent: found parts but no text content",
        },
      })
    }

    return result
  }

  /**
   * Reads how many human user turns are already persisted.
   *
   * @param sessionID - Session identifier.
   * @returns Count of persisted user turn headers.
   */
  private async readPersistedUserTurnCount(sessionID: string): Promise<number> {
    try {
      const filePath = safeSessionPath(this.projectRoot, sessionID, `${sessionID}.md`)
      const raw = await readFile(filePath, "utf-8")
      const matches = raw.match(/## USER \(turn \d+\)/g)
      return matches?.length ?? 0
    } catch {
      return 0
    }
  }

  /**
   * Extracts role from either SDK message shape.
   *
   * @param message - Raw SDK message.
   * @returns Message role, if present.
   */
  private messageRole(message: unknown): string | undefined {
    return asString(getNestedValue(message, ["info", "role"])) ?? asString(getNestedValue(message, ["role"]))
  }

  /**
   * Extracts non-synthetic text from a user message.
   *
   * @param message - Raw SDK message.
   * @returns Human-authored text content, or undefined when none exists.
   */
  private extractHumanTextFromSdkMessage(message: unknown): string | undefined {
    const parts = getNestedValue(message, ["parts"])
    if (!Array.isArray(parts)) return undefined
    const content = parts
      .filter((part) => getNestedValue(part, ["type"]) === "text")
      .filter((part) => getNestedValue(part, ["synthetic"]) !== true)
      .map((part) => asString(getNestedValue(part, ["text"])) ?? "")
      .filter((text) => text.length > 0)
      .join("\n")
    return content.length > 0 ? content : undefined
  }

}
