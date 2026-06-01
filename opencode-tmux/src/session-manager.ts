import type { PluginInput } from "@opencode-ai/plugin";
import type {
  EventSessionCreated,
  EventSessionStatus,
  EventSessionDeleted,
} from "@opencode-ai/sdk";
import type { TmuxPluginConfig } from "./config";
import type { TmuxMultiplexer } from "./tmux";
import { createLogger, type Logger } from "./util";

// Enriched event shape: Hivemind-side observer can inject delegation metadata
// before the fork's SessionManager processes the event.
interface EnrichedSessionEvent extends EventSessionCreated {
  hivemindMeta?: {
    agent: string;
    delegationId: string;
    depth: number;
  };
}

interface TrackedSession {
  sessionId: string;
  paneId: string;
  parentId: string;
  title: string;
  directory: string;
}

interface KnownSession {
  parentId: string;
  title: string;
  directory: string;
  // Hivemind delegation metadata captured from enriched event. Persisted
  // here so respawnIfKnown can reconstruct the same pane identity
  // (agent label, title format) after an idle close + busy re-open.
  hivemindMeta?: { agent: string; delegationId: string; depth: number };
}

export class SessionManager {
  private client: PluginInput["client"];
  private log: Logger;
  private serverUrl: string;
  private directory: string;
  private sessions = new Map<string, TrackedSession>();
  private knownSessions = new Map<string, KnownSession>();
  private spawningSessions = new Set<string>();
  private spawnedSessions = new Set<string>();
  // Sessions whose pane was auto-closed (idle/timeout) and may be re-spawned on busy
  private closedSessions = new Set<string>();
  // Sessions that went idle while their pane was still spawning
  private pendingClose = new Set<string>();
  readonly enabled: boolean;

  constructor(
    private input: PluginInput,
    private config: TmuxPluginConfig,
    private tmux: TmuxMultiplexer,
  ) {
    this.client = input.client;
    this.log = createLogger(input.client, "session-manager");
    this.directory = input.directory;
    // serverUrl is a URL object in PluginInput
    this.serverUrl = input.serverUrl.toString();
    this.enabled = tmux.isInsideSession();

    this.log.debug("initialized", { enabled: this.enabled, serverUrl: this.serverUrl });
  }

  async onSessionCreated(event: EventSessionCreated): Promise<void> {
    if (!this.enabled) return;

    const info = event.properties.info;
    const isChildSession = !!info.parentID;

    // Config-controlled parentID guard: in default mode (copilot=false),
    // skip non-child sessions. In copilot mode, proceed for all sessions.
    if (!this.config.copilot && !isChildSession) return;

    const sessionId = info.id;
    const parentId = info.parentID ?? "";
    const title = info.title ?? "Subagent";
    const directory = info.directory ?? this.directory;

    // Extract Hivemind metadata if present (enriched event shape)
    const hivemindMeta = (event as EnrichedSessionEvent).hivemindMeta;

    this.knownSessions.set(sessionId, { parentId, title, directory, hivemindMeta });

    if (this.isTrackedOrSpawning(sessionId)) {
      this.log.debug("session already tracked or spawning", { sessionId });
      return;
    }

    if (this.spawnedSessions.has(sessionId)) {
      this.log.debug("session already spawned (dedup guard)", { sessionId });
      return;
    }

    this.spawningSessions.add(sessionId);

    try {
      const serverRunning = await this.isServerRunning();
      if (!serverRunning) {
        this.log.debug("server not running, skipping spawn", { sessionId });
        return;
      }

      // Format title with agent metadata if available
      let paneTitle = title;
      if (hivemindMeta && this.config.agentLabelFormat) {
        paneTitle = this.config.agentLabelFormat
          .replace(/\{agentType\}/g, hivemindMeta.agent)
          .replace(/\{delegationId\}/g, hivemindMeta.delegationId);
      }

      const result = await this.tmux.spawnPane({
        sessionId,
        description: paneTitle,
        serverUrl: this.serverUrl,
        directory,
        binaryPath: this.config.opencodeBinaryPath,
        hivemindMeta,
      });

      if (result.success && result.paneId) {
        this.sessions.set(sessionId, {
          sessionId,
          paneId: result.paneId,
          parentId,
          title,
          directory,
        });
        this.closedSessions.delete(sessionId);
        this.spawnedSessions.add(sessionId);
        this.log.debug("session spawned", { sessionId, paneId: result.paneId });

        // #3: idle event arrived while we were spawning — close immediately
        if (this.pendingClose.has(sessionId)) {
          this.pendingClose.delete(sessionId);
          this.log.debug("closing session that went idle during spawn", { sessionId });
          await this.closeSession(sessionId, true);
        }
      }
    } finally {
      this.spawningSessions.delete(sessionId);
    }
  }

