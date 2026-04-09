import type { BackgroundManager, BackgroundResult, BackgroundTask } from "./background-manager.js"
import type { CompletionDetector } from "./completion-detector.js"
import type { ExecutionModeResult } from "./execution-mode.js"
import { observeBackgroundCompletion } from "./lifecycle-background-observer.js"
import { extractTextFromResponse } from "./lifecycle-state.js"
import { notifyParentSession, type TaskNotification } from "./notification-handler.js"
import { sendPrompt, sendPromptAsync, type OpenCodeClient } from "./session-api.js"
import type { SessionContinuityRecord } from "./types.js"
import type { SessionContinuityMetadata, SessionLifecycleObservation, SessionLifecyclePhase, SessionLifecycleState } from "./types.js"

type PatchLifecycleArgs = {
  sessionID: string
  status: SessionContinuityMetadata["status"]
  phase: SessionLifecyclePhase
  observation?: SessionLifecycleObservation
  completedAt?: number
  error?: string
}

type RunLifecycleProcessArgs = {
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
  backgroundManager: BackgroundManager
  patchLifecycle: (args: PatchLifecycleArgs) => void
  getLifecycleSnapshot: (sessionID: string) => SessionLifecycleState | undefined
  releaseQueue: (reason: string) => void
  now: () => number
}

function buildBuiltinProcessCommand(promptText: string): { command: string; args: string[]; env: Record<string, string> } {
  return {
    command: "node",
    args: [
      "-e",
      [
        'const prompt = process.env.HARNESS_DELEGATION_PROMPT ?? "";',
        'const shouldFail = process.env.HARNESS_DELEGATION_FAIL === "1";',
        'if (shouldFail) {',
        '  process.stderr.write(prompt || "[Harness] builtin-process failed");',
        "  process.exit(1);",
        "}",
        "process.stdout.write(prompt);",
      ].join(" "),
    ],
    env: {
      HARNESS_DELEGATION_PROMPT: promptText,
      HARNESS_DELEGATION_FAIL: process.env.OPENCODE_HARNESS_BUILTIN_PROCESS_FAIL === "1" ? "1" : "0",
    },
  }
}

function buildFailureMessage(result: BackgroundResult): string {
  const stderr = result.stderr.trim()
  if (stderr.length > 0) {
    return stderr
  }

  return `[Harness] Builtin process failed with status ${result.status} and code ${String(result.exitCode)}`
}

function finalizeProcessResult(args: {
  result: BackgroundResult
  sessionID: string
  patchLifecycle: (args: PatchLifecycleArgs) => void
  now: () => number
}): string {
  const { result, sessionID, patchLifecycle, now } = args
  const completedAt = now()

  if (result.status === "completed") {
    patchLifecycle({
      sessionID,
      status: "completed",
      phase: "completed",
      completedAt,
      observation: {
        source: "observe:process",
        observedAt: completedAt,
        detail: "owned-process-output-ready",
      },
    })
    return result.stdout
  }

  const error = buildFailureMessage(result)
  patchLifecycle({
    sessionID,
    status: "error",
    phase: "failed",
    error,
    observation: {
      source: "observe:process",
      observedAt: completedAt,
      detail: "owned-process-failed",
    },
  })
  throw new Error(error)
}

function buildAsyncProcessResponse(args: {
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
      instruction: "Task dispatched. Continue with other work — you'll be notified when complete.",
    },
    null,
    2,
  )
}

export async function runLifecycleProcessTask(args: RunLifecycleProcessArgs): Promise<string> {
  const command = buildBuiltinProcessCommand(args.promptText)
  const task = args.backgroundManager.spawn({
    command: command.command,
    args: command.args,
    cwd: args.execution.capabilityEvidence.projectRoot,
    env: command.env,
    parentSessionID: args.parentSessionID,
  })

  if (args.runInBackground) {
    void args.backgroundManager
      .onComplete(task.id)
      .then((result) => {
        finalizeProcessResult({
          result,
          sessionID: args.sessionID,
          patchLifecycle: args.patchLifecycle,
          now: args.now,
        })
      })
      .catch((error: unknown) => {
        args.patchLifecycle({
          sessionID: args.sessionID,
          status: "error",
          phase: "failed",
          error: error instanceof Error ? error.message : String(error),
          observation: {
            source: "observe:process",
            observedAt: args.now(),
            detail: "owned-process-handler-failed",
          },
        })
      })
      .finally(() => {
        args.releaseQueue("builtin-process-complete")
      })

    return buildAsyncProcessResponse({
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

  try {
    const result = await args.backgroundManager.onComplete(task.id)
    return finalizeProcessResult({
      result,
      sessionID: args.sessionID,
      patchLifecycle: args.patchLifecycle,
      now: args.now,
    })
  } finally {
    args.releaseQueue("builtin-process-complete")
  }
}

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
  patchLifecycle: (args: PatchLifecycleArgs) => void
  getLifecycleSnapshot: (sessionID: string) => SessionLifecycleState | undefined
  releaseQueue: (reason: string) => void
  queueSnapshot: { active: number; pending: number; limit: number }
  budgetUsed: number
  launchedAt: number
  now: () => number
}

export async function runLifecycleSubsessionTask(args: RunLifecycleSubsessionArgs): Promise<string> {
  if (args.runInBackground) {
    // Use promptAsync so the platform keeps the child session alive
    // independently of the parent's turn lifecycle.
    sendPromptAsync(args.client, args.sessionID, args.body)
      .then(() => {
        // Prompt dispatched successfully — notify parent that work has started.
        const continuity = args.getSessionContinuity(args.sessionID)
        if (continuity?.metadata.parentSessionID) {
          void notifyParentSession(
            args.client,
            continuity.metadata.parentSessionID,
            {
              sessionID: args.sessionID,
              description: args.description,
              agent: args.agent,
              status: "started",
            } satisfies TaskNotification,
          )
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
            source: "dispatch",
            observedAt: args.now(),
            detail: "prompt-dispatch-failed",
          },
        })

        // Notify parent of dispatch failure so they don't wait blindly.
        const continuity = args.getSessionContinuity(args.sessionID)
        if (continuity?.metadata.parentSessionID) {
          void notifyParentSession(
            args.client,
            continuity.metadata.parentSessionID,
            {
              sessionID: args.sessionID,
              description: args.description,
              agent: args.agent,
              status: "failed",
              error: message,
            } satisfies TaskNotification,
          )
        }
      })

    void observeBackgroundCompletion({
      sessionID: args.sessionID,
      client: args.client,
      completionDetector: args.completionDetector,
      pollTimeoutMs: args.pollTimeoutMs,
      now: args.now,
      getSessionContinuity: args.getSessionContinuity,
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

    args.patchLifecycle({
      sessionID: args.sessionID,
      status: "completed",
      phase: "completed",
      completedAt: args.now(),
      observation: {
        source: "observe:sync",
        observedAt: args.now(),
        detail: "assistant-output-ready",
      },
    })

    return assistantText
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
