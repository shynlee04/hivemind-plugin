import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";

// NOTE: This file registers mock.module() calls at the top level with no cleanup mechanism
// (Bun's mock.module has no restore API). Without --isolate, these stubs leak into other
// test files that import the same modules (e.g. config.test.ts gets the stub instead of
// the real module). The --isolate flag in package.json gives each test file a fresh module
// registry, preventing cross-file mock leakage.

// ---- mock state ----
let isInsideSessionResult = true;
let isAvailableResult = true;

const onSessionCreatedMock = mock(async () => {});
const onSessionStatusMock = mock(async () => {});
const onSessionDeletedMock = mock(async () => {});

// Track SessionManager constructor calls
let sessionManagerConstructed = false;

// Register mocks BEFORE dynamic import
mock.module("../config", () => ({
  loadConfig: () => ({
    layout: "main-vertical",
    mainPaneSize: 60,
    autoClose: true,
    copilot: false,
    agentLabelFormat: "{agentType} — {delegationId}",
  }),
}));

mock.module("../tmux", () => ({
  TmuxMultiplexer: class MockTmuxMultiplexer {
    isInsideSession() {
      return isInsideSessionResult;
    }
    async isAvailable() {
      return isAvailableResult;
    }
  },
}));

mock.module("../session-manager", () => ({
  SessionManager: class MockSessionManager {
    constructor(..._args: any[]) {
      sessionManagerConstructed = true;
    }
    onSessionCreated = onSessionCreatedMock;
    onSessionStatus = onSessionStatusMock;
    onSessionDeleted = onSessionDeletedMock;
    enabled = true;
  },
}));

describe("OpencodeTmux plugin (index.ts)", () => {
  let stderrSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    stderrSpy = spyOn(console, "error").mockImplementation(() => {});
    onSessionCreatedMock.mockClear();
    onSessionStatusMock.mockClear();
    onSessionDeletedMock.mockClear();
    sessionManagerConstructed = false;
    isInsideSessionResult = true;
    isAvailableResult = true;
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  const makeInput = () => {
    const appLogMock = mock(async () => {});
    return {
      client: {
        app: { log: appLogMock },
      },
      directory: "/workspace",
      serverUrl: new URL("http://localhost:3000"),
      project: {},
      worktree: "/workspace",
      experimental_workspace: { register: () => {} },
      $: {},
      _appLogMock: appLogMock,
    };
  };

  it("not inside tmux → returns {}, SessionManager not constructed", async () => {
    isInsideSessionResult = false;
    const { default: plugin } = await import("../index");
    const result = await plugin(makeInput() as any);
    expect(result).toEqual({});
    expect(sessionManagerConstructed).toBe(false);
  });

  it("inside tmux, binary missing → returns {}, logs warning", async () => {
    isInsideSessionResult = true;
    isAvailableResult = false;
    const { default: plugin } = await import("../index");
    const input = makeInput();
    const result = await plugin(input as any);
    expect(result).toEqual({});
    await Promise.resolve();
    expect(input._appLogMock).toHaveBeenCalled();
    expect((input._appLogMock.mock.calls as any)[0][0].body.level).toBe("error");
    expect((input._appLogMock.mock.calls as any)[0][0].body.service).toBe("opencode-tmux");
  });

  it("happy path → returns {event: Function}, SessionManager constructed", async () => {
    isInsideSessionResult = true;
    isAvailableResult = true;
    const { default: plugin } = await import("../index");
    const result = await plugin(makeInput() as any);
    expect(typeof (result as any).event).toBe("function");
    expect(sessionManagerConstructed).toBe(true);
  });

  it("event dispatcher: session.created → mgr.onSessionCreated called", async () => {
    isInsideSessionResult = true;
    isAvailableResult = true;
    const { default: plugin } = await import("../index");
    const hooks = await plugin(makeInput() as any);
    const event = {
      type: "session.created",
      properties: {
        info: {
          id: "s1",
          parentID: "p1",
          title: "T",
          directory: "/d",
          projectID: "",
          version: "",
          time: { created: 0, updated: 0 },
        },
      },
    };
    await (hooks as any).event({ event });
    expect(onSessionCreatedMock).toHaveBeenCalledTimes(1);
  });

  it("event dispatcher: session.status → mgr.onSessionStatus called", async () => {
    isInsideSessionResult = true;
    isAvailableResult = true;
    const { default: plugin } = await import("../index");
    const hooks = await plugin(makeInput() as any);
    const event = {
      type: "session.status",
      properties: { sessionID: "s1", status: { type: "idle" } },
    };
    await (hooks as any).event({ event });
    expect(onSessionStatusMock).toHaveBeenCalledTimes(1);
  });

  it("event dispatcher: session.deleted → mgr.onSessionDeleted called", async () => {
    isInsideSessionResult = true;
    isAvailableResult = true;
    const { default: plugin } = await import("../index");
    const hooks = await plugin(makeInput() as any);
    const event = {
      type: "session.deleted",
      properties: {
        info: {
          id: "s1",
          parentID: "p1",
          title: "T",
          directory: "/d",
          projectID: "",
          version: "",
          time: { created: 0, updated: 0 },
        },
      },
    };
    await (hooks as any).event({ event });
    expect(onSessionDeletedMock).toHaveBeenCalledTimes(1);
  });

  it("unknown event type → no method called", async () => {
    isInsideSessionResult = true;
    isAvailableResult = true;
    const { default: plugin } = await import("../index");
    const hooks = await plugin(makeInput() as any);
    const event = { type: "some.other.event", properties: {} };
    await (hooks as any).event({ event });
    expect(onSessionCreatedMock).not.toHaveBeenCalled();
    expect(onSessionStatusMock).not.toHaveBeenCalled();
    expect(onSessionDeletedMock).not.toHaveBeenCalled();
  });
});
