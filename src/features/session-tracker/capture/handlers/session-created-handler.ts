/**
 * Handles `session.created` — creates subdir + .md for root sessions only.
 *
 * REQ-C6-01: Extracted from EventCapture god module. This handler
 * processes session.created events with gate classification logic.
 *
 * @module session-tracker/capture/handlers/session-created-handler
 */

import { getSession } from "../../../../shared/session-api.js"
import type { HandlerDeps } from "./types.js"
import { writeImmediateChildFile } from "./types.js"

export class SessionCreatedHandler {
  private deps: HandlerDeps

  constructor(deps: HandlerDeps) {
    this.deps = deps
  }

  async handle(sessionID: string): Promise<void> {
    try {
      const anyPending = this.deps.pendingRegistry?.getAnyActiveEntry()
      if (anyPending) {
        void this.deps.client.app?.log?.({
          body: {
            service: "session-tracker",
            level: "info",
            message: `[Hivemind] Session tracker: Gate 0 classification — pending dispatch detected for "${sessionID}"`,
          },
        })
        await writeImmediateChildFile(
          this.deps,
          sessionID,
          anyPending.parentSessionID,
          anyPending.subagentType,
          anyPending.delegationDepth,
        )
        return
      }

      let parentID: string | null | undefined
      let sessionTitle: string | undefined
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const session = await getSession(this.deps.client, sessionID)
          parentID = session.parentID as string | null | undefined
          sessionTitle = (session as Record<string, unknown>).title as string | undefined
          if (parentID) break
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 100))
          }
        } catch {
          break
        }
      }

      if (parentID != null) {
        await writeImmediateChildFile(this.deps, sessionID, parentID)
        return
      }

      if (this.deps.hierarchyIndex?.isChild(sessionID)) {
        const resolvedParent = this.deps.hierarchyIndex.getParent(sessionID)
        if (resolvedParent) {
          await writeImmediateChildFile(this.deps, sessionID, resolvedParent)
        }
        return
      }

      if (this.deps.pendingRegistry?.has(sessionID)) {
        const pendingEntry = this.deps.pendingRegistry.get(sessionID)
        const effectiveParent = pendingEntry?.parentSessionID
        if (effectiveParent) {
          await writeImmediateChildFile(this.deps, sessionID, effectiveParent, pendingEntry?.subagentType)
        }
        return
      }

      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "info",
          message: `[Hivemind] Session tracker: creating root main session directory for "${sessionID}"`,
        },
      })

      await this.deps.sessionWriter.createSessionDir(sessionID)
      await this.deps.sessionWriter.initializeSessionFile(sessionID, {
        sessionID,
        parentSessionID: null,
        delegationDepth: 0,
        status: "active",
        title: sessionTitle,
      })

      if (this.deps.projectIndexWriter) {
        await this.deps.projectIndexWriter.addSession(
          sessionID,
          `${sessionID}/`,
          `${sessionID}.md`,
        )
      }
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Hivemind] Session tracker: failed to handle session.created for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}
