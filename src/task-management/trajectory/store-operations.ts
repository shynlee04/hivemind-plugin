import { randomUUID } from "node:crypto"

import { createEmptyTrajectoryLedger, readTrajectoryLedger, writeTrajectoryLedger } from "./ledger.js"
import type {
  EvidenceRef,
  TrajectoryCheckpoint,
  TrajectoryEvent,
  TrajectoryLedger,
  TrajectoryMutationInput,
  TrajectoryRecord,
  TrajectoryTraversal,
} from "./types.js"

/**
 * Inspect the trajectory ledger, optionally focusing on a single trajectory.
 *
 * @param input - Project root and optional trajectory ID.
 * @returns Ledger plus optional selected trajectory.
 */
export function inspectTrajectoryLedger(input: { projectRoot: string; trajectoryId?: string }): { ledger: TrajectoryLedger; trajectory?: TrajectoryRecord } {
  const ledger = readTrajectoryLedger(input.projectRoot)
  return { ledger, trajectory: input.trajectoryId ? ledger.trajectories[input.trajectoryId] : undefined }
}

/**
 * Attach evidence references to a trajectory, creating the trajectory when needed.
 *
 * @param input - Trajectory identity, optional lineage, and evidence references.
 * @returns Updated ledger and trajectory.
 */
export function attachTrajectoryEvidence(input: TrajectoryMutationInput): { ledger: TrajectoryLedger; trajectory: TrajectoryRecord } {
  const ledger = readTrajectoryLedger(input.projectRoot)
  const existing = ledger.trajectories[input.trajectoryId]
  if (existing?.status === "closed") {
    throw new Error(`[Harness] trajectory is closed: ${input.trajectoryId}`)
  }
  const now = Date.now()
  const trajectory = upsertTrajectory(ledger, input, now)
  const evidenceRefs = normalizeEvidenceRefs(input.evidenceRef, input.evidenceRefs)
  trajectory.evidenceRefs = mergeStrings(trajectory.evidenceRefs, evidenceRefs)
  trajectory.updatedAt = now
  ledger.updatedAt = now
  writeTrajectoryLedger(input.projectRoot, ledger)
  return { ledger, trajectory }
}

/**
 * Record a resumability checkpoint against an existing or newly created trajectory.
 *
 * @param input - Trajectory target, checkpoint identity, summary, and evidence references.
 * @returns Updated ledger and trajectory.
 */
export function checkpointTrajectory(input: TrajectoryMutationInput & { checkpointId?: string; summary: string }): { ledger: TrajectoryLedger; trajectory: TrajectoryRecord; checkpoint: TrajectoryCheckpoint } {
  const ledger = readTrajectoryLedger(input.projectRoot)
  const existing = ledger.trajectories[input.trajectoryId]
  if (existing?.status === "closed") {
    throw new Error(`[Harness] trajectory is closed: ${input.trajectoryId}`)
  }
  const now = Date.now()
  const trajectory = upsertTrajectory(ledger, input, now)
  const checkpoint: TrajectoryCheckpoint = {
    checkpointId: input.checkpointId ?? `checkpoint-${randomUUID()}`,
    summary: boundText(input.summary),
    evidenceRefs: normalizeEvidenceRefs(input.evidenceRef, input.evidenceRefs),
    createdAt: now,
  }
  trajectory.checkpoints = [...trajectory.checkpoints.filter((item) => item.checkpointId !== checkpoint.checkpointId), checkpoint]
  trajectory.evidenceRefs = mergeStrings(trajectory.evidenceRefs, checkpoint.evidenceRefs)
  trajectory.updatedAt = now
  ledger.updatedAt = now
  writeTrajectoryLedger(input.projectRoot, ledger)
  return { ledger, trajectory, checkpoint }
}

/**
 * Record an evidence event against an existing or newly created trajectory.
 *
 * @param input - Trajectory target, event identity, event type, summary, and evidence references.
 * @returns Updated ledger and trajectory.
 */
export function eventTrajectory(input: TrajectoryMutationInput & { eventId?: string; eventType: string; summary: string }): { ledger: TrajectoryLedger; trajectory: TrajectoryRecord; event: TrajectoryEvent } {
  const ledger = readTrajectoryLedger(input.projectRoot)
  const existing = ledger.trajectories[input.trajectoryId]
  if (existing?.status === "closed") {
    throw new Error(`[Harness] trajectory is closed: ${input.trajectoryId}`)
  }
  const now = Date.now()
  const trajectory = upsertTrajectory(ledger, input, now)
  const event: TrajectoryEvent = {
    eventId: input.eventId ?? `event-${randomUUID()}`,
    eventType: boundText(input.eventType),
    summary: boundText(input.summary),
    evidenceRefs: normalizeEvidenceRefs(input.evidenceRef, input.evidenceRefs),
    createdAt: now,
  }
  trajectory.events = [...trajectory.events.filter((item) => item.eventId !== event.eventId), event]
  trajectory.evidenceRefs = mergeStrings(trajectory.evidenceRefs, event.evidenceRefs)
  trajectory.updatedAt = now
  ledger.updatedAt = now
  writeTrajectoryLedger(input.projectRoot, ledger)
  return { ledger, trajectory, event }
}

