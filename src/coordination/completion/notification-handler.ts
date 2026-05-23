/**
 * Notification delivery for parent sessions.
 *
 * Re-activated in Phase 16.2 for terminal-state delegation notifications.
 * Provides fire-and-forget SDK prompt delivery with structured payload.
 *
 * Audit: G-01 closed as by-design (2026-04-21)
 */

import { sendPromptAsync, showTuiToast, type OpenCodeClient } from "../../shared/session-api.js"
import type { Delegation } from "../../shared/types.js"
import type { TaskNotification } from "../../shared/types.js"
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "../../task-management/continuity/index.js"

const MAX_PREVIEW_LENGTH = 500

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

function computeProgressPct(delegation: Delegation): number | undefined {
  if (!delegation.toolCallCount && !delegation.actionCount && !delegation.messageCount) return undefined
  const raw = ((delegation.toolCallCount ?? 0) * 3 + (delegation.messageCount ?? 0) * 2 + (delegation.actionCount ?? 0)) / 30
  return Math.min(Math.round(raw * 100), 99)
}

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

export function formatToastMessage(task: TaskNotification): string {
  const icon = statusIcon(task.status)
  const duration = task.duration !== undefined ? ` [${formatDuration(task.duration)}]` : ""
  return `${icon} ${task.description} ${task.status} (${task.agent})${duration}`
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

/**
 * Reactivate a stopped parent session stream by sending an empty async prompt.
 *
 * Reserved for Step 3 (stream reactivation). Uses `sendPromptAsync()` instead of
 * `sendPrompt()` to avoid blocking and avoid unnecessary response handling.
 * Best-effort: if reactivation fails, notification is still delivered.
 */
export async function reactivateSessionStream(
  client: OpenCodeClient,
  sessionID: string,
): Promise<void> {
  try {
    await sendPromptAsync(client, sessionID, {
      noReply: true,
      parts: [{ type: "text", text: "" }],
    })
  } catch {
    // Best-effort: if reactivation fails, notification still delivered
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

/**
 * Deliver a notification to the parent session using two mechanisms:
 *
 * 1. **Toast** - `showTuiToast()` — user-visible, transient, agent-invisible
 * 2. **Context injection** - `sendPromptAsync()` — fire-and-forget message that
 *    agent sees in its context window. Uses `noReply: true` (no AI auto-response).
 *
 * Step 1 of the notification redesign (2026-05-23):
 * - Replaces `appendTuiPrompt()` with `showTuiToast()` — fixes input pollution bug
 * - Replaces `sendPrompt()` with `sendPromptAsync()` — no blocking, no response wait
 * - Removes `remove `synthetic: true` — it's a TextPart-level property, not message-level
 *
 * @param client - OpenCode SDK client
 * @param parentSessionID - The parent session to notify
 * @param task - Notification task payload
 * @returns `true` when context injection succeeds, `false` on failure
 */
export async function notifyParentSession(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
): Promise<boolean> {
  const message = buildNotificationMessage(task)
  let delivered = true

  // 1. User toast (transient, agent-invisible)
  try {
    await showTuiToast(client, formatToastMessage(task), toastVariant(task.status))
  } catch (error) {
    // Best-effort: toast failure doesn't block context delivery
    void client.app?.log?.({
      body: {
        service: "notification",
        level: "error",
        message: `[Harness] Toast failed: ${error instanceof Error ? error.message : String(error)}`,
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
    queuePendingNotification(parentSessionID, task)
    void client.app?.log?.({
      body: {
        service: "notification",
        level: "error",
        message: `[Harness] Context injection failed: ${error instanceof Error ? error.message : String(error)}`,
      },
    })
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
 * Step 1 implementation:
 * - Uses `showTuiToast()` for user visibility
 * - Uses `sendPromptAsync()` for fire-and-forget context injection into parent session
 *
 * R-NOTIF-02: Payload contains taskId, terminalState, resultSummary, duration.
 * R-NOTIF-03: Delivery failure does NOT block the terminal transition.
 */
export async function notifyDelegationTerminal(
  client: OpenCodeClient,
  delegation: Delegation,
): Promise<void> {
  const task = buildDelegationTaskNotification(delegation)
  const message = buildNotificationMessage(task)

  // 1. User toast (transient, agent-invisible)
  try {
    await showTuiToast(client, formatToastMessage(task), toastVariant(task.status))
  } catch {
    // Best-effort: toast failure doesn't block context delivery
  }

  // 2. Combined reactivation + context injection into parent session.
  // A single sendPromptAsync call reactivates the stream (if stopped) AND
  // delivers the completion notification — no need for separate empty prompt.
  try {
    await sendPromptAsync(client, delegation.parentSessionId, { noReply: true, parts: [{ type: "text", text: message }] })
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
