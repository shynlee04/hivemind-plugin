import * as fsSync from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { getHivemindPath } from '../../shared/paths.js'
import { activateWorkflowTask } from '../workflow-management/task-lifecycle.js'
import { bootstrapWorkflowAuthority } from '../workflow-management/workflow-authority.js'
import type {
  BootstrapTrajectoryInput,
  CloseTrajectoryInput,
  CreateTrajectoryCheckpointInput,
  RecordTrajectoryRecoveryInput,
  TrajectoryEvent,
  TrajectoryLedgerInspection,
  TrajectoryLedger,
  TrajectoryRecoveryLogEntry,
  TrajectoryRecord,
} from './trajectory-types.js'

const TRAJECTORY_LEDGER_VERSION = '1.0.0'

function createEmptyLedger(): TrajectoryLedger {
  return {
    version: TRAJECTORY_LEDGER_VERSION,
    activeTrajectoryId: null,
    lastClosedTrajectoryId: null,
    trajectories: [],
    checkpoints: [],
    recoveryLog: [],
  }
}

export function getTrajectoryLedgerPath(projectRoot: string): string {
  return path.join(getHivemindPath(projectRoot), 'state', 'trajectory-ledger.json')
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function fileExistsSync(filePath: string): boolean {
  return fsSync.existsSync(filePath)
}

async function saveTrajectoryLedger(projectRoot: string, ledger: TrajectoryLedger): Promise<TrajectoryLedger> {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true })
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2))
  return ledger
}

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

function normalizeLedger(ledger: TrajectoryLedger): TrajectoryLedger {
  return {
    version: ledger.version ?? TRAJECTORY_LEDGER_VERSION,
    activeTrajectoryId: ledger.activeTrajectoryId ?? null,
    lastClosedTrajectoryId: ledger.lastClosedTrajectoryId ?? null,
    trajectories: (ledger.trajectories ?? []).map((trajectory) => ({
      ...trajectory,
      checkpointIds: trajectory.checkpointIds ?? [],
      nextAllowedTransitions: trajectory.nextAllowedTransitions ?? [],
      branchNotes: trajectory.branchNotes ?? [],
    })),
    checkpoints: ledger.checkpoints ?? [],
    recoveryLog: ledger.recoveryLog ?? [],
  }
}

export async function loadTrajectoryLedger(projectRoot: string): Promise<TrajectoryLedger> {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  if (!(await fileExists(ledgerPath))) {
    return createEmptyLedger()
  }

  try {
    const raw = await fs.readFile(ledgerPath, 'utf-8')
    return normalizeLedger(JSON.parse(raw) as TrajectoryLedger)
  } catch {
    return createEmptyLedger()
  }
}

export function loadTrajectoryLedgerSync(projectRoot: string): TrajectoryLedger {
  const ledgerPath = getTrajectoryLedgerPath(projectRoot)
  if (!fileExistsSync(ledgerPath)) {
    return createEmptyLedger()
  }

  try {
    const raw = fsSync.readFileSync(ledgerPath, 'utf-8')
    return normalizeLedger(JSON.parse(raw) as TrajectoryLedger)
  } catch {
    return createEmptyLedger()
  }
}

export function inspectTrajectoryLedger(projectRoot: string): TrajectoryLedgerInspection {
  const filePath = getTrajectoryLedgerPath(projectRoot)
  if (!fileExistsSync(filePath)) {
    return {
      exists: false,
      healthy: false,
      filePath,
      issues: ['missing-trajectory-ledger'],
    }
  }

  try {
    const raw = fsSync.readFileSync(filePath, 'utf-8')
    const parsed = normalizeLedger(JSON.parse(raw) as TrajectoryLedger)
    if (parsed.version !== TRAJECTORY_LEDGER_VERSION) {
      return {
        exists: true,
        healthy: true,
        filePath,
        issues: ['trajectory-ledger-version-drift'],
      }
    }

    return {
      exists: true,
      healthy: true,
      filePath,
      issues: [],
    }
  } catch {
    return {
      exists: true,
      healthy: false,
      filePath,
      issues: ['corrupt-trajectory-ledger'],
    }
  }
}

export async function ensureTrajectoryLedger(projectRoot: string): Promise<TrajectoryLedger> {
  const inspection = inspectTrajectoryLedger(projectRoot)
  if (!inspection.exists) {
    return saveTrajectoryLedger(projectRoot, createEmptyLedger())
  }

  if (!inspection.healthy && inspection.issues.includes('corrupt-trajectory-ledger')) {
    return saveTrajectoryLedger(projectRoot, createEmptyLedger())
  }

  return loadTrajectoryLedger(projectRoot)
}

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
