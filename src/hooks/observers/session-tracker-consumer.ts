import { getEventSessionID } from "../../shared/session-api.js"
import type { SessionTracker } from "../../features/session-tracker/index.js"

/**
 * Dependencies for the session tracker consumer (AC-17).
 *
 * Injected at composition time from plugin.ts:
 *  - sessionTracker: SessionTracker instance
 *  - logWarn: optional logging callback (wraps client.app?.log?.())
 */
export interface SessionTrackerConsumerDeps {
  sessionTracker: Pick<SessionTracker, "handleSessionEvent">
  logWarn?: (message: string, error: unknown) => void
}

/**
 * Extracted pass-through consumer for session-tracker event routing (AC-17).
 *
 * Extracts eventType and sessionID from hook events and routes them to
 * sessionTracker.handleSessionEvent() for persistence. Best-effort —
 * errors are caught and logged, never thrown to the runtime.
 *
 * @param deps - Typed dependencies injected from plugin.ts at composition time.
 * @returns An async function that receives { event } and routes to sessionTracker.
 */
export function createSessionTrackerConsumer(
  deps: SessionTrackerConsumerDeps,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      const ev = event as Record<string, unknown> | undefined
      const eventType = (ev?.type as string) || (ev?.eventType as string) || "unknown"
      const sessionID = getEventSessionID(ev) || ""
      if (sessionID) {
        await deps.sessionTracker.handleSessionEvent({ eventType, sessionID, event: ev })
      }
    } catch (err) {
      deps.logWarn?.("[Hivemind] Session tracker event observer failed", err)
    }
  }
}
