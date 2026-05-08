/**
 * Toggle gate helper functions.
 *
 * Provides runtime access to workflow toggle state from `HivemindConfigs`.
 * Functions use Zod defaults as fallback when config is undefined,
 * ensuring toggle state is always resolvable regardless of config load order.
 *
 * @module toggle-gates
 * @see D-08 through D-13 in CA-03-CONTEXT.md
 */

import { getDefaultConfigs } from "../../schema-kernel/hivemind-configs.schema.js"
import type { HivemindConfigs, DiscussMode } from "../../schema-kernel/hivemind-configs.schema.js"

// ---------------------------------------------------------------------------
// Boolean toggle type — wired toggles from D-08 through D-13
// ---------------------------------------------------------------------------

/**
 * Boolean workflow toggles accessible via `isToggleEnabled()`.
 *
 * `discuss_mode` is NOT included — it is an enum, not a boolean toggle,
 * and has its own dedicated accessor `getDiscussMode()`.
 */
export type BooleanToggle =
  | "research"
  | "plan_check"
  | "verifier"
  | "use_worktrees"
  | "research_before_questions"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Checks whether a boolean workflow toggle is currently enabled.
 *
 * Resolves config via `config ?? getDefaultConfigs()` so the function
 * always returns a value — never `undefined`. Zod `.default()` values
 * provide the deterministic fallback.
 *
 * @param config - HivemindConfigs from the config subscriber, or undefined.
 * @param toggle - The boolean toggle key to check.
 * @returns `true` if the toggle is enabled, `false` otherwise.
 *
 * @example
 * ```typescript
 * if (isToggleEnabled(deps.hivemindConfig, "research")) {
 *   // research-phase hook runs
 * }
 * ```
 */
export function isToggleEnabled(
  config: HivemindConfigs | undefined,
  toggle: BooleanToggle,
): boolean {
  const resolved = config ?? getDefaultConfigs()
  return Boolean(resolved.workflow[toggle])
}

/**
 * Returns the current discuss mode from the workflow config.
 *
 * Unlike `isToggleEnabled()`, this returns the raw enum string
 * ("sufficient-phase-discussion", "intensive-phase-discussion", or
 * "skip-phase-discussion") so consumers can branch on the exact mode.
 *
 * @param config - HivemindConfigs from the config subscriber, or undefined.
 * @returns The discuss mode enum value.
 *
 * @example
 * ```typescript
 * const mode = getDiscussMode(deps.hivemindConfig)
 * if (mode === "skip-phase-discussion") return  // bypass discussion
 * ```
 */
export function getDiscussMode(
  config: HivemindConfigs | undefined,
): DiscussMode {
  const resolved = config ?? getDefaultConfigs()
  return resolved.workflow.discuss_mode
}
