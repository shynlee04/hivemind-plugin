/**
 * CLI substrate entry point (Phase 40 / PH40-01).
 *
 * This module is the runtime entry point used by `bin/hivemind-tools.cjs`.
 * It wires the built-in command sources into a router and exposes a
 * single `runCli(argv, io?)` function that:
 *   - Parses argv (stripped of `node` and the script name).
 *   - Dispatches to the matching command via {@link createRouter}.
 *   - Writes the handler's `output` to stdout (when present).
 *   - Writes any `error` to stderr (always `[Harness]`-prefixed).
 *   - Resolves the handler's exit code (default 0).
 *
 * The substrate is dependency-free except for the harness's own modules;
 * see `src/cli/router.ts` for the rationale.
 *
 * @example
 * ```ts
 * // Subpath import resolved by the package's "exports" field.
 * import { runCli } from "<package>/cli"
 * const exitCode = await runCli(process.argv.slice(2))
 * process.exit(exitCode)
 * ```
 */

import { initCmd } from "./commands/init.js"
import { discoverCommands } from "./discovery.js"
import { renderError } from "./renderer.js"
import {
  createRouter,
  type CliCommand,
  type CliRouter,
  type CliRouterResult,
} from "./router.js"

export type CliIO = {
  stdout: (chunk: string) => void
  stderr: (chunk: string) => void
}

const defaultIO: CliIO = {
  stdout: (chunk) => process.stdout.write(chunk),
  stderr: (chunk) => process.stderr.write(chunk),
}

/**
 * Create a deprecation shim for a CLI command that has been replaced
 * by an OpenCode TUI slash command.
 *
 * The shim prints a deprecation message redirecting the user to the
 * replacement command and exits with code 0.
 *
 * @param name - The CLI command name (e.g. "doctor").
 * @param redirectCommand - The replacement slash command path (e.g. "/hm-doctor").
 * @param aliases - Optional aliases the shim should also respond to.
 * @returns A CliCommand implementation that always exits with code 0.
 */
function createDeprecationShim(
  name: string,
  redirectCommand: string,
  aliases?: readonly string[],
): CliCommand {
  return {
    name,
    summary: `(deprecated) Use ${redirectCommand} instead.`,
    aliases,
    handler: async () => ({
      exitCode: 0,
      error: `[Harness] '${name}' CLI command is deprecated. Use '${redirectCommand}' in OpenCode TUI instead.`,
    }),
  }
}

/**
 * Build the canonical CLI router with the harness's built-in commands.
 *
 * Exposed as a separate factory so tests can introspect the registry
 * without going through `runCli`.
 */
export function buildHarnessCli(
  extraCommands: readonly CliCommand[] = [],
): CliRouter {
  const help = createDeprecationShim("help", "/hm-help", ["--help", "-h"])
  const doctor = createDeprecationShim("doctor", "/hm-doctor")
  const recover = createDeprecationShim("recover", "/hm-recover")
  const version = createDeprecationShim("version", "--version or /hm-about")

  const commands = discoverCommands([
    { name: "core", commands: [help, initCmd, doctor, recover, version] },
    { name: "extras", commands: extraCommands },
  ])

  return createRouter({ commands })
}

/**
 * Top-level CLI entrypoint. Dispatches argv to the matching command,
 * pipes its output through the supplied IO interface, and returns the
 * handler's exit code (or 64 for usage errors / 70 for handler crashes
 * per the router's policy).
 */
export async function runCli(
  argv: readonly string[],
  io: CliIO = defaultIO,
): Promise<number> {
  const router = buildHarnessCli()
  const result: CliRouterResult = await router.run(argv)

  if (result.output !== undefined && result.output.length > 0) {
    io.stdout(`${result.output}\n`)
  }
  if (result.error !== undefined && result.error.length > 0) {
    io.stderr(`${renderError(result.error)}\n`)
  }
  return result.exitCode
}

export type { CliCommand, CliRouter, CliRouterResult } from "./router.js"
export { createRouter, parseArgs } from "./router.js"
export { discoverCommands, validateCommand } from "./discovery.js"
export { renderError, renderHelp, renderJson, renderTable } from "./renderer.js"
