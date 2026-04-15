import { CompletionDetector } from "./completion-detector.js"
import { getSession, getSessionMessages, getSessionStatusMap, sendPromptAsync, type OpenCodeClient } from "./session-api.js"
import {
  buildTaskNotificationFromContinuity,
  notifyParentSession,
  type TaskNotification,
} from "./notification-handler.js"
import { persistPendingNotification } from "./pending-notifications.js"
import { captureSubsessionResult } from "./result-capture.js"
import { CompletionVerifier } from "./tasking/completion/completion-verifier.js"
import { countToolCallParts, countUsableAssistantContentParts } from "./tasking/completion/start-gate.js"
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

const DEAD_START_TIMEOUT_MS = 120_000

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

function getMessageRole(message: unknown): string | undefined {
  if (!message || typeof message !== "object") return undefined
  const record = message as { role?: unknown; info?: { role?: unknown } }
  if (typeof record.role === "string") return record.role
  if (record.info && typeof record.info.role === "string") return record.info.role
  return undefined
}

async function getCombinedEvidenceCount(client: OpenCodeClient, sessionID: string): Promise<number> {
  const messages = await getSessionMessages(client, sessionID)
  const assistantMessages = messages.filter((msg) => getMessageRole(msg) === "assistant")
  const assistantContentCount = assistantMessages.reduce<number>((count, message) => {
    return count + (countUsableAssistantContentParts(message) > 0 ? 1 : 0)
  }, 0)
  const toolCallCount = assistantMessages.reduce<number>((count, message) => count + countToolCallParts(message), 0)
  return assistantContentCount + toolCallCount
}

function getCompletionDetector(detector: unknown): CompletionDetector {
  return detector instanceof CompletionDetector ? detector : new CompletionDetector()
}

/**
 * Check if a session still exists by direct lookup.
 *
 * Runtime state must come from client.session.status(); session.get() is only
 * used here to distinguish a deleted session from a status-map visibility gap.
 */
