import type { SessionEntryEventFact } from "./event-observers.js"

/**
 * Extracted pass-through consumer for session-entry event observation (AC-14).
 *
 * Delegates to the session-entry observer factory and silently catches errors.
 * Best-effort intake classification — never blocks canonical event handling.
 *
 * @param observer - The session entry observer function (sessionEntryObserverFactory.observer from plugin.ts).
 * @returns An async function that receives { event } and forwards to the observer.
 */
export function createSessionEntryConsumer(
  observer: (input: { event?: unknown }) => Promise<SessionEntryEventFact>,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      await observer({ event })
    } catch {
      // Best-effort intake classification: never block canonical event handling.
    }
  }
}
