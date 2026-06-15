/**
 * Precondition validators for each workflow turn.
 * Pure functions — no side effects, no I/O.
 *
 * Returns `{ valid: true }` if the guard passes,
 * `{ valid: false, errors: [...] }` if not.
 *
 * @module config-workflow/workflow-guards
 */

import type { ConfigWorkflowState } from "./workflow-types.js"

type GuardPass = { valid: true }
type GuardFail = { valid: false; errors: string[] }
type GuardResult = GuardPass | GuardFail

/**
 * Validate that a turn can be executed given the current workflow state.
 *
 * Turn-specific guards:
 * - Turn 0 (Discovery): Always valid — no prerequisites
 * - Turn 1 (Investigate): Requires `targetPrimitives.length > 0`
 * - Turn 2 (Collect): Requires Turn 1 output exists
 * - Turn 3 (Proposal): Requires Turn 2 output with collected fields
 * - Turn 4 (Validate): Requires Turn 3 output with assembled spec
 * - Turn 5 (Compile): Requires Turn 4 output with validation pass
 * - Turn 6 (Test): Requires Turn 5 output with written file path
 * - Turn 7 (Save): Requires Turn 6 output with test results
 *
 * @param state - Current workflow state.
 * @param turn - Turn index to validate (0-7).
 * @returns Guard result indicating pass or fail with descriptive errors.
 */
export function validateTurnPrecondition(
  state: ConfigWorkflowState,
  turn: number,
): GuardResult {
  const errors: string[] = []

  switch (turn) {
    case 0:
      // Discovery: always valid
      return { valid: true }

    case 1:
      // Investigate: requires at least one target primitive
      if (state.targetPrimitives.length === 0) {
        errors.push("Turn 1 (Investigate) requires at least one target primitive. Complete Turn 0 (Discovery) first.")
      }
      break

    case 2:
      // Collect: requires Turn 1 output
      if (!state.turns[1]?.output) {
        errors.push("Turn 2 (Collect) requires Turn 1 (Investigate) output with investigation results.")
      }
      break

    case 3:
      // Proposal: requires Turn 2 output with collected fields
      if (!state.turns[2]?.output) {
        errors.push("Turn 3 (Proposal) requires Turn 2 (Collect) output with collected configuration fields.")
      }
      break

    case 4:
      // Validate: requires Turn 3 output with assembled spec
      if (!state.turns[3]?.output) {
        errors.push("Turn 4 (Validate) requires Turn 3 (Proposal) output with assembled spec.")
      }
      break

    case 5:
      // Compile: requires Turn 4 output with validation pass
      if (!state.turns[4]?.output) {
        errors.push("Turn 5 (Compile) requires Turn 4 (Validate) output with validation results.")
      }
      break

    case 6:
      // Test: requires Turn 5 output with written file path
      if (!state.turns[5]?.output) {
        errors.push("Turn 6 (Test) requires Turn 5 (Compile) output with written file path.")
      }
      break

    case 7:
      // Save: requires Turn 6 output with test results
      if (!state.turns[6]?.output) {
        errors.push("Turn 7 (Save) requires Turn 6 (Test) output with test results.")
      }
      break

    default:
      errors.push(`Unknown turn index: ${turn}. Valid range is 0-7.`)
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true }
}

/**
 * Check if a workflow has the minimum data needed to start Turn 2 (Collect).
 * Requires at least one target primitive defined.
 *
 * @param state - Current workflow state.
 * @returns `true` if at least one target primitive exists.
 */
export function hasCollectedPrerequisites(state: ConfigWorkflowState): boolean {
  return state.targetPrimitives.length > 0
}

/**
 * Check if a workflow has data needed for Turn 5 (Compile).
 * Requires at least Turn 2 (Collect) output with a spec.
 *
 * @param state - Current workflow state.
 * @returns `true` if Turn 2 has output data.
 */
export function hasCompilePrerequisites(state: ConfigWorkflowState): boolean {
  const collectOutput = state.turns[2]?.output
  return collectOutput !== null && collectOutput !== undefined
}
