/**
 * Constants and helpers for the Hivemind plugin server port allocation.
 *
 * The plugin server tries a fixed list of ports in order and uses the
 * first one that successfully binds. This allows multiple OpenCode
 * instances to coexist (each gets a unique port in the pool) without
 * the race condition that occurred when every instance wrote to a
 * single shared port file.
 *
 * Companion: `sidecar/src/lib/plugin-client.ts` (Wave 2) probes the
 * same port list to discover the active plugin server.
 *
 * Override precedence (highest first):
 *   1. `HIVEMIND_PLUGIN_PORT`       — single explicit port
 *   2. `HIVEMIND_PLUGIN_PORT_LIST`  — comma-separated list
 *   3. `HIVEMIND_PLUGIN_PORT_LIST` default constant
 *
 * @see /Users/apple/hivemind-plugin-private/.hivemind/planning/plugin-port-pool-2026-06-07/00-landscape.md
 * @module sidecar/server/constants
 */

import net from "node:net"

/**
 * Default port pool for the Hivemind plugin server.
 *
 * Ten consecutive ports starting at 4096. The first port that the OS
 * allows the server to bind to on `127.0.0.1` wins.
 */
export const HIVEMIND_PLUGIN_PORT_LIST: readonly number[] = [
  4096, 4097, 4098, 4099, 4100, 4101, 4102, 4103, 4104, 4105,
] as const

/**
 * Parse the `HIVEMIND_PLUGIN_PORT_LIST` environment variable into a
 * list of TCP port numbers. Falls back to {@link HIVEMIND_PLUGIN_PORT_LIST}
 * when the variable is unset, empty, or contains no valid entries.
 *
 * @returns A list of valid TCP port numbers (1 < n < 65536).
 */
export function parsePortList(): readonly number[] {
  const envList = process.env["HIVEMIND_PLUGIN_PORT_LIST"]
  if (envList) {
    const parsed = envList
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0 && n < 65536)
    if (parsed.length > 0) return parsed
  }
  return HIVEMIND_PLUGIN_PORT_LIST
}

/**
 * Try each port in order; return the first one that successfully binds
 * to `127.0.0.1`. The probe server is closed before returning so the
 * port is free for the caller to bind.
 *
 * @param ports - Port candidates in priority order.
 * @param hostname - Bind hostname (default `127.0.0.1`).
 * @returns The first port that was free at probe time.
 * @throws `[Harness]` error when every port is taken.
 */
export async function findAvailablePort(
  ports: readonly number[],
  hostname: string = "127.0.0.1",
): Promise<number> {
  for (const port of ports) {
    const isAvailable = await new Promise<boolean>((resolve) => {
      const tester = net.createServer()
      tester.once("error", () => {
        tester.close(() => resolve(false))
      })
      tester.once("listening", () => {
        tester.close(() => resolve(true))
      })
      tester.listen(port, hostname)
    })
    if (isAvailable) return port
  }
  throw new Error(
    `[Harness] All ${ports.length} plugin server ports are in use: ${ports.join(", ")}. ` +
      `Either close other OpenCode instances or set HIVEMIND_PLUGIN_PORT to a free port.`,
  )
}
