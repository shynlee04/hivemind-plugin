/**
 * lifecycle-process-runner.ts
 *
 * Runs delegated session work using the OpenCode session API (sendPrompt/sendPromptAsync).
 * This is the "builtin" execution path — it invokes the LLM directly via the platform,
 * without requiring tmux or external child processes.
 *
 * Previously (broken): spawned a Node.js echo script that printed the prompt and claimed
 * completion in 136ms with zero LLM output — "false theater."
 *
 * Now (fixed): calls sendPrompt() for sync mode, sendPromptAsync() + polling for async mode.
 * Result capture reads session messages from disk (getSessionMessages) and persists to continuity.
 */
import type { CompletionDetector } from "./completion-detector.js"
import { observeBackgroundCompletion } from "./lifecycle-background-observer.js"
import { extractTextFromResponse } from "./lifecycle-state.js"
import {
  type CommonRunnerArgs,
  type PatchLifecycleArgs,
} from "./lifecycle-runner-shared.js"
import { buildTaskNotificationFromContinuity, notifyParentSession } from "./notification-handler.js"
import { persistPendingNotification } from "./pending-notifications.js"
import { captureSubsessionResult } from "./result-capture.js"
import { sendPrompt, sendPromptAsync, type OpenCodeClient } from "./session-api.js"
import type { SessionContinuityMetadata, SessionContinuityRecord, SessionLifecycleState } from "./types.js"

type RunLifecycleProcessArgs = CommonRunnerArgs

// ---------------------------------------------------------------------------
// Builtin-process runner (session-based, NOT child-process)
// ---------------------------------------------------------------------------

