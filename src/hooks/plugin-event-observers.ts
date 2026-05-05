import { asString, getNestedValue } from "../lib/helpers.js"
import { getEventSessionID } from "../lib/session-api.js"
import type { IntakeResult } from "../lib/session-entry/intake-gate.js"
import { resolveIntake } from "../lib/session-entry/intake-gate.js"

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

/** Fact emitted by the session-entry event observer. */
export type SessionEntryEventFact =
  | { kind: "session-created"; sessionId: string; intake: IntakeResult }
  | { kind: "ignored" }

/**
 * Creates an event observer that classifies session intake on session.created events.
 *
 * Extracts the initial user message from the event, runs it through `resolveIntake()`
 * to classify purpose, detect language, and resolve the developer profile, and stores
 * the result in an in-memory cache keyed by session ID for later retrieval by the
 * system.transform hook.
 *
 * @returns An observer function and a `getIntake` lookup function.
 */
export function createSessionEntryEventObserver(): {
  observer: (input: { event?: unknown }) => Promise<SessionEntryEventFact>
  getIntake: (sessionId: string) => IntakeResult | undefined
} {
  const intakeCache = new Map<string, IntakeResult>()

  const observer = async ({ event }: { event?: unknown }): Promise<SessionEntryEventFact> => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionId = getEventSessionID(event)

    if (eventType !== "session.created" || !sessionId) {
      return { kind: "ignored" }
    }

    // Extract initial user message for purpose classification
    const messages = getNestedValue(event, ["messages"]) as Array<{ role: string; content: string }> | undefined
    const userMessage = messages?.find(m => m.role === "user")?.content ?? ""

    const intake = resolveIntake(userMessage)
    intakeCache.set(sessionId, intake)

    return { kind: "session-created", sessionId, intake }
  }

  return { observer, getIntake: (sessionId: string) => intakeCache.get(sessionId) }
}
