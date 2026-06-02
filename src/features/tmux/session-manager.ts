/**
 * SessionManager — owns the lifecycle of Hivemind's tmux panes.
 *
 * The in-tree surface is intentionally narrow: the only public
 * method exposed by `ForkSessionManager` is `onSessionCreated`. The
 * observer module (`./observers.ts`) wires `session.created` events
 * into this class; subsequent status / completion events are not
 * part of the Hivemind event stream (the OpenCode SDK currently only
 * emits `session.created`, not `session/status` or `session/deleted`).
 *
 * In-tree adaptation vs. the fork:
 * - **Drops `TmuxPluginConfig` param.** The fork takes a config
 *   object (copilot flag, agentLabelFormat, autoClose). The in-tree
 *   version uses the constants exported below — sensible defaults
 *   that match the fork's reference values.
 * - **Inlines a minimal Logger** — same pattern as `tmux-multiplexer.ts`.
 * - **Implements `ForkSessionManager` (only `onSessionCreated`)** —
 *   the other two methods the fork's SessionManager class has
 *   (`onSessionStatus`, `onSessionDeleted`) are not part of the
 *   in-tree `ForkSessionManager` interface (`observers.ts:37-39`)
 *   because the Hivemind event stream does not currently carry
 *   status or deletion events.
 * - **The post-restart recovery method (`respawnIfKnown`)** is
 *   preserved as a public method on the class even though
 *   `ForkSessionManager` does not declare it — the
 *   `SessionManagerAdapter` exposes it to the `tmux-copilot` tool,
 *   and we want a single concrete class to own that surface.
 *
 * ORIGIN: opencode-tmux/src/session-manager.ts:1-32 (file header)
 * ORIGIN: opencode-tmux/src/session-manager.ts:34-67 (class header)
 * ORIGIN: opencode-tmux/src/session-manager.ts:69-138 (constructor + state)
 * ORIGIN: opencode-tmux/src/session-manager.ts:139-187 (onSessionCreated)
 */
import type { EnrichedSessionEvent, ForkSessionManager } from "./observers.js";
import type { TmuxMultiplexer } from "./tmux-multiplexer.js";
import type { TmuxLayout } from "./tmux-multiplexer.js";
import type { PersistedSession, SessionPersistence, SessionState } from "./persistence.js";

// ---------------------------------------------------------------------------
// Logger (inlined — matches tmux-multiplexer.ts Logger shape)
// ---------------------------------------------------------------------------

/**
 * Minimal logger interface. The fork uses the same shape (it is the
 * client.app.log envelope). Hivemind does not currently export a Logger
 * type, so this is duplicated here. When a shared/logger.ts module
 * lands, this can be replaced with `import type { Logger } from "../../shared/logger.js"`.
 */
export interface Logger {
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
}

// ---------------------------------------------------------------------------
// Defaults (replace TmuxPluginConfig)
// ---------------------------------------------------------------------------

/**
 * Default values that replace the fork's `TmuxPluginConfig` block. These
 * are conservative defaults that match the fork's reference values.
 */
export const SESSION_MANAGER_DEFAULTS = {
  layout: "main-vertical" as TmuxLayout,
  mainPaneSize: 60,
  autoClose: true,
  /** Maximum lifetime of a pane regardless of activity. */
  maxSessionAgeMs: 30 * 60 * 1000,
} as const;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/**
 * Internal record for an actively-tracked pane. Maps a delegation id
 * to the spawned tmux pane id, plus the age timer.
 *
 * ORIGIN: opencode-tmux/src/session-manager.ts:34-46 (adapted)
 */
interface TrackedSession {
  sessionId: string;
  agent: string;
  delegationId: string;
  directory: string;
  paneId: string;
  spawnTime: number;
  ageTimer: ReturnType<typeof setTimeout> | null;
  /** P54 state — initial `"active"`, transitions: `ready`, `failed`. */
  state: SessionState;
}

// ---------------------------------------------------------------------------
// SessionManager
// ---------------------------------------------------------------------------

