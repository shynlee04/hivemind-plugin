import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import type { TmuxPluginConfig } from "../config";

// ---- helpers ----
const mkCreated = (id: string, parentID = "p1") => ({
  type: "session.created" as const,
  properties: {
    info: {
      id,
      parentID,
      title: "T",
      directory: "/d",
      projectID: "",
      version: "",
      time: { created: 0, updated: 0 },
    },
  },
});

const mkStatus = (id: string, type: "idle" | "busy") => ({
  type: "session.status" as const,
  properties: { sessionID: id, status: { type } },
});

const mkDeleted = (id: string) => ({
  type: "session.deleted" as const,
  properties: {
    info: {
      id,
      parentID: "p1",
      title: "T",
      directory: "/d",
      projectID: "",
      version: "",
      time: { created: 0, updated: 0 },
    },
  },
});

// ---- default config ----
const defaultConfig: TmuxPluginConfig = {
  layout: "main-vertical",
  mainPaneSize: 60,
  autoClose: true,
  copilot: false,
  agentLabelFormat: "{agentType} — {delegationId}",
};

// ---- fetch restoration ----
// Track the original fetch so afterEach can always restore it.
const _origFetch = globalThis.fetch;

// ---- build a fresh SessionManager with stubs ----
async function buildManager(
  opts: {
    insideSession?: boolean;
    spawnResult?: { success: boolean; paneId?: string };
    closePaneResult?: boolean;
    config?: Partial<TmuxPluginConfig>;
    fetchOk?: boolean;
    fetchThrows?: boolean;
    fetchImpl?: () => Promise<Response>;
  } = {},
) {
  const {
    insideSession = true,
    spawnResult = { success: true, paneId: "%1" },
    closePaneResult = true,
    config = {},
    fetchOk = true,
    fetchThrows = false,
    fetchImpl,
  } = opts;

  const spawnPane = mock(async () => spawnResult);
  const closePane = mock(async () => closePaneResult);

  const tmuxStub = {
    isInsideSession: () => insideSession,
    spawnPane,
    closePane,
  };

  // Mock fetch — afterEach restores globalThis.fetch unconditionally.
  if (fetchImpl) {
    (globalThis as any).fetch = fetchImpl;
  } else if (fetchThrows) {
    (globalThis as any).fetch = async () => {
      throw new Error("network error");
    };
  } else {
    (globalThis as any).fetch = async () =>
      new Response(null, { status: fetchOk ? 200 : 500 });
  }

  const clientStub = {
    app: {
      log: mock(async () => {}),
    },
  };

  const inputStub = {
    client: clientStub,
    directory: "/workspace",
    serverUrl: new URL("http://localhost:3000"),
  } as any;

  const { SessionManager } = await import("../session-manager");
  const mgr = new SessionManager(inputStub, { ...defaultConfig, ...config }, tmuxStub as any);

  return {
    mgr,
    spawnPane,
    closePane,
  };
}

