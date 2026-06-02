/**
 * Hivemind Tmux integration module.
 *
 * Factory module that constructs the in-tree tmux subsystem when tmux
 * is available, and returns `null` (silent no-op) otherwise. The
 * factory mirrors the `createPtyManagerIfSupported()` pattern used
 * elsewhere in the harness.
 *
 * What this module owns:
 * - Binary resolution (tmux, opencode)
 * - Tmux version detection
 * - Port persistence (`.hivemind/state/tmux-port.json`)
 * - Server URL detection (port → `http://localhost:<port>`)
 * - The factory that wires `TmuxMultiplexer` + `SessionManager` +
 *   planner factory into a `TmuxIntegration` object
 *
 * D-04 contract: silent fallback (returns `null`, not throws). The
 * factory uses runtime detection (existsSync / which) rather than
 * import-time detection. The integration still works in a degraded
 * mode (tmux pane commands are unavailable; `tmux-copilot` tool calls
 * return `{available: false, reason: "tmux-not-wired"}`).
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { PaneGridPlanner } from "./grid-planner.js";
import { SessionManager } from "./session-manager.js";
import { TmuxMultiplexer } from "./tmux-multiplexer.js";
import type { Logger } from "./tmux-multiplexer.js";
import { setSessionManagerAdapter, type SessionManagerAdapter } from "./types.js";

const execFileAsync = promisify(execFile);
const PORT_FILE = ".hivemind/state/tmux-port.json";

// ---------------------------------------------------------------------------
// Binary resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the full path to a binary using `which` (POSIX) or `where` (win32).
 * Returns null if not found.
 */
