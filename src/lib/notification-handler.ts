import type { OpenCodeClient } from "./session-api.js"
import type { SessionContinuityRecord } from "./types.js"

type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]

export type TaskNotification = {
  sessionID: string
  description: string
  agent: string
  status: "started" | "completed" | "failed" | "cancelled"
  error?: string
  resultPreview?: string
  briefSummary?: string
  outputLink?: string
  duration?: number
}

const MAX_PREVIEW_LENGTH = 100

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
    status === "failed"
      ? `Task failed: ${error ?? "unknown error"}.`
      : status === "cancelled"
        ? "Task was cancelled."
        : category === "research" || category === "deep"
          ? `${agent.charAt(0).toUpperCase() + agent.slice(1)} completed research on "${continuity.metadata.description}". Review the session for findings.`
          : category === "review"
            ? `${agent.charAt(0).toUpperCase() + agent.slice(1)} completed review of "${continuity.metadata.description}". Check for identified issues.`
            : `${agent.charAt(0).toUpperCase() + agent.slice(1)} completed work on "${continuity.metadata.description}". Check session output for details.`

  return {
    sessionID: continuity.sessionID,
    description: continuity.metadata.description ?? "Delegated task",
    agent,
    status,
    error,
    briefSummary,
    outputLink,
    duration,
  }
}

export type ToastFn = (message: string) => void

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
