import type { BackgroundManager, BackgroundTask } from "./background-manager.js"
import type { ExecutionModeResult } from "./execution-mode.js"
import type { PatchLifecycleArgs } from "./lifecycle-patching.js"
import type { OpenCodeClient } from "./session-api.js"
import type { SessionContinuityMetadata, SessionContinuityRecord, SessionLifecycleState } from "./types.js"

export type { PatchLifecycleArgs }

export type FinalizedResult = {
  output?: string
  error?: string
  status: "completed" | "failed"
  advanced: boolean
}

export type CommonRunnerArgs = {
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
  /** Only required for tmux-pane execution path. */
  backgroundManager?: BackgroundManager
  getSessionContinuity: (sessionID: string) => SessionContinuityRecord | undefined
  patchSessionContinuity: (sessionID: string, patch: Partial<SessionContinuityMetadata>) => SessionContinuityRecord | undefined
  patchLifecycle: (args: PatchLifecycleArgs) => boolean | void
  getLifecycleSnapshot: (sessionID: string) => SessionLifecycleState | undefined
  releaseQueue: (reason: string) => void
  pollTimeoutMs: number
  now: () => number
}

export type BuildAsyncResponseArgs = {
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
  instruction: string
}

export function buildAsyncRunnerResponse(args: BuildAsyncResponseArgs): string {
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
      instruction: args.instruction,
    },
    null,
    2,
  )
}
