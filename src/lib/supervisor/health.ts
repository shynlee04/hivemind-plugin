import { existsSync } from "node:fs"

/**
 * Individual health check results.
 *
 * @property configPresent - Whether the config file exists at the specified path.
 * @property pluginLoaded - Whether the harness plugin is loaded.
 * @property sessionStoreWritable - Whether the session count is a valid finite number.
 */
export type HealthChecks = {
  configPresent: boolean
  pluginLoaded: boolean
  sessionStoreWritable: boolean
}

/**
 * Overall health status of the harness system.
 *
 * @property healthy - Whether all critical health checks pass.
 * @property checks - Individual check results.
 * @property warnings - Human-readable descriptions of any failures.
 * @property timestamp - Unix timestamp of when the health check was performed.
 */
export type HealthStatus = {
  healthy: boolean
  checks: HealthChecks
  warnings: string[]
  timestamp: number
}

/**
 * Diagnostic counts for the harness system.
 *
 * @property sessions - Number of active sessions.
 * @property delegations - Number of delegation records.
 * @property commands - Number of registered commands.
 * @property timestamp - Unix timestamp of when diagnostics were collected.
 */
export type Diagnostics = {
  sessions: number
  delegations: number
  commands: number
  timestamp: number
}

/**
 * Get the health status of the harness system.
 *
 * Checks config file presence, plugin load state, and session store
 * writability. Returns `healthy: true` only when config is present
 * and the plugin is loaded. Session store writability is checked by
 * verifying the session count is a finite number (not NaN or Infinity).
 *
 * @param input - Health check inputs.
 * @param input.configPath - Path to the config file to check for existence.
 * @param input.pluginLoaded - Whether the harness plugin is loaded.
 * @param input.sessionCount - Current session count for writability check.
 * @returns A {@link HealthStatus} with check results and any warnings.
 *
 * @example
 * ```typescript
 * const status = getHealthStatus({
 *   configPath: ".opencode",
 *   pluginLoaded: true,
 *   sessionCount: 5,
 * })
 * console.log(status.healthy) // true
 * ```
 */
export function getHealthStatus(input: {
  configPath: string
  pluginLoaded: boolean
  sessionCount: number
}): HealthStatus {
  const checks: HealthChecks = {
    configPresent: existsSync(input.configPath),
    pluginLoaded: input.pluginLoaded,
    sessionStoreWritable: Number.isFinite(input.sessionCount),
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

/**
 * Get diagnostic counts for the harness system.
 *
 * Returns current counts of sessions, delegations, and commands
 * along with a collection timestamp.
 *
 * @param input - Diagnostic count inputs.
 * @param input.sessionCount - Number of sessions.
 * @param input.delegationCount - Number of delegations.
 * @param input.commandCount - Number of commands.
 * @returns A {@link Diagnostics} snapshot.
 *
 * @example
 * ```typescript
 * const diag = getDiagnostics({
 *   sessionCount: 10,
 *   delegationCount: 3,
 *   commandCount: 7,
 * })
 * ```
 */
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
