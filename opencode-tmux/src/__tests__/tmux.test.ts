import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";

// ---- mutable execFile mock state ----
type ExecResult = { stdout: string; stderr: string };
let execFileImpl: (file: string, args: string[]) => ExecResult = () => ({
  stdout: "",
  stderr: "",
});

const execFileMock = (
  file: string,
  args: string[],
  callback: (err: Error | null, result: ExecResult) => void,
) => {
  try {
    callback(null, execFileImpl(file, args));
  } catch (e) {
    callback(e as Error, null as any);
  }
};

// Register mock BEFORE any import of tmux
mock.module("node:child_process", () => ({
  execFile: execFileMock,
}));

describe("TmuxMultiplexer", () => {
  let origTmuxPane: string | undefined;
  let origTmux: string | undefined;
  let origSetTimeout: typeof globalThis.setTimeout;

  beforeEach(() => {
    origTmuxPane = process.env.TMUX_PANE;
    origTmux = process.env.TMUX;
    origSetTimeout = globalThis.setTimeout;
    delete process.env.TMUX_PANE;
    delete process.env.TMUX;
    // Default: which tmux succeeds
    execFileImpl = (_file: string, args: string[]) => {
      if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
      if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
      return { stdout: "", stderr: "" };
    };
  });

  afterEach(() => {
    if (origTmuxPane !== undefined) process.env.TMUX_PANE = origTmuxPane;
    else delete process.env.TMUX_PANE;
    if (origTmux !== undefined) process.env.TMUX = origTmux;
    else delete process.env.TMUX;
    globalThis.setTimeout = origSetTimeout;
  });

  // ---- isAvailable ----
  describe("isAvailable()", () => {
    it("returns true when which tmux succeeds", async () => {
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      expect(await t.isAvailable()).toBe(true);
    });

    it("caches result on second call", async () => {
      let callCount = 0;
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") {
          callCount++;
          return { stdout: "/usr/bin/tmux\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.isAvailable();
      await t.isAvailable();
      expect(callCount).toBe(1);
    });

    it("returns false when which throws", async () => {
      execFileImpl = () => {
        throw new Error("not found");
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      expect(await t.isAvailable()).toBe(false);
    });

    it("caches false result", async () => {
      let callCount = 0;
      execFileImpl = () => {
        callCount++;
        throw new Error("not found");
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.isAvailable();
      await t.isAvailable();
      expect(callCount).toBe(1);
    });
  });

  // ---- isInsideSession ----
  describe("isInsideSession()", () => {
    it("returns true when TMUX env is set", async () => {
      process.env.TMUX = "/tmp/tmux-1000/default,1234,0";
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      expect(t.isInsideSession()).toBe(true);
    });

    it("returns false when TMUX env is not set", async () => {
      delete process.env.TMUX;
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      expect(t.isInsideSession()).toBe(false);
    });
  });

  // ---- spawnPane ----
  describe("spawnPane()", () => {
    it("success: returns {success:true, paneId}", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") return { stdout: "%5\n", stderr: "" };
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const result = await t.spawnPane({ sessionId: "sess1", description: "My Agent", serverUrl: "http://localhost:3000", directory: "/home/user" });
      expect(result.success).toBe(true);
      expect(result.paneId).toBe("%5");
    });

    it("verifies split-window args contain required flags", async () => {
      let capturedArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") {
          capturedArgs = args;
          return { stdout: "%5\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user" });
      expect(capturedArgs).toContain("split-window");
      expect(capturedArgs).toContain("-h");
      expect(capturedArgs).toContain("-d");
      expect(capturedArgs).toContain("-P");
      expect(capturedArgs).toContain("-F");
      expect(capturedArgs).toContain("#{pane_id}");
      // Last arg should be the opencode command
      const lastArg = capturedArgs[capturedArgs.length - 1];
      expect(lastArg).toContain("opencode");
      expect(lastArg).toContain("attach");
      expect(lastArg).toContain("sess1");
    });

    it("returns {success:false} when no binary", async () => {
      execFileImpl = () => {
        throw new Error("not found");
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const result = await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user" });
      expect(result.success).toBe(false);
    });

    it("returns {success:false} when split-window returns empty paneId", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "split-window") return { stdout: "   \n", stderr: "" };
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const result = await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user" });
      expect(result.success).toBe(false);
    });

    it("returns {success:false} when split-window throws", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "split-window") throw new Error("split failed");
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const result = await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user" });
      expect(result.success).toBe(false);
    });

    it("shell-quoting: directory with single quote", async () => {
      let capturedArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") {
          capturedArgs = args;
          return { stdout: "%7\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user's dir" });
      const lastArg = capturedArgs[capturedArgs.length - 1];
      // Should contain escaped single quote
      expect(lastArg).toContain("'\\''");
    });

    it("TMUX_PANE env var adds -t args", async () => {
      process.env.TMUX_PANE = "%3";
      let capturedArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") {
          capturedArgs = args;
          return { stdout: "%5\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user" });
      expect(capturedArgs).toContain("-t");
      expect(capturedArgs).toContain("%1");
    });

    // ---- Hivemind extension: binaryPath ----
    it("binaryPath overrides 'opencode' in spawn command", async () => {
      let capturedArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") {
          capturedArgs = args;
          return { stdout: "%5\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user", binaryPath: "/custom/path/opencode" });
      const lastArg = capturedArgs[capturedArgs.length - 1];
      expect(lastArg).toContain("/custom/path/opencode");
      expect(lastArg).toContain("/custom/path/opencode attach");
    });

    it("uses bare 'opencode' when binaryPath absent (backward compat)", async () => {
      let capturedArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") {
          capturedArgs = args;
          return { stdout: "%5\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({ sessionId: "sess1", description: "Agent", serverUrl: "http://localhost:3000", directory: "/home/user" });
      const lastArg = capturedArgs[capturedArgs.length - 1];
      expect(lastArg).toContain("opencode attach");
    });

    // ---- Hivemind extension: hivemindMeta title format ----
    it("hivemindMeta formats pane title with [agent] delegationId — description", async () => {
      let selectPaneArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") return { stdout: "%5\n", stderr: "" };
        if (args[0] === "select-pane") {
          selectPaneArgs = args;
          return { stdout: "", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({
        sessionId: "ses_abc123",
        description: "Research phase 42",
        serverUrl: "http://localhost:3000",
        directory: "/home/user",
        hivemindMeta: { agent: "gsd-phase-researcher", delegationId: "ses_abc123_full" },
      });
      expect(selectPaneArgs).toContain("-T");
      const titleIdx = selectPaneArgs.indexOf("-T") + 1;
      expect(selectPaneArgs[titleIdx]).toBe("[gsd-phase-researcher] ses_abc1 — Research phase 42".slice(0, 40));
    });

    it("title truncated to 40 characters maximum", async () => {
      let selectPaneArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") return { stdout: "%5\n", stderr: "" };
        if (args[0] === "select-pane") {
          selectPaneArgs = args;
          return { stdout: "", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({
        sessionId: "ses_xyz",
        description: "This is a very long session description that exceeds the tmux limit",
        serverUrl: "http://localhost:3000",
        directory: "/home/user",
        hivemindMeta: { agent: "long-agent-type-name", delegationId: "ses_abcdef123456" },
      });
      expect(selectPaneArgs).toContain("-T");
      const titleIdx = selectPaneArgs.indexOf("-T") + 1;
      expect(selectPaneArgs[titleIdx].length).toBeLessThanOrEqual(40);
    });

    it("hivemindMeta absent → pane title uses first 30 chars of description (original behavior)", async () => {
      let selectPaneArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") return { stdout: "0 %1\n", stderr: "" };
        if (args[0] === "split-window") return { stdout: "%5\n", stderr: "" };
        if (args[0] === "select-pane") {
          selectPaneArgs = args;
          return { stdout: "", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.spawnPane({ sessionId: "sess1", description: "This is a long description that should be truncated", serverUrl: "http://localhost:3000", directory: "/home/user" });
      expect(selectPaneArgs).toContain("-T");
      const titleIdx = selectPaneArgs.indexOf("-T") + 1;
      expect(selectPaneArgs[titleIdx]).toBe("This is a long description tha");
    });
  });

  // ---- closePane ----
  describe("closePane()", () => {
    beforeEach(() => {
      // Override setTimeout to immediately invoke callback
      (globalThis as any).setTimeout = (cb: () => void, _ms: number) => {
        cb();
        return 0 as any;
      };
    });

    it("success: returns true; send-keys then kill-pane called", async () => {
      const calledCommands: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        calledCommands.push(args[0]);
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const result = await t.closePane("%5");
      expect(result).toBe(true);
      expect(calledCommands).toContain("send-keys");
      expect(calledCommands).toContain("kill-pane");
    });

    it("returns false when kill-pane throws", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "kill-pane") throw new Error("kill failed");
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const result = await t.closePane("%5");
      expect(result).toBe(false);
    });

    it("returns false when no binary", async () => {
      execFileImpl = () => {
        throw new Error("not found");
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const result = await t.closePane("%5");
      expect(result).toBe(false);
    });
  });

  // ---- applyLayout ----
  describe("applyLayout()", () => {
    it("main-vertical: calls set-window-option with main-pane-width", async () => {
      const calledCommands: string[] = [];
      let setWindowOptionArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        calledCommands.push(args[0]);
        if (args[0] === "set-window-option") setWindowOptionArgs = args;
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer("main-vertical", 60);
      await t.applyLayout("main-vertical", 60);
      expect(calledCommands).toContain("set-window-option");
      expect(setWindowOptionArgs).toContain("main-pane-width");
      expect(setWindowOptionArgs).toContain("60%");
    });

    it("main-horizontal: calls set-window-option with main-pane-height", async () => {
      const calledCommands: string[] = [];
      let setWindowOptionArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        calledCommands.push(args[0]);
        if (args[0] === "set-window-option") setWindowOptionArgs = args;
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer("main-horizontal", 50);
      await t.applyLayout("main-horizontal", 50);
      expect(calledCommands).toContain("set-window-option");
      expect(setWindowOptionArgs).toContain("main-pane-height");
    });

    it("tiled: no set-window-option call", async () => {
      const calledCommands: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        calledCommands.push(args[0]);
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer("tiled", 60);
      await t.applyLayout("tiled", 60);
      expect(calledCommands).not.toContain("set-window-option");
    });

    it("TMUX_PANE env var adds -t args to select-layout", async () => {
      process.env.TMUX_PANE = "%3";
      let selectLayoutArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "select-layout") selectLayoutArgs = args;
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.applyLayout("tiled", 60);
      expect(selectLayoutArgs).toContain("-t");
      expect(selectLayoutArgs).toContain("%3");
    });

    it("handles applyLayout error gracefully", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "select-layout") throw new Error("layout error");
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      // Should not throw
      await expect(t.applyLayout("tiled", 60)).resolves.toBeUndefined();
    });
  });

  // ---- sendKeys (43-01 W1-T1, REQ-01) ----
  describe("sendKeys()", () => {
    it("literal=false: invokes tmux send-keys -t %5 'ls\\n'; resolves on success", async () => {
      let capturedArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "send-keys") {
          capturedArgs = args;
          return { stdout: "", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await expect(t.sendKeys("%5", "ls\n", false)).resolves.toBeUndefined();
      expect(capturedArgs[0]).toBe("send-keys");
      expect(capturedArgs).toContain("-t");
      expect(capturedArgs).toContain("%5");
      expect(capturedArgs).not.toContain("-l");
      expect(capturedArgs[capturedArgs.length - 1]).toBe("ls\n");
    });

    it("literal=true: invokes tmux send-keys -t %5 -l '$HOME' (preserves literal text)", async () => {
      let capturedArgs: string[] = [];
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "send-keys") {
          capturedArgs = args;
          return { stdout: "", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await t.sendKeys("%5", "$HOME", true);
      expect(capturedArgs).toContain("send-keys");
      expect(capturedArgs).toContain("-t");
      expect(capturedArgs).toContain("%5");
      expect(capturedArgs).toContain("-l");
      expect(capturedArgs[capturedArgs.length - 1]).toBe("$HOME");
    });

    it("error: tmux exit non-zero rejects with 'tmux sendKeys failed: {stderr}'", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "send-keys") {
          throw Object.assign(new Error(""), { stderr: "can't find pane: %99" });
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      await expect(t.sendKeys("%99", "x", false)).rejects.toThrow(
        /tmux sendKeys failed:.*can't find pane: %99/,
      );
    });
  });

  // ---- listPanes (43-01 W1-T1, REQ-02) ----
  describe("listPanes()", () => {
    it("parses tab-separated tmux format: 2 PaneState records with correct fields", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") {
          // Verify format string includes the expected placeholders
          const formatIdx = args.indexOf("-F") + 1;
          expect(args[formatIdx]).toContain("#{pane_id}");
          expect(args[formatIdx]).toContain("#{pane_title}");
          expect(args[formatIdx]).toContain("#{pane_active}");
          expect(args[formatIdx]).toContain("#{pane_width}");
          expect(args[formatIdx]).toContain("#{pane_height}");
          return {
            stdout: "%0\tmain\t1\t120x40\n%1\tworker\t0\t80x40\n",
            stderr: "",
          };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const panes = await t.listPanes();
      expect(panes).toHaveLength(2);
      expect(panes[0]).toEqual({
        paneId: "%0",
        title: "main",
        isActive: true,
        width: 120,
        height: 40,
        isMain: false,
      });
      expect(panes[1]).toEqual({
        paneId: "%1",
        title: "worker",
        isActive: false,
        width: 80,
        height: 40,
        isMain: false,
      });
    });

    it("isMain=true on matching paneId when mainPaneId supplied", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") {
          return { stdout: "%0\tmain\t1\t120x40\n%1\tworker\t0\t80x40\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const panes = await t.listPanes("%0");
      expect(panes[0].isMain).toBe(true);
      expect(panes[1].isMain).toBe(false);
    });

    it("isMain=false on all records when mainPaneId undefined", async () => {
      execFileImpl = (_file: string, args: string[]) => {
        if (args[0] === "tmux") return { stdout: "/usr/bin/tmux\n", stderr: "" };
        if (args[0] === "list-panes") {
          return { stdout: "%0\tmain\t1\t120x40\n%1\tworker\t0\t80x40\n", stderr: "" };
        }
        return { stdout: "", stderr: "" };
      };
      const { TmuxMultiplexer } = await import("../tmux");
      const t = new TmuxMultiplexer();
      const panes = await t.listPanes(undefined);
      expect(panes[0].isMain).toBe(false);
      expect(panes[1].isMain).toBe(false);
    });
  });
});
