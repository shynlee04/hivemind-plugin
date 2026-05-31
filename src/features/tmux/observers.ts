/**
 * Hivemind Tmux event observer module.
 *
 * Provides an event observer that enriches `session.created` events with
 * Hivemind delegation metadata (agent type, delegation ID, depth) before
 * forwarding to the fork's SessionManager.
 */
import { getDelegationMeta } from "../../shared/state.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Enriched session.created event with optional Hivemind delegation metadata.
 */
export interface EnrichedSessionEvent {
  type: "session.created";
  properties: {
    info: {
      id: string;
      parentID: string | undefined;
      title: string;
      directory: string;
    };
  };
  hivemindMeta?: {
    agent: string;
    delegationId: string;
    depth: number;
  };
}

/**
 * Interface for the fork's SessionManager, which accepts enriched events.
 */
export interface ForkSessionManager {
  onSessionCreated: (event: EnrichedSessionEvent) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a Tmux event observer that enriches `session.created` events with
 * Hivemind delegation metadata and forwards them to the fork's SessionManager.
 *
 * Returns an async function matching the Hivemind `eventObservers` type:
 * `(input: { event?: unknown }) => Promise<void>`
 *
 * @param forkSessionManager - The fork's SessionManager instance
 * @returns An event observer function
 */
export function createTmuxEventObserver(
  forkSessionManager: ForkSessionManager,
): (input: { event?: unknown }) => Promise<void> {
  return async ({ event }: { event?: unknown }): Promise<void> => {
    // Guard: no event or wrong type
    if (!event || typeof event !== "object") return;

    const evt = event as Record<string, unknown>;
    if (evt.type !== "session.created") return;

    const props = evt.properties as Record<string, unknown> | undefined;
    const info = props?.info as Record<string, unknown> | undefined;
    if (!info?.id) return;

    const sessionId = String(info.id);
    const meta = getDelegationMeta(sessionId);

    const enriched: EnrichedSessionEvent = {
      type: "session.created",
      properties: {
        info: {
          id: sessionId,
          parentID: info.parentID as string | undefined,
          title: String(info.title ?? "Subagent"),
          directory: String(info.directory ?? ""),
        },
      },
      hivemindMeta: meta
        ? {
            agent: meta.agent,
            delegationId: sessionId,
            depth: meta.depth,
          }
        : undefined,
    };

    await forkSessionManager.onSessionCreated(enriched);
  };
}
