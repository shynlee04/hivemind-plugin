import { asString, getNestedValue } from "../../shared/helpers.js"
import { getEventParentID, getEventSessionID } from "../../shared/session-api.js"
import type { IntakeResult } from "../../routing/session-entry/intake-gate.js"
import { resolveIntake } from "../../routing/session-entry/intake-gate.js"

export type DelegationEventFact =
  | { kind: "delegation-session-idle"; sessionId: string }
  | { error?: string; kind: "delegation-session-error"; sessionId: string }
  | { kind: "delegation-session-deleted"; sessionId: string }
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
    if (eventType === "session.error") {
      const error = asString(getNestedValue(event, ["error"]))
      return { error, kind: "delegation-session-error", sessionId }
    }
    if (eventType === "session.deleted") {
      return { kind: "delegation-session-deleted", sessionId }
    }
    return { kind: "ignored" }
  }
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

/**
 * Creates an event observer that caches whether a session is a main (level-0) session.
 *
 * Uses OpenCode's native `parentID` field on session records (D-01).
 * Main sessions have `parentID === undefined`; child/delegated sessions have a
 * `parentID` string set by the `task` tool (D-03).
 *
 * The cached boolean is read by the `system.transform` hook via HookDependencies (D-04).
 *
 * **Timing edge case:** `system.transform` may fire before the `session.created` event
 * observer has populated the cache. To prevent silent language-injection failure,
 * `isMainSession` defaults to `true` for uncached sessions. Once the observer processes
 * the session event, the correct status is stored and subsequent lookups return
 * the accurate value.
 *
 * @returns An observer function and an `isMainSession` lookup function.
 */
export function createSessionIsMainObserver(): {
  observer: (input: { event?: unknown }) => Promise<void>
  isMainSession: (sessionId: string) => boolean
} {
  // Map<sessionId, isMain>. Empty until observer processes session.created events.
  // Uncached sessions default to true (main) to avoid blocking language injection
  // when system.transform fires before the event observer runs.
  const mainSessionCache = new Map<string, boolean>()

  const observer = async ({ event }: { event?: unknown }): Promise<void> => {
    const eventType = asString(getNestedValue(event, ["type"]))
    const sessionId = getEventSessionID(event)

    if (eventType !== "session.created" || !sessionId) {
      return
    }

    const parentID = getEventParentID(event)
    // Main sessions have NO parentID (property absent / undefined / null)
    // Child/delegated sessions have parentID set by the task tool
    mainSessionCache.set(sessionId, !parentID)
  }

  return {
    observer,
    isMainSession: (sessionId: string): boolean => {
      // If the cache has been populated for this session, use the stored value.
      // Otherwise default to true (main) — handles the timing edge case where
      // system.transform fires before the session.created event observer runs.
      if (mainSessionCache.has(sessionId)) {
        return mainSessionCache.get(sessionId)!
      }
      return true // uncached → assume main (enables language injection)
    },
  }
}
