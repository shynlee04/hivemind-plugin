import type { Delegation, DelegationStatus } from "./types.js"
import type { FailureCheckpointResult } from "./types.js"
import type { SemanticCompletionResult } from "./completion-detector.js"
import { POLLING_CADENCE } from "./types.js"
import { FailureCheckpointTracker } from "./escalation-timer.js"
import { formatCompactLine, formatFailureNotification, formatFinalFailure } from "./notification-formatter.js"
import { checkSemanticCompletion } from "./completion-detector.js"

type FormatterStatus = "completed" | "error" | "timeout" | "cancelled"

function isFormatterStatus(status: string): status is FormatterStatus {
  return status === "completed" || status === "error" || status === "timeout" || status === "cancelled"
}

function formatStatusLine(delegationId: string, status: string, record: Delegation | undefined, actionCount: number): string {
  if (isFormatterStatus(status) && record) {
    return formatCompactLine({ delegationId, agent: record.agent, status, elapsedMs: 0, toolCount: record.toolCallCount })
  }
  return `[DT:${delegationId}] status=${status} | agent=${record?.agent ?? "unknown"} | tools=${record?.toolCallCount ?? 0} | actions=${actionCount}`
}

export interface MonitorOptions {
  getStatus: (delegationId: string) => DelegationStatus | string
  getDelegationRecord: (delegationId: string) => Delegation | undefined
  getActionCount?: (delegationId: string) => number
  inject: (parentSessionId: string, line: string, delegationId?: string) => void
  onComplete?: (delegationId: string, result?: SemanticCompletionResult) => void
  onFailure?: (delegationId: string, result: FailureCheckpointResult) => void
  onFirstActionDeadline?: (delegationId: string, elapsedSeconds: number) => void
  pollingCadence?: readonly number[]
}

interface MonitorState {
  completed: boolean
  checkpointTracker: FailureCheckpointTracker
  pollingTimers: NodeJS.Timeout[]
  parentSessionId: string
}

/**
 * Owns progressive polling, failure checkpoint detection, and completion
 * monitoring for a single delegated session.
 *
 * Polls at 30→45→60→90→120→180 seconds, injecting thin-line status updates.
 * At failure checkpoints (60/120/180/300), compares action counts between
 * checkpoints. No change = failure at that level. Injection stops after
 * level 4 (300s).
 */
export class DelegationMonitor {
  private readonly getStatus: MonitorOptions["getStatus"]
  private readonly getDelegationRecord: MonitorOptions["getDelegationRecord"]
  private readonly getActionCount: MonitorOptions["getActionCount"]
  private readonly inject: MonitorOptions["inject"]
  private readonly onComplete: MonitorOptions["onComplete"]
  private readonly onFailure: MonitorOptions["onFailure"]
  private readonly onFirstActionDeadline: MonitorOptions["onFirstActionDeadline"]
  private readonly pollingCadence: readonly number[]
  private readonly states = new Map<string, MonitorState>()

  constructor(options: MonitorOptions) {
    this.getStatus = options.getStatus
    this.getDelegationRecord = options.getDelegationRecord
    this.getActionCount = options.getActionCount
    this.inject = options.inject
    this.onComplete = options.onComplete
    this.onFailure = options.onFailure
    this.onFirstActionDeadline = options.onFirstActionDeadline
    this.pollingCadence = options.pollingCadence ?? POLLING_CADENCE
  }

  /** Start progressive polling and failure checkpoint tracking. */
  start(delegationId: string, parentSessionId: string): void {
    this.stop(delegationId)

    const tracker = new FailureCheckpointTracker()
    tracker.start(delegationId)

    const state: MonitorState = {
      completed: false,
      checkpointTracker: tracker,
      pollingTimers: [],
      parentSessionId,
    }
    this.states.set(delegationId, state)

    for (const elapsed of this.pollingCadence) {
      state.pollingTimers.push(
        setTimeout(() => {
          if (state.completed) return
          if (!tracker.shouldInject(delegationId)) return

          const status = this.getStatus(delegationId)
          if (this.isTerminal(status)) return

          const record = this.getDelegationRecord(delegationId)
          const actionCount = this.getActionCount?.(delegationId) ?? 0

          if (elapsed >= 60 && record?.executionState !== "confirmed") {
            this.onFirstActionDeadline?.(delegationId, elapsed)
          }

          this.inject(parentSessionId, formatStatusLine(delegationId, status, record, actionCount), delegationId)

          if ((elapsed === 60 || elapsed === 120 || elapsed === 180) && this.onFailure) {
            tracker.check(delegationId, elapsed, actionCount, (result) => {
              this.handleFailure(delegationId, parentSessionId, result)
            })
          }
        }, elapsed * 1000),
      )
    }

    const finalTimer = setTimeout(() => {
      if (state.completed) return
      if (!tracker.shouldInject(delegationId)) return

      const actionCount = this.getActionCount?.(delegationId) ?? 0
      if (this.onFailure) {
        tracker.check(delegationId, 300, actionCount, (result) => {
          this.handleFailure(delegationId, parentSessionId, result)
        })
      }
    }, 300_000)
    state.pollingTimers.push(finalTimer)
  }

  /** Stop all timers and tracking for a delegation. */
  stop(delegationId?: string): void {
    if (delegationId) {
      this.stopState(delegationId)
      return
    }
    for (const id of Array.from(this.states.keys())) this.stopState(id)
  }

  /** Mark the delegation completed and stop all monitoring. */
  onCompletion(delegationId: string, result?: SemanticCompletionResult): void {
    const state = this.states.get(delegationId)
    if (!state) return

    state.completed = true
    state.checkpointTracker.stop(delegationId)
    this.stop(delegationId)
    this.onComplete?.(delegationId, result)
  }

  /** Check semantic completion and trigger completion or continue. */
  checkCompletion(delegationId: string, messages: unknown[]): void {
    const state = this.states.get(delegationId)
    if (!state || state.completed) return

    const result = checkSemanticCompletion(messages)

    if (result.isComplete) {
      this.onCompletion(delegationId, result)
    }
  }

  private isTerminal(status: string): boolean {
    return status === "completed" || status === "error" || status === "timeout"
  }

  private handleFailure(delegationId: string, parentSessionId: string, result: FailureCheckpointResult): void {
    const record = this.getDelegationRecord(delegationId)
    const actionCount = this.getActionCount?.(delegationId) ?? 0
    const isExecutedRunning = actionCount > 0

    this.onFailure?.(delegationId, result)

    if (result.isFinal) {
      const notification = formatFinalFailure({
        delegationId,
        agent: record?.agent ?? "unknown",
        failureLevel: result.level,
        elapsedSeconds: result.elapsedSeconds,
        actionCount,
        isExecutedRunning,
      })
      this.inject(parentSessionId, notification, delegationId)
      const state = this.states.get(delegationId)
      if (state) state.completed = true
      this.stop(delegationId)
    } else {
      const notification = formatFailureNotification({
        delegationId,
        agent: record?.agent ?? "unknown",
        failureLevel: result.level,
        elapsedSeconds: result.elapsedSeconds,
        actionCount,
        isExecutedRunning,
      })
      this.inject(parentSessionId, notification, delegationId)
    }
  }

  private stopState(delegationId: string): void {
    const state = this.states.get(delegationId)
    if (!state) return
    for (const timer of state.pollingTimers.splice(0)) clearTimeout(timer)
    this.states.delete(delegationId)
  }
}
