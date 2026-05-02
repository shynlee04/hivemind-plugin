/**
 * @fileoverview Recovery subsystem barrel — re-exports failure classification,
 * recovery-state assessment, checkpoint creation, and state repair.
 *
 * Phase 66 deliverables:
 *  - REC-01 — failure classification (failure-classes.ts)
 *  - REC-02 — recovery state assessment (assess-state.ts)
 *  - REC-03 — checkpoint creation (create-checkpoint.ts)
 *  - REC-04 — state repair (repair-state.ts)
 *
 * @module recovery
 */

export type { FailureClass } from "./failure-classes.js"
export { FAILURE_CLASSES, classifyFailure } from "./failure-classes.js"

export type {
  AssessRecoveryStateOptions,
  RecoveryAction,
  RecoveryAssessment,
  RecoverySeverity,
} from "./assess-state.js"
export { assessRecoveryState } from "./assess-state.js"

export type { RecoveryCheckpoint } from "./create-checkpoint.js"
export { createRecoveryCheckpoint } from "./create-checkpoint.js"

export type { RepairOptions, RepairResult, RepairSource, RepairStatus } from "./repair-state.js"
export { repairRecoveryState } from "./repair-state.js"
