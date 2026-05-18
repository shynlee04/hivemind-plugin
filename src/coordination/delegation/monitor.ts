import type { Delegation, DelegationStatus, PollingCadence } from "./types.js"
import { POLLING_CADENCE } from "./types.js"
import { EscalationTimer } from "./escalation-timer.js"
import type { ActionCounter } from "../../shared/types.js"

export interface MonitorOptions {
  getStatus: (delegationId: string) => DelegationStatus | string
  /** Returns the current delegation record for semantic escalation guards, or undefined if not tracked. */
  getDelegationRecord?: (delegationId: string) => Delegation | undefined
  inject: (parentSessionId: string, line: string) => void
  pollingCadence?: PollingCadence | readonly number[]
}

type MonitorState = {
  completed: boolean
  escalationTimer: EscalationTimer
  pollingTimers: NodeJS.Timeout[]
  actionCounters: ActionCounter
  previousActionCounters: ActionCounter
}

/** Owns progressive polling and escalation timers for one delegation. */
export class DelegationMonitor {
  private readonly getStatus: MonitorOptions["getStatus"]
  private readonly getDelegationRecord: MonitorOptions["getDelegationRecord"]
  private readonly inject: MonitorOptions["inject"]
  private readonly pollingCadence: readonly number[]
  private readonly states = new Map<string, MonitorState>()

  constructor(options: MonitorOptions) {
    this.getStatus = options.getStatus
    this.getDelegationRecord = options.getDelegationRecord
    this.inject = options.inject
    this.pollingCadence = options.pollingCadence ?? POLLING_CADENCE
  }

  /** Start progressive polling and escalation for a delegation. */
  start(delegationId: string, parentSessionId: string): void {
    this.stop(delegationId)
    const state: MonitorState = {
      completed: false,
      escalationTimer: new EscalationTimer(),
      pollingTimers: [],
      actionCounters: { toolCalls: 0, bashCommands: 0, skillLoads: 0, fileChanges: 0, totalActions: 0 },
      previousActionCounters: { toolCalls: 0, bashCommands: 0, skillLoads: 0, fileChanges: 0, totalActions: 0 },
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
