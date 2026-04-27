import { asString, getNestedValue } from "../lib/helpers.js"
import { getEventSessionID } from "../lib/session-api.js"

export type DelegationEventFact =
  | { kind: "delegation-session-idle"; sessionId: string }
  | { kind: "delegation-session-deleted"; sessionId: string }
  | { kind: "ignored" }

export type SessionJourneyEventFact =
  | { kind: "session-journey-event"; event: unknown; source: "plugin.event" }
  | { kind: "ignored" }

/**
 * Extracts delegation lifecycle facts from OpenCode events without performing writes.
 *
 * @param input - OpenCode event hook payload.
 * @returns A delegation event fact for write-side consumers.
 */
export function createDelegationEventObserver(): (input: { event?: unknown }) => Promise<DelegationEventFact> {
  return async ({ event }) => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionId = getEventSessionID(event)

    if (!eventType || !sessionId) {
      return { kind: "ignored" }
    }
    if (eventType === "session.idle") {
      return { kind: "delegation-session-idle", sessionId }
    }
    if (eventType === "session.deleted") {
      return { kind: "delegation-session-deleted", sessionId }
    }
    return { kind: "ignored" }
  }
}

/**
 * Extracts session journey projection facts from OpenCode events without writing artifacts.
 *
 * @param shouldTrack - Predicate that classifies event-tracker-admitted events.
 * @returns A facts-only session journey event observer.
 */
export function createSessionJourneyEventObserver(
  shouldTrack: (event: unknown) => boolean,
): (input: { event?: unknown }) => Promise<SessionJourneyEventFact> {
  return async ({ event }) => shouldTrack(event)
    ? { kind: "session-journey-event", event, source: "plugin.event" }
    : { kind: "ignored" }
}
