import type { TrajectoryRecord } from './trajectory-types.js'
import type { AssessTrajectoryEntryInput, TrajectoryAssessment } from './trajectory-types.js'
import { getRuntimePressureContract } from '../../shared/pressure-contract.js'
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

function buildEvidenceRefs(
  activeTrajectoryId: string | undefined,
  lastClosedTrajectoryId: string | undefined,
  checkpointId: string | undefined,
): string[] {
  return [
    activeTrajectoryId ? `trajectory:${activeTrajectoryId}` : undefined,
    lastClosedTrajectoryId ? `trajectory:${lastClosedTrajectoryId}` : undefined,
    checkpointId ? `checkpoint:${checkpointId}` : undefined,
  ].filter((value): value is string => value !== undefined)
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
      const latestCheckpoint = resolveLatestCheckpoint(ledger, activeTrajectory.id)
      return {
        action: 'attach-active',
        activeTrajectoryId: activeTrajectory.id,
        matchedWorkflowId: activeTrajectory.workflowIds[0],
        ...latestCheckpoint,
        reasons: ['matched-active-trajectory'],
        evidenceRefs: buildEvidenceRefs(activeTrajectory.id, undefined, latestCheckpoint.checkpointId),
        pressureContract: getRuntimePressureContract('trajectory-continuation'),
      }
    }

    return {
      action: 'refuse-conflict',
      activeTrajectoryId: activeTrajectory.id,
      reasons: ['active-trajectory-conflict'],
      evidenceRefs: buildEvidenceRefs(activeTrajectory.id, undefined, undefined),
      pressureContract: getRuntimePressureContract('active-trajectory-conflict'),
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
      const latestCheckpoint = resolveLatestCheckpoint(ledger, closedTrajectory.id)
      return {
        action: 'resume-closed',
        lastClosedTrajectoryId: closedTrajectory.id,
        matchedWorkflowId: closedTrajectory.workflowIds[0],
        ...latestCheckpoint,
        reasons: ['resume-last-closed-trajectory'],
        evidenceRefs: buildEvidenceRefs(undefined, closedTrajectory.id, latestCheckpoint.checkpointId),
        pressureContract: getRuntimePressureContract('trajectory-continuation'),
      }
  }

  return {
    action: 'create-new',
    lastClosedTrajectoryId: ledger.lastClosedTrajectoryId ?? undefined,
    reasons: ['create-new-trajectory'],
    evidenceRefs: buildEvidenceRefs(undefined, ledger.lastClosedTrajectoryId ?? undefined, undefined),
    pressureContract: getRuntimePressureContract('steady-state'),
  }
}
