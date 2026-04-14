import { CompletionDetector } from "./completion-detector.js"
import { getSession, getSessionMessages, getSessionStatusMap, sendPromptAsync, type OpenCodeClient } from "./session-api.js"
import {
  buildTaskNotificationFromContinuity,
  notifyParentSession,
  type TaskNotification,
} from "./notification-handler.js"
import { persistPendingNotification } from "./pending-notifications.js"
import { CompletionVerifier } from "./tasking/completion/completion-verifier.js"
import {
  checkIdleTimeout,
  createFailureState,
  incrementRetry,
  markActivity,
  markIdleStart,
  shouldRetry,
} from "./tasking/completion/failure-handler.js"
import { PollStrategy } from "./tasking/completion/poll-strategy.js"
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

function countToolCallParts(message: unknown): number {
  if (!message || typeof message !== "object") {
    return 0
  }

  const parts = (message as { parts?: unknown }).parts
  if (!Array.isArray(parts)) {
    return 0
  }

  return parts.reduce((count, part) => {
    if (!part || typeof part !== "object") {
      return count
    }

    const type = (part as { type?: unknown }).type
    return type === "tool-call" || type === "tool_call" || type === "tool" ? count + 1 : count
  }, 0)
}

async function getCombinedEvidenceCount(client: OpenCodeClient, sessionID: string): Promise<number> {
  const messages = await getSessionMessages(client, sessionID)
  const assistantMessages = messages.filter((msg) => {
    if (!msg || typeof msg !== "object") return false
    return (msg as { role?: string }).role === "assistant"
  })
  const toolCallCount = assistantMessages.reduce<number>(
    (count, message) => count + countToolCallParts(message),
    0,
  )
  return assistantMessages.length + toolCallCount
}

