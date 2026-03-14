import { basename } from 'node:path'

export const CLI_COMMANDS = [
  'init',
  'doctor',
  'settings',
  'harness',
  'help',
] as const

export type CliCommand = (typeof CLI_COMMANDS)[number]

const BINARY_ALIASES: Record<string, CliCommand> = {
  'hm-init': 'init',
  'hm-doctor': 'doctor',
  'hm-settings': 'settings',
  'hm-harness': 'harness',
  hivemind: 'init',
  'hivemind-context-governance': 'init',
}

/**
 * Resolve the effective CLI command from the executable path and positional args.
 *
 * @param executablePath Path to the current executable.
 * @param positionalArgs Positional args supplied by the user.
 * @returns Resolved command and remaining positional args.
 */
export function resolveCliInvocation(
  executablePath: string | undefined,
  positionalArgs: string[],
): { command: CliCommand; remainingArgs: string[] } {
  const binaryName = basename(executablePath ?? '')
  const aliasCommand = BINARY_ALIASES[binaryName]
  const firstArg = positionalArgs[0]

  if (firstArg && (CLI_COMMANDS as readonly string[]).includes(firstArg)) {
    return {
      command: firstArg as CliCommand,
      remainingArgs: positionalArgs.slice(1),
    }
  }

  if (aliasCommand) {
    return {
      command: aliasCommand,
      remainingArgs: positionalArgs,
    }
  }

  return {
    command: 'init',
    remainingArgs: positionalArgs,
  }
}