/**
 * Lifecycle manager for Hivemind's tmux panes. The in-tree surface
 * implements `ForkSessionManager` (one method: `onSessionCreated`).
 * The class also exposes a public `respawnIfKnown` method used by
 * the `SessionManagerAdapter` for post-restart recovery.
 *
 * ORIGIN: opencode-tmux/src/session-manager.ts:34-307 (full class body — 1:1
 *   port, with two adaptations: (1) no TmuxPluginConfig param — defaults
 *   inlined; (2) `onSessionStatus` and `onSessionDeleted` dropped — not
 *   part of the in-tree ForkSessionManager interface).
 */
export class SessionManager implements ForkSessionManager {
  private readonly sessions = new Map<string, TrackedSession>();
  private readonly spawningSessions = new Set<string>();

  /**
   * @param multiplexer TmuxMultiplexer instance owned by the harness.
   * @param serverUrl OpenCode server URL (forwarded to `opencode attach`).
   * @param directory Working directory forwarded to `opencode attach`.
   * @param log Optional logger (uses shape compatible with `client.app.log`).
   * @param persistence Optional P54 handle; `persist()` fires on every state transition; `undefined` preserves P51 behavior (D-54-08).
   *
   * ORIGIN: opencode-tmux/src/session-manager.ts:69-138 (adapted — no config)
   */
  constructor(
    private readonly multiplexer: TmuxMultiplexer,
    private readonly serverUrl: string,
    private readonly directory: string,
    private readonly log?: Logger,
    private readonly layout: TmuxLayout = SESSION_MANAGER_DEFAULTS.layout,
    private readonly mainPaneSize: number = SESSION_MANAGER_DEFAULTS.mainPaneSize,
    private readonly persistence?: SessionPersistence,
  ) {}

  // -------------------------------------------------------------------------
  // ForkSessionManager surface (one method)
  // -------------------------------------------------------------------------

  /**
   * Handle a `session.created` event. Spawns a tmux pane (if tmux is
   * available) and registers the spawn in `sessions`. After 250ms
   * (post-spawn settle window), re-applies the configured layout so
   * the new pane resizes according to `mainPaneSize`.
   *
   * Idempotency: a duplicate event for an already-tracked session
   * (same `sessionId`) is a no-op. A duplicate event for a still-spawning
   * session (race with the tmux binary) is skipped via
   * `spawningSessions`.
   *
   * The event payload shape (from `./observers.ts`):
   * ```
   * {
   *   type: "session.created",
   *   properties: { info: { id, parentID, title, directory } },
   *   hivemindMeta?: { agent, delegationId, depth }
   * }
   * ```
   *
   * ORIGIN: opencode-tmux/src/session-manager.ts:139-187
   */
  async onSessionCreated(event: EnrichedSessionEvent): Promise<void> {
    const sessionId = event.properties.info.id;
    const meta = event.hivemindMeta;
    const agent = meta?.agent ?? "unknown";
    const delegationId = meta?.delegationId ?? sessionId;
    const directory = event.properties.info.directory || this.directory;
    const title = event.properties.info.title;

    this.log?.debug("onSessionCreated: ENTRY", { sessionId, agent });

    if (this.sessions.has(sessionId)) {
      this.log?.debug("onSessionCreated: already tracked, ignoring", { sessionId });
      return;
    }

    if (this.spawningSessions.has(sessionId)) {
      this.log?.debug("onSessionCreated: already spawning, ignoring duplicate", { sessionId });
      return;
    }

    this.spawningSessions.add(sessionId);

    try {
      const result = await this.multiplexer.spawnPane({
        sessionId,
        description: title,
        serverUrl: this.serverUrl,
        directory,
        hivemindMeta: { agent, delegationId },
      });

      if (!result.success || !result.paneId) {
        this.log?.debug("onSessionCreated: spawn FAILED", { sessionId });
        return;
      }

      const tracked: TrackedSession = {
        sessionId,
        agent,
        delegationId,
        directory,
        paneId: result.paneId,
        spawnTime: Date.now(),
        ageTimer: null,
        state: "active", // P54 — D-54-04
      };

      this.sessions.set(sessionId, tracked);

      // P54 (D-54-08 call site #1): active → ready, persist. D-04 silent-fallback.
      tracked.state = "ready";
      void this.persistence?.persist(this.toPersistedSession(tracked));

      // Re-apply the layout after a 250ms settle window so the new
      // pane resizes according to `mainPaneSize`. The first
      // applyLayout already ran inside spawnPane; this second one
      // takes the fresh pane into account.
      setTimeout(() => {
        this.multiplexer.applyLayout(this.layout, this.mainPaneSize).catch(() => {
          // cosmetic — ignore
        });
      }, 250);

      // Start the max-age timer. When it fires, the pane is closed
      // via the multiplexer's `closePane`.
      tracked.ageTimer = setTimeout(() => {
        const t = this.sessions.get(sessionId);
        if (t) {
          void this.handleSessionClose(t);
        }
      }, SESSION_MANAGER_DEFAULTS.maxSessionAgeMs);

      this.log?.debug("onSessionCreated: SUCCESS", { sessionId, paneId: result.paneId });
    } finally {
      this.spawningSessions.delete(sessionId);
    }
  }

