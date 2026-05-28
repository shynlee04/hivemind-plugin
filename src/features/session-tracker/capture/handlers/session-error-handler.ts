/**
 * Handles `session.error` — marks the session status as "error".
 *
 * REQ-C6-01: Extracted from EventCapture god module. This handler
 * processes session.error events for both child and main sessions.
 *
 * @module session-tracker/capture/handlers/session-error-handler
 */

import type { HandlerDeps } from "./types.js"
import { resolveChildLifecycleRoute } from "./types.js"

export class SessionErrorHandler {
  private deps: HandlerDeps

  constructor(deps: HandlerDeps) {
    this.deps = deps
  }

  async handle(sessionID: string): Promise<void> {
    try {
      const childRoute = await resolveChildLifecycleRoute(this.deps, sessionID)
      if (childRoute) {
        if (!(await this.deps.childWriter.childFileExists(childRoute.parentID, sessionID))) {
          return
        }
        await this.deps.childWriter.updateChildStatus(childRoute.parentID, sessionID, "error")
        await this.deps.sessionIndexWriter.updateChildStatus(childRoute.rootMainID, sessionID, "error")
        if (this.deps.manifestWriter) {
          await this.deps.manifestWriter.updateChildStatus(childRoute.rootMainID, sessionID, "error")
        }

        const pendingEntry = this.deps.pendingRegistry?.get(sessionID)
        const entry = Array.isArray(pendingEntry) ? pendingEntry[0] : pendingEntry
        const agentName = entry?.subagentType ?? "unknown"
        const model = entry?.model ?? ""
        await this.deps.childWriter.backfillChildMetadata(
          childRoute.parentID,
          sessionID,
          { agentName, model },
        ).catch((err) => {
          void this.deps.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session tracker: backfill failed for "${sessionID}"`,
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
        })
        await this.deps.backfiller.backfillChildTurnsFromSdk(childRoute.parentID, sessionID).catch((err) => {
          void this.deps.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session tracker: backfill failed for "${sessionID}" (error handler)`,
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
        })
        return
      }

      if (!(await this.deps.sessionWriter.sessionFileExists(sessionID))) {
        return
      }
      await this.deps.sessionWriter.updateFrontmatter(sessionID, {
        status: "error",
      } as Partial<import("../../types.js").SessionRecord>)
      this.deps.lastMessageCapture?.clearSession(sessionID)
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to handle session.error for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}
