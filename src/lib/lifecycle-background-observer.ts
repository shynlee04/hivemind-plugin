import { getSession, getSessionStatusMap, type OpenCodeClient } from "./session-api.js"
import { notifyParentSession, type TaskNotification } from "./notification-handler.js"
import type {
  SessionContinuityMetadata,
  SessionContinuityRecord,
  SessionLifecycleObservation,
  SessionLifecyclePhase,
  SessionLifecycleQueueState,
  SessionLifecycleState,
} from "./types.js"
import type { QueueSnapshot } from "./lifecycle-queue.js"

type PatchLifecycleArgs = {
  sessionID: string
  status: SessionContinuityMetadata["status"]
  phase: SessionLifecyclePhase
  observation?: SessionLifecycleObservation
  queue?: QueueSnapshot | SessionLifecycleQueueState
  cleanup?: SessionLifecycleState["cleanup"]
  launchedAt?: number
  completedAt?: number
  error?: string
}

/** Default poll interval in milliseconds — balances responsiveness with API load. */
const DEFAULT_POLL_INTERVAL_MS = 15000

/**
 * Check if a session exists by direct lookup.
 *
 * Uses client.session.get(sessionID) instead of the status map because
 * the status map may not include all sessions (e.g., child sessions in
 * different scopes, or sessions not yet registered in the map).
 *
 * Returns the session's status type if found, undefined if deleted.
 */
async function checkSessionExists(
  sessionID: string,
  client: OpenCodeClient,
): Promise<{ type: string } | undefined> {
  try {
    const session = await getSession(client, sessionID)
    // Session exists — extract status from the response
    const raw = session as Record<string, unknown>
    const status = raw.status ?? raw.info
    if (status && typeof status === "object") {
      const statusObj = status as Record<string, unknown>
      return { type: (statusObj.type as string) ?? "busy" }
    }
    // If no status field, assume it's still alive (busy)
    return { type: "busy" }
  } catch {
    // Session.get() threw — session doesn't exist
    return undefined
  }
}

/**
 * Poll-based background completion observer.
 *
 * Replaces the event-based CompletionDetector.watch() which failed because
 * child session events (session.idle, session.error, session.deleted) were
 * not reliably propagated to the parent session's completion detector.
 *
 * Instead, this polls the child session's status directly via client.session.status()
 * at regular intervals until a terminal state is detected or timeout fires.
 */
export async function observeBackgroundCompletion(args: {
  sessionID: string
  client: OpenCodeClient
  /** @deprecated No longer used — kept for backward compat during migration. */
  completionDetector?: unknown
  pollTimeoutMs: number
  now: () => number
  getSessionContinuity: (sessionID: string) => SessionContinuityRecord | undefined
  patchLifecycle: (args: PatchLifecycleArgs) => void
  releaseQueue: (reason: string) => void
  /** @internal Injected sleep function for testing. Defaults to real setTimeout. */
  sleepFn?: (ms: number) => Promise<void>
}): Promise<void> {
  const pollIntervalMs = DEFAULT_POLL_INTERVAL_MS
  const doSleep = args.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
  const deadline = args.now() + args.pollTimeoutMs

  try {
    while (args.now() < deadline) {
      try {
        // Primary check: direct session lookup via client.session.get()
        // This is more reliable than the status map because:
        // 1. Status map may not include all sessions (scope/directory filtering)
        // 2. Child sessions may not appear in parent's status map view
        // 3. Direct lookup confirms the session actually exists
        let sessionStatus = await checkSessionExists(args.sessionID, args.client)

        // Fallback: if direct lookup returned undefined, try status map
        // to confirm the session is truly deleted vs. just not findable
        if (!sessionStatus) {
          const statusMap = await getSessionStatusMap(args.client)
          sessionStatus = statusMap[args.sessionID]
        }

        // Session not found by either method — it was deleted or never existed
        if (!sessionStatus) {
          const error = "Session deleted during background execution"
          args.patchLifecycle({
            sessionID: args.sessionID,
            status: "error",
            phase: "failed",
            error,
            observation: {
              source: "observe:poll-deleted",
              observedAt: args.now(),
              detail: "background-completion-poll-deleted",
            },
          })
          const continuity = args.getSessionContinuity(args.sessionID)
          if (continuity?.metadata.parentSessionID) {
            void notifyParentSession(
              args.client,
              continuity.metadata.parentSessionID,
              buildNotificationFromContinuity(continuity, "failed", error),
            )
          }
          return
        }

        const statusType = sessionStatus.type

        // "idle" means the session has completed its work
        if (statusType === "idle") {
          args.patchLifecycle({
            sessionID: args.sessionID,
            status: "completed",
            phase: "completed",
            completedAt: args.now(),
            observation: {
              source: "observe:poll-idle",
              observedAt: args.now(),
              detail: "background-completion-poll-idle",
            },
          })
          const continuity = args.getSessionContinuity(args.sessionID)
          if (continuity?.metadata.parentSessionID) {
            void notifyParentSession(
              args.client,
              continuity.metadata.parentSessionID,
              buildNotificationFromContinuity(continuity, "completed"),
            )
          }
          return
        }

        // "retry" means the session encountered an error and is retrying
        // Treat as error if we see retry status
        if (statusType === "retry") {
          const error = "Child session entered retry state"
          args.patchLifecycle({
            sessionID: args.sessionID,
            status: "error",
            phase: "failed",
            error,
            observation: {
              source: "observe:poll-retry",
              observedAt: args.now(),
              detail: "background-completion-poll-retry",
            },
          })
          const continuity = args.getSessionContinuity(args.sessionID)
          if (continuity?.metadata.parentSessionID) {
            void notifyParentSession(
              args.client,
              continuity.metadata.parentSessionID,
              buildNotificationFromContinuity(continuity, "failed", error),
            )
          }
          return
        }

        // "busy" means still working — wait before next poll
        await doSleep(pollIntervalMs)
      } catch {
        // SDK call failed — treat as terminal
        const error = "Failed to poll child session status"
        args.patchLifecycle({
          sessionID: args.sessionID,
          status: "error",
          phase: "failed",
          error,
          observation: {
            source: "observe:poll-failed",
            observedAt: args.now(),
            detail: "background-completion-poll-sdk-error",
          },
        })
        const continuity = args.getSessionContinuity(args.sessionID)
        if (continuity?.metadata.parentSessionID) {
          void notifyParentSession(
            args.client,
            continuity.metadata.parentSessionID,
            buildNotificationFromContinuity(continuity, "failed", error),
          )
        }
        return
      }
    }

    // Timeout reached
    const error = "Background polling timed out"
    args.patchLifecycle({
      sessionID: args.sessionID,
      status: "error",
      phase: "failed",
      error,
      observation: {
        source: "observe:poll-timeout",
        observedAt: args.now(),
        detail: "background-completion-poll-timeout",
      },
    })
    const continuity = args.getSessionContinuity(args.sessionID)
    if (continuity?.metadata.parentSessionID) {
      void notifyParentSession(
        args.client,
        continuity.metadata.parentSessionID,
        buildNotificationFromContinuity(continuity, "failed", error),
      )
    }
  } finally {
    args.releaseQueue("background-complete")
  }
}

/** Build a TaskNotification from a continuity record. */
function buildNotificationFromContinuity(
  continuity: SessionContinuityRecord,
  status: TaskNotification["status"],
  error?: string,
): TaskNotification {
  return {
    sessionID: continuity.sessionID,
    description: continuity.metadata.description ?? "Delegated task",
    agent: continuity.metadata.delegation?.agent ?? "unknown",
    status,
    error,
  }
}
