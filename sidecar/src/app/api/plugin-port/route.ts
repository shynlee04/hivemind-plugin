/**
 * GET /api/plugin-port
 *
 * Returns the canonical port the Hivemind plugin server is currently bound to.
 * The plugin server writes its bound port to `.hivemind/state/sidecar-port.json`
 * at startup (see `src/sidecar/server/factory.ts`). The sidecar browser client
 * fetches this same-origin endpoint during port discovery (Wave 3 of the
 * plugin-port-pool initiative) so it can connect to the actual port instead of
 * guessing from the [4096-4105] probe list.
 *
 * Response shape: `{ "port": <number 1-65535> }` (unwrapped — distinct from
 * the plugin server's wrapped `{ ok, data }` envelope).
 *
 * Failure modes:
 *   - 404: port file not found (plugin server not yet started, or `.hivemind/`
 *     state root missing). The client should fall through to the port-probe
 *     loop.
 *   - 500: file exists but contains invalid JSON or an invalid `{ port }` shape.
 *     The client should fall through to the port-probe loop.
 *   - 200: valid port number. The client should use this port directly.
 *
 * Runtime: this handler runs in the Next.js Node runtime (NOT edge) because
 * it uses `node:fs` to read the port file. The `dynamic = "force-dynamic"`
 * export disables all caching so the response always reflects the latest
 * plugin-server state.
 */

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export const dynamic = "force-dynamic";

// Env var that explicitly pins the Hivemind project root. Honored by
// `resolveHivemindRoot()` as a fast path before the walk-up search.
// Useful for tests (deterministic root) and containerized deploys.
const HIVEMIND_DIR_ENV = "HIVEMIND_DIR";

// Path to the canonical port file relative to the Hivemind project root.
// The plugin server writes this file via `writeFile` at
// `src/sidecar/server/factory.ts:136-140`. The `.hivemind/` root is a
// Q6-locked project-level state directory (see `.planning/architecture/`).
const PORT_FILE_RELATIVE = ".hivemind/state/sidecar-port.json";

/**
 * Type guard: validates that `value` is a usable TCP port number.
 * Accepts integers in the inclusive range [1, 65535].
 */
function isValidPortNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 65535
  );
}

/**
 * Type guard: validates the JSON-decoded port file has the expected
 * `{ port: <number> }` shape. Returns `true` only when the file contains
 * exactly one field `port` whose value passes `isValidPortNumber`.
 */
function isPortFileShape(parsed: unknown): parsed is { port: number } {
  if (typeof parsed !== "object" || parsed === null) {
    return false;
  }
  // After the typeof+null check above, `parsed` is known to be an object.
  // The `as Record<string, unknown>` is a SAFE narrowing (we've already
  // rejected non-objects) used to read an arbitrary property without
  // TypeScript's strict index-signature error.
  const record = parsed as Record<string, unknown>;
  return isValidPortNumber(record.port);
}

/**
 * Type guard: identifies Node.js filesystem errors (those carrying a
 * `code` string like "ENOENT", "EACCES", etc.). Used to differentiate
 * "file not found" (404) from "permission denied" or other I/O errors
 * (500).
 */
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
  );
}

/**
 * Resolves the Hivemind project root directory at runtime.
 *
 * Lookup order:
 *   1. `HIVEMIND_DIR` env var (explicit override — primarily for tests
 *      and containerized deploys)
 *   2. Walk up from `process.cwd()` looking for a directory containing
 *      `.hivemind/`. This handles the dev-server case where the sidecar
 *      runs from `sidecar/` but the project root is the parent dir.
 *
 * The Q6 architectural decision locks `.hivemind/` at the project root
 * for ALL consumers (plugin server, sidecar, tests). Walking up from
 * cwd is the canonical way to find it without hardcoding absolute paths.
 *
 * @returns Absolute path to the directory containing `.hivemind/`,
 *          or `null` if neither env var nor walk-up finds it.
 */
function resolveHivemindRoot(): string | null {
  const envDir = process.env[HIVEMIND_DIR_ENV];
  if (envDir !== undefined && envDir.length > 0) return envDir;
  let current = process.cwd();
  while (true) {
    if (existsSync(join(current, ".hivemind"))) return current;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * GET handler — reads the plugin server's port file and returns the port
 * as JSON. See the module-level JSDoc for response shape and failure-mode
 * semantics.
 */
export async function GET(): Promise<NextResponse> {
  // Step 0: resolve the Hivemind project root. If neither env var nor
  // walk-up finds `.hivemind/`, return 500 (the route cannot serve a
  // meaningful port without it).
  const hivemindRoot = resolveHivemindRoot();
  if (hivemindRoot === null) {
    return NextResponse.json(
      {
        error: "hivemind_root_not_found",
        message:
          `Could not locate .hivemind/ by walking up from ${process.cwd()}. ` +
          `Set ${HIVEMIND_DIR_ENV} env var to the project root.`,
      },
      { status: 500 },
    );
  }
  const portFilePath = join(hivemindRoot, PORT_FILE_RELATIVE);

  // Step 1: read the port file. ENOENT → 404 (file missing means the plugin
  // server has not yet bound a port and written the file). Any other I/O
  // error → 500 (unexpected infrastructure problem).
  let content: string;
  try {
    content = await readFile(portFilePath, "utf-8");
  } catch (err) {
    if (isNodeError(err) && err.code === "ENOENT") {
      return NextResponse.json(
        {
          error: "plugin_server_port_file_not_found",
          message: `No plugin server port file at ${portFilePath}`,
          path: portFilePath,
        },
        { status: 404 },
      );
    }
    return NextResponse.json(
      {
        error: "plugin_server_port_file_read_failed",
        message: "Failed to read plugin server port file",
      },
      { status: 500 },
    );
  }

  // Step 2: parse JSON. Malformed JSON → 500.
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json(
      {
        error: "plugin_server_port_file_invalid_json",
        message: "Plugin server port file does not contain valid JSON",
      },
      { status: 500 },
    );
  }

  // Step 3: validate the parsed JSON has the expected `{ port: <number> }`
  // shape. Wrong shape → 500.
  if (!isPortFileShape(parsed)) {
    return NextResponse.json(
      {
        error: "plugin_server_port_file_invalid_shape",
        message: "Plugin server port file does not contain a valid port number",
      },
      { status: 500 },
    );
  }

  // Step 4: success — return the raw `{ port: <number> }` envelope. This is
  // intentionally UNWRAPPED (no `ok`/`data` keys) so the client can parse
  // it directly without unwrapping the plugin server's response envelope.
  return NextResponse.json({ port: parsed.port });
}
