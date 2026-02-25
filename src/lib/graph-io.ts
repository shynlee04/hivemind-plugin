export type { OrphanRecord } from "./graph/shared.js"

export {
  validateMemsWithFKValidation,
  validateTasksWithFKValidation,
} from "./graph/fk-validator.js"

export {
  buildLifecycleLineageSnapshot,
  loadGraphMems,
  loadGraphTasks,
  loadGraphWithFullFKValidation,
  loadPlans,
  loadTrajectory,
  type FKValidationOptions,
  type LifecycleLineageSnapshot,
} from "./graph/reader.js"

export {
  addGraphMem,
  addGraphTask,
  flagFalsePath,
  invalidateOrphanedActiveTasks,
  invalidateTask,
  normalizeSessionIdToUuid,
  reconcileStaleTasks,
  resolveCanonicalSessionId,
  saveGraphMems,
  saveGraphTasks,
  savePlans,
  saveTrajectory,
  type InvalidationResult,
  type ReconciliationResult,
} from "./graph/writer.js"

export {
  buildRalphTaskGraphSnapshot,
  type RalphTaskGraphSnapshot,
} from "./bridges/ralph-bridge.js"
