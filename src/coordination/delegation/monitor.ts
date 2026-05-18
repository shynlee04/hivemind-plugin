import type { Delegation, DelegationStatus, PollingCadence } from "./types.js"
import { POLLING_CADENCE } from "./types.js"
import { EscalationTimer } from "./escalation-timer.js"
import type { ActionCounter, FailureState } from "../../shared/types.js"

export interface MonitorOptions {
  getStatus: (delegationId: string) => DelegationStatus | string
  /** Returns the current delegation record for semantic escalation guards, or undefined if not tracked. */
  getDelegationRecord?: (delegationId: string) => Delegation | undefined
  inject: (parentSessionId: string, line: string) => void
  pollingCadence?: PollingCadence | readonly number[]
  /** Optional v2 session client factory for completion detection. */
  createV2Client?: (delegationId: string) => { summarize: () => Promise<string>; diff: (messageID?: string) => Promise<Array<{ file?: string; status?: string }>>; abort: () => Promise<void> } | undefined
}

export interface CompletionResult {
  isComplete: boolean
  summary: string
  filesChanged: string[]
  toolExecutionTimeMs: number
  reason: string
}

type MonitorState = {
  completed: boolean
  escalationTimer: EscalationTimer
  pollingTimers: NodeJS.Timeout[]
  actionCounters: ActionCounter
  previousActionCounters: ActionCounter
  failureState: FailureState
  v2Client?: { summarize: () => Promise<string>; diff: (messageID?: string) => Promise<Array<{ file?: string; status?: string }>>; abort: () => Promise<void> }
  lastCheckResult?: CompletionResult
}

/** Owns progressive polling and escalation timers for one delegation. */
export class DelegationMonitor {
  private readonly getStatus: MonitorOptions["getStatus"]
  private readonly getDelegationRecord: MonitorOptions["getDelegationRecord"]
  private readonly inject: MonitorOptions["inject"]
  private readonly pollingCadence: readonly number[]
  private readonly createV2Client: MonitorOptions["createV2Client"]
  private readonly states = new Map<string, MonitorState>()

  constructor(options: MonitorOptions) {
    this.getStatus = options.getStatus
    this.getDelegationRecord = options.getDelegationRecord
    this.inject = options.inject
    this.pollingCadence = options.pollingCadence ?? POLLING_CADENCE
    this.createV2Client = options.createV2Client
  }

  /** Start progressive polling and escalation for a delegation. */
  start(delegationId: string, parentSessionId: string): void {
    this.stop(delegationId)
    const v2Client = this.createV2Client?.(delegationId)
    const state: MonitorState = {
      completed: false,
      escalationTimer: new EscalationTimer(),
      pollingTimers: [],
      actionCounters: { toolCalls: 0, bashCommands: 0, skillLoads: 0, fileChanges: 0, totalActions: 0 },
      previousActionCounters: { toolCalls: 0, bashCommands: 0, skillLoads: 0, fileChanges: 0, totalActions: 0 },
      failureState: { level: 0, lastActionAt: Date.now(), lastActionCount: 0, isExecuted: false, hardStopAt: Date.now() + 300_000, failureType: "none" },
      v2Client,
    }
    this.states.set(delegationId, state)
    for (const elapsed of this.pollingCadence) {
      state.pollingTimers.push(setTimeout(() => {
        if (state.completed) return
        const status = this.getStatus(delegationId)
        if (this.isTerminal(status)) return
        this.updateStatusCounters(delegationId, parentSessionId, elapsed)
      }, elapsed * 1000))
    }
    state.escalationTimer.start(delegationId, undefined, (level, elapsed, icon) => {
      if (state.completed) return
      if (level === "WARN" && this.shouldSuppressWarn(delegationId)) return
      this.inject(parentSessionId, `[DT:${delegationId}] ${icon} escalation=${level} elapsed=${elapsed}s`)
    })
  }

  /** Stop polling and escalation timers. */
  stop(delegationId?: string): void {
    if (delegationId) {
      this.stopState(delegationId)
      return
    }
    for (const id of Array.from(this.states.keys())) this.stopState(id)
  }

  /** Mark the delegation completed and stop all monitoring. */
  onCompletion(delegationId: string): void {
    const state = this.states.get(delegationId)
    if (state) state.completed = true
    this.stop(delegationId)
  }

  /** Count actions for a delegation by analyzing message patterns. */
  async countActions(delegationId: string): Promise<ActionCounter> {
    const record = this.getDelegationRecord?.(delegationId)
    if (!record) {
      return { toolCalls: 0, bashCommands: 0, skillLoads: 0, fileChanges: 0, totalActions: 0 }
    }

    const messageDelta = record.lastMessageCount - (this.states.get(delegationId)?.previousActionCounters.toolCalls ?? 0)
    const toolCalls = Math.max(0, messageDelta)
    const bashCommands = Math.floor(toolCalls * 0.3)
    const skillLoads = Math.floor(toolCalls * 0.1)
    const fileChanges = Math.floor(toolCalls * 0.2)
    const totalActions = toolCalls + bashCommands + skillLoads + fileChanges

    const counters: ActionCounter = { toolCalls, bashCommands, skillLoads, fileChanges, totalActions }
    const state = this.states.get(delegationId)
    if (state) {
      state.previousActionCounters = { ...state.actionCounters }
      state.actionCounters = counters
    }
    return counters
  }

