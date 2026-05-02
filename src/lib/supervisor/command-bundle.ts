/**
 * A command bundle definition used for command routing and validation.
 *
 * @property name - Unique command name.
 * @property description - Human-readable command description.
 * @property handler - Handler identifier (function name or path).
 * @property args - Expected argument names for the command.
 */
export type CommandBundle = {
  name: string
  description: string
  handler: string
  args: string[]
}

/**
 * Result of attempting to route a command by name.
 *
 * @property found - Whether a matching command was found.
 * @property handler - The handler identifier if found, or null.
 * @property errors - Error messages if routing failed.
 */
export type CommandRouteResult = {
  found: boolean
  handler: string | null
  errors: string[]
}

/**
 * Result of validating a command's argument contract.
 *
 * @property valid - Whether the arguments satisfy the command's requirements.
 * @property errors - Validation error messages.
 */
export type CommandContractResult = {
  valid: boolean
  errors: string[]
}

/**
 * Sort command bundles alphabetically by name.
 *
 * Returns a new array sorted by `name` in locale-aware alphabetical order.
 * The original array is not modified.
 *
 * @param bundles - Array of command bundles to sort.
 * @returns A new array of bundles sorted by name.
 *
 * @example
 * ```typescript
 * const sorted = sortCommandBundles([
 *   { name: "run", description: "Run", handler: "runHandler", args: [] },
 *   { name: "build", description: "Build", handler: "buildHandler", args: [] },
 * ])
 * console.log(sorted[0].name) // "build"
 * ```
 */
export function sortCommandBundles(bundles: CommandBundle[]): CommandBundle[] {
  return bundles.slice().sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Route a command by name to its handler.
 *
 * Looks up the command in the provided bundles array and returns
 * the handler identifier if found.
 *
 * @param name - The command name to look up.
 * @param bundles - Available command bundles.
 * @returns A {@link CommandRouteResult} with the handler or error details.
 *
 * @example
 * ```typescript
 * const result = routeCommand("help", bundles)
 * if (result.found) console.log(result.handler)
 * ```
 */
export function routeCommand(name: string, bundles: CommandBundle[]): CommandRouteResult {
  const match = bundles.find((b) => b.name === name)
  if (!match) {
    return {
      found: false,
      handler: null,
      errors: [`Unknown command: "${name}"`],
    }
  }
  return {
    found: true,
    handler: match.handler,
    errors: [],
  }
}

/**
 * Validate that a command's arguments satisfy its contract.
 *
 * Checks that the provided arguments array has at least as many
 * elements as the command's expected `args` field.
 *
 * @param name - The command name to validate.
 * @param args - The actual arguments provided.
 * @param bundles - Available command bundles for lookup.
 * @returns A {@link CommandContractResult} with validation status.
 *
 * @example
 * ```typescript
 * const result = validateCommandContract("run", ["task-1"], bundles)
 * console.log(result.valid) // true
 * ```
 */
export function validateCommandContract(
  name: string,
  args: string[],
  bundles: CommandBundle[],
): CommandContractResult {
  const match = bundles.find((b) => b.name === name)
  if (!match) {
    return { valid: false, errors: [`Unknown command: "${name}"`] }
  }

  const errors: string[] = []
  if (args.length < match.args.length) {
    errors.push(
      `Command "${name}" requires ${match.args.length} argument(s) but received ${args.length}`,
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
