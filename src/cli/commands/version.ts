import { readFileSync } from "node:fs"

import type { CliCommand } from "../router.js"

type VersionCommandDeps = {
  readVersion: () => string
}

/**
 * Read the installed Hivemind package version from package metadata.
 *
 * @returns The version string declared in the package root `package.json`.
 *
 * @example
 * ```ts
 * const version = readInstalledVersion()
 * ```
 */
export function readInstalledVersion(): string {
  const packageJson = JSON.parse(
    readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
  ) as { version?: string }
  return packageJson.version ?? "0.0.0"
}

/**
 * Create the BOOT-02 `version` CLI command.
 *
 * The command prints the installed package version and supports `--version`
 * routing through the existing alias mechanism.
 *
 * @param deps - Optional injectable dependencies for tests.
 * @returns The `version` command implementation.
 *
 * @example
 * ```ts
 * const command = createVersionCommand()
 * ```
 */
export function createVersionCommand(deps: Partial<VersionCommandDeps> = {}): CliCommand {
  const resolvedDeps: VersionCommandDeps = {
    readVersion: deps.readVersion ?? readInstalledVersion,
  }

  return {
    name: "version",
    summary: "Print the installed Hivemind package version.",
    aliases: ["--version"],
    handler: async () => ({
      exitCode: 0,
      output: resolvedDeps.readVersion(),
    }),
  }
}

/**
 * Canonical BOOT-02 `version` command export.
 *
 * @example
 * ```ts
 * const result = await versionCmd.handler({ flags: {}, positionals: [], argv: ["version"] })
 * ```
 */
export const versionCmd = createVersionCommand()
