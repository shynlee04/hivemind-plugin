export type CommandBundle = {
  name: string
  description: string
  handler: string
  args: string[]
}

export type CommandRouteResult = {
  found: boolean
  handler: string | null
  errors: string[]
}

export type CommandContractResult = {
  valid: boolean
  errors: string[]
}

export function discoverCommandBundles(bundles: CommandBundle[]): CommandBundle[] {
  return bundles.slice().sort((a, b) => a.name.localeCompare(b.name))
}

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
