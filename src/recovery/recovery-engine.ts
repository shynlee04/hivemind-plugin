import {
  bootstrapTrajectoryLedger,
  bootstrapWorkflowAuthority,
  createTrajectoryCheckpoint,
  ensureTrajectoryLedger,
  inspectTrajectoryLedger,
  loadTrajectoryLedger,
  recordTrajectoryRecoveryOutcome,
} from '../core/index.js'
import { inspectWorkflowAuthority } from '../core/workflow-management/index.js'
import type {
  CreateRecoveryCheckpointInput,
  RecoveryAssessment,
  RecoveryAssessmentInput,
  RecoveryFailureClass,
  RecoveryRepairResult,
} from './recovery-types.js'

function mapWorkflowIssues(input: ReturnType<typeof inspectWorkflowAuthority>): RecoveryFailureClass[] {
  return input.issues
    .map((issue) => issue.code)
    .filter((code): code is RecoveryFailureClass => [
      'missing-hivemind',
      'missing-planning-root',
      'missing-state-tasks',
      'missing-graph-tasks',
      'missing-task-link',
      'unknown-task-link',
    ].includes(code))
}

export async function assessRecoveryState(
  projectRoot: string,
  input: RecoveryAssessmentInput,
): Promise<RecoveryAssessment> {
  const workflowAuthority = inspectWorkflowAuthority(projectRoot, {
    workflowId: input.workflowId,
    taskIds: input.taskIds,
    sessionScope: input.sessionScope,
    purposeClass: input.purposeClass,
    lineage: input.lineage,
  })
  const trajectoryInspection = inspectTrajectoryLedger(projectRoot)
  const ledger = await loadTrajectoryLedger(projectRoot)
  const failureClasses = [
    ...mapWorkflowIssues(workflowAuthority),
    ...(trajectoryInspection.issues.filter((issue): issue is RecoveryFailureClass => [
      'missing-trajectory-ledger',
      'corrupt-trajectory-ledger',
    ].includes(issue))),
  ]
  const latestCheckpoint = [...ledger.checkpoints]
    .reverse()
    .find((checkpoint) => {
      if (input.trajectoryId) {
        return checkpoint.trajectoryId === input.trajectoryId
      }

      if (input.workflowId) {
        return checkpoint.workflowId === input.workflowId
      }

      return true
    })
  const hasBlockedConflict = failureClasses.includes('active-trajectory-conflict')

  return {
    status: hasBlockedConflict
      ? 'blocked'
      : failureClasses.length > 0
        ? 'recoverable'
        : 'healthy',
    failureClasses,
    recoveryOutcome: failureClasses.length > 0 ? 'repair' : 'none',
    reasons: failureClasses.length > 0 ? [...failureClasses] : ['recovery-state-healthy'],
    resumeTarget: latestCheckpoint?.resumeTarget,
    checkpointId: latestCheckpoint?.id,
  }
}

export async function createRecoveryCheckpoint(
  projectRoot: string,
  input: CreateRecoveryCheckpointInput,
) {
  return createTrajectoryCheckpoint(projectRoot, input)
}

export async function repairRecoveryState(
  projectRoot: string,
  input: RecoveryAssessmentInput,
): Promise<RecoveryRepairResult> {
  const before = await assessRecoveryState(projectRoot, input)
  const repairActions: string[] = []

  if (before.failureClasses.some((failure) => [
    'missing-hivemind',
    'missing-planning-root',
    'missing-state-tasks',
    'missing-graph-tasks',
  ].includes(failure))) {
    bootstrapWorkflowAuthority(projectRoot, {
      workflowId: input.workflowId,
      taskIds: input.taskIds,
      sessionScope: input.sessionScope,
      purposeClass: input.purposeClass,
      lineage: input.lineage,
    })
    repairActions.push('bootstrap-workflow-authority')
  }

  if (before.failureClasses.includes('missing-trajectory-ledger') || before.failureClasses.includes('corrupt-trajectory-ledger')) {
    await ensureTrajectoryLedger(projectRoot)
    repairActions.push('rebuild-trajectory-ledger')
  }

  if (input.trajectoryId && input.workflowId && input.lineage && input.purposeClass) {
    await bootstrapTrajectoryLedger(projectRoot, {
      trajectoryId: input.trajectoryId,
      workflowId: input.workflowId,
      sessionId: input.workflowId,
      lineage: input.lineage,
      purposeClass: input.purposeClass,
      taskIds: input.taskIds,
    })
    if (!repairActions.includes('rebuild-trajectory-ledger')) {
      repairActions.push('bootstrap-trajectory-bindings')
    }
  }

  await recordTrajectoryRecoveryOutcome(projectRoot, {
    outcome: repairActions.length > 0 ? 'repair' : 'none',
    failureClasses: before.failureClasses,
    summary: repairActions.length > 0 ? 'Recovery spine applied targeted repair actions.' : 'Recovery assessment found no repair work to apply.',
    checkpointId: before.checkpointId,
  })

  const after = await assessRecoveryState(projectRoot, input)
  const ledger = await loadTrajectoryLedger(projectRoot)
  const latestRecovery = ledger.recoveryLog.at(-1)

  return {
    ...after,
    recoveryOutcome: latestRecovery?.outcome ?? after.recoveryOutcome,
    repairActions,
  }
}