function getCompletionDetector(detector: unknown): CompletionDetector {
  return detector instanceof CompletionDetector ? detector : new CompletionDetector()
}

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
      return { type: (statusObj.type as string) ?? "unknown" }
    }
    return { type: "unknown" }
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
  completionDetector?: CompletionDetector | unknown
  pollTimeoutMs: number
  now: () => number
  getSessionContinuity: (sessionID: string) => SessionContinuityRecord | undefined
  patchLifecycle: (args: PatchLifecycleArgs) => boolean | void
  releaseQueue: (reason: string) => void
  /** @internal Injected sleep function for testing. Defaults to real setTimeout. */
  sleepFn?: (ms: number) => Promise<void>
}): Promise<void> {
  const doSleep = args.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)))
  const deadline = args.now() + args.pollTimeoutMs
  const completionDetector = getCompletionDetector(args.completionDetector)
  const completionVerifier = new CompletionVerifier()
  const pollStrategy = new PollStrategy()
  let failureState = createFailureState(args.sessionID)
  let lastEvidenceCount = -1

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
          const advanced =
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
            }) !== false
          const continuity = args.getSessionContinuity(args.sessionID)
          if (advanced && continuity?.metadata.parentSessionID) {
            void notifyParentWithFallback(
              args.client,
              continuity.metadata.parentSessionID,
              buildTaskNotificationFromContinuity(continuity, "failed", error),
            )
          }
          return
        }

        const statusType = sessionStatus.type
        const combinedEvidenceCount = await getCombinedEvidenceCount(args.client, args.sessionID)
        if (combinedEvidenceCount !== lastEvidenceCount) {
          lastEvidenceCount = combinedEvidenceCount
          failureState = markActivity(failureState)
          pollStrategy.reset()
          completionDetector.feedMessageCount(args.sessionID, combinedEvidenceCount)
        }

        const completionCheck = await completionVerifier.check(
          args.client,
          args.sessionID,
          statusType === "idle",
        )

        const continuity = args.getSessionContinuity(args.sessionID)
        const startGatePassed = completionCheck.evidence.passed
        const alreadyRunning = continuity?.metadata.status === "running"

        if (startGatePassed && !alreadyRunning) {
          const promotedAt = args.now()
          const advanced =
            args.patchLifecycle({
              sessionID: args.sessionID,
              status: "running",
              phase: "running",
              observation: {
                source: "observe:start-gate",
                observedAt: promotedAt,
                detail: "background-start-gate-passed",
              },
            }) !== false

          const promotedContinuity = args.getSessionContinuity(args.sessionID)
          if (advanced && promotedContinuity?.metadata.parentSessionID) {
            void notifyParentWithFallback(
              args.client,
              promotedContinuity.metadata.parentSessionID,
              buildTaskNotificationFromContinuity(promotedContinuity, "started"),
            )
          }
        }

        if (completionCheck.evidence.passed) {
          failureState =
            failureState.idleSinceMs === null ? markIdleStart(failureState, args.now()) : failureState

          const timeout = checkIdleTimeout(failureState, args.now())
          if (timeout.timedOut) {
            if (shouldRetry(failureState)) {
              failureState = markActivity(incrementRetry(failureState))
              completionVerifier.reset()
              pollStrategy.reset()
              await sendPromptAsync(args.client, args.sessionID, {
                parts: [
                  {
                    type: "text",
                    text: "Resume the current delegated task from where you left off. Continue and finish the task.",
                  },
                ],
              })
              await doSleep(pollStrategy.nextInterval())
              continue
            }

            const error = "Child session retry budget exhausted after resume-first attempts"
            const advanced =
              args.patchLifecycle({
                sessionID: args.sessionID,
                status: "error",
                phase: "failed",
                error,
                observation: {
                  source: "observe:poll-retry-exhausted",
                  observedAt: args.now(),
                  detail: "background-completion-retry-exhausted",
                },
              }) !== false
            const continuity = args.getSessionContinuity(args.sessionID)
            if (advanced && continuity?.metadata.parentSessionID) {
              void notifyParentWithFallback(
                args.client,
                continuity.metadata.parentSessionID,
                buildTaskNotificationFromContinuity(continuity, "failed", error),
              )
            }
            return
          }
        }

        if (statusType === "idle" && completionCheck.status === "completed") {
          const advanced =
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
            }) !== false
          const completedContinuity = args.getSessionContinuity(args.sessionID)
          if (advanced && completedContinuity?.metadata.parentSessionID) {
            void notifyParentWithFallback(
              args.client,
              completedContinuity.metadata.parentSessionID,
              buildTaskNotificationFromContinuity(completedContinuity, "completed"),
            )
          }
          return
        }

        // "retry" means the session encountered an error and is retrying
        // Treat as error if we see retry status
        if (statusType === "retry") {
          const error = "Child session entered retry state"
          const advanced =
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
            }) !== false
          const continuity = args.getSessionContinuity(args.sessionID)
          if (advanced && continuity?.metadata.parentSessionID) {
            void notifyParentWithFallback(
              args.client,
              continuity.metadata.parentSessionID,
              buildTaskNotificationFromContinuity(continuity, "failed", error),
            )
          }
          return
        }

        await doSleep(pollStrategy.nextInterval())
      } catch {
        // SDK call failed — treat as terminal
        const error = "Failed to poll child session status"
        const advanced =
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
          }) !== false
        const continuity = args.getSessionContinuity(args.sessionID)
        if (advanced && continuity?.metadata.parentSessionID) {
          void notifyParentWithFallback(
            args.client,
            continuity.metadata.parentSessionID,
            buildTaskNotificationFromContinuity(continuity, "failed", error),
          )
        }
        return
      }
    }

    // Timeout reached
    const error = "Background polling timed out"
    const advanced =
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
      }) !== false
    const continuity = args.getSessionContinuity(args.sessionID)
    if (advanced && continuity?.metadata.parentSessionID) {
      void notifyParentWithFallback(
        args.client,
        continuity.metadata.parentSessionID,
        buildTaskNotificationFromContinuity(continuity, "failed", error),
      )
    }
  } finally {
    args.releaseQueue("background-complete")
  }
}

/** Send notification to parent, persisting for offline delivery if parent is unavailable. */
async function notifyParentWithFallback(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
): Promise<void> {
  // Try real-time notification first
  const toastFn = (msg: string) => {
    try {
      if (client.tui?.showToast) {
        const variant = task.status === "completed" ? "success" : task.status === "failed" ? "error" : "info"
        void client.tui.showToast({ body: { message: msg, variant } })
      }
    } catch {
      // Best-effort
    }
  }

  const delivered = await notifyParentSession(client, parentSessionID, task, toastFn)
  if (!delivered) {
    persistPendingNotification(parentSessionID, task)
  }
}
