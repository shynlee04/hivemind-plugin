/**
 * PeriodicNotifier — periodic silent injection of delegation progress
 * into parent sessions via combined batch blocks.
 *
 * Queues all delegation snapshots within a 2-second batch window,
 * then flushes ONE combined <system_reminder> block with ALL changed
 * delegations. Single injection path — no double injection.
 * Fire-and-forget: sendPromptAsync failures are caught and logged.
 */

import { formatCompactLine } from "./notification-formatter.js"
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
  batchWindowMs?: number
  showToast?: boolean
  client: unknown
}

interface TrackedDelegation {
  parentSessionId: string
  agent: string
  lastToolCount: number
  lastActionCount: number
}

type InjectFn = (parentSessionId: string, line: string, delegationId?: string) => void

const DEFAULT_BATCH_WINDOW_MS = 2000

/**
 * Strips duration string from a formatted line so dedup comparison
 * focuses on toolCount and actionCount changes, not elapsed time.
 */
function stripDuration(line: string): string {
  return line.replace(/\|\s*\d+(\.\d+)?(ms|s|m\s+\d+s|h\s+\d+m)\s*\|/, "| - |")
}

export class PeriodicNotifier {
  private readonly config: Required<PeriodicNotifierConfig>
  private readonly inject: InjectFn
  private readonly tracked: Map<string, TrackedDelegation> = new Map()
  private readonly pendingFlush: Map<string, DelegationSnapshot> = new Map()
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private lastBatchHash = ""
  private destroyed = false

  constructor(config: PeriodicNotifierConfig, inject: InjectFn) {
    this.config = {
      cadenceMs: config.cadenceMs,
      batchWindowMs: config.batchWindowMs ?? DEFAULT_BATCH_WINDOW_MS,
      showToast: config.showToast ?? false,
      client: config.client,
    }
    this.inject = inject
  }

  get activeCount(): number {
    return this.tracked.size
  }

  register(snapshot: DelegationSnapshot): void {
    if (this.destroyed) return
    this.tracked.set(snapshot.delegationId, {
      parentSessionId: snapshot.parentSessionId,
      agent: snapshot.agent,
      lastToolCount: snapshot.toolCount,
      lastActionCount: snapshot.actionCount,
    })
  }

  deregister(delegationId: string): void {
    this.tracked.delete(delegationId)
    this.pendingFlush.delete(delegationId)
  }

  handlePollTick(snapshot: DelegationSnapshot): void {
    if (this.destroyed) return
    const tracked = this.tracked.get(snapshot.delegationId)
    if (!tracked) return

    const toolChanged = snapshot.toolCount !== tracked.lastToolCount
    const actionChanged = snapshot.actionCount !== tracked.lastActionCount
    if (!toolChanged && !actionChanged) return

    tracked.lastToolCount = snapshot.toolCount
    tracked.lastActionCount = snapshot.actionCount

    // Queue for batch flush — NO immediate injection
    this.pendingFlush.set(snapshot.delegationId, snapshot)
    this.scheduleFlush()
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer)
    }
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null
      this.flush()
    }, this.config.batchWindowMs)
  }

  private flush(): void {
    if (this.destroyed || this.pendingFlush.size === 0) return

    // Cross-batch dedup: compute hash of (delegationId + toolCount + actionCount)
    const sorted = Array.from(this.pendingFlush.entries()).sort(([a], [b]) => a.localeCompare(b))
    const hash = sorted.map(([id, snap]) => `${id}:${snap.toolCount}:${snap.actionCount}`).join("|")
    if (hash === this.lastBatchHash) return
    this.lastBatchHash = hash

    const batch = new Map(this.pendingFlush)
    this.pendingFlush.clear()

    // Group by parentSessionId so each parent receives its own combined block.
    const byParent = new Map<string, string[]>()
    for (const [, snap] of batch) {
      if (!this.tracked.has(snap.delegationId)) continue
      const existing = byParent.get(snap.parentSessionId) ?? []
      existing.push(formatCompactLine({
        delegationId: snap.delegationId,
        agent: snap.agent,
        status: "running",
        elapsedMs: snap.elapsedMs,
        toolCount: snap.toolCount,
      }))
      byParent.set(snap.parentSessionId, existing)
    }

    if (byParent.size === 0) return

    // Send one combined <system_reminder> block per parent
    for (const [parentSessionId, parentLines] of byParent) {
      const combinedBlock = parentLines.join("\n")
      this.inject(parentSessionId, combinedBlock, undefined)
    }

    // Aggregated toast: one toast for the entire batch
    if (this.config.showToast) {
      const toastClient = this.config.client as OpenCodeClient | undefined
      if (toastClient) {
        const count = batch.size
        const topAgents = Array.from(batch.values())
          .sort((a, b) => b.elapsedMs - a.elapsedMs)
          .slice(0, 3)
          .map((s) => s.agent)
        const suffix = count > 3 ? ` +${count - 3} more` : ""
        showTuiToast(toastClient, `${count} delegations active · ${topAgents.join(" ")}${suffix}`).catch((err) => {
          toastClient.app?.log?.({ body: { service: "PeriodicNotifier", level: "warn", message: `[Harness] Toast failed: ${err instanceof Error ? err.message : String(err)}` } })
        })
      }
    }
  }

  destroy(): void {
    this.destroyed = true
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.tracked.clear()
    this.pendingFlush.clear()
  }
}

export { stripDuration }
