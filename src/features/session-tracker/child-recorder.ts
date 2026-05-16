/**
 * Child recorder — handles child session recording extracted from index.ts.
 *
 * Owns the responsibility of capturing child session turns and journey
 * entries without creating directories. Child sessions write only to
 * their parent's child .json file (D-03, D-05).
 *
 * @module session-tracker/child-recorder
 */

import type { ChildWriter } from "./persistence/child-writer.js"

/**
 * Input from the chat.message hook for child recording.
 */
export interface ChildMessageInput {
  sessionID: string
  agent?: string
  model?: string | { providerID: string; modelID: string }
  messageID?: string
}

/**
 * Output from the chat.message hook for child recording.
 */
export interface ChildMessageOutput {
  message: unknown
  parts: unknown[]
}

/**
 * Dependencies injected into the child recorder.
 */
export interface ChildRecorderDeps {
  /** Child writer for .json persistence. */
  childWriter: ChildWriter
  /** Set of bootstrapped session IDs (mutated by recorder). */
  bootstrappedSessions: Set<string>
  /** Route establishment for child sessions. */
  ensureChildRoute: (parentID: string, childSessionID: string) => Promise<void>
}

/**
 * Child recorder that captures child session messages to parent .json files.
 *
 * Extracted from index.ts to reduce LOC and isolate child-recording logic.
 * Child sessions never get their own directory (D-03, D-05).
 *
 * Usage:
 * ```typescript
 * const recorder = new ChildRecorder({ childWriter, bootstrappedSessions, ensureChildRoute })
 * await recorder.recordChildMessage(parentID, input, output)
 * ```
 */
export class ChildRecorder {
  private readonly childWriter: ChildWriter
  private readonly bootstrappedSessions: Set<string>
  private readonly ensureChildRoute: (parentID: string, childSessionID: string) => Promise<void>

  /**
   * @param deps - Injected dependencies.
   */
  constructor(deps: ChildRecorderDeps) {
    this.childWriter = deps.childWriter
    this.bootstrappedSessions = deps.bootstrappedSessions
    this.ensureChildRoute = deps.ensureChildRoute
  }

  /**
   * Records a child session message to the parent's child .json file.
   *
   * Skips ensureSessionReady entirely — no directory creation.
   * Captures both turn data and journey entries for assistant messages.
   *
   * @param parentID - The parent session ID to record under.
   * @param sessionID - The child session ID.
   * @param input - Hook input containing agent, model, messageID.
   * @param output - Hook output containing message and parts.
   */
  async recordChildMessage(
    parentID: string,
    sessionID: string,
    input: ChildMessageInput,
    output: ChildMessageOutput,
  ): Promise<void> {
    // Mark as bootstrapped (no directory creation needed)
    this.bootstrappedSessions.add(sessionID)
    await this.ensureChildRoute(parentID, sessionID)

    // Extract text content from parts (D-03)
    const messageRole = (output.message as Record<string, unknown> | null)?.role
    const parts = output.parts as Array<{ type: string; text?: string }>
    const content = parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text!)
      .join("\n")
      || (typeof messageRole === "string" ? `[${messageRole} message]` : "unknown")

    // Record turn to child .json under parent
    await this.childWriter.appendChildTurn(
      parentID,
      sessionID,
      {
        turn: 0, // Computed from current turns count by appendChildTurn
        actor: input.agent || "unknown",
        content,
        tools: [],
      },
    )

    // Record journey entry for assistant messages
    if (messageRole === "assistant") {
      await this.childWriter.appendJourneyEntry(parentID, sessionID, {
        timestamp: new Date().toISOString(),
        type: "assistant_message",
        content,
        metadata: {
          actor: input.agent || "unknown",
          model: typeof input.model === "string" ? input.model : input.model?.modelID,
          messageID: input.messageID,
        },
      })
    }
  }
}
