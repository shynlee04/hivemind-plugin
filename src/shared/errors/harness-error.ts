/**
 * Base class for all Hivemind runtime errors.
 *
 * Every `HarnessError` automatically prepends `[Harness]` to the error message,
 * which the TUI suppression layer (REQ-34C) uses to route the error to
 * `client.app.log()` instead of `client.tui.showToast()`.
 *
 * @example
 * ```ts
 * class ConfigNotFoundError extends HarnessError {
 *   readonly name = "ConfigNotFoundError" as const
 *   constructor(message?: string) {
 *     super("C8", "config", message ?? "Configuration file not found")
 *   }
 * }
 * ```
 */
export class HarnessError extends Error {
  /** Machine-readable error code, e.g. `"CONFIG_NOT_FOUND"`. */
  readonly code: string

  /**
   * Cluster identifier — maps to the architectural cluster (C0–C9).
   * @see `.planning/codebase/ARCHITECTURE.md` for cluster definitions.
   */
  readonly cluster: string

  /**
   * Module name within the cluster, e.g. `"errors"`, `"delegation"`, `"config"`.
   */
  readonly module: string

  constructor(cluster: string, module: string, message: string, code?: string) {
    const prefixed = `[Harness] ${message}`
    super(prefixed)
    this.name = "HarnessError"
    this.cluster = cluster
    this.module = module
    this.code = code ?? "UNKNOWN"
  }
}
