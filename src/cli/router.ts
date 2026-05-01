/**
 * CLI router for the harness CLI substrate (Phase 40 / PH40-01 + PH40-02).
 *
 * This module owns argv parsing and command dispatch for the
 * `bin/hivemind-tools.cjs` entrypoint. It is deliberately framework-free
 * (no commander / yargs / oclif) so that:
 *   - The CLI substrate stays small and reviewable (well under the 500 LOC
 *     project ceiling).
 *   - There is no transitive dependency we need to security-audit for the
 *     harness's bin surface.
 *   - The same router can be unit-tested without spawning a subprocess.
 *
 * The router exposes three primitives:
 *   - {@link parseArgs}        — argv → `{ command, flags, positionals }`
 *   - {@link createRouter}     — build a registry from `CliCommand[]`
 *   - `Router.run(argv)`       — dispatch to the matching command
 *
 * Exit codes follow the BSD `sysexits.h` convention used by most CLIs:
 *   - `0`  — success
 *   - `64` — usage error (`EX_USAGE`)  — unknown command, missing command
 *   - `70` — software error (`EX_SOFTWARE`) — handler threw
 *
 * Errors raised inside this module always carry the `[Harness]` prefix
 * required by `AGENTS.md`.
 */

export type CliFlagValue = string | boolean

export type CliCommandContext = {
  /** Parsed `--flag` / `--flag=value` map. Bare flags become `true`. */
  flags: Record<string, CliFlagValue>
  /** Positional arguments after the command name. */
  positionals: readonly string[]
  /** The argv slice that produced this context, for diagnostic logging. */
  argv: readonly string[]
}

export type CliRouterResult = {
  exitCode: number
  error?: string
  output?: string
}

export type CliCommand = {
  name: string
  summary: string
  aliases?: readonly string[]
  handler: (ctx: CliCommandContext) => Promise<CliRouterResult>
}

export type CliRouterOptions = {
  commands: readonly CliCommand[]
}

export type CliRouter = {
  /** Dispatch the given argv (without `node` / script name) to a command. */
  run: (argv: readonly string[]) => Promise<CliRouterResult>
  /** Inspect the registered commands in registration order (read-only copy). */
  commands: () => readonly CliCommand[]
}

export type ParsedArgs = {
  command: string
  flags: Record<string, CliFlagValue>
  positionals: string[]
}

/**
 * Parse a raw argv tail (everything after `node bin/hivemind-tools.cjs`)
 * into a `{ command, flags, positionals }` triple.
 *
 * Supported forms:
 *   - `cmd`                — bare command, no args
 *   - `cmd --flag`         — boolean flag (set to `true`)
 *   - `cmd --flag value`   — string flag
 *   - `cmd --flag=value`   — string flag (single-token form)
 *   - `cmd pos1 pos2`      — positional arguments
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  if (argv.length === 0) {
    return { command: "", flags: {}, positionals: [] }
  }

  const [command, ...rest] = argv
  const flags: Record<string, CliFlagValue> = {}
  const positionals: string[] = []

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (token === undefined) continue

    if (token.startsWith("--")) {
      const stripped = token.slice(2)
      const eqIndex = stripped.indexOf("=")
      if (eqIndex >= 0) {
        const key = stripped.slice(0, eqIndex)
        const value = stripped.slice(eqIndex + 1)
        flags[key] = value
        continue
      }
      const next = rest[index + 1]
      if (next !== undefined && !next.startsWith("--")) {
        flags[stripped] = next
        index += 1
      } else {
        flags[stripped] = true
      }
      continue
    }

    positionals.push(token)
  }

  return { command: command ?? "", flags, positionals }
}

/**
 * Build a router from a list of `CliCommand` entries. Throws `[Harness]`
 * errors at construction time for duplicate command names or aliases that
 * collide with a different command's name.
 */
export function createRouter(options: CliRouterOptions): CliRouter {
  const commands = [...options.commands]
  const byName = new Map<string, CliCommand>()

  for (const command of commands) {
    if (byName.has(command.name)) {
      throw new Error(
        `[Harness] Duplicate CLI command registration: "${command.name}"`,
      )
    }
    byName.set(command.name, command)
  }

  for (const command of commands) {
    for (const alias of command.aliases ?? []) {
      if (byName.has(alias) && byName.get(alias) !== command) {
        throw new Error(
          `[Harness] CLI alias "${alias}" of command "${command.name}" collides with another command`,
        )
      }
      byName.set(alias, command)
    }
  }

  return {
    commands: () => commands.slice(),
    run: async (argv: readonly string[]): Promise<CliRouterResult> => {
      const { command, flags, positionals } = parseArgs(argv)
      if (command === "") {
        return {
          exitCode: 64,
          error: "[Harness] No CLI command provided. Run `help` to list commands.",
        }
      }

      const target = byName.get(command)
      if (target === undefined) {
        return {
          exitCode: 64,
          error: `[Harness] Unknown CLI command: "${command}". Run \`help\` to list commands.`,
        }
      }

      const context: CliCommandContext = { flags, positionals, argv }
      try {
        return await target.handler(context)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
          exitCode: 70,
          error: `[Harness] CLI command "${target.name}" failed: ${message}`,
        }
      }
    },
  }
}