async function checkSessionExists(
  sessionID: string,
  client: OpenCodeClient,
): Promise<boolean> {
  try {
    await getSession(client, sessionID)
    return true
  } catch {
    return false
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
  patchSessionContinuity: (sessionID: string, patch: Partial<SessionContinuityMetadata>) => SessionContinuityRecord | undefined
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
        const statusMap = await getSessionStatusMap(args.client)
        let sessionStatus = statusMap[args.sessionID]

        // If the status map cannot see the child, use session.get() only to
        // distinguish deletion from a temporary visibility gap. Do not derive
        // idle/busy/retry state from the session payload.
        if (!sessionStatus && await checkSessionExists(args.sessionID, args.client)) {
          sessionStatus = { type: "unknown" }
        }

        // Session not found by either method — it was deleted or never existed.
        if (!sessionStatus) {
          const error = "Session deleted during background execution"
          const advanced =
            args.patchLifecycle({
              sessionID: args.sessionID,
              status: "failed",
              phase: "failed",
            error,
            observation: {
              source: "observe:poll-deleted",
              observedAt: args.now(),
                detail: "background-completion-poll-deleted",
              },
            }) !== false
          if (advanced) {
            try {
              const captured = await captureSubsessionResult(args.client, args.sessionID)
              args.patchSessionContinuity(args.sessionID, { resultCapture: { ...captured, partial: true } })
            } catch {
              // Partial capture best-effort
            }
          }
          const continuity = args.getSessionContinuity(args.sessionID)
          if (continuity?.metadata.parentSessionID) {
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
        const toolActivityObserved = Boolean(continuity?.metadata.lastToolActivityAt)
        const alreadyRunning = continuity?.metadata.status === "running"
        const launchedAt = continuity?.metadata.lifecycle?.launchedAt ?? continuity?.metadata.createdAt ?? args.now()
        const deadStartWindowMs = Math.min(args.pollTimeoutMs, DEAD_START_TIMEOUT_MS)

        if (!startGatePassed && !toolActivityObserved && combinedEvidenceCount === 0) {
          const idleSinceLaunchMs = Math.max(0, args.now() - launchedAt)
          if (idleSinceLaunchMs >= deadStartWindowMs) {
            const error = "Background start timed out with no tool activity or assistant evidence"
            const advanced =
              args.patchLifecycle({
                sessionID: args.sessionID,
                status: "failed",
                phase: "failed",
                error,
                observation: {
                  source: "observe:dead-start-timeout",
                  observedAt: args.now(),
                  detail: "background-dead-start-timeout",
                },
              }) !== false
            if (advanced) {
              try {
                const captured = await captureSubsessionResult(args.client, args.sessionID)
                args.patchSessionContinuity(args.sessionID, { resultCapture: { ...captured, partial: true } })
              } catch {
                // Partial capture best-effort
              }
              const failedContinuity = args.getSessionContinuity(args.sessionID)
              if (failedContinuity?.metadata.parentSessionID) {
                void notifyParentWithFallback(
                  args.client,
                  failedContinuity.metadata.parentSessionID,
                  buildTaskNotificationFromContinuity(failedContinuity, "failed", error),
                )
              }
            }
            return
          }
        }

        if ((startGatePassed || toolActivityObserved) && !alreadyRunning) {
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
                status: "failed",
                phase: "failed",
                error,
                observation: {
                  source: "observe:poll-retry-exhausted",
                  observedAt: args.now(),
                  detail: "background-completion-retry-exhausted",
                },
              }) !== false
            if (advanced) {
              try {
                const captured = await captureSubsessionResult(args.client, args.sessionID)
                args.patchSessionContinuity(args.sessionID, { resultCapture: { ...captured, partial: true } })
              } catch {
                // Partial capture best-effort
              }
            }
            const continuity = args.getSessionContinuity(args.sessionID)
            if (continuity?.metadata.parentSessionID) {
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
          if (advanced) {
            try {
              const captured = await captureSubsessionResult(args.client, args.sessionID)
              args.patchSessionContinuity(args.sessionID, { resultCapture: captured })
              if (captured.artifactPaths.length > 0 || captured.gitCommits.length > 0) {
                const existingPacket = args.getSessionContinuity(args.sessionID)?.metadata.delegationPacket
                if (existingPacket) {
                  args.patchSessionContinuity(args.sessionID, {
                    delegationPacket: {
                      ...existingPacket,
                      artifacts: captured.artifactPaths,
                      commits: captured.gitCommits,
                    },
                  })
                }
              }
            } catch {
              // Capture failure must not block notification
            }
          }
          const completedContinuity = args.getSessionContinuity(args.sessionID)
          if (completedContinuity?.metadata.parentSessionID) {
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
              status: "failed",
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
            status: "failed",
            phase: "failed",
          error,
          observation: {
            source: "observe:poll-failed",
            observedAt: args.now(),
              detail: "background-completion-poll-sdk-error",
            },
          }) !== false
        if (advanced) {
          try {
            const captured = await captureSubsessionResult(args.client, args.sessionID)
            args.patchSessionContinuity(args.sessionID, { resultCapture: { ...captured, partial: true } })
          } catch {
            // Partial capture best-effort
          }
        }
        const continuity = args.getSessionContinuity(args.sessionID)
        if (continuity?.metadata.parentSessionID) {
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
        status: "failed",
        phase: "failed",
      error,
      observation: {
        source: "observe:poll-timeout",
        observedAt: args.now(),
          detail: "background-completion-poll-timeout",
        },
      }) !== false
    if (advanced) {
      try {
        const captured = await captureSubsessionResult(args.client, args.sessionID)
        args.patchSessionContinuity(args.sessionID, { resultCapture: { ...captured, partial: true } })
      } catch {
        // Partial capture best-effort
      }
    }
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