describe("SessionManager", () => {
  afterEach(() => {
    // Always restore fetch to the original — idempotent regardless of test outcome.
    (globalThis as any).fetch = _origFetch;
  });

  // ---- enabled flag ----
  describe("enabled flag", () => {
    it("enabled=false when isInsideSession() returns false → onSessionCreated is no-op", async () => {
      const { mgr, spawnPane } = await buildManager({ insideSession: false });
      expect(mgr.enabled).toBe(false);
      await mgr.onSessionCreated(mkCreated("s1") as any);
      expect(spawnPane).not.toHaveBeenCalled();
    });
  });

  // ---- onSessionCreated ----
  describe("onSessionCreated()", () => {
    it("ignores sessions without parentID when copilot=false", async () => {
      const { mgr, spawnPane } = await buildManager();
      const event = mkCreated("s1");
      (event.properties.info as any).parentID = "";
      await mgr.onSessionCreated(event as any);
      expect(spawnPane).not.toHaveBeenCalled();
    });

    it("proceeds without parentID when copilot=true", async () => {
      const { mgr, spawnPane } = await buildManager({ config: { copilot: true } });
      const event = mkCreated("s1");
      (event.properties.info as any).parentID = "";
      await mgr.onSessionCreated(event as any);
      expect(spawnPane).toHaveBeenCalledTimes(1);
      await mgr.cleanup();
    });

    it("happy path: spawnPane called, sessions map populated", async () => {
      const { mgr, spawnPane } = await buildManager();
      await mgr.onSessionCreated(mkCreated("s1") as any);
      expect(spawnPane).toHaveBeenCalledTimes(1);
      expect(spawnPane).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "s1" }),
      );
      await mgr.cleanup();
    });

    it("passes hivemindMeta when event has hivemindMeta", async () => {
      const { mgr, spawnPane } = await buildManager();
      const event = mkCreated("s1");
      (event as any).hivemindMeta = { agent: "gsd-researcher", delegationId: "ses_abc123", depth: 2 };
      await mgr.onSessionCreated(event as any);
      expect(spawnPane).toHaveBeenCalledWith(
        expect.objectContaining({
          hivemindMeta: { agent: "gsd-researcher", delegationId: "ses_abc123", depth: 2 },
        }),
      );
      await mgr.cleanup();
    });

    it("calls spawnPane without hivemindMeta when event has none", async () => {
      const { mgr, spawnPane } = await buildManager();
      await mgr.onSessionCreated(mkCreated("s1") as any);
      expect(spawnPane).toHaveBeenCalledWith(
        expect.not.objectContaining({ hivemindMeta: expect.anything() }),
      );
      await mgr.cleanup();
    });

    it("skips when server unhealthy (fetch returns 500)", async () => {
      const { mgr, spawnPane } = await buildManager({ fetchOk: false });
      await mgr.onSessionCreated(mkCreated("s1") as any);
      expect(spawnPane).not.toHaveBeenCalled();
    });

    it("skips when fetch throws", async () => {
      const { mgr, spawnPane } = await buildManager({ fetchThrows: true });
      await mgr.onSessionCreated(mkCreated("s1") as any);
      expect(spawnPane).not.toHaveBeenCalled();
    });

    it("deduplication: second call while spawning → spawnPane called once", async () => {
      // We need to simulate concurrent calls
      // Use a promise that we can control
      let resolveSpawn!: (v: { success: boolean; paneId: string }) => void;
      const spawnPromise = new Promise<{ success: boolean; paneId: string }>(
        (res) => (resolveSpawn = res),
      );

      const spawnPane = mock(async () => spawnPromise);
      const closePane = mock(async () => true);
      const tmuxStub = {
        isInsideSession: () => true,
        spawnPane,
        closePane,
      };

      (globalThis as any).fetch = async () => new Response(null, { status: 200 });

      const clientStub = {
        app: { log: mock(async () => {}) },
      };
      const inputStub = {
        client: clientStub,
        directory: "/workspace",
        serverUrl: new URL("http://localhost:3000"),
      } as any;

      const { SessionManager } = await import("../session-manager");
      const mgr = new SessionManager(inputStub, defaultConfig, tmuxStub as any);

      // Start first spawn (won't resolve yet)
      const p1 = mgr.onSessionCreated(mkCreated("s1") as any);
      // Second call while first is in progress
      const p2 = mgr.onSessionCreated(mkCreated("s1") as any);

      // Resolve the spawn
      resolveSpawn({ success: true, paneId: "%1" });
      await Promise.all([p1, p2]);

      expect(spawnPane).toHaveBeenCalledTimes(1);

      await mgr.cleanup();
    });
  });

  // ---- onSessionStatus ----
  describe("onSessionStatus()", () => {
    it("idle + autoClose=true → closePane called, closedSessions populated", async () => {
      const { mgr, spawnPane, closePane } = await buildManager();
      await mgr.onSessionCreated(mkCreated("s1") as any);
      expect(spawnPane).toHaveBeenCalledTimes(1);

      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);
      expect(closePane).toHaveBeenCalledTimes(1);
      expect(closePane).toHaveBeenCalledWith("%1");
    });

    it("idle + autoClose=false → closePane NOT called", async () => {
      const { mgr, closePane } = await buildManager({
        config: { autoClose: false },
      });
      await mgr.onSessionCreated(mkCreated("s1") as any);
      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);
      expect(closePane).not.toHaveBeenCalled();
      await mgr.cleanup();
    });

    it("busy + in closedSessions → respawn (spawnPane called again)", async () => {
      const { mgr, spawnPane } = await buildManager();
      await mgr.onSessionCreated(mkCreated("s1") as any);
      // Close via idle
      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);
      expect(spawnPane).toHaveBeenCalledTimes(1);

      // Now busy → should respawn
      await mgr.onSessionStatus(mkStatus("s1", "busy") as any);
      expect(spawnPane).toHaveBeenCalledTimes(2);
      await mgr.cleanup();
    });

    it("busy without prior close → no-op", async () => {
      const { mgr, spawnPane } = await buildManager();
      await mgr.onSessionCreated(mkCreated("s1") as any);
      const callsBefore = spawnPane.mock.calls.length;
      await mgr.onSessionStatus(mkStatus("s1", "busy") as any);
      expect(spawnPane.mock.calls.length).toBe(callsBefore);
      await mgr.cleanup();
    });

    it("idle while spawning → pendingClose; after spawn resolves, closePane called", async () => {
      let resolveSpawn!: (v: { success: boolean; paneId: string }) => void;
      const spawnPromise = new Promise<{ success: boolean; paneId: string }>(
        (res) => (resolveSpawn = res),
      );

      const spawnPane = mock(async () => spawnPromise);
      const closePane = mock(async () => true);
      const tmuxStub = {
        isInsideSession: () => true,
        spawnPane,
        closePane,
      };

      (globalThis as any).fetch = async () => new Response(null, { status: 200 });

      const clientStub = {
        app: { log: mock(async () => {}) },
      };
      const inputStub = {
        client: clientStub,
        directory: "/workspace",
        serverUrl: new URL("http://localhost:3000"),
      } as any;

      const { SessionManager } = await import("../session-manager");
      const mgr = new SessionManager(inputStub, defaultConfig, tmuxStub as any);

      // Start spawn (won't resolve yet)
      const spawnP = mgr.onSessionCreated(mkCreated("s1") as any);

      // Idle event arrives while spawning
      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);
      // closePane should NOT be called yet
      expect(closePane).not.toHaveBeenCalled();

      // Resolve spawn
      resolveSpawn({ success: true, paneId: "%1" });
      await spawnP;

      // Now closePane should have been called
      expect(closePane).toHaveBeenCalledTimes(1);
    });
  });

  // ---- onSessionDeleted ----
  describe("onSessionDeleted()", () => {
    it("closePane called, knownSessions cleared, closedSessions NOT populated", async () => {
      const { mgr, closePane } = await buildManager();
      await mgr.onSessionCreated(mkCreated("s1") as any);
      await mgr.onSessionDeleted(mkDeleted("s1") as any);
      expect(closePane).toHaveBeenCalledTimes(1);

      // knownSessions must be cleared
      expect((mgr as any).knownSessions.size).toBe(0);

      // After delete, busy should NOT respawn (closedSessions not populated)
      await mgr.onSessionStatus(mkStatus("s1", "busy") as any);
      // sessions map should be empty, no respawn
      expect((mgr as any).sessions.size).toBe(0);
    });
  });

  // ---- cleanup ----
  describe("cleanup()", () => {
    it("closes all panes, clears all maps", async () => {
      const { mgr, closePane } = await buildManager();
      await mgr.onSessionCreated(mkCreated("s1") as any);
      await mgr.onSessionCreated(mkCreated("s2") as any);
      await mgr.cleanup();
      expect(closePane).toHaveBeenCalledTimes(2);
      expect((mgr as any).sessions.size).toBe(0);
      expect((mgr as any).knownSessions.size).toBe(0);
    });
  });

  // ---- respawnIfKnown hivemindMeta propagation (Task 3 fix) ----
  describe("respawnIfKnown() hivemindMeta propagation", () => {
    const meta = { agent: "gsd-researcher", delegationId: "ses_abc123", depth: 2 };

    it("respawn after idle close propagates original hivemindMeta to spawnPane", async () => {
      const { mgr, spawnPane } = await buildManager();
      // Initial create WITH hivemindMeta
      const event = mkCreated("s1");
      (event as any).hivemindMeta = meta;
      await mgr.onSessionCreated(event as any);
      expect(spawnPane).toHaveBeenCalledTimes(1);

      // Close via idle
      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);

      // Busy triggers respawn
      await mgr.onSessionStatus(mkStatus("s1", "busy") as any);
      expect(spawnPane).toHaveBeenCalledTimes(2);

      // The respawned spawnPane call MUST include the original hivemindMeta
      const secondCall = spawnPane.mock.calls[1]?.[0] as any;
      expect(secondCall?.hivemindMeta).toEqual(meta);
      await mgr.cleanup();
    });

    it("respawn after idle close uses agentLabelFormat with original hivemindMeta", async () => {
      const { mgr, spawnPane } = await buildManager({
        config: { agentLabelFormat: "[{agentType}·{delegationId}]" },
      });
      const event = mkCreated("s1");
      (event as any).hivemindMeta = meta;
      await mgr.onSessionCreated(event as any);

      // Close + busy → respawn
      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);
      await mgr.onSessionStatus(mkStatus("s1", "busy") as any);

      // The respawned pane's description must be the formatted label,
      // proving hivemindMeta propagated through the agentLabelFormat path.
      const secondCall = spawnPane.mock.calls[1]?.[0] as any;
      expect(secondCall?.description).toBe("[gsd-researcher·ses_abc123]");
      await mgr.cleanup();
    });

    it("respawn without original hivemindMeta does not crash and passes no meta", async () => {
      const { mgr, spawnPane } = await buildManager();
      // Initial create WITHOUT hivemindMeta
      await mgr.onSessionCreated(mkCreated("s1") as any);

      // Close + busy → respawn
      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);
      await mgr.onSessionStatus(mkStatus("s1", "busy") as any);

      expect(spawnPane).toHaveBeenCalledTimes(2);
      const secondCall = spawnPane.mock.calls[1]?.[0] as any;
      // No meta was ever provided; respawn must not invent one
      expect(secondCall?.hivemindMeta).toBeUndefined();
      await mgr.cleanup();
    });

    it("respawn preserves parentId, title, and directory alongside hivemindMeta", async () => {
      const { mgr, spawnPane } = await buildManager();
      const event = mkCreated("s1", "parent-X");
      (event as any).properties.info.title = "Custom Title";
      (event as any).properties.info.directory = "/custom/dir";
      (event as any).hivemindMeta = meta;
      await mgr.onSessionCreated(event as any);

      // Close + busy → respawn
      await mgr.onSessionStatus(mkStatus("s1", "idle") as any);
      await mgr.onSessionStatus(mkStatus("s1", "busy") as any);

      const secondCall = spawnPane.mock.calls[1]?.[0] as any;
      expect(secondCall?.sessionId).toBe("s1");
      expect(secondCall?.hivemindMeta).toEqual(meta);
      expect(secondCall?.directory).toBe("/custom/dir");
      await mgr.cleanup();
    });
  });

  // ---- isServerRunning retry ----
  describe("isServerRunning()", () => {
    it("fetch called exactly 2 times when it always fails (maxAttempts=2)", async () => {
      let fetchCallCount = 0;
      const { mgr } = await buildManager({
        fetchImpl: async () => {
          fetchCallCount++;
          throw new Error("network error");
        },
      });
      // isServerRunning is private; trigger it via onSessionCreated
      await mgr.onSessionCreated(mkCreated("s1") as any);
      expect(fetchCallCount).toBe(2);
    });

    it("AbortController timeout fires when fetch hangs → spawnPane NOT called", async () => {
      // Use a fetch that watches the AbortSignal and rejects when aborted.
      // Pass a very short timeoutMs (10ms) by patching isServerRunning on the instance.
      const spawnPane = mock(async () => ({ success: true, paneId: "%1" }));
      const closePane = mock(async () => true);
      const tmuxStub = { isInsideSession: () => true, spawnPane, closePane };
      const clientStub = { app: { log: mock(async () => {}) } };

      // fetch that hangs until the AbortSignal fires
      (globalThis as any).fetch = (_url: string, opts: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = opts?.signal as AbortSignal | undefined;
          if (signal) {
            if (signal.aborted) {
              reject(new DOMException("Aborted", "AbortError"));
              return;
            }
            signal.addEventListener("abort", () => {
              reject(new DOMException("Aborted", "AbortError"));
            });
          }
          // Never resolves on its own — waits for abort
        });

      const inputStub = {
        client: clientStub,
        directory: "/workspace",
        serverUrl: new URL("http://localhost:3000"),
      } as any;

      const { SessionManager } = await import("../session-manager");
      const mgr = new SessionManager(inputStub, defaultConfig, tmuxStub as any);

      // Patch isServerRunning to use a very short timeout (10ms) so the test is fast
      const origIsServerRunning = (mgr as any).isServerRunning.bind(mgr);
      (mgr as any).isServerRunning = () => origIsServerRunning(10, 2);

      // onSessionCreated calls isServerRunning; fetch will hang then abort after 10ms × 2
      await mgr.onSessionCreated(mkCreated("s1") as any);

      // Server never responded → spawnPane must NOT have been called
      expect(spawnPane).not.toHaveBeenCalled();
    });
  });
});
