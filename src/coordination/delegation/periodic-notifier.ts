/**
 * PeriodicNotifier — time-based periodic injection of delegation progress
 * into parent sessions via combined batch blocks.
 *
 * Switched from change-detection model (toolCount/actionCount changes) to
 * a time-based model (T3.3). Every `intervalMs` (default 30s), polls ALL
 * tracked delegations and reports their current status. No change-detection
 * dedup — every interval produces a fresh combined block per parent session.
 *
 * Fire-and-forget: sendPromptAsync failures are caught and logged.
 */

import { formatCompactLine } from "./notification-router.js"
import type { OpenCodeClient } from "../../shared/session-api.js"
import { showTuiToast } from "../../shared/session-api.js"

export interface DelegationSnapshot {
  delegationId: string
  parentSessionId: string
  agent: string
  toolCount: number
  actionCount: number
  elapsedMs: number
}

export interface PeriodicNotifierConfig {
  cadenceMs: number
  /** Interval between status reports in ms (default 30000 = 30s) */
  intervalMs?: number
  showToast?: boolean
  client: unknown
}

interface TrackedDelegation {
  parentSessionId: string
  agent: string
  /** Latest known tool count (updated on each handlePollTick) */
  toolCount: number
  /** Latest known action count (updated on each handlePollTick) */
  actionCount: number
  /** Latest known elapsed ms (updated on each handlePollTick) */
  elapsedMs: number
}

type InjectFn = (parentSessionId: string, line: string, delegationId?: string) => void

const DEFAULT_INTERVAL_MS = 30000

/** Removes / from past snapshot hash for dedup. */
function snapKey(snap: DelegationSnapshot): string {
  return `${snap.delegationId}:${snap.toolCount}:${snap.actionCount}`
}

export class PeriodicNotifier {
  private readonly config: Required<PeriodicNotifierConfig>
  private readonly inject: InjectFn
  private readonly tracked: Map<string, TrackedDelegation> = new Map()
  private intervalTimer: ReturnType<typeof setInterval> | null = null
  private destroyed = false

  constructor(config: PeriodicNotifierConfig, inject: InjectFn) {
    this.config = {
      cadenceMs: config.cadenceMs,
      intervalMs: config.intervalMs ?? DEFAULT_INTERVAL_MS,
      showToast: config.showToast ?? false,
      client: config.client,
    }
    this.inject = inject
  }

  /** Start the periodic interval. Must be called explicitly after construction. */
  start(): void {
    this.startInterval()
  }

  get activeCount(): number {
    return this.tracked.size
  }

  register(snapshot: DelegationSnapshot): void {
    if (this.destroyed) return
    this.tracked.set(snapshot.delegationId, {
      parentSessionId: snapshot.parentSessionId,
      agent: snapshot.agent,
      toolCount: snapshot.toolCount,
      actionCount: snapshot.actionCount,
      elapsedMs: snapshot.elapsedMs,
    })
  }

  deregister(delegationId: string): void {
    this.tracked.delete(delegationId)
  }

  /**
   * Update tracked state with the latest snapshot values.
   * No change-detection — the interval-based flush reports ALL tracked
   * delegations regardless of whether individual values changed.
   */
  handlePollTick(snapshot: DelegationSnapshot): void {
    if (this.destroyed) return
    const tracked = this.tracked.get(snapshot.delegationId)
    if (!tracked) return

    // Always update tracked values — interval flush uses latest values
    tracked.toolCount = snapshot.toolCount
    tracked.actionCount = snapshot.actionCount
    tracked.elapsedMs = snapshot.elapsedMs
  }

  /** Start or restart the interval timer. */
  private startInterval(): void {
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer)
    }
    this.intervalTimer = setInterval(() => {
      this.flush()
    }, this.config.intervalMs)
    // Allow the process to exit even if the interval is still active
    if (this.intervalTimer && typeof this.intervalTimer === "object" && "unref" in this.intervalTimer) {
      this.intervalTimer.unref()
    }
  }

  /**
   * Flush ALL tracked delegations into combined <system_reminder> blocks
   * grouped by parentSessionId. Called on every interval tick.
   */
  private flush(): void {
    if (this.destroyed || this.tracked.size === 0) return

    // Sort entries for deterministic output order
    const sorted = Array.from(this.tracked.entries()).sort(([a], [b]) => a.localeCompare(b))

    // Group by parentSessionId
    const byParent = new Map<string, string[]>()
    for (const [delegationId, tracked] of sorted) {
      const line = formatCompactLine({
        delegationId,
        agent: tracked.agent,
        status: "running",
        elapsedMs: tracked.elapsedMs,
        toolCount: tracked.toolCount,
      })
      const existing = byParent.get(tracked.parentSessionId) ?? []
      existing.push(line)
      byParent.set(tracked.parentSessionId, existing)
    }

    if (byParent.size === 0) return

    // Send one combined <system_reminder> block per parent
    for (const [parentSessionId, parentLines] of byParent) {
      const combinedBlock = parentLines.join("\n")
      this.inject(parentSessionId, combinedBlock, undefined)
    }

    // Aggregated toast
    if (this.config.showToast) {
      const toastClient = this.config.client as OpenCodeClient | undefined
      if (toastClient) {
        const count = this.tracked.size
        const topAgents = sorted
          .map(([, t]) => t.agent)
          .slice(0, 3)
        const suffix = count > 3 ? ` +${count - 3} more` : ""
        showTuiToast(toastClient, `${count} delegations active · ${topAgents.join(" ")}${suffix}`).catch((err) => {
          toastClient.app?.log?.({ body: { service: "PeriodicNotifier", level: "warn", message: `[Hivemind] Toast failed: ${err instanceof Error ? err.message : String(err)}` } })
        })
      }
    }
  }

  destroy(): void {
    this.destroyed = true
    if (this.intervalTimer !== null) {
      clearInterval(this.intervalTimer)
      this.intervalTimer = null
    }
    this.tracked.clear()
  }
}

export { snapKey }
