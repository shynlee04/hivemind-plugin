/**
 * TmuxMultiplexer — direct wrapper around the `tmux` CLI binary.
 *
 * Owns the binary resolution, pane spawn/close, send-keys, list-panes,
 * and layout-application surface. The class is intentionally thin: tmux
 * is the source of truth; this class is a structured wrapper that
 * surfaces parsed results.
 *
 * Public method surface (the contract `SessionManagerAdapter` exposes
 * to the `tmux-copilot` tool):
 *   - isAvailable(): Promise<boolean>
 *   - isInsideSession(): boolean
 *   - getMainPaneId(): Promise<string | null>      [public — was private in fork]
 *   - spawnPane(options): Promise<PaneResult>
 *   - closePane(paneId): Promise<boolean>
 *   - sendKeys(paneId, text, literal?): Promise<void>
 *   - listPanes(mainPaneId?): Promise<PaneState[]>
 *   - applyLayout(layout, mainPaneSize): Promise<void>
 *
 * NOTE on `getMainPaneId` visibility: in the fork (`opencode-tmux/src/tmux.ts`)
 * this method is private (line 74-89) because the fork's public API
 * doesn't need it. Hivemind's `tmux-copilot` tool requires it (it is
 * one of the 4 methods the adapter exposes — see
 * `fork-bridge.ts:106`), so the in-tree port promotes it to public.
 * Implementation is unchanged: still runs `tmux list-panes -F "#{pane_index} #{pane_id}"`
 * and returns the pane whose pane_index is 0.
 *
 * ORIGIN: opencode-tmux/src/tmux.ts:38-345 (full class body — 1:1 port with
 *   one visibility change: getMainPaneId private → public).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// ---------------------------------------------------------------------------
// Logger (inlined — no shared/Logger module exists in Hivemind yet)
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
// Layout (inlined — no config.ts in-tree)
// ---------------------------------------------------------------------------

/**
 * Tmux layout identifiers. Mirrors the fork's `TmuxLayout` union from
 * `opencode-tmux/src/config.ts` (1:1 — same string set).
 */
export type TmuxLayout = "main-vertical" | "main-horizontal" | "tiled" | "even-horizontal" | "even-vertical";

// ---------------------------------------------------------------------------
// Public return types
// ---------------------------------------------------------------------------

/**
 * Result of a `spawnPane` call.
 * - `paneId` is set when `success === true`.
 * - `error` is set when `success === false` (human-readable failure reason).
 * ORIGIN: opencode-tmux/src/tmux.ts:8-11
 */
export interface PaneResult {
  success: boolean;
  paneId?: string;
  /**
   * Human-readable failure reason. Set when `success === false` so callers
   * can surface WHY the spawn failed (binary missing, no main pane, tmux
   * CLI error, etc.) instead of receiving a silent `{success: false}`.
   */
  error?: string;
}

/**
 * Parsed pane state from one line of `tmux list-panes` output. Re-exported
 * from `./types.js` so the multiplexer is self-contained for any caller
 * that imports directly from this file. Canonical home is `./types.js`.
 *
 * ORIGIN: opencode-tmux/src/tmux.ts:13-20 (carried forward).
 */
export type { PaneState } from "./types.js";
import type { PaneState } from "./types.js";

/**
 * Options for `spawnPane`. The `hivemindMeta` field carries the agent
 * label + delegation id that gets stamped into the pane title
 * (`[agent] deleg123 — description`).
 *
 * ORIGIN: opencode-tmux/src/tmux.ts:22-32
 */
