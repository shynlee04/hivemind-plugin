/**
 * CLI command discovery (Phase 40 / PH40-02).
 *
 * The harness CLI is composed from multiple sources — built-in commands
 * declared in `src/cli/commands/`, plus future workspace-scoped or
 * plugin-contributed commands. This module owns the *registration*
 * boundary so the router never sees malformed entries.
 *
 * Two primitives are exposed:
 *   - {@link validateCommand}  — fail fast on bad shape (empty name,
 *                                 whitespace-in-name, empty summary).
 *   - {@link discoverCommands} — flatten a list of `CommandSource`s into
 *                                 a single registration-ordered array,
 *                                 rejecting duplicate command names.
 *
 * No I/O happens here — discovery is *static*. The CLI substrate stays
 * synchronous and side-effect-free until a command's handler runs.
 */

import type { CliCommand } from "./router.js"

export type CommandSource = {
  /** Source label, used only for diagnostic messages. */
  name: string
  commands: readonly CliCommand[]
}

/**
 * Validate a single CLI command. Throws a `[Harness]`-prefixed error if
 * the command shape is unusable.
 */
export function validateCommand(command: CliCommand): void {
  if (typeof command.name !== "string" || command.name.trim().length === 0) {
    throw new Error("[Harness] CLI command requires a non-empty name")
  }
  if (/\s/.test(command.name)) {
    throw new Error(
      `[Harness] CLI command name "${command.name}" must not contain whitespace`,
    )
  }
  if (typeof command.summary !== "string" || command.summary.trim().length === 0) {
    throw new Error(
      `[Harness] CLI command "${command.name}" requires a non-empty summary`,
    )
  }
  if (typeof command.handler !== "function") {
    throw new Error(
      `[Harness] CLI command "${command.name}" requires a handler function`,
    )
  }
}

/**
 * Flatten an ordered list of `CommandSource`s into a single registration
 * order. Validates every entry and rejects duplicate command names with a
 * `[Harness]`-prefixed error that names both colliding sources.
 */
export function discoverCommands(sources: readonly CommandSource[]): CliCommand[] {
  const seen = new Map<string, string>()
  const flattened: CliCommand[] = []

  for (const source of sources) {
    for (const command of source.commands) {
      validateCommand(command)
      const previousSource = seen.get(command.name)
      if (previousSource !== undefined) {
        throw new Error(
          `[Harness] CLI command "${command.name}" registered twice — first by source "${previousSource}", again by "${source.name}"`,
        )
      }
      seen.set(command.name, source.name)
      flattened.push(command)
    }
  }

  return flattened
}
