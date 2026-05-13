import type { DelegationEventFact } from "./event-observers.js"

/**
 * Dependencies for the delegation consumer (AC-16).
 *
 * Injected at composition time from plugin.ts:
 *  - observer: delegationEventObserver (from createDelegationEventObserver())
 *  - handleSessionIdle/handleSessionDeleted: delegationManager methods (bound)
 */
export interface DelegationConsumerDeps {
  observer: (input: { event?: unknown }) => Promise<DelegationEventFact>
  handleSessionIdle: (sessionId: string) => void
  handleSessionDeleted: (sessionId: string) => void
}

/**
 * Extracted pass-through consumer for delegation event routing (AC-16).
 *
 * Observes delegation lifecycle facts and routes them to DelegationManager
 * for idle/deleted session handling.
 *
 * @param deps - Typed dependencies injected from plugin.ts at composition time.
 * @returns An async function that receives { event } and routes delegation facts.
 */
export function createDelegationConsumer(
  deps: DelegationConsumerDeps,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }) => {
    const fact = await deps.observer({ event })
    if (fact.kind === "delegation-session-idle") {
      deps.handleSessionIdle(fact.sessionId)
    }
    if (fact.kind === "delegation-session-deleted") {
      deps.handleSessionDeleted(fact.sessionId)
    }
  }
}
