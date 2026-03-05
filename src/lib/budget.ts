/**
 * Budget Constants - Single Source of Truth for Context Limits
 *
 * US-055: Remove legacy 2000-char budget limits
 *
 * Default: 12% of context window for 128k model = 15,360 chars
 * Configurable via config.json (agent_behavior.constraints.max_response_tokens)
 */

/**
 * Default context budget for prompt transformation (characters)
 * 12% of 128k context window ≈ 15,360 characters
 */
export const DEFAULT_CONTEXT_BUDGET = 15360

/**
 * Shared per-turn injection budget percentage applied to the estimated
 * context window size before floor/ceiling clamping.
 */
export const INJECTION_BUDGET_PERCENT = 0.15

/**
 * Minimum shared per-turn injection cap (characters).
 *
 * Prevents small response-token settings from starving bootstrap, anchor,
 * checklist, and clarify injections.
 */
export const MIN_SHARED_INJECTION_CAP = 6000

/**
 * Default budget for compaction reports (characters)
 * Slightly smaller to leave room for metadata
 */
export const DEFAULT_COMPACTION_BUDGET = 15000

/**
 * Default max response tokens for agent behavior
 * Used in agent_behavior.constraints.max_response_tokens
 */
export const DEFAULT_MAX_RESPONSE_TOKENS = 4096

/**
 * Legacy budget value (2000 chars) - DEPRECATED
 * Kept for reference and backward compatibility
 * @deprecated Use DEFAULT_CONTEXT_BUDGET instead
 */
export const LEGACY_CONTEXT_BUDGET = 2000

/**
 * Legacy compaction budget (1800 chars) - DEPRECATED
 * @deprecated Use DEFAULT_COMPACTION_BUDGET instead
 */
export const LEGACY_COMPACTION_BUDGET = 1800

/**
 * Estimate the prompt context window in characters from a response-token limit.
 *
 * Invalid values fall back to `DEFAULT_MAX_RESPONSE_TOKENS`, and the result is
 * clamped to a conservative minimum to avoid collapsing prompt budgets.
 *
 * @param maxResponseTokens Max response tokens configured for the agent.
 * @returns Estimated available context window in characters.
 */
export function estimateContextWindowChars(maxResponseTokens: number | null | undefined): number {
  const normalizedTokens = Number.isFinite(maxResponseTokens)
    ? Math.floor(Number(maxResponseTokens))
    : DEFAULT_MAX_RESPONSE_TOKENS
  const safeTokens = normalizedTokens > 0 ? normalizedTokens : DEFAULT_MAX_RESPONSE_TOKENS
  return Math.max(8000, Math.floor(safeTokens * 4))
}

/**
 * Compute the shared per-turn injection cap from the configured response-token limit.
 *
 * The cap scales with the estimated context window, then applies a hard floor
 * and ceiling so injection remains useful without growing unbounded.
 *
 * @param maxResponseTokens Max response tokens configured for the agent.
 * @returns Shared injection cap in characters for the current turn.
 */
export function computeSharedInjectionCapChars(maxResponseTokens: number | null | undefined): number {
  const estimatedContextWindow = estimateContextWindowChars(maxResponseTokens)
  const scaledBudget = Math.floor(estimatedContextWindow * INJECTION_BUDGET_PERCENT)
  return Math.min(DEFAULT_CONTEXT_BUDGET, Math.max(MIN_SHARED_INJECTION_CAP, scaledBudget))
}
