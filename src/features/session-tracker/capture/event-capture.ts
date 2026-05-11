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
import type { ChildWriter } from "../persistence/child-writer.js"
import type { SessionIndexWriter } from "../persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
import { sanitizeSessionID } from "../persistence/atomic-write.js"
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
  private childWriter: ChildWriter
  private sessionIndexWriter: SessionIndexWriter
  private projectIndexWriter: ProjectIndexWriter | undefined

  /**
   * @param deps - Injected dependencies.
   * @param deps.client - The OpenCode SDK client for session queries.
   * @param deps.sessionWriter - The session writer for persistence.
   * @param deps.childWriter - The child writer for child session .json updates (DEFECT-08).
   * @param deps.sessionIndexWriter - The session index writer for hierarchy updates (DEFECT-08).
   * @param deps.projectIndexWriter - Optional project index writer for session registration.
   */
  constructor(deps: {
    client: OpenCodeClient
    sessionWriter: SessionWriter
    childWriter: ChildWriter
    sessionIndexWriter: SessionIndexWriter
    projectIndexWriter?: ProjectIndexWriter
  }) {
    this.client = deps.client
    this.sessionWriter = deps.sessionWriter
    this.childWriter = deps.childWriter
    this.sessionIndexWriter = deps.sessionIndexWriter
    this.projectIndexWriter = deps.projectIndexWriter
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

      // Validate sessionID matches its own sanitized form — reject any
      // sessionID that would be altered by sanitization (path traversal guard).
      if (event.sessionID !== sanitizeSessionID(event.sessionID)) {
        console.warn(
          `[Harness] Session tracker: sessionID contains unsafe characters: "${event.sessionID}"`,
        )
        return
      }

      // Validate eventType is a recognized session lifecycle type.
      const validEventTypes = [
        "session.created",
        "session.idle",
        "session.deleted",
        "session.error",
        "session.status",
        "session.compacted",
        "session.updated",
      ]
      if (!validEventTypes.includes(event.eventType)) {
        console.warn(
          `[Harness] Session tracker: unexpected event type "${event.eventType}", expected one of: ${validEventTypes.join(", ")}`,
        )
        // Continue for unrecognized types — they may carry unknown but harmless events.
        // Don't return; log is sufficient for observability.
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

        // Register the session in the project-level continuity index
        if (this.projectIndexWriter) {
          await this.projectIndexWriter.addSession(
            sessionID,
            `${sessionID}/`,
            `${sessionID}.md`,
          )
        }
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
   * Child sessions are routed through childWriter + sessionIndexWriter (DEFECT-08).
   */
  private async handleSessionIdle(sessionID: string): Promise<void> {
    try {
      // Check if this is a child session
      const session = await getSession(this.client, sessionID)
      const parentID = session.parentID as string | null | undefined
      if (parentID !== null && parentID !== undefined) {
        // Child session — update .json via childWriter
        await this.childWriter.updateChildStatus(parentID, sessionID, "idle")
        // Also update session-local index hierarchy
        await this.sessionIndexWriter.updateChildStatus(parentID, sessionID, "idle")
        return
      }
      // Main session — existing behavior
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
   * Child sessions are routed through childWriter + sessionIndexWriter (DEFECT-08).
   */
  private async handleSessionDeleted(sessionID: string): Promise<void> {
    try {
      // Check if this is a child session
      const session = await getSession(this.client, sessionID)
      const parentID = session.parentID as string | null | undefined
      if (parentID !== null && parentID !== undefined) {
        // Child session — update .json via childWriter
        await this.childWriter.updateChildStatus(parentID, sessionID, "completed")
        await this.sessionIndexWriter.updateChildStatus(parentID, sessionID, "completed")
        return
      }
      // Main session — existing behavior
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
   * Child sessions are routed through childWriter + sessionIndexWriter (DEFECT-08).
   */
  private async handleSessionError(sessionID: string): Promise<void> {
    try {
      // Check if this is a child session
      const session = await getSession(this.client, sessionID)
      const parentID = session.parentID as string | null | undefined
      if (parentID !== null && parentID !== undefined) {
        // Child session — update .json via childWriter
        await this.childWriter.updateChildStatus(parentID, sessionID, "error")
        await this.sessionIndexWriter.updateChildStatus(parentID, sessionID, "error")
        return
      }
      // Main session — existing behavior
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
