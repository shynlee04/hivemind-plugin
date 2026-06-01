import { describe, it, expect, beforeEach, afterEach, beforeAll, mock, spyOn } from "bun:test";

// ---- mutable mock state ----
// These are captured by closure in the mock factory functions below.
// Changing them between tests affects subsequent calls to readFileSync/homedir.
let readFileSyncImpl: (path: string, enc: string) => string = () => {
  const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
  throw err;
};

let homedirImpl: () => string = () => "/home/testuser";

// ---- register mocks BEFORE any import of config ----
// mock.module replaces the module registry entry. Since config.ts uses
// `import { readFileSync } from "node:fs"`, the binding is resolved at
// module load time. For the mock to work, config.ts must be loaded AFTER
// mock.module() is called. This file has no static import of ../config,
// so the first time config.ts loads is when beforeAll runs.
mock.module("node:fs", () => ({
  readFileSync: (path: string, enc: string) => readFileSyncImpl(path, enc),
}));

mock.module("node:os", () => ({
  homedir: () => homedirImpl(),
}));

// Import config module AFTER mocks are registered.
// Use a module-level variable populated in beforeAll.
let loadConfig: (dir: string) => any;
let DEFAULT_CONFIG: any;

describe("loadConfig()", () => {
  let stderrSpy: ReturnType<typeof spyOn>;

  beforeAll(async () => {
    // Dynamic import ensures config.ts loads with our mocked node:fs/node:os
    const mod = await import("../config");
    loadConfig = mod.loadConfig;
    DEFAULT_CONFIG = mod.DEFAULT_CONFIG;
  });

  beforeEach(() => {
    stderrSpy = spyOn(console, "error").mockImplementation(() => {});
    // Reset to ENOENT for all paths
    readFileSyncImpl = () => {
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    homedirImpl = () => "/home/testuser";
    delete process.env.OPENCODE_TMUX_DEBUG;
  });

  afterEach(() => {
    stderrSpy.mockRestore();
  });

  it("returns DEFAULT_CONFIG when all paths ENOENT", () => {
    const cfg = loadConfig("/project");
    expect(cfg).toEqual(DEFAULT_CONFIG);
  });

  it("applies global config", () => {
    readFileSyncImpl = (path: string) => {
      if (path.includes(".config/opencode/opencode-tmux.json")) {
        return JSON.stringify({ layout: "tiled", mainPaneSize: 40 });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.layout).toBe("tiled");
    expect(cfg.mainPaneSize).toBe(40);
  });

  it("project overrides global", () => {
    readFileSyncImpl = (path: string) => {
      if (path.includes(".config/opencode/opencode-tmux.json")) {
        return JSON.stringify({ layout: "tiled", mainPaneSize: 40 });
      }
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ layout: "even-horizontal", mainPaneSize: 70 });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.layout).toBe("even-horizontal");
    expect(cfg.mainPaneSize).toBe(70);
  });

  it("opencode-tmux.json preferred over .opencode/opencode-tmux.json", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ layout: "even-vertical" });
      }
      if (path.endsWith("/project/.opencode/opencode-tmux.json")) {
        return JSON.stringify({ layout: "tiled" });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.layout).toBe("even-vertical");
  });

  it("falls back to .opencode/opencode-tmux.json when direct not found", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/.opencode/opencode-tmux.json")) {
        return JSON.stringify({ layout: "main-horizontal" });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.layout).toBe("main-horizontal");
  });

  it("clamps mainPaneSize to minimum 10", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ mainPaneSize: 5 });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.mainPaneSize).toBe(10);
  });

  it("clamps mainPaneSize to maximum 90", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ mainPaneSize: 95 });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.mainPaneSize).toBe(90);
  });

  it("invalid layout falls back to default", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ layout: "not-a-layout" });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.layout).toBe(DEFAULT_CONFIG.layout);
  });

  it("wrong types for all fields → defaults kept", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({
          layout: 123,
          mainPaneSize: "big",
          autoClose: "yes",
        });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg).toEqual(DEFAULT_CONFIG);
  });

  it("malformed JSON logs error when OPENCODE_TMUX_DEBUG set", () => {
    process.env.OPENCODE_TMUX_DEBUG = "1";
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return "{ not valid json }}}";
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    loadConfig("/project");
    expect(stderrSpy).toHaveBeenCalled();
    expect(stderrSpy.mock.calls[0][0]).toContain("[opencode-tmux:config]");
  });

  it("autoClose false is respected", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ autoClose: false });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.autoClose).toBe(false);
  });

  // ---- Hivemind extension keys ----

  it("copilot true is respected", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ copilot: true });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.copilot).toBe(true);
  });

  it("copilot defaults to false when absent", () => {
    const cfg = loadConfig("/project");
    expect(cfg.copilot).toBe(false);
  });

  it("copilot false when wrong type", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ copilot: "yes" });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.copilot).toBe(false);
  });

  it("agentLabelFormat is parsed from config", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ agentLabelFormat: "{agentType}" });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.agentLabelFormat).toBe("{agentType}");
  });

  it("agentLabelFormat defaults when absent", () => {
    const cfg = loadConfig("/project");
    expect(cfg.agentLabelFormat).toBe("{agentType} — {delegationId}");
  });

  it("opencodeBinaryPath is kept when string", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ opencodeBinaryPath: "/custom/path/opencode" });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.opencodeBinaryPath).toBe("/custom/path/opencode");
  });

  it("opencodeBinaryPath is undefined when absent", () => {
    const cfg = loadConfig("/project");
    expect(cfg.opencodeBinaryPath).toBeUndefined();
  });

  it("opencodeBinaryPath is undefined when wrong type", () => {
    readFileSyncImpl = (path: string) => {
      if (path.endsWith("/project/opencode-tmux.json")) {
        return JSON.stringify({ opencodeBinaryPath: 42 });
      }
      const err = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw err;
    };
    const cfg = loadConfig("/project");
    expect(cfg.opencodeBinaryPath).toBeUndefined();
  });
});
