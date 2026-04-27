/**
 * Harness lifecycle manager — session lifecycle state machine.
 *
 * Provides transition guards, activity tracking, and event routing
 * for delegated session lifecycle management.
 */
import { CompletionDetector } from "./completion-detector.js"
import { getSessionContinuity, listSessionContinuity, patchSessionContinuity } from "./continuity.js"
import type { DelegationManager } from "./delegation-manager.js"
import { abortSession, sendPrompt, type OpenCodeClient } from "./session-api.js"
import { hydrateDelegationState, taskState } from "./state.js"
import type {
  CheckpointData,
  RuntimePolicy,
  SessionLifecyclePhase,
  SessionLifecycleState,
} from "./types.js"

type HarnessLifecycleManagerOptions = {
  client: OpenCodeClient
  pollTimeoutMs: number
  runtimePolicy?: RuntimePolicy
  backgroundManager?: unknown
  delegationManager?: DelegationManager
}

export type LaunchDelegatedSessionArgs = {
  sessionID: string
  description: string
  agent: string
  category?: string
  model?: string
  constraints?: string[]
  promptText: string
  parentSessionID?: string
  [key: string]: unknown
}

/**
 * Valid lifecycle phase transitions.
 *
 * ┌─────────────┬──────────────────────────────────────────────┐
 * │ From         │ To                                           │
 * ├─────────────┼──────────────────────────────────────────────┤
 * │ created     │ queued, dispatching, running, failed         │
 * │ queued      │ dispatching, running, failed                 │
 * │ dispatching │ running, completed, failed                   │
 * │ running     │ completed, failed                            │
 * │ completed   │ (terminal)                                   │
 * │ failed      │ (terminal)                                   │
 * └─────────────┴──────────────────────────────────────────────┘
 */
const VALID_LIFECYCLE_TRANSITIONS: Record<SessionLifecyclePhase, SessionLifecyclePhase[]> = {
  created:     ["queued", "dispatching", "running", "failed"],
  queued:      ["dispatching", "running", "failed"],
  dispatching: ["running", "completed", "failed"],
  running:     ["completed", "failed"],
  completed:   [],
  failed:      [],
}

export function isValidTransition(from: SessionLifecyclePhase, to: SessionLifecyclePhase): boolean {
  return VALID_LIFECYCLE_TRANSITIONS[from].includes(to)
}

export function isTerminalPhase(phase: SessionLifecyclePhase): boolean {
  return phase === "completed" || phase === "failed"
}

export class HarnessLifecycleManager {
  private readonly concurrencyLimit: number
  private readonly completionDetector = new CompletionDetector()
  private readonly client: OpenCodeClient
  private readonly delegationManager?: DelegationManager

  constructor(options: HarnessLifecycleManagerOptions) {
    this.client = options.client
    this.delegationManager = options.delegationManager
    this.concurrencyLimit = parseInt(process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT ?? "3", 10)
    if (Number.isNaN(this.concurrencyLimit) || this.concurrencyLimit < 1) {
      this.concurrencyLimit = 3
    }
  }

  getConcurrencyLimit(): number {
    return this.concurrencyLimit
  }

  hydrateFromContinuity(): void {
    for (const record of listSessionContinuity()) {
      if (record.metadata.delegation) {
        hydrateDelegationState(record.sessionID, record.metadata.delegation)
      }
    }
  }

  getLifecycleSnapshot(sessionID: string): SessionLifecycleState | undefined {
    return getSessionContinuity(sessionID)?.metadata.lifecycle
  }

  noteObservedActivity(sessionID: string, source: string): void {
    const now = Date.now()
    const current = getSessionContinuity(sessionID)
    const currentLifecycle = current?.metadata.lifecycle
    patchSessionContinuity(sessionID, {
      lifecycle: {
        phase: currentLifecycle?.phase ?? "running",
        ...currentLifecycle,
        observation: { source, observedAt: now, detail: `activity noted by ${source}` },
      },
      lastToolActivityAt: now,
    })
  }

  handleEvent(args: { event: unknown; eventType: string; sessionID: string }): void {
    const { eventType, sessionID } = args
    // Minimal event routing: feed completion detector for idle detection
    const statusSignal = typeof (args.event as Record<string, unknown>)?.properties === "object"
      ? (((args.event as { properties?: { status?: { type?: string } } }).properties?.status?.type) ?? "")
      : ""

    if (statusSignal === "idle" || eventType === "session.idle") {
      this.completionDetector.feed("session.idle", sessionID)
    }
  }

  async cancelDelegatedSession(sessionID: string): Promise<void> {
    try {
      await abortSession(this.client, sessionID)
    } catch {
      // Abort best-effort
    }

    this.completionDetector.cancel(sessionID)
    patchSessionContinuity(sessionID, {
      lifecycle: {
        phase: "failed",
        error: "Session cancelled by user",
      },
    })
  }

  async requestAutoLoopRetry(args: { sessionID: string; promptText: string }): Promise<void> {
    await sendPrompt(this.client, args.sessionID, {
      parts: [{ type: "text", text: args.promptText }],
    })
  }

  recordCompactionCheckpoint(sessionID: string, checkpoint: CheckpointData): void {
    patchSessionContinuity(sessionID, { compactionCheckpoint: checkpoint })
    taskState.resetStats(sessionID)
  }

  async launchDelegatedSession(args: LaunchDelegatedSessionArgs): Promise<string> {
    if (!this.delegationManager) {
      throw new Error("[Harness] DelegationManager is required for launchDelegatedSession facade")
    }

    const result = await this.delegationManager.dispatch({
      parentSessionId: args.parentSessionID ?? args.sessionID,
      agent: args.agent,
      prompt: args.promptText,
      title: args.description,
      category: args.category,
      model: args.model,
    })

    return result.delegationId
  }

  getCompletionDetector(): CompletionDetector {
    return this.completionDetector
  }
}

export function createHarnessLifecycleManager(
  options: HarnessLifecycleManagerOptions,
): HarnessLifecycleManager {
  return new HarnessLifecycleManager(options)
}
