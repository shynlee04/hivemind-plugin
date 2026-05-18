/**
 * Harness lifecycle manager — session lifecycle state machine.
 *
 * Provides transition guards, activity tracking, and event routing
 * for delegated session lifecycle management.
 */
import { CompletionDetector } from "../../coordination/completion/detector.js"
import { getSessionContinuity, listSessionContinuity, patchSessionContinuity } from "../continuity/index.js"
import { replayPendingNotifications } from "../../coordination/completion/notification-handler.js"
import type { DelegationManager } from "../../coordination/delegation/manager.js"
import { abortSession, sendPrompt, type OpenCodeClient } from "../../shared/session-api.js"
import { hydrateDelegationState, taskState } from "../../shared/state.js"
import type {
  CheckpointData,
  RuntimePolicy,
  SessionLifecyclePhase,
  SessionLifecycleState,
} from "../../shared/types.js"

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

  /**
   * Returns the lifecycle-owned `CompletionDetector` instance.
   *
   * Phase 36.1 wiring: the SDK delegation polling path consumes cached
   * terminal signals (`session.error` / `session.deleted`) and feeds
   * message counts back into this detector so message-stability is
   * mirrored across both state machines. Exposing the instance — rather
   * than a façade — keeps test ergonomics simple: tests can construct
   * a real detector, feed it directly, and assert on resulting state
   * transitions in the SDK handler.
   *
   * @returns The lifecycle-owned `CompletionDetector`.
   */
  getCompletionDetector(): CompletionDetector {
    return this.completionDetector
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
    const properties = (args.event as { properties?: { status?: { type?: string }; error?: unknown } } | undefined)?.properties
    const statusSignal = typeof properties?.status?.type === "string" ? properties.status.type : ""

    if (statusSignal === "idle" || eventType === "session.idle") {
      this.completionDetector.feed("session.idle", sessionID)
    }

    // Phase 36.1 R-COMPLETION-DETECTOR-04: feed every terminal session event
    // into the detector, not just `session.idle`. Until this wiring landed,
    // the detector cached only idle signals while error/deleted events were
    // observed by `delegation-event-observer.ts` and dispatched directly to
    // the delegation manager — meaning the detector's "did this session
    // terminate?" answer was incomplete. Now any consumer (including the
    // SDK polling loop) can drain the cached result and react truthfully.
    if (statusSignal === "error" || eventType === "session.error") {
      const errorMessage = typeof properties?.error === "string"
        ? properties.error
        : properties?.error instanceof Error
          ? properties.error.message
          : undefined
      this.completionDetector.feed("session.error", sessionID, errorMessage)
    }

    if (eventType === "session.deleted") {
      this.completionDetector.feed("session.deleted", sessionID)
    }
  }

  /**
   * Replays queued parent-session notifications from the explicit write-side manager boundary.
   *
   * @param sessionID - Parent session observed by an OpenCode lifecycle event.
   * @param eventType - OpenCode event type that may authorize replay.
   */
  async replayPendingNotificationsForEvent(sessionID: string, eventType: string): Promise<void> {
    const continuity = getSessionContinuity(sessionID)
    const pendingNotifications = continuity?.metadata.pendingNotifications ?? []
    if (pendingNotifications.length === 0) {
      return
    }

    const shouldReplay =
      (eventType === "session.created" && continuity?.metadata.lifecycle?.phase === "created") ||
      eventType === "session.updated"

    if (!shouldReplay) {
      return
    }

    try {
      const delivered = await replayPendingNotifications(this.client, sessionID, pendingNotifications)
      if (delivered) {
        patchSessionContinuity(sessionID, { pendingNotifications: [] })
      }
    } catch {
      // Best-effort replay: keep queued notifications for the next parent event.
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
      model: args.model,
    })

    return result.delegationId
  }
}

export function createHarnessLifecycleManager(
  options: HarnessLifecycleManagerOptions,
): HarnessLifecycleManager {
  return new HarnessLifecycleManager(options)
}
