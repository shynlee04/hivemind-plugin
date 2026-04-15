/**
 * Pending notification store for offline delivery.
 *
 * When a background task completes but the parent session is offline/idle,
 * the notification is persisted here. On the next session resume, pending
 * notifications are surfaced to the user.
 *
 * Stored in continuity store under `metadata.pendingNotifications`.
 */

import { getSessionContinuity, patchSessionContinuity } from "./continuity.js"
import type { PendingNotification, TaskNotification } from "./types.js"

/**
 * Build a pending notification from a completed task.
 */
export function buildPendingNotification(task: TaskNotification): PendingNotification {
  return {
    ...task,
    createdAt: Date.now(),
    delivered: false,
  }
}

export function persistPendingNotification(
  parentSessionID: string,
  task: TaskNotification,
): PendingNotification | undefined {
  const current = getSessionContinuity(parentSessionID)
  if (!current) {
    return undefined
  }

  const pending = buildPendingNotification(task)
  const existing = current.metadata.pendingNotifications ?? []
  patchSessionContinuity(parentSessionID, {
    pendingNotifications: [...existing, pending],
  })
  return pending
}

/**
 * Format a pending notification for display on session resume.
 */
export function formatPendingNotification(pending: PendingNotification): string {
  const icon =
    pending.status === "completed"
      ? "✓"
      : pending.status === "failed"
        ? "✗"
        : "⊘"
  const link = pending.outputLink ? `\n  View: ${pending.outputLink}` : ""
  const summary = pending.briefSummary ? `\n  ${pending.briefSummary}` : ""
  return `[${icon} Background task: ${pending.description} (${pending.agent}) — ${pending.status}${summary}${link}]`
}

/**
 * Format all pending notifications for a session as a single block.
 */
export function formatPendingNotificationsForSession(
  pending: PendingNotification[],
): string {
  if (pending.length === 0) return ""
  const lines = ["\n<system_reminder>", "Pending background task notifications:"]
  for (const p of pending) {
    lines.push(formatPendingNotification(p))
  }
  lines.push("End of pending notifications.</system_reminder>")
  return lines.join("\n")
}

export type { PendingNotification, TaskNotification }
