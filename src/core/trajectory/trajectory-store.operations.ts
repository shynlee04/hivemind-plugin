import { activateWorkflowTask } from '../workflow-management/task-lifecycle.js'
import { bootstrapWorkflowAuthority } from '../workflow-management/workflow-authority.js'
import type {
  BootstrapTrajectoryInput,
  CloseTrajectoryInput,
  CreateTrajectoryCheckpointInput,
  RecordTrajectoryRecoveryInput,
  TrajectoryEvent,
  TrajectoryRecoveryLogEntry,
  TrajectoryRecord,
} from './trajectory-types.js'
import { saveTrajectoryLedger, ensureTrajectoryLedger } from './trajectory-store.ledger.js'
import type { TrajectoryLedger } from './trajectory-types.js'

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mergeUnique(existing: string[], incoming: string[] | undefined): string[] {
  return [...new Set([...existing, ...(incoming ?? [])])]
}

function createTrajectoryRecord(input: BootstrapTrajectoryInput): TrajectoryRecord {
  const now = new Date().toISOString()

  return {
    id: input.trajectoryId,
    lineage: input.lineage,
    purposeClass: input.purposeClass,
    workflowIds: [input.workflowId],
    sessionIds: [input.sessionId],
    taskIds: [...(input.taskIds ?? [])],
    subtaskIds: [...(input.subtaskIds ?? [])],
    delegationIds: [...(input.delegationIds ?? [])],
    eventSummaries: [],
    evidenceRefs: [],
    planningRefs: [...(input.planningRefs ?? [])],
    graphNodeBindings: [...(input.graphNodeBindings ?? [])],
    rerouteNotes: [],
    checkpointIds: [],
    nextAllowedTransitions: ['command:hm-harness', 'command:hm-plan', 'command:hm-implement'],
    branchNotes: [],
    events: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

// ---------------------------------------------------------------------------
// High-level operations
// ---------------------------------------------------------------------------

/**
 * Bootstraps a new trajectory ledger entry, creating the trajectory record
 * and activating associated workflow tasks.
 * @param projectRoot - The project root directory
 * @param input - Bootstrap input containing trajectory identity
 * @returns The updated TrajectoryLedger
 */
export async function bootstrapTrajectoryLedger(
  projectRoot: string,
  input: BootstrapTrajectoryInput,
): Promise<TrajectoryLedger> {
  bootstrapWorkflowAuthority(projectRoot, {
    workflowId: input.workflowId,
    taskIds: input.taskIds,
    sessionScope: 'main',
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })
  if ((input.taskIds?.length ?? 0) > 0) {
    activateWorkflowTask(projectRoot, {
      workflowId: input.workflowId,
      taskId: input.taskIds![0]!,
      title: input.taskIds![0]!,
    })
  }
  for (const subtaskId of input.subtaskIds ?? []) {
    activateWorkflowTask(projectRoot, {
      workflowId: input.workflowId,
      taskId: subtaskId,
      title: subtaskId,
      kind: 'subtask',
      parentTaskId: input.taskIds?.[0],
    })
  }

  const ledger = await ensureTrajectoryLedger(projectRoot)
  const existing = ledger.trajectories.find((trajectory) => trajectory.id === input.trajectoryId)
  const updatedAt = new Date().toISOString()

  if (existing) {
    existing.workflowIds = mergeUnique(existing.workflowIds, [input.workflowId])
    existing.sessionIds = mergeUnique(existing.sessionIds, [input.sessionId])
    existing.taskIds = mergeUnique(existing.taskIds, input.taskIds)
    existing.subtaskIds = mergeUnique(existing.subtaskIds, input.subtaskIds)
    existing.delegationIds = mergeUnique(existing.delegationIds, input.delegationIds)
    existing.planningRefs = mergeUnique(existing.planningRefs, input.planningRefs)
    existing.graphNodeBindings = mergeUnique(existing.graphNodeBindings, input.graphNodeBindings)
    existing.status = 'active'
    existing.updatedAt = updatedAt
  } else {
    ledger.trajectories.push(createTrajectoryRecord(input))
  }

  ledger.activeTrajectoryId = input.trajectoryId
  return saveTrajectoryLedger(projectRoot, ledger)
}

/**
 * Records a trajectory event (summary, handoff, evidence, transition, or note).
 * @param projectRoot - The project root directory
 * @param trajectoryId - The trajectory ID to record the event under
 * @param event - The event to record
 * @returns The updated TrajectoryLedger
 */
export async function recordTrajectoryEvent(
  projectRoot: string,
  trajectoryId: string,
  event: TrajectoryEvent,
): Promise<TrajectoryLedger> {
  const ledger = await ensureTrajectoryLedger(projectRoot)
  const trajectory = ledger.trajectories.find((item) => item.id === trajectoryId)
  if (!trajectory) {
    return ledger
  }

  const createdAt = event.createdAt ?? new Date().toISOString()
  trajectory.events.push({
    ...event,
    createdAt,
  })
  trajectory.eventSummaries = mergeUnique(trajectory.eventSummaries, [event.summary])
  trajectory.evidenceRefs = mergeUnique(trajectory.evidenceRefs, event.evidenceRefs)
  trajectory.updatedAt = createdAt

  return saveTrajectoryLedger(projectRoot, ledger)
}

/**
 * Closes a trajectory, marking it as completed.
 * @param projectRoot - The project root directory
 * @param trajectoryId - The trajectory ID to close
 * @param input - Close input containing closing summary
 * @returns The updated TrajectoryLedger
 */
export async function closeTrajectory(
  projectRoot: string,
  trajectoryId: string,
  input: CloseTrajectoryInput,
): Promise<TrajectoryLedger> {
  const ledger = await ensureTrajectoryLedger(projectRoot)
  const trajectory = ledger.trajectories.find((item) => item.id === trajectoryId)
  if (!trajectory) {
    return ledger
  }

  const closedAt = new Date().toISOString()
  trajectory.status = 'closed'
  trajectory.closedAt = closedAt
  trajectory.closingSummary = input.closingSummary
  trajectory.updatedAt = closedAt
  trajectory.eventSummaries = mergeUnique(trajectory.eventSummaries, [input.closingSummary])

  if (ledger.activeTrajectoryId === trajectoryId) {
    ledger.activeTrajectoryId = null
  }
  ledger.lastClosedTrajectoryId = trajectoryId

  return saveTrajectoryLedger(projectRoot, ledger)
}

/**
 * Creates a checkpoint for a trajectory, enabling recovery/resume.
 * @param projectRoot - The project root directory
 * @param input - Checkpoint input containing trajectory and workflow IDs
 * @returns The created checkpoint
 */
export async function createTrajectoryCheckpoint(
  projectRoot: string,
  input: CreateTrajectoryCheckpointInput,
) {
  const ledger = await ensureTrajectoryLedger(projectRoot)
  const trajectory = ledger.trajectories.find((item) => item.id === input.trajectoryId)
  const createdAt = new Date().toISOString()
  const checkpoint = {
    id: `chk_${input.trajectoryId}_${ledger.checkpoints.length + 1}`,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds: [...(input.taskIds ?? [])],
    subtaskIds: [...(input.subtaskIds ?? [])],
    source: input.source,
    resumeTarget: input.resumeTarget,
    createdAt,
  }

  ledger.checkpoints.push(checkpoint)
  if (trajectory) {
    trajectory.checkpointIds = mergeUnique(trajectory.checkpointIds, [checkpoint.id])
    trajectory.updatedAt = createdAt
  }

  await saveTrajectoryLedger(projectRoot, ledger)
  return checkpoint
}

/**
 * Records the outcome of a trajectory recovery operation.
 * @param projectRoot - The project root directory
 * @param input - Recovery input containing outcome and summary
 * @returns The created recovery log entry
 */
export async function recordTrajectoryRecoveryOutcome(
  projectRoot: string,
  input: RecordTrajectoryRecoveryInput,
): Promise<TrajectoryRecoveryLogEntry> {
  const ledger = await ensureTrajectoryLedger(projectRoot)
  const entry = {
    id: `recovery_${ledger.recoveryLog.length + 1}`,
    outcome: input.outcome,
    failureClasses: [...input.failureClasses],
    summary: input.summary,
    checkpointId: input.checkpointId,
    createdAt: new Date().toISOString(),
  }

  ledger.recoveryLog.push(entry)
  await saveTrajectoryLedger(projectRoot, ledger)
  return entry
}
