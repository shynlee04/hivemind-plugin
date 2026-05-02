import { existsSync } from "node:fs"

export type HealthChecks = {
  configPresent: boolean
  pluginLoaded: boolean
  sessionStoreWritable: boolean
}

export type HealthStatus = {
  healthy: boolean
  checks: HealthChecks
  warnings: string[]
  timestamp: number
}

export type Diagnostics = {
  sessions: number
  delegations: number
  commands: number
  timestamp: number
}

export function getHealthStatus(input: {
  configPath: string
  pluginLoaded: boolean
  sessionCount: number
}): HealthStatus {
  const checks: HealthChecks = {
    configPresent: existsSync(input.configPath),
    pluginLoaded: input.pluginLoaded,
    sessionStoreWritable: input.sessionCount >= 0,
  }

  const warnings: string[] = []
  if (!checks.configPresent) warnings.push(`Config path not found: ${input.configPath}`)
  if (!checks.pluginLoaded) warnings.push("Plugin not loaded")

  return {
    healthy: checks.configPresent && checks.pluginLoaded,
    checks,
    warnings,
    timestamp: Date.now(),
  }
}

export function getDiagnostics(input: {
  sessionCount: number
  delegationCount: number
  commandCount: number
}): Diagnostics {
  return {
    sessions: input.sessionCount,
    delegations: input.delegationCount,
    commands: input.commandCount,
    timestamp: Date.now(),
  }
}