/**
 * Close a trajectory after verification while preserving all existing evidence.
 *
 * @param input - Target trajectory ID and optional close summary.
 * @returns Updated ledger and closed trajectory.
 * @throws {Error} When the target trajectory does not exist.
 */
export function closeTrajectory(input: { projectRoot: string; trajectoryId: string; summary?: string }): { ledger: TrajectoryLedger; trajectory: TrajectoryRecord } {
  const ledger = readTrajectoryLedger(input.projectRoot)
  const trajectory = ledger.trajectories[input.trajectoryId]
  if (!trajectory) {
    throw new Error(`[Harness] Trajectory "${input.trajectoryId}" not found`)
  }
  if (trajectory.status === "closed") {
    throw new Error(`[Harness] trajectory is already closed: ${input.trajectoryId}`)
  }
  const now = Date.now()
  trajectory.status = "closed"
  trajectory.updatedAt = now
  trajectory.closeSummary = input.summary ? boundText(input.summary) : trajectory.closeSummary
  ledger.updatedAt = now
  writeTrajectoryLedger(input.projectRoot, ledger)
  return { ledger, trajectory }
}

/**
 * Traverse trajectory records by root session, concrete session, or trajectory ID.
 *
 * @param input - Traversal filter and project root.
 * @returns Parent-child traversal projection containing matching nodes and edges.
 */
export function traverseTrajectory(input: { projectRoot: string; rootSessionId?: string; sessionId?: string; trajectoryId?: string }): TrajectoryTraversal {
  const ledger = readTrajectoryLedger(input.projectRoot)
  const all = Object.values(ledger.trajectories)
  const selected = all.filter((trajectory) => {
    if (input.trajectoryId) return trajectory.id === input.trajectoryId || trajectory.parentTrajectoryId === input.trajectoryId
    if (input.sessionId) return trajectory.sessionId === input.sessionId
    if (input.rootSessionId) return trajectory.rootSessionId === input.rootSessionId
    return true
  }).sort(compareTrajectoryRecords)
  const selectedIds = new Set(selected.map((trajectory) => trajectory.id))
  const edges = selected
    .filter((trajectory) => trajectory.parentTrajectoryId && selectedIds.has(trajectory.parentTrajectoryId))
    .map((trajectory) => ({ from: trajectory.parentTrajectoryId as string, to: trajectory.id }))
  return { trajectories: selected, edges }
}

function upsertTrajectory(ledger: TrajectoryLedger, input: TrajectoryMutationInput, now: number): TrajectoryRecord {
  const existing = ledger.trajectories[input.trajectoryId]
  if (existing) {
    existing.rootSessionId = input.rootSessionId ?? existing.rootSessionId
    existing.sessionId = input.sessionId ?? existing.sessionId
    existing.parentTrajectoryId = input.parentTrajectoryId ?? existing.parentTrajectoryId
    return existing
  }

  if (!input.rootSessionId) {
    throw new Error(`[Harness] rootSessionId is required to create trajectory "${input.trajectoryId}"`)
  }

  const trajectory: TrajectoryRecord = {
    id: input.trajectoryId,
    rootSessionId: input.rootSessionId,
    sessionId: input.sessionId ?? null,
    parentTrajectoryId: input.parentTrajectoryId ?? null,
    status: "active",
    evidenceRefs: [],
    checkpoints: [],
    events: [],
    createdAt: now,
    updatedAt: now,
  }
  ledger.trajectories[trajectory.id] = trajectory
  return trajectory
}

function normalizeEvidenceRefs(evidenceRef?: EvidenceRef, evidenceRefs?: EvidenceRef[]): EvidenceRef[] {
  return mergeStrings(evidenceRef ? [evidenceRef] : [], evidenceRefs ?? [])
}

function mergeStrings(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming].map((value) => boundText(value)).filter(Boolean)))
}

function boundText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 2_000)
}

function compareTrajectoryRecords(a: TrajectoryRecord, b: TrajectoryRecord): number {
  if (a.parentTrajectoryId === b.id) return 1
  if (b.parentTrajectoryId === a.id) return -1
  return a.createdAt - b.createdAt || a.id.localeCompare(b.id)
}

/**
 * Create an empty trajectory ledger value for tests and callers that need a seed object.
 *
 * @returns Empty versioned trajectory ledger.
 */
export function createTrajectoryLedger(): TrajectoryLedger {
  return createEmptyTrajectoryLedger()
}
