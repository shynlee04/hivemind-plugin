/**
 * Intent-lock gate — state machine.
 *
 * Defines the allowed transition graph (mirror of SPEC §2) and the six pure
 * transition functions used by the store to advance a session through the
 * gate. All transition functions are pure: they take a current `IntentLockState`
 * and return a NEW state object with the history entry appended.
 *
 * The hook (plan 03) and the verify-step functions (plan 02) call these
 * functions to compute the next state, then hand it to the store for atomic
 * persistence.
 */

import {
  HarnessStateError,
  IntentLockStateTransitionError,
  IntentState,
  type IntentLockHistoryEntry,
  type IntentLockState,
} from "./types.js"

/**
 * Formal transition graph for the intent-lock gate.
 *
 * Mirrors SPEC §2 exactly. Empty arrays denote terminal states
 * (`LOCKED_NON_CODE`, `COMPLETED`). Any transition not listed here throws
 * `IntentLockStateTransitionError` when attempted.
 */
export const ALLOWED_TRANSITIONS: Record<IntentState, readonly IntentState[]> = {
  [IntentState.UNLOCKED]: [IntentState.LOCKED_NON_CODE, IntentState.LOCKED_CODE_CHANGE],
  [IntentState.LOCKED_NON_CODE]: [],
  [IntentState.LOCKED_CODE_CHANGE]: [IntentState.PHASE_READY],
  [IntentState.PHASE_READY]: [IntentState.PHASE_AUTHORIZED],
  [IntentState.PHASE_AUTHORIZED]: [IntentState.EXECUTING],
  [IntentState.EXECUTING]: [IntentState.COMPLETED],
  [IntentState.COMPLETED]: [],
}

/**
 * Returns true iff `state` has no outgoing transitions (terminal).
 *
 * @param state - The state to test.
 * @returns True when `ALLOWED_TRANSITIONS[state]` is empty.
 */
export function isTerminalState(state: IntentState): boolean {
  return ALLOWED_TRANSITIONS[state].length === 0
}

/**
 * Pure boolean transition check.
 *
 * @param from - Source state.
 * @param to - Target state.
 * @returns True iff `to` appears in `ALLOWED_TRANSITIONS[from]`.
 */
export function canTransition(from: IntentState, to: IntentState): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

/**
 * Throws `IntentLockStateTransitionError` when the transition is not allowed.
 *
 * The hook and verify-step functions MUST call this BEFORE invoking the store
 * to surface invalid transitions as a 4xx-class error rather than a corrupt
 * persisted state.
 *
 * @param from - Source state.
 * @param to - Target state.
 * @param sessionId - Session context for the error message.
 * @throws {IntentLockStateTransitionError} when the transition is not allowed.
 */
