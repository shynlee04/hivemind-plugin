/**
 * Extracted pass-through consumer for main-session event observation (AC-15).
 *
 * Delegates to the is-main-session observer factory and silently catches errors.
 * Best-effort isMainSession caching — never blocks canonical event handling.
 *
 * @param observer - The is-main-session observer function (sessionIsMainObserverFactory.observer from plugin.ts).
 * @returns An async function that receives { event } and forwards to the observer.
 */
export function createSessionMainConsumer(
  observer: (input: { event?: unknown }) => Promise<void>,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    try {
      await observer({ event })
    } catch {
      // Best-effort isMainSession caching: never block canonical event handling.
    }
  }
}
