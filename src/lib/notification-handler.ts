/**
 * Notification delivery for parent sessions.
 *
 * Re-activated in Phase 16.2 for terminal-state delegation notifications.
 * Provides fire-and-forget SDK prompt delivery with structured payload.
 *
 * Audit: G-01 closed as by-design (2026-04-21)
 */

import type { OpenCodeClient } from "./session-api.js"
import type { Delegation } from "./types.js"
import type { SessionContinuityRecord, TaskNotification } from "./types.js"
import { getSessionContinuity, patchSessionContinuity, recordSessionContinuity } from "./continuity.js"

type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]

const MAX_PREVIEW_LENGTH = 500

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

export function buildTaskNotificationFromContinuity(
  continuity: SessionContinuityRecord,
  status: TaskNotification["status"],
  error?: string,
): TaskNotification {
  const launchedAt = continuity.metadata.lifecycle?.launchedAt
  const completedAt = continuity.metadata.lifecycle?.completedAt ?? Date.now()
  const duration = launchedAt ? completedAt - launchedAt : undefined
  const outputLink = `session://${continuity.sessionID}`
  const agent = continuity.metadata.delegation?.agent ?? "unknown"
  const category = continuity.metadata.category
  const briefSummary =
    status === "started"
      ? `${String(agent).charAt(0).toUpperCase()}${String(agent).slice(1)} started work on "${continuity.metadata.description}". Session is running.`
      : status === "failed"
        ? `Task failed: ${error ?? "unknown error"}.`
        : status === "cancelled"
          ? "Task was cancelled."
          : category === "research" || category === "deep"
            ? `${String(agent).charAt(0).toUpperCase()}${String(agent).slice(1)} completed research on "${continuity.metadata.description}". Review the session for findings.`
            : category === "review"
              ? `${String(agent).charAt(0).toUpperCase()}${String(agent).slice(1)} completed review of "${continuity.metadata.description}". Check for identified issues.`
              : `${String(agent).charAt(0).toUpperCase()}${String(agent).slice(1)} completed work on "${continuity.metadata.description}". Check session output for details.`

  const capturedResult = continuity.metadata.resultCapture
  const resultPreview = capturedResult?.resultText ?? undefined
  const artifacts = capturedResult?.artifactPaths && capturedResult.artifactPaths.length > 0
    ? capturedResult.artifactPaths
    : undefined
  const commits = capturedResult?.gitCommits && capturedResult.gitCommits.length > 0
    ? capturedResult.gitCommits
    : undefined

  const effectiveSummary = status === "completed" && capturedResult?.resultText
    ? capturedResult.resultText.slice(0, 200).trim() + (capturedResult.resultText.length > 200 ? "..." : "")
    : briefSummary

  return {
    sessionID: continuity.sessionID,
    description: continuity.metadata.description ?? "Delegated task",
    agent: String(agent),
    status,
    error,
    resultPreview,
    briefSummary: effectiveSummary,
    outputLink,
    duration,
    artifacts,
    commits,
  }
}

export type ToastFn = (message: string) => void

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
  toastFn?: ToastFn
): Promise<boolean> {
  const message = buildNotificationMessage(task)
  let delivered = true

  const body = {
    noReply: true,
    parts: [{ type: "text", text: message }],
  }

  try {
    await client.session.prompt({
      path: { id: parentSessionID },
      body: body as SessionPromptRequest["body"],
    })
  } catch {
    delivered = false
  }

  if (toastFn) {
    try {
      toastFn(formatToastMessage(task))
    } catch {
      // Best-effort: toast failure is not critical
    }
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
 * R-NOTIF-04: Delivered via direct `client.session.prompt()` call.
 */
export async function notifyDelegationTerminal(
  client: OpenCodeClient,
  delegation: Delegation,
): Promise<void> {
  const task = buildDelegationTaskNotification(delegation)
  const message = buildNotificationMessage(task)

  try {
    await client.session.prompt({
      path: { id: delegation.parentSessionId },
      body: { noReply: true, parts: [{ type: "text", text: message }] },
    })
  } catch (error) {
    queuePendingNotification(delegation.parentSessionId, task)
    console.error(
      `[Harness] Failed to notify parent session ${delegation.parentSessionId} of delegation ${delegation.id} terminal state: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export type { TaskNotification }