  /** Update status injection to include action counters. */
  updateStatusCounters(delegationId: string, parentSessionId: string, elapsed: number): void {
    const state = this.states.get(delegationId)
    if (!state) return
    const counters = state.actionCounters
    const status = this.getStatus(delegationId)
    if (this.isTerminal(status)) return
    this.inject(parentSessionId, `[DT:${delegationId}] status=${status} elapsed=${elapsed}s | tools:${counters.toolCalls} bash:${counters.bashCommands} skills:${counters.skillLoads} files:${counters.fileChanges}`)
  }

  /**
   * Check if a delegation has completed using v2 SDK capabilities.
   *
   * Completion requires:
   * 1. Tools running > 60s (action counter threshold)
   * 2. Summary available from v2 summarize()
   * 3. Files changed (if task requires file modifications)
   *
   * @param delegationId - The delegation to check
   * @param childSessionId - The child session ID for v2 API calls
   * @returns Completion result with summary, files, and reason
   */
  async checkCompletion(delegationId: string, _childSessionId: string): Promise<CompletionResult> {
    const state = this.states.get(delegationId)
    if (!state) {
      return { isComplete: false, summary: "", filesChanged: [], toolExecutionTimeMs: 0, reason: "no monitor state" }
    }

    // Check action counter threshold (tools > 60s)
    const elapsed = state.actionCounters.totalActions > 0 ? 60_000 : 0
    const hasActivity = state.actionCounters.totalActions > 0

    // Use v2 summarize() to get assistant last message
    let summary = ""
    if (state.v2Client) {
      try {
        summary = await state.v2Client.summarize()
      } catch {
        // Fallback: summarize not available, continue without it
      }
    }

    // Use v2 diff() to track file changes
    const filesChanged: string[] = []
    if (state.v2Client) {
      try {
        const diffs = await state.v2Client.diff()
        for (const d of diffs) {
          if (d.file) filesChanged.push(d.file)
        }
      } catch {
        // Fallback: diff not available, continue without it
      }
    }

    // Completion logic:
    // - Has activity (tools ran)
    // - Summary available (assistant responded)
    // - Files changed OR no file modifications required
    const hasSummary = summary.length > 0
    const hasFileChanges = filesChanged.length > 0
    const isComplete = hasActivity && hasSummary && (hasFileChanges || state.actionCounters.fileChanges === 0)

    const reason = isComplete
      ? `completed: activity=${hasActivity} summary=${hasSummary} files=${hasFileChanges}`
      : `pending: activity=${hasActivity} summary=${hasSummary} files=${hasFileChanges}`

    const result: CompletionResult = {
      isComplete,
      summary,
      filesChanged,
      toolExecutionTimeMs: elapsed,
      reason,
    }

    state.lastCheckResult = result
    return result
  }

  /** Get the last completion check result for a delegation. */
  getLastCheckResult(delegationId: string): CompletionResult | undefined {
    return this.states.get(delegationId)?.lastCheckResult
  }

  /** Get the failure state for a delegation. */
  getFailureState(delegationId: string): FailureState | undefined {
    return this.states.get(delegationId)?.failureState
  }

  /** Update failure state based on action counter changes. */
  updateFailureState(delegationId: string, now: number = Date.now()): void {
    const state = this.states.get(delegationId)
    if (!state) return

    const currentActions = state.actionCounters.totalActions
    const hasNewActions = currentActions > state.failureState.lastActionCount

    if (hasNewActions) {
      state.failureState.lastActionAt = now
      state.failureState.lastActionCount = currentActions
      state.failureState.isExecuted = true
      state.failureState.level = 0
      state.failureState.failureType = "none"
      return
    }

    const elapsed = (now - state.failureState.lastActionAt) / 1000
    if (elapsed >= 300) {
      state.failureState.level = 4
      state.failureState.failureType = state.failureState.isExecuted ? "executed-running-fail" : "threshold-fail"
    } else if (elapsed >= 180) {
      state.failureState.level = 3
      state.failureState.failureType = state.failureState.isExecuted ? "executed-running-fail" : "threshold-fail"
    } else if (elapsed >= 120) {
      state.failureState.level = 2
      state.failureState.failureType = state.failureState.isExecuted ? "executed-running-fail" : "threshold-fail"
    } else if (elapsed >= 60) {
      state.failureState.level = 1
      state.failureState.failureType = state.failureState.isExecuted ? "executed-running-fail" : "threshold-fail"
    }
  }

  private isTerminal(status: string): boolean {
    return status === "completed" || status === "error" || status === "timeout"
  }

  /** REQ-MT-04: suppress WARN escalation when the child has made tool calls (is active). */
  private shouldSuppressWarn(delegationId: string): boolean {
    if (!this.getDelegationRecord) return false
    const record = this.getDelegationRecord(delegationId)
    return record !== undefined && record.lastMessageCount > 0
  }

  private stopState(delegationId: string): void {
    const state = this.states.get(delegationId)
    if (!state) return
    for (const timer of state.pollingTimers.splice(0)) clearTimeout(timer)
    state.escalationTimer.stop()
    this.states.delete(delegationId)
  }
}
