import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { TmuxLayout } from "./config";
import type { Logger } from "./util";

const execFileAsync = promisify(execFile);

export interface PaneResult {
  success: boolean;
  paneId?: string;
}

export interface PaneState {
  paneId: string;
  title: string;
  isActive: boolean;
  width: number;
  height: number;
  isMain: boolean;
}

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

function quoteShellArg(arg: string): string {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

export class TmuxMultiplexer {
  private binaryPath: string | null = null;
  private hasChecked = false;
  private targetPane = process.env.TMUX_PANE;

  constructor(
    private layout: TmuxLayout = "main-vertical",
    private mainPaneSize: number = 60,
    private log?: Logger,
  ) {}

  async isAvailable(): Promise<boolean> {
    if (this.hasChecked) return this.binaryPath !== null;
    this.binaryPath = await this.findBinary();
    this.hasChecked = true;
    return this.binaryPath !== null;
  }

  isInsideSession(): boolean {
    return !!process.env.TMUX;
  }

  private async findBinary(): Promise<string | null> {
    const cmd = process.platform === "win32" ? "where" : "which";
    try {
      const { stdout } = await execFileAsync(cmd, ["tmux"]);
      return stdout.trim().split("\n")[0] ?? null;
    } catch {
      return null;
    }
  }

  private targetArgs(): string[] {
    return this.targetPane ? ["-t", this.targetPane] : [];
  }

  private async getMainPaneId(): Promise<string | null> {
    const tmux = await this.getBinary();
    if (!tmux) return null;
    try {
      const { stdout } = await execFileAsync(tmux, [
        "list-panes",
        ...this.targetArgs(),
        "-F", "#{pane_index} #{pane_id}",
      ]);
      const line = stdout.trim().split("\n").find(l => l.startsWith("0 "));
      return line ? (line.split(" ")[1] || null) : null;
    } catch (err) {
      this.log?.debug("getMainPaneId: ERROR", err);
      return null;
    }
  }

  private async getBinary(): Promise<string | null> {
    if (!this.hasChecked) await this.isAvailable();
    return this.binaryPath;
  }

  async spawnPane(options: SpawnPaneOptions): Promise<PaneResult> {
    const tmux = await this.getBinary();
    if (!tmux) {
      this.log?.debug("spawnPane: tmux binary not found");
      return { success: false };
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
        return { success: false };
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

      return { success: false };
    } catch (err) {
      this.log?.debug("spawnPane: ERROR", err);
      return { success: false };
    }
  }

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

  /**
   * Send keystrokes to a tmux pane.
   *
   * Awaits the tmux `send-keys` call to confirm tmux accepted the command.
   * Note: tmux does not provide a signal that the target pane actually
   * consumed the text — a resolved promise only means tmux accepted the
   * input. A false confirmation would be worse than no confirmation, so
   * callers should not assume the pane has processed the keys.
   *
   * When `literal` is true, tmux's `-l` flag is used to suppress special-key
   * interpretation, preserving the text exactly as provided.
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
    } catch (err: any) {
      const stderr = (err && err.stderr) ? String(err.stderr).trim() : String(err);
      throw new Error(`tmux sendKeys failed: ${stderr}`);
    }
  }

  /**
   * List all panes in the current tmux window with parsed metadata.
   *
   * Uses tmux format `#{pane_id}\t#{pane_title}\t#{pane_active}\t#{pane_width}x#{pane_height}`
   * and parses one PaneState per non-empty line. Malformed lines (wrong field
   * count, non-integer dimensions) are logged at debug and skipped — partial
   * results are preferred over a tool failure.
   *
   * When `mainPaneId` is supplied, the matching pane has `isMain: true`. When
   * undefined, all records have `isMain: false` (graceful degradation when
   * the caller didn't know the main pane id).
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
