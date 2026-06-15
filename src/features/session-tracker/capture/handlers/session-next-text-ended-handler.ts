/**
 * Handles `session.next.text.ended` — captures assistant text as `lastMessage`.
 *
 * REQ-C6-01: Extracted from EventCapture god module. This handler
 * processes session.next.text.ended events (currently unreachable per SDK analysis).
 *
 * @module session-tracker/capture/handlers/session-next-text-ended-handler
 */

import { asString, getNestedValue } from "../../../../shared/helpers.js"
import type { HandlerDeps } from "./types.js"
import { resolveChildLifecycleRoute } from "./types.js"

export class SessionNextTextEndedHandler {
  private deps: HandlerDeps

  constructor(deps: HandlerDeps) {
    this.deps = deps
  }

  async handle(
    sessionID: string,
    event: Record<string, unknown> | undefined,
  ): Promise<void> {
    try {
      const text = asString(getNestedValue(event, ["properties", "text"]))
      if (!text || text.trim().length === 0) {
        return
      }

      const childRoute = await resolveChildLifecycleRoute(this.deps, sessionID)
      if (childRoute) {
        return
      }

      await this.deps.sessionWriter.updateFrontmatter(sessionID, {
        lastMessage: text.trim(),
      })
    } catch (err) {
      void this.deps.client.app?.log?.({
        body: {
          service: "session-tracker",
          level: "warn",
          message: `[Hivemind] Session tracker: failed to capture lastMessage from session.next.text.ended for "${sessionID}"`,
          extra: { error: err instanceof Error ? err.message : String(err) },
        },
      })
    }
  }
}
