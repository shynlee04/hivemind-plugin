import type { EscalationLevel } from "./types.js"
import { ESCALATION_THRESHOLDS } from "./types.js"

export const ESCALATION_ICONS = ["⚠", "⚠", "🔴", "⛔", "🛑"] as const
const ESCALATION_LEVELS = ["WARN", "NUDGE", "ALERT", "TERMINATE", "TERMINATE"] as const

/** Schedules multi-level delegation escalation callbacks. */
export class EscalationTimer {
  private readonly timers: NodeJS.Timeout[] = []

  /** Start one timer per threshold, expressed in seconds. */
  start(
    delegationId: string,
    thresholds: readonly number[] = ESCALATION_THRESHOLDS,
    onLevel: (level: EscalationLevel, elapsedSeconds: number, icon: string, delegationId: string) => void,
  ): void {
    this.stop()
    thresholds.forEach((threshold, index) => {
      const level = ESCALATION_LEVELS[index]
      const icon = ESCALATION_ICONS[index]
      if (!level || !icon) return
      this.timers.push(setTimeout(() => { onLevel(level, threshold, icon, delegationId) }, threshold * 1000))
    })
  }

  /** Clear all pending escalation timers. */
  stop(): void {
    for (const timer of this.timers.splice(0)) clearTimeout(timer)
  }
}
