/**
 * NotificationDeliverer — consolidated delivery logic for parent session notifications.
 *
 * Consolidates delivery logic previously split across:
 * - `notification-handler.ts` (delegation/terminal notifications)
 * - `notification-router.ts` formatting functions (formally `notification-formatter.ts`)
 *
 * Provides a unified class interface for toast + context injection,
 * deduplication, pending queue replay, and session reactivation.
 *
 * @module coordination/notifier
 */

import { sendPromptAsync, showTuiToast, type OpenCodeClient } from "../shared/session-api.js"
import type { Delegation } from "../shared/types.js"
import type { TaskNotification } from "../shared/types.js"
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "../task-management/continuity/index.js"
import {
  formatCompactLine as routerFormatCompactLine,
  formatDuration,
} from "./delegation/notification-router.js"

const MAX_PREVIEW_LENGTH = 500

function statusIcon(status: TaskNotification["status"]): string {
  switch (status) {
    case "started": return "▶"
    case "completed": return "✓"
    case "failed": return "✗"
    case "cancelled": return "⊘"
  }
}

function toastVariant(status: TaskNotification["status"]): "info" | "success" | "error" | "warning" {
  switch (status) {
    case "started": return "info"
    case "completed": return "success"
    case "failed": return "error"
    case "cancelled": return "warning"
  }
}

function computeProgressPct(delegation: Delegation): number | undefined {
  if (!delegation.toolCallCount && !delegation.actionCount && !delegation.messageCount) return undefined
  const raw = ((delegation.toolCallCount ?? 0) * 3 + (delegation.messageCount ?? 0) * 2 + (delegation.actionCount ?? 0)) / 30
  return Math.min(Math.round(raw * 100), 99)
}

function buildDelegationPreview(
  delegation: Delegation,
  duration: number,
  summaryPreview?: string,
): string {
  const terminalState = delegation.terminalKind ?? delegation.status
  const previewSuffix = summaryPreview ? ` Summary preview: ${summaryPreview}` : ""
  return `Delegated work finished with terminal state ${terminalState} after ${formatDuration(duration)}.${previewSuffix}`
}

function buildDelegationTask(delegation: Delegation): TaskNotification {
  const duration = delegation.completedAt
    ? delegation.completedAt - delegation.createdAt
    : Date.now() - delegation.createdAt

  const summaryPreview =
    delegation.result?.slice(0, MAX_PREVIEW_LENGTH) ??
    delegation.error?.slice(0, MAX_PREVIEW_LENGTH) ??
    undefined

  return {
    sessionID: delegation.childSessionId,
    description: `Delegation: ${delegation.agent}`,
    agent: delegation.agent,
    status: delegation.status === "completed" ? "completed" : delegation.explicitCancellation ? "cancelled" : "failed",
    error: delegation.status === "completed" ? undefined : delegation.error,
    resultPreview: summaryPreview,
    briefSummary: buildDelegationPreview(delegation, duration, summaryPreview),
    outputLink: `session://${delegation.childSessionId}`,
    duration,
    toolCallCount: delegation.toolCallCount,
    actionCount: delegation.actionCount,
    messageCount: delegation.messageCount,
    signalSource: delegation.signalSource,
    elapsedHuman: formatDuration(duration),
    progressPct: computeProgressPct(delegation),
    metadata: {
      delegationId: delegation.id,
      terminalState: delegation.status,
      recoveryGuarantee: delegation.recoveryGuarantee,
      summaryPreview,
    },
  }
}

function buildNotificationMessage(task: TaskNotification): string {
  const statusLabel =
    task.status === "started"
      ? "started"
      : task.status === "completed"
        ? "completed"
        : task.status === "failed"
          ? "failed"
          : "cancelled"

  const lines = [
    `<system_reminder>`,
    task.status === "started"
      ? `Delegated task started:`
      : `Delegated task ${statusLabel}:`,
    `- Task: ${task.description}`,
    `- Agent: ${task.agent}`,
  ]

  if (task.status !== "started") {
    lines.push(`- Status: ${task.status}`)
  }

  if (task.error) {
    lines.push(`- Error: ${task.error}`)
  }

  if (task.resultPreview) {
    const preview =
      task.resultPreview.length > MAX_PREVIEW_LENGTH
        ? task.resultPreview.slice(0, MAX_PREVIEW_LENGTH) + "..."
        : task.resultPreview
    lines.push(`- Result: ${preview}`)
  }

  if (task.briefSummary) {
    lines.push(`- Summary: ${task.briefSummary}`)
  }

  if (task.outputLink) {
    lines.push(`- View results: ${task.outputLink}`)
  }

  if (task.duration !== undefined) {
    lines.push(`- Duration: ${formatDuration(task.duration)}`)
  }

  if (task.elapsedHuman && task.elapsedHuman !== (task.duration !== undefined ? formatDuration(task.duration) : undefined)) {
    lines.push(`- Elapsed: ${task.elapsedHuman}`)
  }

  if (task.toolCallCount !== undefined) {
    lines.push(`- Tool calls: ${task.toolCallCount}`)
  }

  if (task.actionCount !== undefined) {
    lines.push(`- Actions: ${task.actionCount}`)
  }

  if (task.messageCount !== undefined) {
    lines.push(`- Messages: ${task.messageCount}`)
  }

  if (task.signalSource) {
    lines.push(`- Signal source: ${task.signalSource}`)
  }

  if (task.progressPct !== undefined) {
    lines.push(`- Progress: ${task.progressPct}%`)
  }

  if (task.metadata) {
    lines.push(`- Metadata: ${JSON.stringify(task.metadata)}`)
  }

  lines.push(`</system_reminder>`)

  return lines.join("\n")
}

