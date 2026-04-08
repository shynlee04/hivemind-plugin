import type { DelegationConcurrencyQueue } from "./concurrency.js"
import { getQueuePriority } from "./lifecycle-state.js"
import type {
  SessionContinuityMetadata,
  SessionContinuityRecord,
  SessionLifecycleObservation,
  SessionLifecyclePhase,
  SessionLifecycleQueueState,
  SessionLifecycleState,
} from "./types.js"

export type QueueSnapshot = {
  active: number
  pending: number
  limit: number
}

export function enqueueWaitingLifecycle(args: {
  queue: DelegationConcurrencyQueue
  sessionID: string
  queueKey: string
  runMode: "sync" | "async"
  now: () => number
  patchLifecycle: (args: {
    sessionID: string
    status: SessionContinuityMetadata["status"]
    phase: SessionLifecyclePhase
    observation?: SessionLifecycleObservation
    queue?: QueueSnapshot | SessionLifecycleQueueState
    cleanup?: SessionLifecycleState["cleanup"]
    launchedAt?: number
    completedAt?: number
    error?: string
  }) => void
}): void {
  const waitingQueueState = args.queue.snapshot(args.queueKey)
  if (waitingQueueState.active < waitingQueueState.limit) {
    return
  }

  args.queue.enqueue({
    id: args.sessionID,
    key: args.queueKey,
    createdAt: args.now(),
    priority: getQueuePriority(args.runMode),
  })

  args.patchLifecycle({
    sessionID: args.sessionID,
    status: "running",
    phase: "queued",
    observation: {
      source: "queue",
      observedAt: args.now(),
      detail: "waiting-for-lane",
    },
    queue: {
      ...waitingQueueState,
      pending: waitingQueueState.pending + 1,
    },
  })
}

export async function acquireLifecycleQueue(args: {
  queue: DelegationConcurrencyQueue
  sessionID: string
  queueKey: string
  runMode: "sync" | "async"
  now: () => number
  getSessionContinuity: (sessionID: string) => SessionContinuityRecord | undefined
  patchLifecycle: (args: {
    sessionID: string
    status: SessionContinuityMetadata["status"]
    phase: SessionLifecyclePhase
    observation?: SessionLifecycleObservation
    queue?: QueueSnapshot | SessionLifecycleQueueState
    cleanup?: SessionLifecycleState["cleanup"]
    launchedAt?: number
    completedAt?: number
    error?: string
  }) => void
  /** Resolved concurrency limit for this queue key (from runtime policy). */
  concurrencyLimit?: number
  /** Resolved acquire timeout for this queue key (from runtime policy). */
  concurrencyTimeoutMs?: number
}): Promise<(reason: string) => void> {
  const release = await args.queue.acquire(
    args.queueKey,
    args.concurrencyLimit,
    args.concurrencyTimeoutMs,
  )
  args.queue.dequeue(args.queueKey, args.sessionID)
  const acquiredAt = args.now()

  args.patchLifecycle({
    sessionID: args.sessionID,
    status: "running",
    phase: "dispatching",
    queue: {
      ...args.queue.snapshot(args.queueKey),
      acquiredAt,
    },
    observation: {
      source: "queue",
      observedAt: acquiredAt,
      detail: `lane-acquired:${args.runMode}`,
    },
  })

  return (reason: string) => {
    const timestamp = args.now()
    const existing = args.getSessionContinuity(args.sessionID)
    const previousQueue = existing?.metadata.lifecycle?.queue

    release()

    const queueAfterRelease = args.queue.snapshot(args.queueKey)
    args.patchLifecycle({
      sessionID: args.sessionID,
      status: existing?.metadata.status ?? "running",
      phase: existing?.metadata.lifecycle?.phase ?? "running",
      queue: {
        ...queueAfterRelease,
        acquiredAt: previousQueue?.acquiredAt,
        releasedAt: timestamp,
      },
      cleanup: {
        scheduledAt: existing?.metadata.lifecycle?.cleanup?.scheduledAt ?? timestamp,
        completedAt: timestamp,
        reason,
      },
      observation: {
        source: "queue",
        observedAt: timestamp,
        detail: `lane-released:${reason}`,
      },
    })
  }
}
