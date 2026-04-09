import type { OpenCodeClient } from "./session-api.js"

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

export type ToastFn = (message: string) => void

export async function notifyParentSession(
  client: OpenCodeClient,
  parentSessionID: string,
  task: TaskNotification,
  toastFn?: ToastFn
): Promise<void> {
  const message = buildNotificationMessage(task)

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
    // Best-effort: notification failure should not propagate
    // The parent session can still observe completion via events
  }

  if (toastFn) {
    try {
      toastFn(formatToastMessage(task))
    } catch {
      // Best-effort: toast failure is not critical
    }
  }
}
