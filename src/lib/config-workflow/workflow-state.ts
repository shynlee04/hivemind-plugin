/**
 * Config workflow state machine — turn transition logic, state creation,
 * and advancement. Pure functions only — no I/O, no side effects.
 *
 * Pattern: follows task-status.ts — static ordering + canAdvance guard.
 *
 * @module config-workflow/workflow-state
 */

import type {
  ConfigWorkflowState,
  WorkflowTurn,
  WorkflowTurnRecord,
} from "./workflow-types.js"

/** Ordered turn names for the 8-turn configuration workflow. */
export const TURN_NAMES: WorkflowTurn[] = [
  "discovery",
  "investigate",
  "collect",
  "proposal",
  "validate",
  "compile",
  "test",
  "save",
]

/** Total number of turns in the workflow. */
export const TOTAL_TURNS = 8

/**
 * Create a new workflow state at Turn 0 (Discovery).
 *
 * @param options - Workflow creation parameters (type, targetPrimitives, scope, mode).
 * @returns A fresh {@link ConfigWorkflowState} with all turns pending.
 */
export function createWorkflowState(options: {
  type: ConfigWorkflowState["type"]
  targetPrimitives: ConfigWorkflowState["targetPrimitives"]
  scope: ConfigWorkflowState["scope"]
  mode: ConfigWorkflowState["mode"]
}): ConfigWorkflowState {
  const now = Date.now()
  const turns: Record<number, WorkflowTurnRecord> = {}
  for (let i = 0; i < TOTAL_TURNS; i++) {
    turns[i] = { status: "pending", output: null }
  }

  return {
    id: `wf-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    type: options.type,
    currentTurn: 0,
    turns,
    targetPrimitives: options.targetPrimitives,
    scope: options.scope,
    mode: options.mode,
    startedAt: now,
    updatedAt: now,
  }
}

/**
 * Check if advancing from current turn to target turn is valid.
 *
 * Transition rules:
 * - Forward: `targetTurn === currentTurn + 1` → always allowed
 * - Skip-back: `targetTurn <= currentTurn` → always allowed (re-do a turn)
 * - Skip-forward: `targetTurn > currentTurn + 1` → REJECTED
 * - Out-of-range: `targetTurn < 0 || targetTurn > 7` → REJECTED
 *
 * @param state - Current workflow state.
 * @param targetTurn - Turn index to advance to (0-7).
 * @returns `true` if the transition is valid, `false` otherwise.
 */
export function canAdvanceTurn(state: ConfigWorkflowState, targetTurn: number): boolean {
  if (targetTurn < 0 || targetTurn >= TOTAL_TURNS) {
    return false
  }
  // Skip-back (re-do) is always allowed
  if (targetTurn <= state.currentTurn) {
    return true
  }
  // Forward by exactly 1 is allowed
  if (targetTurn === state.currentTurn + 1) {
    return true
  }
  // Skip-forward is rejected
  return false
}

/**
 * Advance to a specific turn. Returns a **new** state — does not mutate input.
 *
 * @param state - Current workflow state (not mutated).
 * @param targetTurn - Turn index to advance to (0-7).
 * @returns A new {@link ConfigWorkflowState} with updated `currentTurn`.
 * @throws {Error} `[Harness]` error if the transition is invalid.
 */
export function advanceTurn(
  state: ConfigWorkflowState,
  targetTurn: number,
): ConfigWorkflowState {
  if (!canAdvanceTurn(state, targetTurn)) {
    throw new Error(
      `[Harness] Invalid turn transition: cannot advance from turn ${state.currentTurn} to turn ${targetTurn}. ` +
        `Expected turn ${state.currentTurn + 1} or any turn <= ${state.currentTurn}.`,
    )
  }

  return {
    ...cloneWorkflowState(state),
    currentTurn: targetTurn,
    updatedAt: Date.now(),
  }
}

/**
 * Mark the current turn as complete with output data.
 * Returns a **new** state — does not mutate input.
 *
 * @param state - Current workflow state (not mutated).
 * @param output - Arbitrary output data from the completed turn.
 * @returns A new {@link ConfigWorkflowState} with the current turn marked complete.
 */
export function completeCurrentTurn(
  state: ConfigWorkflowState,
  output: Record<string, unknown>,
): ConfigWorkflowState {
  const cloned = cloneWorkflowState(state)
  const now = Date.now()
  cloned.turns = { ...cloned.turns }
  cloned.turns[cloned.currentTurn] = {
    status: "complete",
    output,
    completedAt: now,
  }
  cloned.updatedAt = now
  return cloned
}

/**
 * Get the name of a turn by its numeric index.
 *
 * @param turnIndex - Turn index (0-7).
 * @returns The turn name string.
 * @throws {Error} If the turn index is out of range.
 */
export function getTurnName(turnIndex: number): WorkflowTurn {
  if (turnIndex < 0 || turnIndex >= TOTAL_TURNS) {
    throw new Error(`[Harness] Turn index ${turnIndex} is out of range (0-${TOTAL_TURNS - 1})`)
  }
  return TURN_NAMES[turnIndex]
}

/**
 * Check if a workflow is complete (all 8 turns done, or the final turn is complete).
 *
 * @param state - Current workflow state.
 * @returns `true` if the workflow has completed all turns.
 */
export function isWorkflowComplete(state: ConfigWorkflowState): boolean {
  return state.turns[TOTAL_TURNS - 1]?.status === "complete"
}

/**
 * Deep-clone a workflow state for safe return (prevents mutation aliasing).
 *
 * @param state - Workflow state to clone.
 * @returns A deep copy of the state.
 */
export function cloneWorkflowState(state: ConfigWorkflowState): ConfigWorkflowState {
  return {
    ...state,
    targetPrimitives: state.targetPrimitives.map((p) => ({ ...p })),
    turns: Object.fromEntries(
      Object.entries(state.turns).map(([k, v]) => [
        k,
        {
          ...v,
          output: v.output ? { ...v.output } : null,
        },
      ]),
    ),
  }
}
