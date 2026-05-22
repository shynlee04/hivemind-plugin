/**
 * Notification delivery for parent sessions.
 *
 * Re-activated in Phase 16.2 for terminal-state delegation notifications.
 * Provides fire-and-forget SDK prompt delivery with structured payload.
 *
 * Audit: G-01 closed as by-design (2026-04-21)
 */

import { sendPrompt, appendTuiPrompt, type OpenCodeClient } from "../../shared/session-api.js"
import type { Delegation } from "../../shared/types.js"
import type { TaskNotification } from "../../shared/types.js"
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "../../task-management/continuity/index.js"

const MAX_PREVIEW_LENGTH = 500
export const STALL_TIMEOUT_MS = 60000

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

export function buildNotificationMessage(task: TaskNotification): string {
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
    const formatted = formatDuration(task.duration)
    lines.push(`- Duration: ${formatted}`)
  }

  if (task.metadata) {
    lines.push(`- Metadata: ${JSON.stringify(task.metadata)}`)
  }

  lines.push(`</system_reminder>`)

  return lines.join("\n")
}

export function formatToastMessage(task: TaskNotification): string {
  const icon =
    task.status === "started"
      ? "▶"
      : task.status === "completed"
        ? "✓"
        : task.status === "failed"
          ? "✗"
          : "⊘"
  const duration = task.duration !== undefined ? ` [${formatDuration(task.duration)}]` : ""
  return `${icon} ${task.description} ${task.status} (${task.agent})${duration}`
}

export type ToastFn = (message: string) => void

/**
 * Reactivate a stopped parent session stream by sending an empty synthetic prompt.
 *
 * Per D3: Send empty synthetic prompt to reactivate stopped session stream,
 * THEN deliver notification. Empty synthetic prompt should NOT trigger AI loop.
 * Best-effort: if reactivation fails, notification is still delivered.
 */
export async function reactivateSessionStream(
  client: OpenCodeClient,
  sessionID: string,
): Promise<void> {
  try {
    await sendPrompt(client, sessionID, {
      noReply: true,
      parts: [{ type: "text", text: "", synthetic: true }],
    })
  } catch {
    // Best-effort: if reactivation fails, notification still delivered
  }
}

function buildDelegationSummary(
  delegation: Delegation,
  duration: number,
  summaryPreview?: string,
): string {
  const terminalState = delegation.terminalKind ?? delegation.status
  const previewSuffix = summaryPreview ? ` Summary preview: ${summaryPreview}` : ""
  return `Delegated work finished with terminal state ${terminalState} after ${formatDuration(duration)}.${previewSuffix}`
}

function buildDelegationTaskNotification(delegation: Delegation): TaskNotification {
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
    briefSummary: buildDelegationSummary(delegation, duration, summaryPreview),
    outputLink: `session://${delegation.childSessionId}`,
    duration,
    metadata: {
      delegationId: delegation.id,
      terminalState: delegation.status,
      recoveryGuarantee: delegation.recoveryGuarantee,
      summaryPreview,
    },
  }
}

function queuePendingNotification(parentSessionID: string, notification: TaskNotification): void {
  const queuedNotification = {
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
      pendingNotifications: [...existing, queuedNotification],
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
      pendingNotifications: [queuedNotification],
      updatedAt: Date.now(),
    },
  })
}

export async function notifyParentSession(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
  toastFn?: ToastFn,
  options?: { urgent?: boolean }
): Promise<boolean> {
  const message = buildNotificationMessage(task)
  let delivered = true

  // Determine delivery mechanism
  // Urgent by default for terminal states (failed/completed)
  const isUrgent = options?.urgent ?? (task.status === "failed" || task.status === "completed")

  if (isUrgent) {
    // Reactivate stream if needed (D3)
    try {
      await reactivateSessionStream(client, parentSessionID)
    } catch {
      // Best-effort: notification still delivered
    }

    // Urgent: append to TUI prompt so agent sees it immediately
    try {
      if (toastFn) toastFn(formatToastMessage(task))
      await appendTuiPrompt(client, formatToastMessage(task))
    } catch {
      // Best-effort
    }
  }

  const body = {
    noReply: !isUrgent,
    parts: [{ type: "text", text: message, synthetic: true }],
  }

  try {
    await sendPrompt(client, parentSessionID, body)
  } catch {
    delivered = false
    queuePendingNotification(parentSessionID, task)
  }

  return delivered
}

export async function replayPendingNotifications(
  client: OpenCodeClient,
  parentSessionID: string,
  notifications: TaskNotification[],
): Promise<boolean> {
  for (const notification of notifications) {
    const delivered = await notifyParentSession(client, parentSessionID, notification)
    if (!delivered) {
      return false
    }
  }

  return true
}

/**
 * Fire-and-forget notification of a delegation's terminal state to its parent session.
 *
 * R-NOTIF-02: Payload contains taskId, terminalState, resultSummary, duration.
 * R-NOTIF-03: Delivery failure does NOT block the terminal transition.
 * R-NOTIF-04: Delivered through the typed `sendPrompt()` SDK wrapper.
 */
export async function notifyDelegationTerminal(
  client: OpenCodeClient,
  delegation: Delegation,
): Promise<void> {
  const task = buildDelegationTaskNotification(delegation)
  const message = buildNotificationMessage(task)

  // Reactivate stream before terminal notification delivery
  await reactivateSessionStream(client, delegation.parentSessionId)

  try {
    await sendPrompt(client, delegation.parentSessionId, { noReply: true, parts: [{ type: "text", text: message, synthetic: true }] })
  } catch (error) {
    queuePendingNotification(delegation.parentSessionId, task)
    void client.app?.log?.({
      body: {
        service: "delegation",
        level: "error",
        message: `[Harness] Failed to notify parent session ${delegation.parentSessionId} of delegation ${delegation.id} terminal state: ${error instanceof Error ? error.message : String(error)}`,
      },
    })
  }
}

export type { TaskNotification }
