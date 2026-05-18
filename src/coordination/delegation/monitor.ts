import type { Delegation, DelegationStatus, PollingCadence } from "./types.js"
import { POLLING_CADENCE } from "./types.js"
import { EscalationTimer } from "./escalation-timer.js"

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
    const state: MonitorState = { completed: false, escalationTimer: new EscalationTimer(), pollingTimers: [] }
    this.states.set(delegationId, state)
    for (const elapsed of this.pollingCadence) {
      state.pollingTimers.push(setTimeout(() => {
        if (state.completed) return
        const status = this.getStatus(delegationId)
        if (this.isTerminal(status)) return
        this.inject(parentSessionId, `[DT:${delegationId}] status=${status} elapsed=${elapsed}s`)
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