function formatToast(task: TaskNotification): string {
  const icon = statusIcon(task.status)
  const duration = task.duration !== undefined ? ` [${formatDuration(task.duration)}]` : ""
  return `${icon} ${task.description} ${task.status} (${task.agent})${duration}`
}

/**
 * In-memory deduplication guard for completion notifications.
 * Tracks the hash of the last delivered notification per delegation to
 * prevent the same completion notification from being re-injected on
 * consecutive turns, which triggers the agent-looping behavior.
 */
const deliveredHashes = new Map<string, { hash: string; deliveredAt: number }>()
const MAX_DEDUP_ENTRIES = 100

function computeHash(message: string): string {
  let hash = 0
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash.toString(16)
}

function queuePending(parentSessionID: string, notification: TaskNotification): void {
  const queued = {
    ...notification,
    metadata: notification.metadata ? { ...notification.metadata } : undefined,
    artifacts: notification.artifacts ? [...notification.artifacts] : undefined,
    commits: notification.commits ? [...notification.commits] : undefined,
    createdAt: Date.now(),
    delivered: false,
    retryCount: 0,
    maxRetries: 3,
  }
  const current = getSessionContinuity(parentSessionID)
  const existing = current?.metadata.pendingNotifications ?? []

  if (current) {
    patchSessionContinuity(parentSessionID, {
      pendingNotifications: [...existing, queued],
    })
    return
  }

  recordSessionContinuity({
    sessionID: parentSessionID,
    promptParams: {},
    metadata: {
      status: "running",
      description: "Recovered parent session notification queue",
      delegation: null,
      constraints: [],
      pendingNotifications: [queued],
      updatedAt: Date.now(),
    },
  })
}

/**
 * Consolidated notification delivery service.
 *
 * Provides a unified interface for:
 * - Toast notifications (user-visible, agent-invisible)
 * - Context injection via async prompt (fire-and-forget)
 * - Deduplication of terminal notifications
 * - Pending queue replay
 * - Session stream reactivation
 */