export interface SpawnPaneOptions {
  sessionId: string;
  description: string;
  serverUrl: string;
  directory: string;
  binaryPath?: string;
  hivemindMeta?: {
    agent: string;
    delegationId: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const execFileAsync = promisify(execFile);

/**
 * Quote a shell argument for safe interpolation into a `tmux` command
 * string. The tmux CLI is invoked with `execFile` (so argv is array
 * — no shell interpolation normally), but the inner `opencode attach`
 * command is joined as a single string and re-parsed by tmux's
 * `command` parser; that path DOES need shell-quote safety.
 *
 * ORIGIN: opencode-tmux/src/tmux.ts:34-36
 */
function quoteShellArg(arg: string): string {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

// ---------------------------------------------------------------------------
// TmuxMultiplexer
// ---------------------------------------------------------------------------

/**
 * Wrapper around the `tmux` CLI binary. Lazily resolves the binary path
 * on the first call (binary resolution runs `which tmux` / `where tmux`).
 *
 * ORIGIN: opencode-tmux/src/tmux.ts:38-47 (constructor)
 * ORIGIN: opencode-tmux/src/tmux.ts:49-58 (isAvailable + isInsideSession)
 * ORIGIN: opencode-tmux/src/tmux.ts:60-72 (findBinary + targetArgs helpers)
 * ORIGIN: opencode-tmux/src/tmux.ts:74-89 (getMainPaneId — promoted to public)
 * ORIGIN: opencode-tmux/src/tmux.ts:91-94 (getBinary helper)
 * ORIGIN: opencode-tmux/src/tmux.ts:96-181 (spawnPane)
 * ORIGIN: opencode-tmux/src/tmux.ts:183-209 (closePane)
 * ORIGIN: opencode-tmux/src/tmux.ts:223-247 (sendKeys)
 * ORIGIN: opencode-tmux/src/tmux.ts:261-314 (listPanes)
 * ORIGIN: opencode-tmux/src/tmux.ts:316-345 (applyLayout)
 */
export class TmuxMultiplexer {
  private binaryPath: string | null = null;
  private hasChecked = false;
  private readonly targetPane: string | undefined;

  constructor(
    private layout: TmuxLayout = "main-vertical",
    private mainPaneSize: number = 60,
    private log?: Logger,
  ) {
    this.targetPane = process.env["TMUX_PANE"];
  }

  // -------------------------------------------------------------------------
  // Binary detection
  // -------------------------------------------------------------------------

  /**
   * Resolve the tmux binary (cached). Returns true iff the binary was
   * found on PATH.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:49-54
   */
  async isAvailable(): Promise<boolean> {
    if (this.hasChecked) return this.binaryPath !== null;
    this.binaryPath = await this.findBinary();
    this.hasChecked = true;
    return this.binaryPath !== null;
  }

  /**
   * Are we running inside a tmux session? Synchronous check on
   * `process.env.TMUX`. Used by `SessionManager` to gate `enabled`.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:56-58
   */
  isInsideSession(): boolean {
    return Boolean(process.env["TMUX"]);
  }

  /**
   * Find the tmux binary on PATH. POSIX: `which tmux`; win32: `where tmux`.
   * Returns the first match, or `null` on failure.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:60-68
   */
  private async findBinary(): Promise<string | null> {
    const cmd = process.platform === "win32" ? "where" : "which";
    try {
      const { stdout } = await execFileAsync(cmd, ["tmux"]);
      return stdout.trim().split("\n")[0] ?? null;
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Target argument helpers
  // -------------------------------------------------------------------------

  /**
   * Build the `-t <pane>` arg pair for tmux commands that target the
   * current pane (the one the harness is running in). Returns `[]`
   * outside a tmux session.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:70-72
   */
  private targetArgs(): string[] {
    return this.targetPane ? ["-t", this.targetPane] : [];
  }

  // -------------------------------------------------------------------------
  // Main pane detection (PROMOTED to public for tmux-copilot tool)
  // -------------------------------------------------------------------------

  /**
   * Resolve the main (pane_index = 0) pane id of the current tmux window.
   * Returns `null` if tmux is unavailable, no main pane exists, or the
   * list-panes call fails.
   *
   * Originally private in the fork (`opencode-tmux/src/tmux.ts:74-89`).
   * Promoted to public here because the Hivemind `tmux-copilot` tool's
   * `getMainPaneId` adapter method needs it (fork-bridge.ts:106).
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:74-89
   */
  async getMainPaneId(): Promise<string | null> {
    const tmux = await this.getBinary();
    if (!tmux) return null;
    try {
      const { stdout } = await execFileAsync(tmux, [
        "list-panes",
        ...this.targetArgs(),
        "-F", "#{pane_index} #{pane_id}",
      ]);
      const line = stdout.trim().split("\n").find((l) => l.startsWith("0 "));
      return line ? (line.split(" ")[1] || null) : null;
    } catch (err) {
      this.log?.debug("getMainPaneId: ERROR", err);
      return null;
    }
  }

  /**
   * Get the cached binary path, triggering resolution if necessary.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:91-94
   */
  private async getBinary(): Promise<string | null> {
    if (!this.hasChecked) await this.isAvailable();
    return this.binaryPath;
  }

  // -------------------------------------------------------------------------
  // Pane spawn
  // -------------------------------------------------------------------------

  /**
   * Spawn a new tmux pane that runs `opencode attach`. The pane is
   * created via `split-window -h -d -P -F #{pane_id}` (horizontal split,
   * don't switch focus, print the new pane id). After spawn we apply
   * the configured layout and (if `hivemindMeta` is supplied) stamp a
   * `[agent] deleg123 — description` title onto the pane (truncated to
   * 40 chars — tmux title length limit).
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:96-181
   */
  async spawnPane(options: SpawnPaneOptions): Promise<PaneResult> {
    console.log("[S5C-SMOKE-DEBUG] tmux-multiplexer.spawnPane:ENTRY", { sessionId: options.sessionId, description: options.description, serverUrl: options.serverUrl, directory: options.directory, hivemindMeta: options.hivemindMeta });
    const tmux = await this.getBinary();
    console.log("[S5C-SMOKE-DEBUG] tmux-multiplexer.spawnPane:binaryResolved", { binaryPath: tmux });
    if (!tmux) {
      console.log("[S5C-SMOKE-DEBUG] tmux-multiplexer.spawnPane:NO_BINARY → returning success:false");
      this.log?.debug("spawnPane: tmux binary not found");
      return { success: false, error: "tmux binary not found" };
    }

    try {
      const quotedDirectory = quoteShellArg(options.directory);
      const quotedUrl = quoteShellArg(options.serverUrl);
      const quotedSessionId = quoteShellArg(options.sessionId);

      const opencodeBinary = options.binaryPath ?? "opencode";
      const opencodeCmd = [
        opencodeBinary,
        "attach",
        quotedUrl,
        "--session",
        quotedSessionId,
        "--dir",
        quotedDirectory,
      ].join(" ");

      const splitTarget = await this.getMainPaneId();
      if (!splitTarget) {
        this.log?.debug("spawnPane: could not resolve main pane ID, aborting");
        return { success: false, error: "could not resolve main pane ID" };
      }
      const splitTargetArgs = ["-t", splitTarget];

      const args = [
        "split-window",
        ...splitTargetArgs,
        "-h",
        "-d",
        "-P",
        "-F",
        "#{pane_id}",
        opencodeCmd,
      ];

      this.log?.debug("spawnPane: executing", { tmux, args });

      const { stdout, stderr } = await execFileAsync(tmux, args);
      const paneId = stdout.trim();

      this.log?.debug("spawnPane: result", { paneId, stderr: stderr.trim() });

      if (paneId) {
        try {
          // Pane title with Hivemind metadata:
          if (options.hivemindMeta) {
            const title = `[${options.hivemindMeta.agent}] ${options.hivemindMeta.delegationId.slice(0, 8)} — ${options.description}`;
            await execFileAsync(tmux, [
              "select-pane",
              "-t",
              paneId,
              "-T",
              title.slice(0, 40), // tmux title length limit
            ]);
          } else {
            // Original behavior: first 30 chars of description
            await execFileAsync(tmux, [
              "select-pane",
              "-t",
              paneId,
              "-T",
              options.description.slice(0, 30),
            ]);
          }
        } catch {
          // cosmetic — ignore
        }

        await this.applyLayout(this.layout, this.mainPaneSize);

        this.log?.debug("spawnPane: SUCCESS", { paneId });
        return { success: true, paneId };
      }

      return { success: false, error: "tmux split-window returned no pane id" };
    } catch (err) {
      const errorMsg = err instanceof Error ? `${err.message}` : String(err);
      this.log?.debug("spawnPane: ERROR", err);
      return { success: false, error: errorMsg };
    }
  }

  // -------------------------------------------------------------------------
  // Pane close
  // -------------------------------------------------------------------------

  /**
   * Close a tmux pane: first send `C-c` to give the inner process a
   * chance to clean up, wait 250ms, then `kill-pane`. After kill, apply
   * the configured layout (cosmetic). Returns `false` if tmux is not
   * available or the kill fails.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:183-209
   */
  async closePane(paneId: string): Promise<boolean> {
    const tmux = await this.getBinary();
    if (!tmux) return false;

    try {
      try {
        await execFileAsync(tmux, ["send-keys", "-t", paneId, "C-c"]);
        await new Promise((r) => setTimeout(r, 250));
      } catch {
        // ignore
      }

      await execFileAsync(tmux, ["kill-pane", "-t", paneId]);
      this.log?.debug("closePane: killed", { paneId });

      try {
        await this.applyLayout(this.layout, this.mainPaneSize);
      } catch {
        // cosmetic
      }

      return true;
    } catch (err) {
      this.log?.debug("closePane: ERROR", err);
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Send keys
  // -------------------------------------------------------------------------

  /**
   * Send keystrokes to a tmux pane. Awaits the tmux `send-keys` call
   * to confirm tmux accepted the command. NOTE: tmux does not provide
   * a signal that the target pane actually consumed the text — a
   * resolved promise only means tmux accepted the input. A false
   * confirmation would be worse than no confirmation, so callers
   * should not assume the pane has processed the keys.
   *
   * When `literal` is true, tmux's `-l` flag is used to suppress
   * special-key interpretation, preserving the text exactly as
   * provided.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:223-247
   */
  async sendKeys(
    paneId: string,
    text: string,
    literal: boolean = false,
  ): Promise<void> {
    const tmux = await this.getBinary();
    if (!tmux) {
      throw new Error("tmux binary not found");
    }

    const args = [
      "send-keys",
      "-t",
      paneId,
      ...(literal ? ["-l"] : []),
      text,
    ];

    try {
      await execFileAsync(tmux, args);
    } catch (err: unknown) {
      const e = err as { stderr?: unknown } | null;
      const stderr = e?.stderr ? String(e.stderr).trim() : String(err);
      throw new Error(`tmux sendKeys failed: ${stderr}`);
    }
  }

  // -------------------------------------------------------------------------
  // List panes
  // -------------------------------------------------------------------------

  /**
   * List all panes in the current tmux window with parsed metadata.
   * Uses tmux format `#{pane_id}\t#{pane_title}\t#{pane_active}\t#{pane_width}x#{pane_height}`
   * and parses one PaneState per non-empty line. Malformed lines
   * (wrong field count, non-integer dimensions) are logged at debug
   * and skipped — partial results are preferred over a tool failure.
   *
   * When `mainPaneId` is supplied, the matching pane has `isMain: true`.
   * When undefined, all records have `isMain: false` (graceful
   * degradation when the caller didn't know the main pane id).
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:261-314
   */
  async listPanes(mainPaneId?: string): Promise<PaneState[]> {
    const tmux = await this.getBinary();
    if (!tmux) return [];

    const args = [
      "list-panes",
      ...this.targetArgs(),
      "-F",
      "#{pane_id}\t#{pane_title}\t#{pane_active}\t#{pane_width}x#{pane_height}",
    ];

    let stdout: string;
    try {
      const result = await execFileAsync(tmux, args);
      stdout = result.stdout;
    } catch (err) {
      this.log?.debug("listPanes: ERROR", err);
      return [];
    }

    const panes: PaneState[] = [];
    const lines = stdout.split("\n");
    for (const raw of lines) {
      const line = raw.replace(/\r$/, "");
      if (line.length === 0) continue;
      const parts = line.split("\t");
      if (parts.length !== 4) {
        this.log?.debug("listPanes: skipping malformed line", { line });
        continue;
      }
      const [paneId, title, activeFlag, dimensions] = parts;
      const dimParts = dimensions.split("x");
      if (dimParts.length !== 2) {
        this.log?.debug("listPanes: skipping line with bad dimensions", { line });
        continue;
      }
      const width = Number.parseInt(dimParts[0] ?? "", 10);
      const height = Number.parseInt(dimParts[1] ?? "", 10);
      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        this.log?.debug("listPanes: skipping line with non-integer dimensions", { line });
        continue;
      }
      panes.push({
        paneId,
        title,
        isActive: activeFlag === "1",
        width,
        height,
        isMain: mainPaneId !== undefined && paneId === mainPaneId,
      });
    }

    return panes;
  }

  // -------------------------------------------------------------------------
  // Capture pane content (P58.8, REQ-58-07)
  // -------------------------------------------------------------------------

  /**
   * Capture the visible content of a tmux pane via `tmux capture-pane -p`.
   * Returns the raw text content (up to `maxBytes` characters, default 5000)
   * along with the capture timestamp and byte length.
   *
   * This is the read-side companion to `sendKeys` — used by the polling
   * loop in `SessionManager.startPolling()` (P58.8 S1) and by the
   * `delegation-status peek` action to surface what the user currently
   * sees in the pane. The 2-second timeout protects against hung tmux
   * servers; a timeout returns `byteLength: 0` (the caller can detect
   * this and skip the cache write).
   *
   * @param paneId - The tmux pane id (e.g. `%0`).
   * @param maxBytes - Maximum content length to return. Defaults to 5000.
   * @returns Captured content + timestamp + byte length.
   */
  async capturePaneContent(
    paneId: string,
    maxBytes: number = 5000,
  ): Promise<{ content: string; capturedAt: number; byteLength: number }> {
    const tmux = await this.getBinary();
    if (!tmux) {
      return { content: "", capturedAt: Date.now(), byteLength: 0 };
    }
    try {
      const { stdout } = await execFileAsync(tmux, [
        "capture-pane",
        "-t", paneId,
        "-p",
      ], { timeout: 2000 } as Parameters<typeof execFileAsync>[2]);
      // execFile returns string | Buffer; coerce to string for stable API.
      const full = typeof stdout === "string" ? stdout : (stdout?.toString("utf8") ?? "");
      const content = full.length > maxBytes ? full.slice(-maxBytes) : full;
      return { content, capturedAt: Date.now(), byteLength: Buffer.byteLength(content, "utf8") };
    } catch (err) {
      this.log?.debug("capturePaneContent: ERROR", { paneId, err });
      return { content: "", capturedAt: Date.now(), byteLength: 0 };
    }
  }

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------

  /**
   * Apply a tmux window layout and (for `main-*` layouts) set the
   * main-pane size. For `tiled`/`even-*` we only need the
   * `select-layout` call.
   *
   * ORIGIN: opencode-tmux/src/tmux.ts:316-345
   */
  async applyLayout(layout: TmuxLayout, mainPaneSize: number): Promise<void> {
    const tmux = await this.getBinary();
    if (!tmux) return;

    try {
      await execFileAsync(tmux, [
        "select-layout",
        ...this.targetArgs(),
        layout,
      ]);

      if (layout === "main-vertical" || layout === "main-horizontal") {
        const option =
          layout === "main-vertical" ? "main-pane-width" : "main-pane-height";
        await execFileAsync(tmux, [
          "set-window-option",
          ...this.targetArgs(),
          option,
          `${mainPaneSize}%`,
        ]);
        await execFileAsync(tmux, [
          "select-layout",
          ...this.targetArgs(),
          layout,
        ]);
      }
    } catch (err) {
      this.log?.debug("applyLayout: ERROR", err);
    }
  }
}