export async function resolveBinary(name: string): Promise<string | null> {
  const cmd = process.platform === "win32" ? "where" : "which";
  try {
    const { stdout } = await execFileAsync(cmd, [name]);
    const path = stdout.trim().split("\n")[0];
    return path ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tmux version detection
// ---------------------------------------------------------------------------

/**
 * Get the tmux version string by running `{tmuxPath} --version`.
 */
export async function getTmuxVersion(tmuxPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(tmuxPath, ["--version"]);
    return stdout.trim();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Port persistence
// ---------------------------------------------------------------------------

/**
 * Resolve the tmux port for `projectDir`, returning the persisted port if
 * the state file exists, else computing a deterministic fallback from a
 * SHA-256 hash of `projectDir` mapped into the 10000..65535 range.
 *
 * The previous name `readPersistedPort` was misleading — the function does
 * NOT return `null` on a cold start; it always returns a usable port via
 * the deterministic hash fallback. The new name `readOrMigratePort`
 * documents the "persist or derive" behavior at the call site.
 *
 * Birthday-collision invariant: the deterministic fallback has 55,535
 * distinct ports (10000..65535 inclusive). Per the birthday paradox, the
 * first collision among N projects on a shared host is expected at
 * ~√55535 ≈ 236 projects. Two projects on the same host whose SHA-256
 * hashes happen to map to the same port will both attempt to bind, and
 * the second will silently fall back to a different port via the
 * `EADDRINUSE` retry path in the tmux server bootstrap. This is
 * acceptable for the single-developer, single-host target use case
 * documented in P42/SPEC.md.
 *
 * @param projectDir - absolute path used as the hash key AND as the
 *   parent of the persisted port file (`.hivemind/state/tmux-port.json`).
 * @returns a port number in 10000..65535, or `null` only if the persisted
 *   file exists but is malformed (parse error or non-numeric `port`
 *   field). A `null` return is a signal to the caller to treat the
 *   project as having no valid port and to surface the error to the user
 *   rather than silently using a fresh hash (which would be a different
 *   port than the one the user may have been told to use).
 */
export function readOrMigratePort(projectDir: string): number | null {
  const path = join(projectDir, PORT_FILE);
  if (!existsSync(path)) {
    // Fallback: deterministic hash of project directory for stability
    const hash = createHash("sha256").update(projectDir).digest("hex");
    return 10000 + (parseInt(hash.slice(0, 4), 16) % 55535);
  }
  try {
    const data = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
    return typeof data.port === "number" ? data.port : null;
  } catch {
    return null;
  }
}

/**
 * Persist the tmux port to `.hivemind/state/tmux-port.json` for cross-session
 * stability. Creates the state directory if it does not exist.
 */
export function persistPort(projectDir: string, port: number): void {
  const stateDir = join(projectDir, ".hivemind", "state");
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }
  writeFileSync(
    join(projectDir, PORT_FILE),
    JSON.stringify({ port, updatedAt: Date.now() }, null, 2),
    "utf-8",
  );
}

/**
 * Detect the server URL for a given project directory.
 * First tries the persisted port; if none found, returns null
 * (caller may detect URL from PluginInput later).
 */
export async function detectServerUrl(projectDir: string): Promise<string | null> {
  const port = readOrMigratePort(projectDir);
  if (port) return `http://localhost:${port}`;
  return null;
}

// ---------------------------------------------------------------------------
// TmuxIntegration interface
// ---------------------------------------------------------------------------

/**
 * The wired tmux subsystem. The `tmux-copilot` tool consumes `adapter`
 * (the `SessionManagerAdapter` shape). `multiplexer` and
 * `sessionManager_` are exposed for testing + future plugin-time wiring
 * (e.g. observer hookup in `plugin.ts`).
 */
export interface TmuxIntegration {
  readonly isAvailable: () => boolean;
  readonly version: string | null;
  readonly binaryPath: string | null;
  readonly opencodeBinaryPath: string | null;
  readonly serverUrl: string | null;
  readonly projectDirectory: string;
  readonly adapter: SessionManagerAdapter;
  readonly multiplexer: TmuxMultiplexer;
  readonly sessionManager_: SessionManager;
  /** Factory for the in-tree `PaneGridPlanner`. */
  readonly createPaneGridPlanner: (debounceMs?: number) => PaneGridPlanner;
}

// ---------------------------------------------------------------------------
// Factory — silent fallback
// ---------------------------------------------------------------------------

/**
 * Create a `TmuxIntegration` instance if tmux and opencode are available.
 * Returns `null` (silent no-op) when:
 * - tmux binary not found on PATH
 * - Not running inside a tmux session (process.env.TMUX not set)
 * - opencode binary not found on PATH
 * - Any error occurs during detection
 *
 * Phase 51 (REQ-51-05): the factory owns the in-tree `TmuxMultiplexer`
 * and `SessionManager` lifecycle. The `adapter` it returns is the
 * `SessionManagerAdapter` shape that the `tmux-copilot` tool consumes
 * (replaces the fork-bridge that Phase 43-46 used).
 *
 * D-04 contract: runtime existsSync-based detection. The factory
 * returns `null` (not throws) when tmux is unavailable. The D-04
 * graceful-fallback guarantee is preserved by the silent-null return
 * pattern — callers (e.g. `plugin.ts`) treat a `null` return as
 * "tmux integration not available, skip the tool registration."
 */
export async function createTmuxIntegrationIfSupported(
  projectDirectory: string,
  options: { log?: Logger } = {},
): Promise<TmuxIntegration | null> {
  try {
    // Step 1: Check tmux binary via which/where
    const tmuxPath = await resolveBinary("tmux");
    if (!tmuxPath) return null;

    // Step 2: Verify we're inside a tmux session
    if (!process.env.TMUX) return null;

    // Step 3: Resolve opencode binary for pane spawn commands
    const opencodePath = await resolveBinary("opencode");
    if (!opencodePath) return null;

    // Step 4: Detect or read persisted server URL
    const serverUrl = await detectServerUrl(projectDirectory);
    // Null serverUrl is OK — will be detected from PluginInput at plugin time

    // Step 5: Get tmux version string
    const version = await getTmuxVersion(tmuxPath);

    // Step 6: Construct the in-tree multiplexer
    const multiplexer = new TmuxMultiplexer("main-vertical", 60, options.log);

    // Step 7: Construct the in-tree session manager
    const sessionManager_ = new SessionManager(
      multiplexer,
      serverUrl ?? `http://localhost:${readOrMigratePort(projectDirectory) ?? 0}`,
      projectDirectory,
      options.log,
    );

    // Step 8: Build the SessionManagerAdapter (the surface the
    // tmux-copilot tool consumes). This is the in-tree replacement
    // for the fork-bridge's `getForkSessionManager()` pattern.
    const adapter: SessionManagerAdapter = {
      onSessionCreated: (event) => sessionManager_.onSessionCreated(event),
      respawnIfKnown: (sessionId: string) => sessionManager_.respawnIfKnown(sessionId),
      getMainPaneId: () => multiplexer.getMainPaneId(),
      sendKeys: (paneId: string, text: string, literal?: boolean) =>
        multiplexer.sendKeys(paneId, text, literal),
      listPanes: (mainPaneId?: string) => multiplexer.listPanes(mainPaneId),
      createPaneGridPlanner: (debounceMs?: number) => new PaneGridPlanner(debounceMs),
    };

    // Step 9: Publish the adapter to the module-level slot so the
    // tmux-copilot tool (which is constructed at SDK-tool-registration
    // time, before this factory runs) can look it up at execute() time.
    setSessionManagerAdapter(adapter);

    return {
      isAvailable: () => true,
      version,
      binaryPath: tmuxPath,
      opencodeBinaryPath: opencodePath,
      serverUrl,
      projectDirectory,
      adapter,
      multiplexer,
      sessionManager_,
      createPaneGridPlanner: (debounceMs?: number) => new PaneGridPlanner(debounceMs),
    };
  } catch {
    return null;
  }
}
