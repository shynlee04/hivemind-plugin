/**
 * Intent-lock gate — barrel export.
 *
 * Plan 01 ships the foundation: types, state machine, and dual-layer store.
 * Plan 02 ADDS verify-step-{1,2,3,4}, tool-resolver, and resume. Plan 03
 * ADDS the hook entry point and config schema integration. This barrel
 * is the single import surface for downstream consumers.
 */

// Types and errors
export {
  DEFAULT_INTENT_LOCK_CONFIG,
  HarnessStateError,
  IntentLockBlockedError,
  IntentLockNotFoundError,
  IntentLockSchemaError,
  IntentLockStateTransitionError,
  IntentState,
} from "./types.js"
export type {
  IntentLockConfig,
  IntentLockHistoryEntry,
  IntentLockState,
  SessionContext,
  ToolDecision,
} from "./types.js"

// State machine
export {
  ALLOWED_TRANSITIONS,
  canTransition,
  completeIntent,
  completeIntentWithUnblock,
  isTerminalState,
  lockIntentCodeChange,
  lockIntentNonCode,
  transitionToExecuting,
  transitionToPhaseAuthorized,
  transitionToPhaseReady,
  transitionWithCheckpoint,
  validateTransition,
} from "./state-machine.js"

// Dual-layer store
export {
  clearIntentLockCache,
  getIntentLockFilePath,
  getOrCreateIntentLockState,
  getIntentLockStoreVersion,
  persistIntentLockState,
  readIntentLockState,
  upsertIntentLockState,
} from "./store.js"

// Tool resolver (plan 02)
export {
  MODERATE_BASH_PATTERNS,
  PERMISSION_MATRIX,
  READ_ONLY_TOOLS,
  resolveToolPermission,
} from "./tool-resolver.js"

// Resume (plan 02)
export { resolveContinuedSession } from "./resume.js"
export type { ContinuityEntry, ResumeDeps, ResumeResult } from "./resume.js"
