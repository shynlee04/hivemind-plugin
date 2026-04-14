import { patchSessionContinuity, patchSessionDelegationPacket, getSessionContinuity } from "./continuity.js"
import { buildLifecycleState, isValidLifecycleTransition, mapPhaseToDelegationPacketStatus } from "./lifecycle-state.js"
import type {
  SessionContinuityMetadata,
  SessionLifecycleObservation,
  SessionLifecyclePhase,
  SessionLifecycleQueueState,
  SessionLifecycleState,
} from "./types.js"

export type PatchLifecycleArgs = {
  sessionID: string
  status: SessionContinuityMetadata["status"]
  phase: SessionLifecyclePhase
  observation?: SessionLifecycleObservation
  queue?: QueueSnapshotLike | SessionLifecycleQueueState
  cleanup?: SessionLifecycleState["cleanup"]
  launchedAt?: number
  completedAt?: number
  error?: string
}

export type QueueSnapshotLike = {
  active: number
  pending: number
  limit: number
}

export function patchLifecycle(args: PatchLifecycleArgs): boolean {
  const record = getSessionContinuity(args.sessionID)
  if (!record) {
    return false
  }

  const previousPhase = record.metadata.lifecycle?.phase
  if (
    previousPhase !== undefined &&
    previousPhase !== args.phase &&
    !isValidLifecycleTransition(previousPhase, args.phase)
  ) {
    console.warn(
      `[Harness] Invalid lifecycle transition rejected: ${previousPhase} → ${args.phase} for session ${args.sessionID}`,
    )
    return false
  }

  const timestamp = Date.now()
  const lifecycle = buildLifecycleState({
    phase: args.phase,
    runMode: record.metadata.runInBackground ? "async" : "sync",
    queueKey: record.metadata.lifecycle?.queueKey ?? record.metadata.delegation.queueKey,
    previous: record.metadata.lifecycle,
    queue: args.queue ? { ...args.queue } : record.metadata.lifecycle?.queue,
    observation: args.observation,
    cleanup: args.cleanup,
    launchedAt: args.launchedAt,
    completedAt: args.completedAt,
  })

  patchSessionContinuity(args.sessionID, {
    status: args.status,
    lastObservedAt: timestamp,
    lastError: args.error === undefined ? record.metadata.lastError : args.error,
    lifecycle,
  })
  syncDelegationPacketStatus(args.sessionID, args.phase)
  return true
}

export function syncDelegationPacketStatus(sessionID: string, phase: SessionLifecyclePhase): void {
  const record = getSessionContinuity(sessionID)
  const currentStatus = record?.metadata.delegationPacket?.status
  const nextStatus = mapPhaseToDelegationPacketStatus(phase)

  if (!record?.metadata.delegationPacket || currentStatus === nextStatus) {
    return
  }

  patchSessionDelegationPacket(sessionID, { status: nextStatus })
}