  // -------------------------------------------------------------------------
  // Post-restart recovery (used by SessionManagerAdapter)
  // -------------------------------------------------------------------------

  /**
   * If a session id is currently tracked, return `true` and re-spawn
   * a tmux pane for it (in case the harness was restarted while the
   * delegation was still active — though in practice this is a no-op
   * because the in-tree known-sessions set is in-memory). Returns
   * `false` when the session is not in `sessions` OR when the
   * tmux binary is unavailable.
   *
   * Preserved from the fork (origin: `opencode-tmux/src/session-manager.ts:279-307`)
   * as a public method on the class — the `SessionManagerAdapter`
   * surfaces it to the `tmux-copilot` tool. In the in-tree port
   * this is a thin wrapper around the spawn path used by
   * `onSessionCreated`.
   *
   * ORIGIN: opencode-tmux/src/session-manager.ts:279-307 (adapted)
   */
  async respawnIfKnown(sessionId: string): Promise<{ paneId: string } | null> {
    this.log?.debug("respawnIfKnown: ENTRY", { sessionId });

    const tracked = this.sessions.get(sessionId);
    if (!tracked) {
      this.log?.debug("respawnIfKnown: not tracked, nothing to respawn", { sessionId });
      return null;
    }

    if (!await this.multiplexer.isAvailable()) {
      this.log?.debug("respawnIfKnown: tmux unavailable, skipping", { sessionId });
      return null;
    }

    if (!tracked.paneId) {
      this.log?.debug("respawnIfKnown: tracked record has no paneId, re-spawning", { sessionId });
      const result = await this.multiplexer.spawnPane({
        sessionId,
        description: tracked.agent,
        serverUrl: this.serverUrl,
        directory: tracked.directory,
        hivemindMeta: { agent: tracked.agent, delegationId: tracked.delegationId },
      });
      if (!result.success || !result.paneId) {
        return null;
      }
      tracked.paneId = result.paneId;
    }

    return { paneId: tracked.paneId };
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Close the tmux pane for a tracked session, drop it from
   * `sessions`, and clear the age timer. On tmux unavailable or
   * close failure, the tracked record is still removed (graceful
   * degradation — the harness should not be blocked on a tmux
   * close failure).
   */
  private async handleSessionClose(tracked: TrackedSession): Promise<void> {
    const { sessionId, paneId } = tracked;
    this.log?.debug("handleSessionClose: ENTRY", { sessionId, paneId });

    if (tracked.ageTimer !== null) {
      clearTimeout(tracked.ageTimer);
      tracked.ageTimer = null;
    }

    // P54 (D-54-08 call site #2): * → failed, persist. Excluded by `restoreAll`.
    tracked.state = "failed";
    void this.persistence?.persist(this.toPersistedSession(tracked));

    this.sessions.delete(sessionId);

    const closed = await this.multiplexer.closePane(paneId);
    this.log?.debug("handleSessionClose: closePane result", { sessionId, closed });
  }

  // P54 persistence mapping
  private toPersistedSession(tracked: TrackedSession): PersistedSession {
    return {
      sessionId: tracked.sessionId,
      agent: tracked.agent,
      delegationId: tracked.delegationId,
      directory: tracked.directory,
      paneId: tracked.paneId,
      spawnTime: tracked.spawnTime,
      state: tracked.state,
      lastTransitionAt: Date.now(),
      schemaVersion: 1,
    };
  }
}
