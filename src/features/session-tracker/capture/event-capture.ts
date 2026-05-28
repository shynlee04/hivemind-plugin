/**
 * Session lifecycle event capture handler — thin router.
 *
 * REQ-C6-01: Reduced from 1050 LOC to ≤200 LOC. Delegates all event
 * handling to dedicated handler classes under handlers/.
 *
 * @module session-tracker/capture/event-capture
 */

import type { OpenCodeClient } from "../../../shared/session-api.js"
import type { SessionWriter } from "../persistence/session-writer.js"
import type { ChildWriter } from "../persistence/child-writer.js"
import type { SessionIndexWriter } from "../persistence/session-index-writer.js"
import type { ProjectIndexWriter } from "../persistence/project-index-writer.js"
import type { HierarchyIndex } from "../persistence/hierarchy-index.js"
import type { PendingDispatchRegistry } from "../persistence/pending-dispatch-registry.js"
import type { HierarchyManifestWriter } from "../persistence/hierarchy-manifest.js"
import type { LastMessageCapture } from "./last-message-capture.js"
import { ChildBackfiller } from "./child-backfiller.js"
import { sanitizeSessionID } from "../persistence/atomic-write.js"
import { isValidSessionID } from "../types.js"
import type { JourneyEntry } from "../types.js"
import { getSession } from "../../../shared/session-api.js"
import type { HandlerDeps } from "./handlers/types.js"

import { SessionCreatedHandler } from "./handlers/session-created-handler.js"
import { SessionIdleHandler } from "./handlers/session-idle-handler.js"
import { SessionDeletedHandler } from "./handlers/session-deleted-handler.js"
import { SessionErrorHandler } from "./handlers/session-error-handler.js"
import { SessionCompactedHandler } from "./handlers/session-compacted-handler.js"
import { SessionNextTextEndedHandler } from "./handlers/session-next-text-ended-handler.js"

// ---------------------------------------------------------------------------
// Handler interface
// ---------------------------------------------------------------------------

interface EventHandler {
  handle(sessionID: string, event?: Record<string, unknown>): Promise<void>
}

// ---------------------------------------------------------------------------
// EventCapture — thin router
// ---------------------------------------------------------------------------

export class EventCapture {
  private deps: HandlerDeps
  private handlers: Record<string, EventHandler>

  constructor(deps: {
    client: OpenCodeClient
    sessionWriter: SessionWriter
    childWriter: ChildWriter
    sessionIndexWriter: SessionIndexWriter
    projectIndexWriter?: ProjectIndexWriter
    hierarchyIndex?: HierarchyIndex
    pendingRegistry?: PendingDispatchRegistry
    manifestWriter?: HierarchyManifestWriter
    lastMessageCapture?: LastMessageCapture
  }) {
    const backfiller = new ChildBackfiller({ client: deps.client, childWriter: deps.childWriter })
    const assistantTurnCounters = new Map<string, number>()

    this.deps = {
      ...deps,
      backfiller,
      assistantTurnCounters,
    }

    this.handlers = {
      "session.created": new SessionCreatedHandler(this.deps),
      "session.idle": new SessionIdleHandler(this.deps),
      "session.deleted": new SessionDeletedHandler(this.deps),
      "session.error": new SessionErrorHandler(this.deps),
      "session.compacted": new SessionCompactedHandler(this.deps),
      "session.next.compaction.ended": new SessionCompactedHandler(this.deps),
      "session.next.text.ended": new SessionNextTextEndedHandler(this.deps),
    }
  }

  async handleSessionEvent(event: {
    eventType: string
    sessionID: string
    event: unknown
  }): Promise<void> {
    try {
      if (!event?.sessionID || !isValidSessionID(event.sessionID)) {
        return
      }

      if (event.sessionID !== sanitizeSessionID(event.sessionID)) {
        void this.deps.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: `[Harness] Session tracker: sessionID contains unsafe characters: "${event.sessionID}"`,
          },
        })
        return
      }

      const handler = this.handlers[event.eventType]
      if (handler) {
        await handler.handle(event.sessionID, event.event as Record<string, unknown>)
      } else {
        void this.deps.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "warn",
            message: `[Harness] Session tracker: unknown event type "${event.eventType}"`,
          },
        })
      }
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: "[Harness] Session tracker: event handler failed",
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  async recordJourneyEntry(
    sessionID: string,
    entry: JourneyEntry,
  ): Promise<void> {
    try {
      if (!isValidSessionID(sessionID)) return

      let parentID: string | null | undefined
      try {
        const session = await getSession(this.deps.client, sessionID)
        parentID = session.parentID as string | null | undefined
      } catch {
        parentID = null
      }

      if (parentID) {
        if (!(await this.deps.childWriter.childFileExists(parentID, sessionID))) {
          return
        }
        await this.deps.childWriter.appendJourneyEntry(parentID, sessionID, entry)
      } else {
        if (!(await this.deps.sessionWriter.sessionFileExists(sessionID))) {
          return
        }
        await this.deps.sessionWriter.appendJourneyEntry(sessionID, entry)
      }
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: journey recording failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}
