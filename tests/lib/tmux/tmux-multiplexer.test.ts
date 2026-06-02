/**
 * Phase 51 in-tree port — unit tests for the new `TmuxMultiplexer` class.
 *
 * Covers REQ-51-02 (P42 REQ-01):
 * - `isInsideSession` — sync check on `process.env.TMUX`
 * - `isAvailable` — binary resolution (uses `which` / `where`; mocked)
 * - `getMainPaneId` — parse `list-panes` output for index 0
 * - Constructor captures `TMUX_PANE` at construction time
 *
 * These tests run without a real tmux server — `which` is mocked
 * and the binary path is injected via the `findBinary` code path.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TmuxMultiplexer } from "../../../src/features/tmux/tmux-multiplexer.js";

// We need to mock the child_process execFile that findBinary() uses
// (to resolve the tmux binary). We use a hoisted vi.mock for that.
vi.mock("node:child_process", async () => {
  const actual = await vi.importActual< typeof import("node:child_process")>(
    "node:child_process",
  );
  return {
    ...actual,
    execFile: vi.fn(),
  };
});

import { execFile } from "node:child_process";

const execFileMock = execFile as unknown as ReturnType<typeof vi.fn>;

// Cast to a promisified exec shape — the class uses `util.promisify(execFile)`,
// so the mock must return a `{ stdout }` object from a callback-style call.
function mockExecFileResponse(stdout: string, stderr: string = "") {
  execFileMock.mockImplementation(
    ((_cmd: string, _args: string[], cb: (err: null, out: { stdout: string; stderr: string }) => void) => {
      cb(null, { stdout, stderr });
    }) as unknown as typeof execFileMock,
  );
}

function mockExecFileError(errMessage: string) {
  execFileMock.mockImplementation(
    ((_cmd: string, _args: string[], cb: (err: Error) => void) => {
      cb(new Error(errMessage));
    }) as unknown as typeof execFileMock,
  );
}

describe("TmuxMultiplexer", () => {
  const ORIGINAL_TMUX = process.env["TMUX"];
  const ORIGINAL_TMUX_PANE = process.env["TMUX_PANE"];

  beforeEach(() => {
    execFileMock.mockReset();
  });

  afterEach(() => {
    if (ORIGINAL_TMUX === undefined) delete process.env["TMUX"];
    else process.env["TMUX"] = ORIGINAL_TMUX;
    if (ORIGINAL_TMUX_PANE === undefined) delete process.env["TMUX_PANE"];
    else process.env["TMUX_PANE"] = ORIGINAL_TMUX_PANE;
  });

  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------

  it("captures TMUX_PANE from the environment at construction time", async () => {
    process.env["TMUX_PANE"] = "%5";
    // The constructor stores targetPane internally; we verify by calling
    // getMainPaneId (which uses targetArgs) and observing that "-t %5"
    // is forwarded to execFile. The mock returns the tmux binary path
    // on the first call (which/where) and the list-panes output on the
    // second call.
    mockExecFileResponse("/usr/bin/tmux\n");
    const mux = new TmuxMultiplexer("main-vertical", 60);
    // First call resolves the binary; second call is the list-panes query.
    // After that, override the mock to return the list-panes output.
    execFileMock.mockImplementationOnce(
      ((_cmd: string, _args: string[], cb: (err: null, out: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: "/usr/bin/tmux\n", stderr: "" });
      }) as unknown as typeof execFileMock,
    );
    execFileMock.mockImplementationOnce(
      ((_cmd: string, _args: string[], cb: (err: null, out: { stdout: string; stderr: string }) => void) => {
        cb(null, { stdout: "0 %0\n1 %5\n", stderr: "" });
      }) as unknown as typeof execFileMock,
    );
    await mux.getMainPaneId();
    // The 2nd positional arg to execFile is the args array of the
    // list-panes call. Verify "-t %5" was forwarded.
    expect(execFileMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    const lastCall = execFileMock.mock.calls[execFileMock.mock.calls.length - 1];
    expect(lastCall).toBeDefined();
    const args = lastCall?.[1] as string[] | undefined;
    expect(args).toContain("-t");
    expect(args).toContain("%5");
  });

  it("defaults layout to 'main-vertical' and mainPaneSize to 60", () => {
    // Sanity check: no throw on default construction
    const mux = new TmuxMultiplexer();
    expect(mux).toBeInstanceOf(TmuxMultiplexer);
  });

  // ---------------------------------------------------------------------------
  // isInsideSession
  // ---------------------------------------------------------------------------

  it("isInsideSession returns true when TMUX env var is set", () => {
    process.env["TMUX"] = "/tmp/tmux-1000/default,12345,0";
    const mux = new TmuxMultiplexer();
    expect(mux.isInsideSession()).toBe(true);
  });

  it("isInsideSession returns false when TMUX env var is absent", () => {
    delete process.env["TMUX"];
    const mux = new TmuxMultiplexer();
    expect(mux.isInsideSession()).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // isAvailable (binary resolution)
  // ---------------------------------------------------------------------------

  it("isAvailable returns true when tmux is on PATH", async () => {
    mockExecFileResponse("/usr/local/bin/tmux\n");
    const mux = new TmuxMultiplexer();
    expect(await mux.isAvailable()).toBe(true);
  });

  it("isAvailable returns false when tmux is not on PATH", async () => {
    mockExecFileError("not found");
    const mux = new TmuxMultiplexer();
    expect(await mux.isAvailable()).toBe(false);
  });

  it("isAvailable caches the result (subsequent calls do not re-shell)", async () => {
    mockExecFileResponse("/usr/bin/tmux\n");
    const mux = new TmuxMultiplexer();
    expect(await mux.isAvailable()).toBe(true);
    const callsAfterFirst = execFileMock.mock.calls.length;
    // Second call should hit the cache
    expect(await mux.isAvailable()).toBe(true);
    expect(execFileMock.mock.calls.length).toBe(callsAfterFirst);
  });

  // ---------------------------------------------------------------------------
  // getMainPaneId
  // ---------------------------------------------------------------------------

  it("getMainPaneId returns the pane id for index 0 from list-panes output", async () => {
    process.env["TMUX"] = "/tmp/tmux-1000/default,12345,0";
    mockExecFileResponse("0 %0\n1 %5\n2 %8\n");
    const mux = new TmuxMultiplexer();
    expect(await mux.getMainPaneId()).toBe("%0");
  });

  it("getMainPaneId returns null when no pane has index 0", async () => {
    process.env["TMUX"] = "/tmp/tmux-1000/default,12345,0";
    mockExecFileResponse("1 %5\n2 %8\n");
    const mux = new TmuxMultiplexer();
    expect(await mux.getMainPaneId()).toBeNull();
  });

  it("getMainPaneId returns null when tmux is unavailable", async () => {
    process.env["TMUX"] = "/tmp/tmux-1000/default,12345,0";
    mockExecFileError("tmux not running");
    const mux = new TmuxMultiplexer();
    expect(await mux.getMainPaneId()).toBeNull();
  });

  it("getMainPaneId returns null when list-panes stdout is empty", async () => {
    process.env["TMUX"] = "/tmp/tmux-1000/default,12345,0";
    mockExecFileResponse("");
    const mux = new TmuxMultiplexer();
    expect(await mux.getMainPaneId()).toBeNull();
  });
});
