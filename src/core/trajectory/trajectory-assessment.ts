import type { TrajectoryRecord } from './trajectory-types.js'
import type { AssessTrajectoryEntryInput, TrajectoryAssessment } from './trajectory-types.js'
import { loadTrajectoryLedger, loadTrajectoryLedgerSync } from './trajectory-store.js'

const CONTINUATION_PATTERN = /\b(continue|continuation|resume|pick up|last time|validated|again)\b/i

function matchesWorkflow(record: TrajectoryRecord, workflowId: string | undefined): boolean {
  if (!workflowId) {
    return true
  }

  return record.workflowIds.includes(workflowId)
}

function matchesLineage(record: TrajectoryRecord, input: AssessTrajectoryEntryInput): boolean {
  return record.lineage === input.lineage
}

function resolveLatestCheckpoint(
  ledger: Awaited<ReturnType<typeof loadTrajectoryLedger>>,
  trajectoryId: string | undefined,
): { checkpointId?: string; resumeTarget?: string } {
  if (!trajectoryId) {
    return {}
  }

  const checkpoint = [...ledger.checkpoints]
    .reverse()
    .find((item) => item.trajectoryId === trajectoryId)

  return {
    checkpointId: checkpoint?.id,
    resumeTarget: checkpoint?.resumeTarget,
  }
}

export async function assessTrajectoryEntry(
  projectRoot: string,
  input: AssessTrajectoryEntryInput,
): Promise<TrajectoryAssessment> {
  const ledger = await loadTrajectoryLedger(projectRoot)
  return assessAgainstLedger(ledger, input)
}

export function assessTrajectoryEntrySync(
  projectRoot: string,
  input: AssessTrajectoryEntryInput,
): TrajectoryAssessment {
  const ledger = loadTrajectoryLedgerSync(projectRoot)
  return assessAgainstLedger(ledger, input)
}

function assessAgainstLedger(
  ledger: Awaited<ReturnType<typeof loadTrajectoryLedger>>,
  input: AssessTrajectoryEntryInput,
): TrajectoryAssessment {
  const activeTrajectory = ledger.activeTrajectoryId
    ? ledger.trajectories.find((trajectory) => trajectory.id === ledger.activeTrajectoryId)
    : undefined

  if (activeTrajectory) {
    if (matchesLineage(activeTrajectory, input) && matchesWorkflow(activeTrajectory, input.workflowId)) {
      return {
        action: 'attach-active',
        activeTrajectoryId: activeTrajectory.id,
        matchedWorkflowId: activeTrajectory.workflowIds[0],
        ...resolveLatestCheckpoint(ledger, activeTrajectory.id),
        reasons: ['matched-active-trajectory'],
      }
    }

    return {
      action: 'refuse-conflict',
      activeTrajectoryId: activeTrajectory.id,
      reasons: ['active-trajectory-conflict'],
    }
  }

  const wantsContinuation = CONTINUATION_PATTERN.test(input.userMessage)
  const closedTrajectory = ledger.lastClosedTrajectoryId
    ? ledger.trajectories.find((trajectory) => trajectory.id === ledger.lastClosedTrajectoryId)
    : undefined

  if (
    wantsContinuation
    && closedTrajectory
    && matchesLineage(closedTrajectory, input)
    && matchesWorkflow(closedTrajectory, input.workflowId)
  ) {
      return {
        action: 'resume-closed',
        lastClosedTrajectoryId: closedTrajectory.id,
        matchedWorkflowId: closedTrajectory.workflowIds[0],
        ...resolveLatestCheckpoint(ledger, closedTrajectory.id),
        reasons: ['resume-last-closed-trajectory'],
      }
  }

  return {
    action: 'create-new',
    lastClosedTrajectoryId: ledger.lastClosedTrajectoryId ?? undefined,
    reasons: ['create-new-trajectory'],
  }
}
