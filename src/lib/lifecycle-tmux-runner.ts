/**
 * Tmux visible-worker runner for delegated sessions.
 *
 * Executes child-session work inside a tmux pane so the user can observe
 * progress. Completion is signaled via process/pane exit — a binary terminal
 * signal, not message-count stability polling.
 *
 * Threat mitigations:
 *  - T-09-09: explicit tmux-pane branch or hard failure — no silent fallback
 *  - T-09-10: reuses BackgroundManager allowlist/cwd constraints
 */

import type { BackgroundManager, BackgroundResult, BackgroundTask } from "./background-manager.js"
import type { ExecutionModeResult } from "./execution-mode.js"
import { buildTaskNotificationFromContinuity, notifyParentSession } from "./notification-handler.js"
import { persistPendingNotification } from "./pending-notifications.js"
import type { OpenCodeClient } from "./session-api.js"
import type { SessionContinuityMetadata, SessionContinuityRecord, SessionLifecycleObservation, SessionLifecyclePhase, SessionLifecycleState } from "./types.js"

type PatchLifecycleArgs = {
  sessionID: string
  status: SessionContinuityMetadata["status"]
  phase: SessionLifecyclePhase
  observation?: SessionLifecycleObservation
  completedAt?: number
  error?: string
}

type RunLifecycleTmuxArgs = {
  sessionID: string
  parentSessionID: string
  rootID: string
  childDepth: number
  agent: string
  category?: string
  model?: string
  description: string
  promptText: string
  runInBackground: boolean
  execution: ExecutionModeResult
  client: OpenCodeClient
  backgroundManager: BackgroundManager
  getSessionContinuity: (sessionID: string) => SessionContinuityRecord | undefined
  patchLifecycle: (args: PatchLifecycleArgs) => boolean | void
  getLifecycleSnapshot: (sessionID: string) => SessionLifecycleState | undefined
  releaseQueue: (reason: string) => void
  now: () => number
}

/**
 * Build the tmux command that opens a visible pane running OpenCode.
 *
 * Uses `tmux split-window` to create a new pane and runs `opencode attach`
 * in that pane so the delegated session is visible to the user.
 */
function buildTmuxCommand(sessionID: string): { command: string; args: string[] } {
  return {
    command: "tmux",
    args: [
      "split-window",
      "-P",
      "-F",
      "#{pane_id}",
      "opencode",
      "attach",
      "-s",
      sessionID,
    ],
  }
}

function finalizeTmuxResult(args: {
  result: BackgroundResult
  sessionID: string
  patchLifecycle: (args: PatchLifecycleArgs) => boolean | void
  now: () => number
}): { error?: string; status: "completed" | "failed"; advanced: boolean } {
  const { result, sessionID, patchLifecycle, now } = args
  const completedAt = now()

  if (result.status === "completed") {
    const advanced =
      patchLifecycle({
        sessionID,
        status: "completed",
        phase: "completed",
        completedAt,
        observation: {
          source: "observe:tmux-exit",
          observedAt: completedAt,
          detail: "tmux-pane-exited-cleanly",
        },
      }) !== false
    return { status: "completed", advanced }
  }

  const stderr = result.stderr.trim()
  const error = stderr.length > 0
    ? stderr
    : `[Harness] Tmux pane exited with status ${result.status} and code ${String(result.exitCode)}`

  const advanced =
    patchLifecycle({
      sessionID,
      status: "error",
      phase: "failed",
      error,
      observation: {
        source: "observe:tmux-exit",
        observedAt: completedAt,
        detail: "tmux-pane-failed",
      },
    }) !== false
  return { error, status: "failed", advanced }
}

function buildAsyncTmuxResponse(args: {
  task: BackgroundTask
  sessionID: string
  parentSessionID: string
  rootID: string
  childDepth: number
  agent: string
  category?: string
  model?: string
  description: string
  execution: ExecutionModeResult
  getLifecycleSnapshot: (sessionID: string) => SessionLifecycleState | undefined
}): string {
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
      background_task_id: args.task.id,
      execution: args.execution,
      description: args.description,
      lifecycle: args.getLifecycleSnapshot(args.sessionID),
      instruction: "Task dispatched to visible tmux pane. You can observe progress. You'll be notified when complete.",
    },
    null,
    2,
  )
}

/**
 * Run a delegated session inside a visible tmux pane.
 *
 * Completion is determined by pane/process exit — a binary terminal signal.
 * This is the visible-worker execution path (D-11/D-12).
 */
export async function runLifecycleTmuxTask(args: RunLifecycleTmuxArgs): Promise<string> {
  const tmuxCmd = buildTmuxCommand(args.sessionID)
  const task = args.backgroundManager.spawn({
    command: tmuxCmd.command,
    args: tmuxCmd.args,
    cwd: args.execution.capabilityEvidence.projectRoot,
    parentSessionID: args.parentSessionID,
  })

  // Notify parent that work has started
  const startedContinuity = args.getSessionContinuity(args.sessionID)
  if (startedContinuity?.metadata.parentSessionID) {
    const startedNotification = buildTaskNotificationFromContinuity(startedContinuity, "started")
    void notifyParentSession(
      args.client,
      startedContinuity.metadata.parentSessionID,
      startedNotification,
    ).then((delivered) => {
      if (!delivered) {
        persistPendingNotification(startedContinuity.metadata.parentSessionID, startedNotification)
      }
    })
  }

  if (args.runInBackground) {
    void args.backgroundManager
      .onComplete(task.id)
      .then((result) => {
        const finalized = finalizeTmuxResult({
          result,
          sessionID: args.sessionID,
          patchLifecycle: args.patchLifecycle,
          now: args.now,
        })
        const continuity = args.getSessionContinuity(args.sessionID)

        if (finalized.advanced && continuity?.metadata.parentSessionID) {
          const notification = buildTaskNotificationFromContinuity(
            continuity,
            finalized.status,
            finalized.error,
          )
          void notifyParentSession(
            args.client,
            continuity.metadata.parentSessionID,
            notification,
          ).then((delivered) => {
            if (!delivered) {
              persistPendingNotification(continuity.metadata.parentSessionID, notification)
            }
          })
        }

        if (finalized.status === "failed" && finalized.error) {
          throw new Error(finalized.error)
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        args.patchLifecycle({
          sessionID: args.sessionID,
          status: "error",
          phase: "failed",
          error: message,
          observation: {
            source: "observe:tmux-exit",
            observedAt: args.now(),
            detail: "tmux-pane-handler-failed",
          },
        })
      })
      .finally(() => {
        args.releaseQueue("tmux-pane-complete")
      })

    return buildAsyncTmuxResponse({
      task,
      sessionID: args.sessionID,
      parentSessionID: args.parentSessionID,
      rootID: args.rootID,
      childDepth: args.childDepth,
      agent: args.agent,
      category: args.category,
      model: args.model,
      description: args.description,
      execution: args.execution,
      getLifecycleSnapshot: args.getLifecycleSnapshot,
    })
  }

  // Sync mode: wait for tmux pane to exit
  try {
    const result = await args.backgroundManager.onComplete(task.id)
    const finalized = finalizeTmuxResult({
      result,
      sessionID: args.sessionID,
      patchLifecycle: args.patchLifecycle,
      now: args.now,
    })
    if (finalized.status === "failed" && finalized.error) {
      throw new Error(finalized.error)
    }
    return JSON.stringify({ ok: true, mode: "sync", session_id: args.sessionID }, null, 2)
  } finally {
    args.releaseQueue("tmux-sync-complete")
  }
}
