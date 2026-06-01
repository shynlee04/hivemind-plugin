/**
 * Hivemind Tmux integration module.
 *
 * Provides Tmux availability detection, binary path resolution, port persistence,
 * and a silent fallback factory that mirrors `createPtyManagerIfSupported()`.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { setForkSessionManager } from "./fork-bridge.js";
import type { ForkSessionManagerAdapter } from "./fork-bridge.js";

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
 * Read the persisted tmux port from `.hivemind/state/tmux-port.json`.
 * If no file exists, compute a deterministic fallback port from a hash of
 * projectDir, mapped to the 10000..65535 range.
 */
export function readPersistedPort(projectDir: string): number | null {
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
  const port = readPersistedPort(projectDir);
  if (port) return `http://localhost:${port}`;
  return null;
}

// ---------------------------------------------------------------------------
// TmuxIntegration interface
// ---------------------------------------------------------------------------

export interface TmuxIntegration {
  readonly isAvailable: () => boolean;
  readonly version: string | null;
  readonly binaryPath: string | null;
  readonly opencodeBinaryPath: string | null;
  readonly serverUrl: string | null;
  readonly projectDirectory: string;
}

// ---------------------------------------------------------------------------
// Factory — silent fallback
// ---------------------------------------------------------------------------

/**
 * Create a TmuxIntegration instance if tmux and opencode are available.
 * Returns `null` (silent no-op) when:
 * - tmux binary not found on PATH
 * - Not running inside a tmux session (process.env.TMUX not set)
 * - opencode binary not found on PATH
 * - Any error occurs during detection
 *
 * If `forkSessionManager` is provided AND the integration is successfully
 * created, registers the adapter via `setForkSessionManager(adapter)` so the
 * tmux-copilot tool can dispatch actions to the fork. When the integration is
 * not created (returns null), the bridge is left untouched (already null by
 * default) — explicit `setForkSessionManager(null)` calls are unnecessary.
 *
 * Phase 43 (REQ-05): runtime-injection boundary. In production, the fork's
 * plugin entry calls this factory with its own SessionManager cast to
 * `ForkSessionManagerAdapter`. Tests pass a stub adapter.
 */
export async function createTmuxIntegrationIfSupported(
  projectDirectory: string,
  forkSessionManager?: ForkSessionManagerAdapter | null,
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

    // Phase 43 wiring: register the fork adapter with the bridge. Replace-only
    // semantics from the bridge handle HMR-style re-init safely.
    //
    // D-04: existsSync-based detection (not import-based). The fork package
    // is OPTIONAL — if package.json declares it but install failed (peer-dep
    // mismatch, native binding missing), the import chain may resolve but the
    // on-disk package is absent. existsSync on the package directory is the
    // runtime truth. When the package is absent, skip fork-bridge registration
    // — the integration still works (tmux pane commands) but tmux-copilot
    // tool calls will return {available: false, reason: "fork-not-wired"}
    // (P43-02's graceful-unavailable contract).
    const FORK_PACKAGE_DIR = "node_modules/@hivemind/opencode-tmux";
    if (forkSessionManager !== undefined && forkSessionManager !== null) {
      if (existsSync(join(projectDirectory, FORK_PACKAGE_DIR))) {
        setForkSessionManager(forkSessionManager);
      }
    }

    return {
      isAvailable: () => true,
      version,
      binaryPath: tmuxPath,
      opencodeBinaryPath: opencodePath,
      serverUrl,
      projectDirectory,
    };
  } catch {
    return null;
  }
}
