/**
 * Handles `session.deleted` — marks the session status as "completed".
 *
 * REQ-C6-01: Extracted from EventCapture god module. This handler
 * processes session.deleted events for both child and main sessions.
 *
 * @module session-tracker/capture/handlers/session-deleted-handler
 */

import { getSession } from "../../../../shared/session-api.js"
import { parseSessionTitle } from "../../../../shared/session-naming.js"
import type { HandlerDeps } from "./types.js"
import { resolveChildLifecycleRoute } from "./types.js"

export class SessionDeletedHandler {
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
        await this.deps.childWriter.updateChildStatus(childRoute.parentID, sessionID, "completed")
        await this.deps.sessionIndexWriter.updateChildStatus(childRoute.rootMainID, sessionID, "completed")
        if (this.deps.manifestWriter) {
          await this.deps.manifestWriter.updateChildStatus(childRoute.rootMainID, sessionID, "completed")
        }

        let parsedAgentName: string | undefined
        try {
          const session = await getSession(this.deps.client, sessionID)
          const title = (session as Record<string, unknown>).title as string | undefined
          if (title) {
            const parsed = parseSessionTitle(title)
            if (parsed) parsedAgentName = parsed.agent
          }
        } catch { /* session fetch failed - fall through */ }

        const pendingEntry = this.deps.pendingRegistry?.get(sessionID)
        const entry = Array.isArray(pendingEntry) ? pendingEntry[0] : pendingEntry
        const agentName = parsedAgentName ?? entry?.subagentType ?? "unknown"
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
              message: `[Harness] Session tracker: backfill failed for "${sessionID}" (deleted handler)`,
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
        status: "completed",
      } as Partial<import("../../types.js").SessionRecord>)
      this.deps.lastMessageCapture?.clearSession(sessionID)
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to handle session.deleted for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}