export function validateTransition(from: IntentState, to: IntentState, sessionId: string): void {
  if (!canTransition(from, to)) {
    throw new IntentLockStateTransitionError({ from, to, sessionId })
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Append a history entry to a state object and return a fresh state object.
 *
 * Always deep-spreads the history array so callers cannot mutate the input.
 */
function appendHistory(
  state: IntentLockState,
  entry: IntentLockHistoryEntry,
  nextState: IntentState,
): IntentLockState {
  return {
    ...state,
    state: nextState,
    lastTransitionAt: Date.now(),
    history: [...state.history, entry],
  }
}

// ---------------------------------------------------------------------------
// Public transition functions
// ---------------------------------------------------------------------------

/**
 * Lock a non-code-change intent.
 *
 * Valid: `UNLOCKED → LOCKED_NON_CODE`.
 *
 * @param state - Current state.
 * @param intentId - Intent identifier from the artifact.
 * @param summary - Intent summary for resume toasts.
 * @returns A new state with the transition applied.
 * @throws {IntentLockStateTransitionError} when `state.state !== UNLOCKED`.
 */
export function lockIntentNonCode(
  state: IntentLockState,
  intentId: string,
  summary: string,
): IntentLockState {
  const from = state.state
  validateTransition(from, IntentState.LOCKED_NON_CODE, state.sessionId)
  const at = Date.now()
  return appendHistory(
    {
      ...state,
      intentId,
      summary,
      isCodeChange: false,
    },
    { from, to: IntentState.LOCKED_NON_CODE, at },
    IntentState.LOCKED_NON_CODE,
  )
}

/**
 * Lock a code-change intent.
 *
 * Valid: `UNLOCKED → LOCKED_CODE_CHANGE`.
 *
 * @param state - Current state.
 * @param intentId - Intent identifier from the artifact.
 * @param summary - Intent summary for resume toasts.
 * @param allowedSurfaces - File surfaces the intent is allowed to touch.
 * @returns A new state with the transition applied.
 * @throws {IntentLockStateTransitionError} when `state.state !== UNLOCKED`.
 */
export function lockIntentCodeChange(
  state: IntentLockState,
  intentId: string,
  summary: string,
  allowedSurfaces: string[],
): IntentLockState {
  const from = state.state
  validateTransition(from, IntentState.LOCKED_CODE_CHANGE, state.sessionId)
  const at = Date.now()
  const next: IntentLockState = {
    ...state,
    intentId,
    summary,
    isCodeChange: true,
    allowedSurfaces: [...allowedSurfaces],
  }
  return appendHistory(
    next,
    { from, to: IntentState.LOCKED_CODE_CHANGE, at },
    IntentState.LOCKED_CODE_CHANGE,
  )
}

/**
 * Advance to `PHASE_READY` after the landscape artifact is committed.
 *
 * Valid: `LOCKED_CODE_CHANGE → PHASE_READY`.
 *
 * @param state - Current state.
 * @param phaseId - Phase identifier from the landscape.
 * @param commitHash - Commit SHA that introduced the landscape.
 * @returns A new state with the transition applied.
 * @throws {IntentLockStateTransitionError} when `state.state !== LOCKED_CODE_CHANGE`.
 */
export function transitionToPhaseReady(
  state: IntentLockState,
  phaseId: string,
  commitHash: string,
): IntentLockState {
  const from = state.state
  validateTransition(from, IntentState.PHASE_READY, state.sessionId)
  const at = Date.now()
  return appendHistory(
    { ...state, phaseId },
    { from, to: IntentState.PHASE_READY, at, commitHash },
    IntentState.PHASE_READY,
  )
}

/**
 * Advance to `PHASE_AUTHORIZED` after ROADMAP/STATE sync.
 *
 * Valid: `PHASE_READY → PHASE_AUTHORIZED`.
 *
 * @param state - Current state.
 * @param commitHash - Commit SHA that synced ROADMAP/STATE.
 * @returns A new state with the transition applied.
 * @throws {IntentLockStateTransitionError} when `state.state !== PHASE_READY`.
 */
export function transitionToPhaseAuthorized(
  state: IntentLockState,
  commitHash: string,
): IntentLockState {
  const from = state.state
  validateTransition(from, IntentState.PHASE_AUTHORIZED, state.sessionId)
  const at = Date.now()
  return appendHistory(
    state,
    { from, to: IntentState.PHASE_AUTHORIZED, at, commitHash },
    IntentState.PHASE_AUTHORIZED,
  )
}

/**
 * Advance to `EXECUTING` after the phase manifest is committed.
 *
 * Valid: `PHASE_AUTHORIZED → EXECUTING`. The full toolkit unlocks at this point.
 *
 * @param state - Current state.
 * @param commitHash - Commit SHA that introduced the phase manifest.
 * @returns A new state with the transition applied.
 * @throws {IntentLockStateTransitionError} when `state.state !== PHASE_AUTHORIZED`.
 */
export function transitionToExecuting(state: IntentLockState, commitHash: string): IntentLockState {
  const from = state.state
  validateTransition(from, IntentState.EXECUTING, state.sessionId)
  const at = Date.now()
  return appendHistory(
    state,
    { from, to: IntentState.EXECUTING, at, commitHash },
    IntentState.EXECUTING,
  )
}

/**
 * Checkpoint invoker signature (P27.2 T15, D-03).
 *
 * Called by `transitionWithCheckpoint` to auto-invoke a checkpoint
 * on a critical transition (e.g., SL-3 → EXECUTING fires
 * `pre_executing`).
 */
export type CheckpointInvoker = (
  checkpoint: "pre_executing" | "pre_verifying",
) => Promise<"ACCEPTED" | "REJECTED" | "TIMEOUT">

/**
 * Transition with optional auto-invoke checkpoint (P27.2 T15, REQ-15).
 *
 * Wraps `transitionToExecuting` with a pre-flight checkpoint check.
 * When `checkpointInvoker` is set and the target is `EXECUTING`, this
 * function awaits `invoker("pre_executing")` before completing the
 * transition.
 *
 * - `ACCEPTED`: transition completes normally.
 * - `REJECTED`: raises `IntentLockStateTransitionError` with
 *   "Review intent first" (state reverts to caller's responsibility).
 * - `TIMEOUT`: transition proceeds (advisory per D-15).
 *
 * @param state - Current state.
 * @param to - Target state.
 * @param checkpointInvoker - Optional invoker; skip when undefined.
 * @param commitHash - The commit hash for the transition.
 * @param options - Additional options.
 * @param options.verifying - When true, this is an EXECUTING->VERIFYING
 *   transition (auto-invokes pre_verifying). VERIFYING is interpreted
 *   as a transient flag on EXECUTING per P27.2 T17.
 * @returns A new state with the transition applied.
 * @throws {IntentLockStateTransitionError} on REJECTED (error path).
 */
export async function transitionWithCheckpoint(
  state: IntentLockState,
  to: IntentState,
  checkpointInvoker: CheckpointInvoker | undefined,
  commitHash: string,
  options?: { verifying?: boolean },
): Promise<IntentLockState> {
  if (!checkpointInvoker) {
    return transitionToExecuting(state, commitHash)
  }

  // P27.2 T15: pre_executing checkpoint for PHASE_AUTHORIZED -> EXECUTING.
  if (to === IntentState.EXECUTING && !options?.verifying) {
    const result = await checkpointInvoker("pre_executing")

    if (result === "REJECTED") {
      throw new IntentLockStateTransitionError({
        from: state.state,
        to: IntentState.LOCKED_CODE_CHANGE,
        sessionId: state.sessionId,
      })
    }

    // TIMEOUT: proceed (advisory per D-15).
    // ACCEPTED: proceed normally.
    return transitionToExecuting(state, commitHash)
  }

  // P27.2 T17: pre_verifying checkpoint for EXECUTING -> VERIFYING.
  if (to === IntentState.EXECUTING && options?.verifying) {
    const result = await checkpointInvoker("pre_verifying")

    if (result === "REJECTED") {
      // "Continue implementation": state stays EXECUTING unchanged.
      return state
    }

    // ACCEPTED or TIMEOUT: append verifying history entry.
    // State stays EXECUTING; the history entry marks the verifying transition.
    return appendHistory(
      state,
      { from: IntentState.EXECUTING, to: IntentState.EXECUTING, at: Date.now(), commitHash, trajectoryId: "verifying" },
      IntentState.EXECUTING,
    )
  }

  // Standard transition via the existing function.
  return transitionToExecuting(state, commitHash)
}

/**
 * Complete the intent with an unblock precondition check (P27.2 T18, REQ-22).
 *
 * Enforces D-02 Layer 2 precondition:
 * - If `config.enabled === true`, raise `HarnessStateError` with remediation
 *   message (the gate must be disabled before completing the intent).
 * - Otherwise, call existing `completeIntent(state)`.
 *
 * @param state - Current state (must be EXECUTING).
 * @param config - The intent_lock config (`.hivemind/configs.json`).
 * @returns A new state with the transition applied.
 * @throws {HarnessStateError} When config.enabled === true (precondition violation).
 * @throws {IntentLockStateTransitionError} When state.state !== EXECUTING.
 */
export function completeIntentWithUnblock(
  state: IntentLockState,
  config: { enabled: boolean },
): IntentLockState {
  // D-02 precondition: gate must be disabled.
  if (config.enabled) {
    throw new HarnessStateError(
      "[Hivemind] Cannot complete intent: intent_lock.enabled === true. Set to false in .hivemind/configs.json per P27.2-SPEC REQ-22.",
    )
  }

  return completeIntent(state)
}

/**
 * Complete the intent lock. The hook uses this when the phase finishes.
 *
 * Valid: `EXECUTING → COMPLETED` (terminal).
 *
 * @param state - Current state.
 * @returns A new state with the transition applied.
 * @throws {IntentLockStateTransitionError} when `state.state !== EXECUTING`.
 */
export function completeIntent(state: IntentLockState): IntentLockState {
  const from = state.state
  validateTransition(from, IntentState.COMPLETED, state.sessionId)
  const at = Date.now()
  return appendHistory(
    state,
    { from, to: IntentState.COMPLETED, at },
    IntentState.COMPLETED,
  )
}