export class NotificationDeliverer {
  /**
   * Deliver a notification to a parent session using toast + context injection.
   *
   * @param client - OpenCode SDK client
   * @param parentSessionID - The parent session to notify
   * @param task - Notification task payload
   * @returns `true` when context injection succeeds, `false` on failure
   */
  async notifyParentSession(
    client: OpenCodeClient,
    parentSessionID: string,
    task: TaskNotification,
  ): Promise<boolean> {
    const message = buildNotificationMessage(task)
    let delivered = true

    // 1. User toast (transient, agent-invisible)
    try {
      await showTuiToast(client, formatToast(task), toastVariant(task.status))
    } catch (error) {
      void client.app?.log?.({
        body: {
          service: "notification",
          level: "error",
          message: `[Hivemind] Toast failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      })
    }

    // 2. Context injection via async prompt (agent sees, no AI response triggered)
    try {
      await sendPromptAsync(client, parentSessionID, {
        noReply: true,
        parts: [{ type: "text", text: message }],
      })
    } catch (error) {
      delivered = false
      queuePending(parentSessionID, task)
      void client.app?.log?.({
        body: {
          service: "notification",
          level: "error",
          message: `[Hivemind] Context injection failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      })
    }

    return delivered
  }

  /**
   * Fire-and-forget notification of a delegation's terminal state to its parent session.
   * Includes deduplication to prevent agent-looping from repeated notifications.
   *
   * R-NOTIF-02: Payload contains taskId, terminalState, resultSummary, duration.
   * R-NOTIF-03: Delivery failure does NOT block the terminal transition.
   */
  async notifyDelegationTerminal(
    client: OpenCodeClient,
    delegation: Delegation,
  ): Promise<void> {
    const task = buildDelegationTask(delegation)
    const message = buildNotificationMessage(task)

    // Dedup check — skip re-injection of identical notifications
    const msgHash = computeHash(message)
    const alreadyDelivered = deliveredHashes.get(delegation.id)
    if (alreadyDelivered && alreadyDelivered.hash === msgHash) {
      void client.app?.log?.({
        body: {
          service: "delegation",
          level: "info",
          message: `[Hivemind] Skipping duplicate notification for delegation ${delegation.id}: already delivered at ${new Date(alreadyDelivered.deliveredAt).toISOString()}`,
        },
      })
      // Still show the toast (user-visible transient notifications are fine)
      try {
        await showTuiToast(client, formatToast(task), toastVariant(task.status))
      } catch {
        // Best-effort
      }
      return
    }

    // 1. User toast (transient, agent-invisible)
    try {
      await showTuiToast(client, formatToast(task), toastVariant(task.status))
    } catch (error) {
      void client.app?.log?.({
        body: {
          service: "delegation",
          level: "error",
          message: `[Hivemind] Toast failed for delegation ${delegation.id}: ${error instanceof Error ? error.message : String(error)}`,
        },
      })
    }

    // 2. Context injection into parent session (reactivates stream if stopped)
    try {
      await sendPromptAsync(client, delegation.parentSessionId, { noReply: true, parts: [{ type: "text", text: message }] })
    } catch (error) {
      queuePending(delegation.parentSessionId, task)
      void client.app?.log?.({
        body: {
          service: "delegation",
          level: "error",
          message: `[Hivemind] Failed to notify parent session ${delegation.parentSessionId} of delegation ${delegation.id} terminal state: ${error instanceof Error ? error.message : String(error)}`,
        },
      })
    }

    // Record delivery for dedup (bound map size)
    if (deliveredHashes.size >= MAX_DEDUP_ENTRIES) {
      const oldest = deliveredHashes.entries().next()
      if (oldest.value) deliveredHashes.delete(oldest.value[0])
    }
    deliveredHashes.set(delegation.id, { hash: msgHash, deliveredAt: Date.now() })
  }

  /**
   * Reactivate a stopped parent session stream by sending an empty async prompt.
   * Best-effort: if reactivation fails, notification is still delivered.
   */
  async reactivateSessionStream(
    client: OpenCodeClient,
    sessionID: string,
  ): Promise<void> {
    try {
      await sendPromptAsync(client, sessionID, {
        noReply: true,
        parts: [{ type: "text", text: "" }],
      })
    } catch (error) {
      void client.app?.log?.({
        body: {
          service: "notification",
          level: "warn",
          message: `[Hivemind] Stream reactivation failed for ${sessionID}: ${error instanceof Error ? error.message : String(error)}`,
        },
      })
    }
  }

  /**
   * Replay pending notifications that were queued during prior delivery failures.
   */
  async replayPending(
    client: OpenCodeClient,
    parentSessionID: string,
    notifications: TaskNotification[],
  ): Promise<boolean> {
    for (const notification of notifications) {
      const delivered = await this.notifyParentSession(client, parentSessionID, notification)
      if (!delivered) {
        return false
      }
    }
    return true
  }

  /**
   * Format a compact line suitable for periodic progress injection.
   * Delegates to notification-router.ts formatting utilities.
   */
  formatCompactStatus(
    delegationId: string,
    agent: string,
    status: "completed" | "error" | "timeout" | "cancelled" | "running",
    elapsedMs: number,
    toolCount?: number,
  ): string {
    return routerFormatCompactLine({ delegationId, agent, status, elapsedMs, toolCount })
  }
}

// ---------------------------------------------------------------------------
// Singleton instance
// ---------------------------------------------------------------------------

/** Shared NotificationDeliverer instance used across coordination modules. */
export const notificationDeliverer = new NotificationDeliverer()

// ---------------------------------------------------------------------------
// Re-exported standalone helpers for backward compatibility
// ---------------------------------------------------------------------------

/**
 * @deprecated Use `notificationDeliverer.notifyParentSession()` instead.
 * Kept for backward compatibility during migration.
 */
export async function notifyParentSession(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
): Promise<boolean> {
  return notificationDeliverer.notifyParentSession(client, parentSessionID, task)
}

/**
 * @deprecated Use `notificationDeliverer.notifyDelegationTerminal()` instead.
 * Kept for backward compatibility during migration.
 */
export async function notifyDelegationTerminal(
  client: OpenCodeClient,
  delegation: Delegation,
): Promise<void> {
  return notificationDeliverer.notifyDelegationTerminal(client, delegation)
}

/**
 * @deprecated Use `notificationDeliverer.reactivateSessionStream()` instead.
 * Kept for backward compatibility during migration.
 */
export async function reactivateSessionStream(
  client: OpenCodeClient,
  sessionID: string,
): Promise<void> {
  return notificationDeliverer.reactivateSessionStream(client, sessionID)
}

/**
 * @deprecated Use `notificationDeliverer.replayPending()` instead.
 * Kept for backward compatibility during migration.
 */
export async function replayPendingNotifications(
  client: OpenCodeClient,
  parentSessionID: string,
  notifications: TaskNotification[],
): Promise<boolean> {
  return notificationDeliverer.replayPending(client, parentSessionID, notifications)
}

export type { TaskNotification }
