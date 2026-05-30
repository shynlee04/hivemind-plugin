import { randomUUID } from "node:crypto"

import { createEmptyTrajectoryLedger, readTrajectoryLedger, writeTrajectoryLedger } from "./ledger.js"
import {
  TRAJECTORY_AUTO_TRANSITIONS,
  TRAJECTORY_TRANSITIONS,
  type TrajectoryDepth,
  type TrajectoryStatus,
  type TrajectorySummary,
} from "./types.js"
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
 * Create a phase-level trajectory in the ledger.
 *
 * Per D-04, phase trajectory ID format is `traj-phase-{N}`.
 * Per D-31, new trajectories start in "planning" status.
 * Per D-15/D-36, orchestrator creates phase trajectories explicitly.
 *
 * @param input - Phase trajectory creation parameters.
 * @returns Updated ledger and created trajectory.
 * @throws {Error} If a trajectory with the same phase number already exists.
 */
export function createPhaseTrajectory(input: {
  projectRoot: string
  phaseNumber: number | string
  rootSessionId: string
  phaseName?: string
}): { ledger: TrajectoryLedger; trajectory: TrajectoryRecord } {
  const trajectoryId = `traj-phase-${input.phaseNumber}`
  const ledger = readTrajectoryLedger(input.projectRoot)
  const existing = ledger.trajectories[trajectoryId]
  if (existing) {
    throw new Error(`[Harness] phase trajectory already exists: ${trajectoryId}`)
  }
  const now = Date.now()
  const trajectory: TrajectoryRecord = {
    id: trajectoryId,
    rootSessionId: input.rootSessionId,
    sessionId: null,
    parentTrajectoryId: null,
    status: "planning",
    evidenceRefs: [],
    checkpoints: [],
    events: [],
    createdAt: now,
    updatedAt: now,
  }
  ledger.trajectories[trajectoryId] = trajectory
  ledger.updatedAt = now
  writeTrajectoryLedger(input.projectRoot, ledger)
  return { ledger, trajectory }
}

/**
 * Transition a trajectory to a target status, validating against TRAJECTORY_TRANSITIONS.
 *
 * Per D-31 to D-35, transitions support both automatic (event-based) and
 * manual (orchestrator tool call) paths. This is the manual transition function.
 *
 * Idempotent: transitioning to the current state is a no-op.
 *
 * @param projectRoot - Project root whose ledger should be used.
 * @param trajectoryId - Target trajectory ID.
 * @param targetStatus - Desired target status.
 * @returns Updated ledger and trajectory.
 * @throws {Error} When the trajectory doesn't exist or the transition is invalid.
 */
export function transitionTrajectory(
  projectRoot: string,
  trajectoryId: string,
  targetStatus: TrajectoryStatus,
): { ledger: TrajectoryLedger; trajectory: TrajectoryRecord } {
  const ledger = readTrajectoryLedger(projectRoot)
  const trajectory = ledger.trajectories[trajectoryId]
  if (!trajectory) {
    throw new Error(`[Harness] trajectory not found: ${trajectoryId}`)
  }

  // Idempotent: same-state transition is a no-op
  if (trajectory.status === targetStatus) {
    return { ledger, trajectory }
  }

  const allowed = TRAJECTORY_TRANSITIONS[trajectory.status]
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `[Harness] invalid trajectory transition: ${trajectory.status}→${targetStatus} (${trajectoryId})`,
    )
  }

  const now = Date.now()
  trajectory.status = targetStatus
  trajectory.updatedAt = now
  ledger.updatedAt = now
  writeTrajectoryLedger(projectRoot, ledger)
  return { ledger, trajectory }
}

/**
 * Add an event to a trajectory with automatic state transitions.
 *
 * Per D-32 to D-34, certain event types trigger automatic state transitions.
 * If the event type matches TRAJECTORY_AUTO_TRANSITIONS, and the transition
 * is valid per TRAJECTORY_TRANSITIONS, the trajectory's status is updated.
 *
 * @param projectRoot - Project root whose ledger should be used.
 * @param trajectoryId - Target trajectory ID.
 * @param eventType - Event type string (may trigger auto-transition).
 * @param summary - Human-readable event summary.
 * @returns Updated ledger and trajectory.
 * @throws {Error} When the trajectory doesn't exist.
 */
