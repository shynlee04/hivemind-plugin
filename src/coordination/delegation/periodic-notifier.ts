/**
 * PeriodicNotifier — periodic silent injection of delegation progress
 * into parent sessions via the monitor's inject callback.
 *
 * Deduplicates by comparing toolCount + actionCount snapshots.
 * Single immediate injection per state change — no batch flush to avoid
 * duplicate messages in the parent session context.
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

    this.injectSnapshot(snapshot)
  }

  private injectSnapshot(snapshot: DelegationSnapshot): void {
    if (!this.tracked.has(snapshot.delegationId)) return
    const line = formatCompactLine({
      delegationId: snapshot.delegationId,
      agent: snapshot.agent,
      status: "running",
      elapsedMs: snapshot.elapsedMs,
      toolCount: snapshot.toolCount,
    })
    this.inject(snapshot.parentSessionId, line, snapshot.delegationId)

    if (this.config.showToast) {
      const toastClient = this.config.client as OpenCodeClient | undefined
      if (toastClient) {
        showTuiToast(toastClient, `[DT:${snapshot.delegationId}] ${snapshot.agent} — ${formatElapsed(snapshot.elapsedMs)}`).catch(() => {})
      }
    }
  }

  destroy(): void {
    this.destroyed = true
    this.tracked.clear()
  }
}

function formatElapsed(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

export { stripDuration }
