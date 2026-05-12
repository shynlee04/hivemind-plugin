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
import type { OpenCodeClient } from "../../../shared/session-api.js"

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
    // Filter out thinking blocks before passing to agent transform
    const nonThinkingParts = (parts || []).filter(
      (p) => p.type !== "thinking",
    )

    const metadata = this.agentTransform.extractAssistantMetadata(input, {
      parts: nonThinkingParts,
    })

    // P-01: Extract assistant text content from non-thinking parts
    const content = this.extractTextContent(nonThinkingParts)

    await this.sessionWriter.appendAgentBlock(
      input.sessionID,
      metadata.name,
      metadata.model,
      metadata.thinkingDuration,
      content || undefined,
    )
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
   * Extracts the concatenated text content from an array of output parts.
   *
   * @param parts - Array of hook output parts.
   * @returns The concatenated text content, or empty string if no text found.
   */
  private extractTextContent(parts: OutputPart[] | null | undefined): string {
    if (!Array.isArray(parts)) return ""
    return parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text!)
      .join("")
  }
}
