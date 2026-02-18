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
