/**
 * Phase 51 / Fix B2 — regression test for the silent-failure bug in
 * `TmuxMultiplexer.spawnPane()`.
 *
 * Before the fix, when `execFileAsync` threw inside `spawnPane` the
 * returned `PaneResult` was `{success: false}` — no message, no stderr,
 * no actionable signal for the caller. Consumers could not distinguish
 * "tmux binary missing" from "tmux split-window failed: bad session"
 * from "main pane vanished mid-spawn".
 *
 * This test pins the contract that `spawnPane` MUST surface the
 * underlying error message in the `error` field of `PaneResult` whenever
 * `success === false` due to an exec failure. The success-path shape
 * (`{success: true, paneId}`) is preserved and is covered by the main
 * `tmux-multiplexer.test.ts` suite.
 *
 * ORIGIN: REVIEW.md B2 — "spawnPane empty error surface"
 * See: src/features/tmux/tmux-multiplexer.ts:268-362 (spawnPane)
 * See: src/features/tmux/tmux-multiplexer.ts:65-80 (PaneResult)
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TmuxMultiplexer } from "../../../src/features/tmux/tmux-multiplexer.js";
import type { SpawnPaneOptions } from "../../../src/features/tmux/tmux-multiplexer.js";

// We mock child_process.execFile (the class uses `util.promisify(execFile)`,
// so the mock must return a `{ stdout }` object from a callback-style call
// OR invoke the callback with an Error to reject the promise).
vi.mock("node:child_process", async () => {
  const actual = await vi.importActual<typeof import("node:child_process")>(
    "node:child_process",
  );
  return {
    ...actual,
    execFile: vi.fn(),
  };
});

import { execFile } from "node:child_process";

const execFileMock = execFile as unknown as ReturnType<typeof vi.fn>;

const BASE_OPTIONS: SpawnPaneOptions = {
  sessionId: "ses_test123",
  description: "regression test for spawnPane error surface",
  serverUrl: "http://127.0.0.1:9999",
  directory: "/tmp/regression",
};

describe("TmuxMultiplexer.spawnPane — error surface regression (B2)", () => {
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

  it("surfaces execFileAsync error in PaneResult.error (was silent {success: false})", async () => {
    // Inside a tmux session so targetArgs() forwards "-t <pane>" and the
    // getMainPaneId() lookup uses a real-looking target.
    process.env["TMUX"] = "/tmp/tmux-1000/default,12345,0";

    // Sequence of execFile calls inside spawnPane:
    //   1) findBinary()  — `which tmux`         → return a path
    //   2) getMainPaneId() — `tmux list-panes`  → return a valid pane index 0
    //   3) split-window   — `tmux split-window` → THROW with known message
    execFileMock
      // Call 1: which tmux
      .mockImplementationOnce(
        ((_cmd: string, _args: string[], cb: (err: null, out: { stdout: string; stderr: string }) => void) => {
          cb(null, { stdout: "/usr/bin/tmux\n", stderr: "" });
        }) as unknown as typeof execFileMock,
      )
      // Call 2: tmux list-panes
      .mockImplementationOnce(
        ((_cmd: string, _args: string[], cb: (err: null, out: { stdout: string; stderr: string }) => void) => {
          cb(null, { stdout: "0 %0\n1 %5\n", stderr: "" });
        }) as unknown as typeof execFileMock,
      )
      // Call 3: tmux split-window — the call we want to fail. After the
      // two `mockImplementationOnce` setups, the *next* call (the
      // split-window) must throw with a known message so we can assert
      // that message is surfaced in PaneResult.error.
      .mockImplementation(
        ((_cmd: string, _args: string[], cb: (err: Error) => void) => {
          cb(new Error("tmux split-window failed: exit code 1"));
        }) as unknown as typeof execFileMock,
      );

    const mux = new TmuxMultiplexer("main-vertical", 60);
    const result = await mux.spawnPane(BASE_OPTIONS);

    // Contract: success must be false on exec failure.
    expect(result.success).toBe(false);

    // Contract: paneId must NOT be set on failure.
    expect(result.paneId).toBeUndefined();

    // Contract: the underlying error message MUST be surfaced via
    // `error` so callers can diagnose the failure.
    expect(result.error).toBeDefined();
    expect(result.error).toContain("tmux split-window failed: exit code 1");
  });
});