export async function runLifecycleProcessTask(args: RunLifecycleProcessArgs): Promise<string> {
  // Build the prompt body for the LLM session
  const body = {
    agent: args.agent,
    parts: [{ type: "text", text: args.promptText }],
    ...(args.model ? { model: args.model } : {}),
  }

  if (args.runInBackground) {
    // Async mode: dispatch via sendPromptAsync, then poll for completion.
    // The observer verifies actual execution by checking getSessionMessages()
    // for new assistant messages and tool calls — no false theater.
    sendPromptAsync(args.client, args.sessionID, body)
      .then(() => {
        // Dispatch accepted — the observer will verify actual execution.
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        args.patchLifecycle({
          sessionID: args.sessionID,
          status: "error",
          phase: "failed",
          error: message,
          observation: {
            source: "dispatch",
            observedAt: args.now(),
            detail: "builtin-process-dispatch-failed",
          },
        })

        const continuity = args.getSessionContinuity(args.sessionID)
        if (continuity?.metadata.parentSessionID) {
          const failedNotification = buildTaskNotificationFromContinuity(continuity, "failed", message)
          void notifyParentSession(
            args.client,
            continuity.metadata.parentSessionID,
            failedNotification,
          ).then((delivered) => {
            if (!delivered) {
              persistPendingNotification(continuity.metadata.parentSessionID, failedNotification)
            }
          })
        }
      })

    void observeBackgroundCompletion({
      sessionID: args.sessionID,
      client: args.client,
      completionDetector: undefined,
      pollTimeoutMs: args.pollTimeoutMs,
      now: args.now,
      getSessionContinuity: args.getSessionContinuity,
      patchSessionContinuity: args.patchSessionContinuity,
      patchLifecycle: args.patchLifecycle,
      releaseQueue: args.releaseQueue,
    })

    return JSON.stringify(
      {
        ok: true,
        mode: "async",
        session_id: args.sessionID,
        parent_session_id: args.parentSessionID,
        root_session_id: args.rootID,
        agent: args.agent,
        category: args.category,
        model: args.model,
        depth: args.childDepth,
        description: args.description,
        lifecycle: args.getLifecycleSnapshot(args.sessionID),
        output_link: `session://${args.sessionID}`,
        instruction: "Task dispatched. Continue with other work — you'll be notified when complete.",
      },
      null,
      2,
    )
  }

  // Sync mode: await LLM response directly
  try {
    const response = await sendPrompt(args.client, args.sessionID, body)
    const assistantText = extractTextFromResponse(response)
    const completedAt = args.now()

    args.patchLifecycle({
      sessionID: args.sessionID,
      status: "completed",
      phase: "completed",
      completedAt,
      observation: {
        source: "observe:sync",
        observedAt: completedAt,
        detail: "builtin-process-assistant-output-ready",
      },
    })

    // Capture result to continuity
    try {
      const captured = await captureSubsessionResult(args.client, args.sessionID)
      args.patchSessionContinuity(args.sessionID, { resultCapture: captured })
    } catch {
      // Best-effort capture — lifecycle already complete
    }

    return JSON.stringify(
      {
        ok: true,
        mode: "sync",
        session_id: args.sessionID,
        parent_session_id: args.parentSessionID,
        root_session_id: args.rootID,
        agent: args.agent,
        category: args.category,
        model: args.model,
        output: assistantText,
      },
      null,
      2,
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    args.patchLifecycle({
      sessionID: args.sessionID,
      status: "error",
      phase: "failed",
      error: message,
      observation: {
        source: "observe:sync",
        observedAt: args.now(),
        detail: "builtin-process-assistant-output-failed",
      },
    })
    throw error
  } finally {
    args.releaseQueue("builtin-process-complete")
  }
}

// ---------------------------------------------------------------------------
// Subsession runner (kept for tmux-pane path compatibility)
// ---------------------------------------------------------------------------

type RunLifecycleSubsessionArgs = {
  sessionID: string
  parentSessionID: string
  rootID: string
  childDepth: number
  agent: string
  category?: string
  model?: string
  description: string
  route: unknown
  body: unknown
  runInBackground: boolean
  client: OpenCodeClient
  completionDetector: CompletionDetector
  pollTimeoutMs: number
  getSessionContinuity: (sessionID: string) => SessionContinuityRecord | undefined
  patchSessionContinuity: (sessionID: string, patch: Partial<SessionContinuityMetadata>) => SessionContinuityRecord | undefined
  patchLifecycle: (args: PatchLifecycleArgs) => boolean | void
  getLifecycleSnapshot: (sessionID: string) => SessionLifecycleState | undefined
  releaseQueue: (reason: string) => void
  queueSnapshot: { active: number; pending: number; limit: number }
  budgetUsed: number
  launchedAt: number
  now: () => number
}

function buildSyncSubsessionEnvelope(args: {
  sessionID: string
  parentSessionID: string
  rootID: string
  agent: string
  category?: string
  model?: string
  output: string
}): string {
  return JSON.stringify(
    {
      ok: true,
      mode: "sync",
      session_id: args.sessionID,
      parent_session_id: args.parentSessionID,
      root_session_id: args.rootID,
      agent: args.agent,
      category: args.category,
      model: args.model,
      output: Buffer.from(args.output, "utf8").toString("base64"),
    },
    null,
    2,
  )
}

export async function runLifecycleSubsessionTask(args: RunLifecycleSubsessionArgs): Promise<string> {
  if (args.runInBackground) {
    sendPromptAsync(args.client, args.sessionID, args.body)
      .then(() => {
        // Dispatch accepted — observer verifies execution.
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        args.patchLifecycle({
          sessionID: args.sessionID,
          status: "error",
          phase: "failed",
          error: message,
          observation: {
            source: "dispatch",
            observedAt: args.now(),
            detail: "prompt-dispatch-failed",
          },
        })

        const continuity = args.getSessionContinuity(args.sessionID)
        if (continuity?.metadata.parentSessionID) {
          const failedNotification = buildTaskNotificationFromContinuity(continuity, "failed", message)
          void notifyParentSession(
            args.client,
            continuity.metadata.parentSessionID,
            failedNotification,
          ).then((delivered) => {
            if (!delivered) {
              persistPendingNotification(continuity.metadata.parentSessionID, failedNotification)
            }
          })
        }
      })

    void observeBackgroundCompletion({
      sessionID: args.sessionID,
      client: args.client,
      completionDetector: args.completionDetector,
      pollTimeoutMs: args.pollTimeoutMs,
      now: args.now,
      getSessionContinuity: args.getSessionContinuity,
      patchSessionContinuity: args.patchSessionContinuity,
      patchLifecycle: args.patchLifecycle,
      releaseQueue: args.releaseQueue,
    })

    return JSON.stringify(
      {
        ok: true,
        mode: "async",
        session_id: args.sessionID,
        parent_session_id: args.parentSessionID,
        root_session_id: args.rootID,
        agent: args.agent,
        category: args.category,
        model: args.model,
        depth: args.childDepth,
        budget_used: args.budgetUsed,
        concurrency_key: args.getLifecycleSnapshot(args.sessionID)?.queueKey,
        concurrency_active: args.queueSnapshot.active,
        concurrency_pending: args.queueSnapshot.pending,
        concurrency_limit: args.queueSnapshot.limit,
        route: args.route,
        description: args.description,
        lifecycle: args.getLifecycleSnapshot(args.sessionID),
        launched_at: args.launchedAt,
        output_link: `session://${args.sessionID}`,
        instruction: "Task dispatched. Continue with other work — you'll be notified when complete.",
      },
      null,
      2,
    )
  }

  try {
    const response = await sendPrompt(args.client, args.sessionID, args.body)
    const assistantText = extractTextFromResponse(response)
    const completedAt = args.now()

    args.patchLifecycle({
      sessionID: args.sessionID,
      status: "completed",
      phase: "completed",
      completedAt,
      observation: {
        source: "observe:sync",
        observedAt: completedAt,
        detail: "assistant-output-ready",
      },
    })

    return buildSyncSubsessionEnvelope({
      sessionID: args.sessionID,
      parentSessionID: args.parentSessionID,
      rootID: args.rootID,
      agent: args.agent,
      category: args.category,
      model: args.model,
      output: assistantText,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    args.patchLifecycle({
      sessionID: args.sessionID,
      status: "error",
      phase: "failed",
      error: message,
      observation: {
        source: "observe:sync",
        observedAt: args.now(),
        detail: "assistant-output-failed",
      },
    })
    throw error
  } finally {
    args.releaseQueue("sync-complete")
  }
}
