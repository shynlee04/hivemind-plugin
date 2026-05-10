/**
 * Session lifecycle event capture handler.
 *
 * Handles `session.created`, `session.idle`, `session.deleted`, and
 * `session.error` events from the OpenCode `event` hook. Distinguishes
 * root sessions from child sessions via SDK `parentID` check.
 *
 * Root sessions: creates `.hivemind/session-tracker/{sessionID}/` subdir
 * and `{sessionID}.md` file. Child sessions: skipped (handled by tool-capture
 * when `task` tool fires).
 *
 * All handlers are best-effort — errors are logged, never thrown.
 *
 * @module session-tracker/capture/event-capture
 */

import type { OpenCodeClient } from "../../../shared/session-api.js"
import { getSession } from "../../../shared/session-api.js"
import type { SessionWriter } from "../persistence/session-writer.js"
import { isValidSessionID } from "../types.js"

// ---------------------------------------------------------------------------
// EventCapture class
// ---------------------------------------------------------------------------

/**
 * Handles session lifecycle events from the OpenCode `event` hook.
 *
 * Delegated by the hook pipeline. Never writes files directly — relies on
 * {@link SessionWriter} for all persistence operations.
 */
export class EventCapture {
  private client: OpenCodeClient
  private sessionWriter: SessionWriter

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for session queries.
   * @param deps.sessionWriter - The session writer for persistence.
   */
  constructor(deps: {
    client: OpenCodeClient
    sessionWriter: SessionWriter
  }) {
    this.client = deps.client
    this.sessionWriter = deps.sessionWriter
  }

  /**
   * Handles a session lifecycle event from the `event` hook.
   *
   * @param event - Hook input containing eventType, sessionID, and raw event data.
   * @returns Promise that resolves when the event has been processed.
   *
   * @remarks
   * Supported event types:
   * - `session.created` — creates subdir + .md for root sessions
   * - `session.idle` — updates session status to "idle"
   * - `session.deleted` — marks session status as "completed"
   * - `session.error` — marks session status as "error"
   */
  async handleSessionEvent(event: {
    eventType: string
    sessionID: string
    event: unknown
  }): Promise<void> {
    try {
      if (!event?.sessionID || !isValidSessionID(event.sessionID)) {
        return
      }

      switch (event.eventType) {
        case "session.created":
          await this.handleSessionCreated(event.sessionID)
          break
        case "session.idle":
          await this.handleSessionIdle(event.sessionID)
          break
        case "session.deleted":
          await this.handleSessionDeleted(event.sessionID)
          break
        case "session.error":
          await this.handleSessionError(event.sessionID)
          break
        default:
          console.warn(
            `[Harness] Session tracker: unknown event type "${event.eventType}"`,
          )
      }
    } catch (err) {
      console.warn(
        "[Harness] Session tracker: event handler failed:",
        err,
      )
    }
  }

  /**
   * Handles `session.created` — creates subdir + .md for root sessions only.
   *
   * Uses `client.session.get()` (via `getSession` helper) to check `parentID`.
   * Root sessions (null parentID) get a new subdirectory + .md file initialized.
   * Child sessions (non-null parentID) are skipped — the task tool handler
   * will create their child .json file under the parent's subdir when the
   * delegation spawn event fires.
   */
  private async handleSessionCreated(sessionID: string): Promise<void> {
    try {
      const session = await getSession(this.client, sessionID)
      const parentID = session.parentID as string | null | undefined

      if (parentID === null || parentID === undefined) {
        // Root session — create subdirectory + .md file
        await this.sessionWriter.createSessionDir(sessionID)
        await this.sessionWriter.initializeSessionFile(sessionID, {
          sessionID,
          parentSessionID: null,
          delegationDepth: 0,
          status: "active",
        })
      }
      // Child sessions are handled by tool-capture when task tool fires
    } catch (err) {
      console.warn(
        `[Harness] Session tracker: failed to handle session.created for "${sessionID}":`,
        err,
      )
    }
  }

  /**
   * Handles `session.idle` — updates the session status to "idle".
   */
  private async handleSessionIdle(sessionID: string): Promise<void> {
    try {
      await this.sessionWriter.updateFrontmatter(sessionID, {
        status: "idle",
      } as Partial<import("../types.js").SessionRecord>)
    } catch (err) {
      console.warn(
        `[Harness] Session tracker: failed to handle session.idle for "${sessionID}":`,
        err,
      )
    }
  }

  /**
   * Handles `session.deleted` — marks the session status as "completed".
   */
  private async handleSessionDeleted(sessionID: string): Promise<void> {
    try {
      await this.sessionWriter.updateFrontmatter(sessionID, {
        status: "completed",
      } as Partial<import("../types.js").SessionRecord>)
    } catch (err) {
      console.warn(
        `[Harness] Session tracker: failed to handle session.deleted for "${sessionID}":`,
        err,
      )
    }
  }

  /**
   * Handles `session.error` — marks the session status as "error".
   */
  private async handleSessionError(sessionID: string): Promise<void> {
    try {
      await this.sessionWriter.updateFrontmatter(sessionID, {
        status: "error",
      } as Partial<import("../types.js").SessionRecord>)
    } catch (err) {
      console.warn(
        `[Harness] Session tracker: failed to handle session.error for "${sessionID}":`,
        err,
      )
    }
  }
}
