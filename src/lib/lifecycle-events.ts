import { deleteSessionContinuity, getSessionContinuity, patchSessionContinuity } from "./continuity.js"
import { inferContinuityStatusFromEvent } from "./runtime.js"
import { getEventParentID } from "./session-api.js"
import { forgetSession, hydrateDelegationState, inheritRootFromParent } from "./state.js"
import type { CompletionDetector } from "./completion-detector.js"
import { buildLifecycleState, mapStatusToLifecyclePhase } from "./lifecycle-state.js"
import { syncDelegationPacketStatus } from "./lifecycle-patching.js"

export function noteObservedActivity(
  sessionID: string,
  source: string,
): void {
  const record = getSessionContinuity(sessionID)
  if (!record) {
    return
  }

  const timestamp = Date.now()
  const lifecycle = buildLifecycleState({
    phase: record.metadata.status === "error" ? "failed" : "running",
    runMode: record.metadata.runInBackground ? "async" : "sync",
    queueKey: record.metadata.lifecycle?.queueKey ?? record.metadata.delegation.queueKey,
    previous: record.metadata.lifecycle,
    observation: {
      source,
      observedAt: timestamp,
      detail: "tool-activity",
    },
  })

  patchSessionContinuity(sessionID, {
    status: record.metadata.status === "error" ? "error" : "running",
    lastObservedAt: timestamp,
    lastError: record.metadata.status === "error" ? record.metadata.lastError : undefined,
    lifecycle,
  })
  syncDelegationPacketStatus(sessionID, lifecycle.phase)
}

export function handleEvent(args: {
  event: unknown
  eventType: string
  sessionID: string
  completionDetector: CompletionDetector
}): void {
  const { event, eventType, sessionID } = args
  args.completionDetector.feed(eventType, sessionID)

  if (eventType === "session.created" || eventType === "session.updated") {
    const parentID = getEventParentID(event)
    if (parentID) {
      inheritRootFromParent(sessionID, parentID)
    }
  }

  if (eventType === "session.deleted") {
    forgetSession(sessionID)
    deleteSessionContinuity(sessionID)
    return
  }

  const continuity = getSessionContinuity(sessionID)
  if (!continuity) {
    return
  }

  if (eventType === "session.created" || eventType === "session.updated") {
    hydrateDelegationState(sessionID, continuity.metadata.delegation)
  }

  const nextStatus = inferContinuityStatusFromEvent({
    event,
    eventType,
    currentStatus: continuity.metadata.status,
  })

  const timestamp = Date.now()
  const lifecycle = buildLifecycleState({
    phase: mapStatusToLifecyclePhase(nextStatus ?? continuity.metadata.status, continuity.metadata.lifecycle?.phase),
    runMode: continuity.metadata.runInBackground ? "async" : "sync",
    queueKey: continuity.metadata.lifecycle?.queueKey ?? continuity.metadata.delegation.queueKey,
    previous: continuity.metadata.lifecycle,
    observation: {
      source: `event:${eventType}`,
      observedAt: timestamp,
      detail: nextStatus ? `status:${nextStatus}` : undefined,
    },
    completedAt: nextStatus === "completed" ? timestamp : continuity.metadata.lifecycle?.completedAt,
  })

  patchSessionContinuity(sessionID, {
    status: nextStatus ?? continuity.metadata.status,
    lastObservedAt: timestamp,
    lastError: nextStatus === "error" ? continuity.metadata.lastError : undefined,
    lifecycle,
  })
  syncDelegationPacketStatus(sessionID, lifecycle.phase)
}
