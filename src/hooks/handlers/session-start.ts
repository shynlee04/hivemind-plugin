/**
 * Session-start event handler (P27.2 D-11).
 *
 * Subscribes to the plugin's `event` hook and dispatches `runSessionStartFlow`
 * when a `session.created` event fires.
 *
 * **PostToolUse proxy fallback:** Because SDK-created sessions may not fire
 * `session.created` (per `src/coordination/delegation/coordinator.ts:124`),
 * this handler exports an in-memory `sessionStartObserved` Set that the gate
 * hook (`intent-lock-gate.ts`) can check. If a session is not in the Set by
 * the first blockable tool call, the gate hook runs `runSessionStartFlow`
 * inline as a fallback.
 *
 * Per D-14: toasts are suppressed in child sessions, but questions propagate.
 * The handler only acts on root sessions (determined by the gate's layer 0
 * check).
 */

import type { OpenCodeClient } from "../../shared/session-api.js"
import { runSessionStartFlow } from "../../features/intent-lock/session-start.js"

/**
 * Tracks which sessions have had the session.created event fire.
 * The gate hook consults this Set to decide whether to run the
 * PostToolUse proxy fallback.
 */
export const sessionStartObserved = new Set<string>()

/**
 * Context captured from PostToolUse arguments for session start.
 * Maps sessionId -> user prompt for classification.
 */
export const sessionStartContext = new Map<string, { userPrompt?: string; continuityExplicit: boolean }>()

/**
 * Create the session-start event subscriber.
 *
 * @param client - OpenCode SDK client. Not directly used here (the handler
 *   dispatches `runSessionStartFlow` which is pure), but kept in the
 *   signature because the factory pattern matches the gate's dependency
 *   injection in `plugin.ts`.
 * @returns An async function suitable for the `event` hook subscription.
 */
export function createSessionStartHandler(
  _client: OpenCodeClient,
): (event: unknown) => Promise<void> {
  return async (event: unknown) => {
    const ev = event as Record<string, unknown>
    if (ev?.type !== "session.created") return

    const props = ev.properties as Record<string, unknown> | undefined
    const sessionID = (props?.sessionID as string) ?? ""

    if (!sessionID) return

    // Mark this session as observed — the gate hook's PostToolUse proxy
    // will skip its fallback for this session.
    sessionStartObserved.add(sessionID)

    // Run the session-start flow (classification + continuity detection).
    // The projectRoot is resolved from the session context; in the event
    // handler path we resolve it from the client's directory.
    const projectRoot =
      (props?.directory as string) ??
      (props?.projectRoot as string) ??
      process.cwd()

    const result = runSessionStartFlow(projectRoot, sessionID, props?.userPrompt as string | undefined)

    // Track continuity mode for soft-start behavior (D-15).
    // The CONTINUITY question is asked by the C1.3 flow (T8), not here.
    if (result.shouldAskContinuity) {
      sessionStartContext.set(sessionID, {
        userPrompt: props?.userPrompt as string | undefined,
        continuityExplicit: false, // Will be set to true on explicit "Resume"
      })
    }
  }
}
