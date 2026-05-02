/**
 * @fileoverview Recovery engine facade (Phase 66).
 *
 * Single-import surface for the recovery subsystem. Composes:
 *  - {@link ./recovery/failure-classes.ts | classifyFailure} — REC-01
 *  - {@link ./recovery/assess-state.ts | assessRecoveryState} — REC-02
 *  - {@link ./recovery/create-checkpoint.ts | createRecoveryCheckpoint} — REC-03
 *  - {@link ./recovery/repair-state.ts | repairRecoveryState} — REC-04
 *
 * Use this module as the canonical entry point from `src/plugin.ts` and tools.
 *
 * @module recovery-engine
 */

import {
  assessRecoveryState,
  classifyFailure,
  createRecoveryCheckpoint,
  repairRecoveryState,
} from "./recovery/index.js"

export {
  FAILURE_CLASSES,
  assessRecoveryState,
  classifyFailure,
  createRecoveryCheckpoint,
  repairRecoveryState,
} from "./recovery/index.js"

export type {
  AssessRecoveryStateOptions,
  FailureClass,
  RecoveryAction,
  RecoveryAssessment,
  RecoveryCheckpoint,
  RecoverySeverity,
  RepairOptions,
  RepairResult,
  RepairSource,
  RepairStatus,
} from "./recovery/index.js"

/**
 * Composite recovery engine handle. Use {@link createRecoveryEngine} to
 * obtain a bundled handle for ergonomic call-site usage.
 */
export interface RecoveryEngine {
  readonly classifyFailure: typeof classifyFailure
  readonly assessRecoveryState: typeof assessRecoveryState
  readonly createRecoveryCheckpoint: typeof createRecoveryCheckpoint
  readonly repairRecoveryState: typeof repairRecoveryState
}

/**
 * Create a recovery engine handle that bundles all four operations.
 *
 * @returns Recovery engine handle wired to the canonical implementations.
 *
 * @example
 * ```typescript
 * const engine = createRecoveryEngine()
 * const assessment = await engine.assessRecoveryState('sess', '/repo')
 * ```
 */
export function createRecoveryEngine(): RecoveryEngine {
  return {
    classifyFailure,
    assessRecoveryState,
    createRecoveryCheckpoint,
    repairRecoveryState,
  }
}
