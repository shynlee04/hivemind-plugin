import type { DelegationStatus, PollingCadence } from "./types.js"
import { POLLING_CADENCE } from "./types.js"
import { EscalationTimer } from "./escalation-timer.js"

export interface MonitorOptions {
  escalationTimer?: EscalationTimer
  getStatus: (delegationId: string) => DelegationStatus | string
  inject: (parentSessionId: string, line: string) => void
  pollingCadence?: PollingCadence | readonly number[]
}

/** Owns progressive polling and escalation timers for one delegation. */
export class DelegationMonitor {
  private readonly escalationTimer: EscalationTimer
  private readonly getStatus: MonitorOptions["getStatus"]
  private readonly inject: MonitorOptions["inject"]
  private readonly pollingCadence: readonly number[]
  private readonly pollingTimers: NodeJS.Timeout[] = []
  private completed = false

  constructor(options: MonitorOptions) {
    this.escalationTimer = options.escalationTimer ?? new EscalationTimer()
    this.getStatus = options.getStatus
    this.inject = options.inject
    this.pollingCadence = options.pollingCadence ?? POLLING_CADENCE
  }

  /** Start progressive polling and escalation for a delegation. */
  start(delegationId: string, parentSessionId: string): void {
    this.stop()
    this.completed = false
    for (const elapsed of this.pollingCadence) {
      this.pollingTimers.push(setTimeout(() => {
        if (this.completed) return
        const status = this.getStatus(delegationId)
        if (this.isTerminal(status)) return
        this.inject(parentSessionId, `[DT:${delegationId}] status=${status} elapsed=${elapsed}s`)
      }, elapsed * 1000))
    }
    this.escalationTimer.start(delegationId, undefined, (level, elapsed, icon) => {
      if (!this.completed) this.inject(parentSessionId, `[DT:${delegationId}] ${icon} escalation=${level} elapsed=${elapsed}s`)
    })
  }

  /** Stop polling and escalation timers. */
  stop(): void {
    for (const timer of this.pollingTimers.splice(0)) clearTimeout(timer)
    this.escalationTimer.stop()
  }

  /** Mark the delegation completed and stop all monitoring. */
  onCompletion(): void {
    this.completed = true
    this.stop()
  }

  private isTerminal(status: string): boolean {
    return status === "completed" || status === "error" || status === "timeout"
  }
}
