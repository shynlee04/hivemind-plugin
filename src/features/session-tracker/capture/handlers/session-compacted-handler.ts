/**
 * Handles `session.compacted` — writes a compaction block to the session .md file.
 *
 * REQ-C6-01: Extracted from EventCapture god module. This handler
 * processes session.compacted events with event payload summary
 * and message history fallback.
 *
 * @module session-tracker/capture/handlers/session-compacted-handler
 */

import type { HandlerDeps } from "./types.js"
import { resolveChildLifecycleRoute, findCompactionText, resolveCompactionFromMessages } from "./types.js"

export class SessionCompactedHandler {
  private deps: HandlerDeps

  constructor(deps: HandlerDeps) {
    this.deps = deps
  }

  async handle(
    sessionID: string,
    event: Record<string, unknown> | undefined,
  ): Promise<void> {
    try {
      const now = new Date().toISOString()
      let compactContext: string

      const eventSummary = findCompactionText(event)
      if (eventSummary) {
        compactContext = `**compact_summary:**\n\n${eventSummary}\n`
      } else {
        compactContext = await resolveCompactionFromMessages(this.deps, sessionID)
      }
      const section =
        `## COMPACTED (${now})\n\n` +
        compactContext +
        `\n**Continuity index:** See \`session-continuity.json\` for active delegations and pending work at time of compaction.\n`

      const childRoute = await resolveChildLifecycleRoute(this.deps, sessionID)
      if (childRoute) {
        if (!(await this.deps.childWriter.childFileExists(childRoute.parentID, sessionID))) {
          return
        }
        await this.deps.childWriter.appendJourneyEntry(childRoute.parentID, sessionID, {
          timestamp: now,
          type: "session_compacted",
          content: compactContext,
          metadata: { capturedFrom: "session.compacted" },
        })
        return
      }

      await this.deps.sessionWriter.appendCompactionBlock(sessionID, section)
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Hivemind] Session tracker: compaction capture failed for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}
