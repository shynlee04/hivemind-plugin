/**
 * Handles `session.idle` — updates the session status to "completed".
 *
 * REQ-C6-01: Extracted from EventCapture god module. This handler
 * processes session.idle events for both child and main sessions.
 *
 * Child sessions: routes through childWriter + sessionIndexWriter.
 * Main sessions: completes session, captures lastMessage.
 *
 * @module session-tracker/capture/handlers/session-idle-handler
 */

import { getSessionMessages } from "../../../../shared/session-api.js"
import type { HandlerDeps } from "./types.js"
import { resolveChildLifecycleRoute } from "./types.js"

export class SessionIdleHandler {
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
        // REQ-25.1-03: Record trajectory completion event
        this.recordTrajectoryCompletion(sessionID).catch(() => { /* best-effort */ })
        await this.deps.backfiller.backfillChildTurnsFromSdk(childRoute.parentID, sessionID).catch((err) => {
          void this.deps.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session tracker: backfill failed for child "${sessionID}" (idle handler)`,
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
        })
        return
      }

      if (!(await this.deps.sessionWriter.sessionFileExists(sessionID))) {
        return
      }

      const lastMessageEntry = this.deps.pendingRegistry?.get(sessionID)
      let lastMessage = lastMessageEntry?.lastMessage

      if (!lastMessage && this.deps.lastMessageCapture) {
        lastMessage = this.deps.lastMessageCapture.getLastMessage(sessionID)
      }

      if (!lastMessage) {
        try {
          const messages = await getSessionMessages(this.deps.client, sessionID)
          if (messages && messages.length > 0) {
            for (let i = 0; i < messages.length; i++) {
              if (this.deps.backfiller.messageRole(messages[i]) === "assistant") {
                const text = this.deps.backfiller.extractTextFromSdkMessage(messages[i], true)
                if (text && text.trim().length > 0) {
                  const turnNumber = (this.deps.assistantTurnCounters.get(sessionID) ?? 0) + 1
                  this.deps.assistantTurnCounters.set(sessionID, turnNumber)
                  const trimmedText = text.trim()
                  await this.deps.sessionWriter.appendAssistantTurn(sessionID, turnNumber, trimmedText).catch((err) => {
                    void this.deps.client.app?.log?.({
                      body: {
                        service: "session-tracker",
                        level: "warn",
                        message: `[Harness] Session tracker: appendAssistantTurn failed for "${sessionID}" (SDK fallback)`,
                        extra: { error: err instanceof Error ? err.message : String(err) },
                      },
                    })
                  })
                  lastMessage = trimmedText
                }
              }
            }
          }
        } catch {
          // SDK call failed — proceed without lastMessage
        }
      }

      if (lastMessage && lastMessage.trim().length > 0) {
        const currentTurn = (this.deps.assistantTurnCounters.get(sessionID) ?? 0) + 1
        this.deps.assistantTurnCounters.set(sessionID, currentTurn)
        await this.deps.sessionWriter.appendAssistantTurn(sessionID, currentTurn, lastMessage).catch((err) => {
          void this.deps.client.app?.log?.({
            body: {
              service: "session-tracker",
              level: "warn",
              message: `[Harness] Session tracker: appendAssistantTurn failed for "${sessionID}"`,
              extra: { error: err instanceof Error ? err.message : String(err) },
            },
          })
        })
      }

      const updates: Record<string, unknown> = { status: "completed" }
      if (lastMessage) {
        updates.lastMessage = lastMessage
      }
      await this.deps.sessionWriter.updateFrontmatter(
        sessionID,
        updates as Partial<import("../../types.js").SessionRecord>,
      )
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Session tracker: failed to handle session.idle for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }

  /**
   * Records a trajectory completion event for a child session.
   * Best-effort: failures are logged but do not break session.idle handling.
   *
   * @param sessionID - The child session ID that completed.
   */
  private async recordTrajectoryCompletion(sessionID: string): Promise<void> {
    if (!this.deps.projectRoot) return
    try {
      const { eventTrajectory } = await import(
        "../../../../task-management/trajectory/index.js"
      )
      eventTrajectory({
        projectRoot: this.deps.projectRoot,
        trajectoryId: `traj-${sessionID}`,
        eventType: "delegation_completed",
        summary: `Child session ${sessionID} completed`,
        evidenceRef: `session-tracker:idle:${sessionID}`,
      })
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Harness] Trajectory completion event failed for ${sessionID}`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}