  async onSessionStatus(event: EventSessionStatus): Promise<void> {
    if (!this.enabled) return;

    const sessionId = event.properties.sessionID;
    const status = event.properties.status;
    this.log.debug("session.status", { sessionId, statusType: status.type });

    if (status.type === "idle" && this.config.autoClose) {
      if (this.spawningSessions.has(sessionId)) {
        // #3: pane still spawning — defer close until spawn completes
        this.log.debug("session went idle during spawn, deferring close", { sessionId });
        this.pendingClose.add(sessionId);
      } else {
        await this.closeSession(sessionId, true);
      }
    } else if (status.type === "busy") {
      // #2: only respawn if we explicitly auto-closed this session before
      if (this.closedSessions.has(sessionId)) {
        await this.respawnIfKnown(sessionId);
      }
    }
  }

  async onSessionDeleted(event: EventSessionDeleted): Promise<void> {
    if (!this.enabled) return;

    const sessionId = event.properties.info.id;
    this.log.debug("session.deleted", { sessionId });
    // #2: deleted sessions must not respawn — pass autoClose=false
    await this.closeSession(sessionId, false);
    this.knownSessions.delete(sessionId);
    this.closedSessions.delete(sessionId);
    this.pendingClose.delete(sessionId);
    this.spawnedSessions.delete(sessionId);
  }

  /**
   * Close all tracked panes.
   * Best-effort: OpenCode plugin API does not expose a lifecycle hook for this;
   * callers must invoke it manually if needed (e.g. process exit handlers).
   */
  async cleanup(): Promise<void> {
    const closings = [...this.sessions.values()].map((s) =>
      this.tmux.closePane(s.paneId),
    );
    await Promise.allSettled(closings);
    this.sessions.clear();
    this.knownSessions.clear();
    this.spawningSessions.clear();
    this.spawnedSessions.clear();
    this.closedSessions.clear();
    this.pendingClose.clear();
  }

  private isTrackedOrSpawning(sessionId: string): boolean {
    return this.sessions.has(sessionId) || this.spawningSessions.has(sessionId);
  }

  /**
   * @param autoClose - true when closed due to idle (eligible for respawn);
   *                    false when closed due to session.deleted (must not respawn).
   */
  private async closeSession(sessionId: string, autoClose: boolean): Promise<void> {
    const tracked = this.sessions.get(sessionId);
    if (!tracked) return;

    this.log.debug("closeSession", { sessionId, paneId: tracked.paneId, autoClose });
    await this.tmux.closePane(tracked.paneId);
    this.sessions.delete(sessionId);

    // #2: only mark as eligible for respawn when auto-closed, not when deleted
    if (autoClose) {
      this.closedSessions.add(sessionId);
    } else {
      this.spawnedSessions.delete(sessionId);
    }
  }

  // Visibility: public so Hivemind's tmux-copilot tool (Phase 43, REQ-06) can
  // invoke it through the fork-bridge adapter. Previously private; flipped
  // to public by Phase 43 Rule 1 fix (the adapter type requires it).
  async respawnIfKnown(sessionId: string): Promise<void> {
    if (this.sessions.has(sessionId)) return; // already tracked
    if (this.spawningSessions.has(sessionId)) return;

    const known = this.knownSessions.get(sessionId);
    if (!known) return;

    this.log.debug("respawnIfKnown: re-spawning", { sessionId });
    // Remove from closedSessions and spawnedSessions before re-spawning
    this.closedSessions.delete(sessionId);
    this.spawnedSessions.delete(sessionId);
    // Reconstruct the enriched event: onSessionCreated reads
    // `(event as EnrichedSessionEvent).hivemindMeta` so the respawn
    // must carry the same metadata to preserve agent label format
    // and the delegation identity stamped on the new pane.
    await this.onSessionCreated({
      type: "session.created",
      properties: {
        info: {
          id: sessionId,
          parentID: known.parentId,
          title: known.title,
          directory: known.directory,
          projectID: "",
          version: "",
          time: { created: 0, updated: 0 },
        },
      },
      ...(known.hivemindMeta ? { hivemindMeta: known.hivemindMeta } : {}),
    } as Parameters<typeof this.onSessionCreated>[0]);
  }

  /**
   * Expose spawnPane with enriched metadata for Hivemind observer integration.
   * Called by createTmuxEventObserver when the fork is loaded as a separate plugin
   * and we need to invoke pane spawning directly with Hivemind metadata.
   */
  async spawnPaneWithMeta(options: {
    sessionId: string;
    description: string;
    hivemindMeta?: { agent: string; delegationId: string; depth: number };
  }): Promise<void> {
    if (!this.enabled) return;
    if (this.isTrackedOrSpawning(options.sessionId)) return;
    if (this.spawnedSessions.has(options.sessionId)) return;

    const serverRunning = await this.isServerRunning();
    if (!serverRunning) return;

    await this.tmux.spawnPane({
      sessionId: options.sessionId,
      description: options.description,
      serverUrl: this.serverUrl,
      directory: this.directory,
      binaryPath: this.config.opencodeBinaryPath,
      hivemindMeta: options.hivemindMeta,
    });
  }

  private async isServerRunning(
    timeoutMs = 3000,
    maxAttempts = 2,
  ): Promise<boolean> {
    const url = new URL("/health", this.serverUrl).toString();
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);
        if (res.ok) return true;
      } catch {
        // retry
      }
    }
    return false;
  }
}
