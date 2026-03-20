/**
 * Response Mode Resolver
 *
 * Deterministic mapping from PurposeClass to ResponseMode.
 * Pure function with no side effects.
 *
 * @module agent-work-contract/engine/response-mode-resolver
 */

import type { PurposeClass, ResponseMode } from '../schema/index.js'

/**
 * Purpose class to response mode mapping.
 * Determines the appropriate response mode based on the user's intent purpose.
 */
const PURPOSE_TO_RESPONSE_MODE: Record<PurposeClass, ResponseMode> = {
  /**
   * Quick actions require immediate execution with broad search.
   * Examples: "fix the bug", "update variable name"
   */
  'quick-action': 'broad-search-execute',

  /**
   * Research and brainstorming require interactive Q&A for exploration.
   * Examples: "research options", "brainstorm ideas", "compare alternatives"
   */
  'research-brainstorm': 'interactive-qa',

  /**
   * Project-driven work requires broad search with execution planning.
   * Examples: "implement feature", "build system", "create module"
   */
  'project-driven': 'broad-search-execute',
}

/**
 * Resolve the appropriate response mode for a given purpose class.
 *
 * This is a pure function with no side effects - the same input
 * always produces the same output.
 *
 * @param purposeClass - The classified purpose of the user's intent
 * @returns The recommended response mode for handling this purpose
 *
 * @example
 * ```typescript
 * const mode = resolveResponseMode('project-driven')
 * // Returns: 'broad-search-execute'
 *
 * const mode = resolveResponseMode('research-brainstorm')
 * // Returns: 'interactive-qa'
 * ```
 */
export function resolveResponseMode(purposeClass: PurposeClass): ResponseMode {
  return PURPOSE_TO_RESPONSE_MODE[purposeClass]
}