export function addTrajectoryEvent(
  projectRoot: string,
  trajectoryId: string,
  eventType: string,
  summary: string,
): { ledger: TrajectoryLedger; trajectory: TrajectoryRecord } {
  const ledger = readTrajectoryLedger(projectRoot)
  const trajectory = ledger.trajectories[trajectoryId]
  if (!trajectory) {
    throw new Error(`[Harness] trajectory not found: ${trajectoryId}`)
  }

  const now = Date.now()
  const event: TrajectoryEvent = {
    eventId: `event-${randomUUID()}`,
    eventType,
    summary,
    evidenceRefs: [],
    createdAt: now,
  }
  trajectory.events = [...trajectory.events, event]
  trajectory.updatedAt = now
  ledger.updatedAt = now

  // Check for auto-transition
  const autoTarget = TRAJECTORY_AUTO_TRANSITIONS[eventType]
  if (autoTarget) {
    const allowed = TRAJECTORY_TRANSITIONS[trajectory.status]
    if (allowed.includes(autoTarget)) {
      trajectory.status = autoTarget
    }
  }

  writeTrajectoryLedger(projectRoot, ledger)
  return { ledger, trajectory }
}

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
 * Supports progressive disclosure via the `depth` parameter (D-27 to D-30):
 * - "summary": returns status + event count + phase name + duration
 * - "detailed": returns event types + summaries (strips evidence refs)
 * - "full": returns all data (default, backward compat)
 *
 * @param input - Traversal filter, project root, and optional depth.
 * @returns Traversal projection at the requested depth level.
 */
export function traverseTrajectory(input: {
  projectRoot: string
  rootSessionId?: string
  sessionId?: string
  trajectoryId?: string
  depth?: TrajectoryDepth
}): TrajectoryTraversal | { summaries: TrajectorySummary[] } {
  const ledger = readTrajectoryLedger(input.projectRoot)
  const all = Object.values(ledger.trajectories)
  const selected = all.filter((trajectory) => {
    if (input.trajectoryId) return trajectory.id === input.trajectoryId || trajectory.parentTrajectoryId === input.trajectoryId
    if (input.sessionId) return trajectory.sessionId === input.sessionId
    if (input.rootSessionId) return trajectory.rootSessionId === input.rootSessionId
    return true
  }).sort(compareTrajectoryRecords)
  const depth = input.depth ?? "full"

  if (depth === "summary") {
    return { summaries: selected.map((trajectory) => projectSummary(trajectory, ledger)) }
  }

  if (depth === "detailed") {
    return {
      trajectories: selected.map((trajectory) => projectDetailed(trajectory)),
      edges: computeEdges(selected),
    }
  }

  // depth === "full" — return everything (current behavior, backward compat)
  return { trajectories: selected, edges: computeEdges(selected) }
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
    status: "planning",
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
 * Project a summary view for progressive disclosure (depth="summary").
 *
 * Per D-28, summary returns: id, status, eventCount, checkpointCount, durationMs, phaseName.
 */
function projectSummary(record: TrajectoryRecord, ledger: TrajectoryLedger): TrajectorySummary {
  return {
    id: record.id,
    status: record.status,
    eventCount: record.events.length,
    checkpointCount: record.checkpoints.length,
    durationMs: record.updatedAt - record.createdAt,
  }
}

/**
 * Project a detailed view for progressive disclosure (depth="detailed").
 *
 * Per D-29, detailed returns event types + summaries but strips evidence refs.
 */
function projectDetailed(record: TrajectoryRecord): TrajectoryRecord {
  return {
    ...record,
    evidenceRefs: [],
    checkpoints: record.checkpoints.map((cp) => ({
      ...cp,
      evidenceRefs: [],
    })),
    events: record.events.map((evt) => ({
      ...evt,
      evidenceRefs: [],
    })),
  }
}

/**
 * Compute parent-child edges from selected trajectory records.
 */
function computeEdges(selected: TrajectoryRecord[]): Array<{ from: string; to: string }> {
  const selectedIds = new Set(selected.map((trajectory) => trajectory.id))
  return selected
    .filter((trajectory) => trajectory.parentTrajectoryId && selectedIds.has(trajectory.parentTrajectoryId))
    .map((trajectory) => ({ from: trajectory.parentTrajectoryId as string, to: trajectory.id }))
}

/**
 * Create an empty trajectory ledger value for tests and callers that need a seed object.
 *
 * @returns Empty versioned trajectory ledger.
 */
export function createTrajectoryLedger(): TrajectoryLedger {
  return createEmptyTrajectoryLedger()
}
