/**
 * Barrel export for the config-workflow module.
 * All symbols from workflow-types, workflow-state, workflow-persistence, and workflow-guards.
 *
 * @module config-workflow
 */

export type {
  ConfigWorkflowState,
  WorkflowTurn,
  WorkflowTurnRecord,
  WorkflowTurnStatus,
  WorkflowResumeResult,
} from "./workflow-types.js"

export { WORKFLOW_TURNS } from "./workflow-types.js"

export {
  createWorkflowState,
  canAdvanceTurn,
  advanceTurn,
  completeCurrentTurn,
  getTurnName,
  isWorkflowComplete,
  cloneWorkflowState,
  TURN_NAMES,
  TOTAL_TURNS,
} from "./workflow-state.js"

export {
  getWorkflowStorePath,
  persistWorkflows,
  readPersistedWorkflows,
  persistWorkflow,
  readWorkflow,
  deleteWorkflow,
} from "./workflow-persistence.js"

export {
  validateTurnPrecondition,
  hasCollectedPrerequisites,
  hasCompilePrerequisites,
} from "./workflow-guards.js"
