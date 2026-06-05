/**
 * Hivemind Tmux event observer module.
 *
 * Provides an event observer that enriches `session.created` events with
 * Hivemind delegation metadata (agent type, delegation ID, depth) before
 * forwarding to the fork's SessionManager, and exposes subscription hooks
 * for `session-state-changed` and `pane-captured` events (Phase 52).
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
// Phase 52: Extended event types for observability
// ---------------------------------------------------------------------------

/**
 * Union of all tmux event types the observer can handle.
 * - `session.created` — existing, enriched with delegation metadata
 * - `session-state-changed` — Phase 52: session lifecycle transitions
 * - `pane-captured` — Phase 52: pane output capture events
 */
export type TmuxEventType = "session.created" | "session-state-changed" | "pane-captured";

/**
 * Payload for `session-state-changed` events. Carries the previous and
 * current state of a delegation session so subscribers can react to
 * lifecycle transitions (e.g., session creation, completion, error).
 */
export interface SessionStateChangedEvent {
  type: "session-state-changed";
  sessionId: string;
  previousState: string;
  currentState: string;
  timestamp: number;
}

/**
 * Payload for `pane-captured` events. Carries metadata about a tmux pane
 * output capture so subscribers can log, aggregate, or forward the content
 * size information.
 *
 * P58.9 REQ-58.9-01: the optional `content` field is added so subscribers
 * (the P53 pane-monitor hook at `src/hooks/pane-monitor.ts`) can write the
 * full pane content as a sibling `<ts>-pane-content.txt` next to the 7-field
 * `<ts>-pane.json` journal entry. Existing subscribers (none currently
 * beyond the P53 hook) read only metadata and are unaffected by the
 * addition — `content` is OPTIONAL.
 */
export interface PaneCapturedEvent {
  type: "pane-captured";
  sessionId: string;
  paneId: string;
  contentLength: number;
  timestamp: number;
  /** P58.9: optional full content of the captured pane. */
  content?: string;
}

/**
 * P58.9 REQ-58.9-01: minimal observer interface implemented by anything that
 * wants to receive `pane-captured` events from `SessionManager.startPolling`.
 * Kept as a separate, narrower interface than `TmuxEventObserver` because
 * the SessionManager only needs the `onPaneCaptured` callback — it does not
 * need the full observer with `onSessionStateChanged` etc. This lets
 * `SessionManager.setObserver(...)` accept a small adapter without
 * requiring a full TmuxEventObserver.
 */
export interface PaneObserver {
  onPaneCaptured: (event: PaneCapturedEvent) => void;
}

// ---------------------------------------------------------------------------
// Observer return type (function + registration methods)
// ---------------------------------------------------------------------------

/**
 * The return type of `createTmuxEventObserver`. The primary value is an
 * async function matching Hivemind's `eventObservers` contract. Two
 * registration methods are attached for Phase 52 event subscriptions.
 */
export interface TmuxEventObserver {
  (input: { event?: unknown }): Promise<void>;

  /**
   * Register a callback for `session-state-changed` events. Multiple
   * callbacks can be registered — they are invoked in registration order.
   */
  onSessionStateChanged: (cb: (event: SessionStateChangedEvent) => void) => void;

  /**
   * Register a callback for `pane-captured` events. Multiple callbacks
   * can be registered — they are invoked in registration order.
   */
  onPaneCaptured: (cb: (event: PaneCapturedEvent) => void) => void;
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
 * Phase 52 extension: the returned observer also exposes
 * `onSessionStateChanged()` and `onPaneCaptured()` registration methods
 * so downstream consumers can subscribe to lifecycle and capture events.
 *
 * @param forkSessionManager - The fork's SessionManager instance
 * @returns A TmuxEventObserver (function + registration methods)
 */
export function createTmuxEventObserver(
  forkSessionManager: ForkSessionManager,
): TmuxEventObserver {
  // Phase 52: listener registries for new event types
  const stateChangeListeners: Array<(event: SessionStateChangedEvent) => void> = [];
  const paneCaptureListeners: Array<(event: PaneCapturedEvent) => void> = [];

  const observer = (async ({ event }: { event?: unknown }): Promise<void> => {
    // Guard: no event or wrong type
    if (!event || typeof event !== "object") return;

    const evt = event as Record<string, unknown>;
    const eventType = evt.type as string | undefined;

    // Phase 52: dispatch session-state-changed events to registered listeners
    if (eventType === "session-state-changed") {
      const payload = evt as unknown as SessionStateChangedEvent;
      for (const listener of stateChangeListeners) {
        try {
          listener(payload);
        } catch {
          // Swallow per-listener errors so one bad listener does not
          // break the chain.
        }
      }
      return; // session-state-changed is NOT forwarded to the SessionManager
    }

    // Phase 52: dispatch pane-captured events to registered listeners
    if (eventType === "pane-captured") {
      const payload = evt as unknown as PaneCapturedEvent;
      for (const listener of paneCaptureListeners) {
        try {
          listener(payload);
        } catch {
          // Swallow per-listener errors.
        }
      }
      return; // pane-captured is NOT forwarded to the SessionManager
    }

    // Existing behavior: enrich and forward session.created events
    if (eventType !== "session.created") return;

    const props = evt.properties as Record<string, unknown> | undefined;
    const info = props?.info as Record<string, unknown> | undefined;
    if (!info?.id) return;

    const sessionId = String(info.id);
    const meta = getDelegationMeta(sessionId);

    // Only forward sessions that have Hivemind delegation metadata.
    // Sessions without metadata (e.g. `opencode attach` client sessions)
    // are system-level — they are already running inside a tmux pane
    // and should NOT spawn another pane of their own.
    if (!meta) return;

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
      hivemindMeta: {
        agent: meta.agent,
        delegationId: sessionId,
        depth: meta.depth,
      },
    };

    await forkSessionManager.onSessionCreated(enriched);
  }) as TmuxEventObserver;

  // Phase 52: attach registration methods
  observer.onSessionStateChanged = (cb: (event: SessionStateChangedEvent) => void): void => {
    stateChangeListeners.push(cb);
  };

  observer.onPaneCaptured = (cb: (event: PaneCapturedEvent) => void): void => {
    paneCaptureListeners.push(cb);
  };

  return observer;
}
