import type { DelegationNotification, DelegationNotificationType } from "./types.js"

export interface RouteResult {
  parentSessionId: string
  notification: DelegationNotification
}

export interface StatusBlockParams {
  delegationId: string
  status: string
  elapsedSeconds: number
  toolCalls: number
  bashCommands: number
  skillLoads: number
}

export interface CompletionSummary {
  delegationId: string
  task: string
  result: string
  filesChanged: string[]
  timestamp: string
  elapsedHuman: string
}

type RouteEntry = {
  parentSessionId: string
  notifications: DelegationNotification[]
}

const NOTIFICATION_ICONS: Record<DelegationNotificationType, string> = {
  failure: "❌",
  progress: "🔄",
  success: "✅",
  timeout: "⏰",
}

/** Formats delegation status blocks for TUI tool return output. */
export class StatusFormatter {
  /** Format a compact status line for tool return output. */
  formatStatus(params: StatusBlockParams): string {
    return `[DELEGATION STATUS] ${params.delegationId} | ${params.status} | ${params.elapsedSeconds}s | tools:${params.toolCalls} bash:${params.bashCommands} skills:${params.skillLoads}`
  }
}

/** Formats delegation completion summaries for TUI display. */
export class CompletionFormatter {
  /** Format a completion summary block for TUI message display. */
  formatCompletion(summary: CompletionSummary): string {
    const files = summary.filesChanged.length > 0
      ? `Files: ${summary.filesChanged.join(", ")}`
      : "Files: (none)"
    return `[DELEGATION COMPLETE] Task: ${summary.task} | Result: ${summary.result} | ${files} | Timestamp: ${summary.timestamp} | Elapsed: ${summary.elapsedHuman}`
  }
}

/** Routes delegation notifications to their owning parent session. */
export class NotificationRouter {
  private readonly routes = new Map<string, RouteEntry>()
  private readonly pendingLimit = 50
  private readonly statusFormatter = new StatusFormatter()
  private readonly completionFormatter = new CompletionFormatter()

  /** Register a delegation-to-parent route. */
  register(delegationId: string, parentSessionId: string): void {
    this.routes.set(delegationId, { parentSessionId, notifications: [] })
  }

  /** Resolve a notification target without broadcasting to unrelated parents. */
  route(notification: DelegationNotification): RouteResult | undefined {
    const route = this.routes.get(notification.delegationId)
    return route ? { parentSessionId: route.parentSessionId, notification } : undefined
  }

  /** Remove a route after terminal completion. */
  deregister(delegationId: string): void {
    this.routes.delete(delegationId)
  }

  /** Queue a pending notification, bounded to the latest 50 entries. */
  queuePending(delegationId: string, notification: DelegationNotification): void {
    const route = this.routes.get(delegationId)
    if (!route) return
    route.notifications.push(notification)
    if (route.notifications.length > this.pendingLimit) route.notifications.splice(0, route.notifications.length - this.pendingLimit)
  }

  /** Replay and clear pending notifications for a parent in FIFO order. */
  replayPending(parentSessionId: string): DelegationNotification[] {
    const replayed: DelegationNotification[] = []
    for (const route of this.routes.values()) {
      if (route.parentSessionId !== parentSessionId) continue
      replayed.push(...route.notifications.splice(0))
    }
    return replayed.sort((left, right) => left.timestamp - right.timestamp)
  }

  /** Format a compact parent-facing notification line. */
  formatNotification(type: DelegationNotificationType, delegationId: string, message: string): string {
    return `${NOTIFICATION_ICONS[type]} [DT:${delegationId}] ${type} — ${message}`
  }

  /** Format a status block for TUI tool return output (Option A: no injection). */
  formatStatusBlock(params: StatusBlockParams): string {
    return this.statusFormatter.formatStatus(params)
  }

  /** Format a completion summary for TUI display. */
  formatCompletionSummary(summary: CompletionSummary): string {
    return this.completionFormatter.formatCompletion(summary)
  }
}
