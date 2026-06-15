import { existsSync } from "node:fs"
import { dirname, resolve } from "node:path"

import type { BootstrapScope } from "../schema-kernel/bootstrap.schema.js"

/**
 * Resolve the project root directory by walking up from the current working
 * directory (or an explicit path) until a package.json or .hivemind marker is
 * found.
 *
 * @param explicitRoot - Optional explicit root path to start resolution from.
 * @returns The resolved project root, or null if no marker is found.
 */
export function resolveProjectRoot(explicitRoot?: string): string | null {
  const candidate = explicitRoot?.trim() ? resolve(explicitRoot) : process.cwd()
  let current = candidate
  while (true) {
    if (existsSync(resolve(current, "package.json")) || existsSync(resolve(current, ".hivemind"))) {
      return current
    }
    const parent = dirname(current)
    if (parent === current) return null
    current = parent
  }
}

/**
 * Parse a CLI scope flag value into a typed BootstrapScope result.
 *
 * @param rawScope - The raw scope value from CLI flags (string, boolean, or undefined).
 * @returns A success result with the parsed scope, or a failure result with an error message.
 */
export function parseScopeFlag(
  rawScope: string | boolean | undefined,
): { success: true; scope: BootstrapScope } | { success: false; error: string } {
  if (rawScope === undefined) {
    return { success: true, scope: "project" }
  }
  if (rawScope === "project" || rawScope === "global") {
    return { success: true, scope: rawScope }
  }
  return { success: false, error: `[Hivemind] Invalid scope: ${String(rawScope)}` }
}

/**
 * Extract a string value from a CLI flags record.
 *
 * @param flags - The CLI flags record.
 * @param key - The flag key to look up.
 * @returns The string value if present, or undefined.
 */
export function getStringFlag(
  flags: Record<string, string | boolean>,
  key: string,
): string | undefined {
  const value = flags[key]
  return typeof value === "string" ? value : undefined
}

/**
 * Check whether the --help or -h flag is set in a CLI flags record.
 *
 * @param flags - The CLI flags record.
 * @returns True if help is requested.
 */
export function hasHelpFlag(flags: Record<string, string | boolean>): boolean {
  return flags.help === true || flags.h === true
}
