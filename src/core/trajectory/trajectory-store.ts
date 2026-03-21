/**
 * Trajectory Store — Ledger CRUD
 *
 * This module composes trajectory ledger operations from specialized sub-modules:
 * - trajectory-store.types.ts    — Version constant and path resolution
 * - trajectory-store.ledger.ts   — Ledger create/read/write/normalize
 * - trajectory-store.operations.ts — High-level bootstrap, events, checkpoints
 *
 * @module trajectory-store
 */

// Re-export types for consumers
export type {
  BootstrapTrajectoryInput,
  CloseTrajectoryInput,
  CreateTrajectoryCheckpointInput,
  RecordTrajectoryRecoveryInput,
  TrajectoryEvent,
  TrajectoryLedger,
  TrajectoryLedgerInspection,
  TrajectoryRecoveryLogEntry,
  TrajectoryRecord,
} from './trajectory-types.js'

// Re-export version and path utilities
export { TRAJECTORY_LEDGER_VERSION, getTrajectoryLedgerPath } from './trajectory-store.types.js'

// Re-export ledger operations
export {
  createEmptyLedger,
  ensureTrajectoryLedger,
  inspectTrajectoryLedger,
  loadTrajectoryLedger,
  loadTrajectoryLedgerSync,
  normalizeLedger,
  saveTrajectoryLedger,
} from './trajectory-store.ledger.js'

// Re-export high-level operations
export {
  bootstrapTrajectoryLedger,
  closeTrajectory,
  createTrajectoryCheckpoint,
  recordTrajectoryEvent,
  recordTrajectoryRecoveryOutcome,
} from './trajectory-store.operations.js'
