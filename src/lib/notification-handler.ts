import type { OpenCodeClient } from "./session-api.js"

type SessionPromptRequest = Parameters<OpenCodeClient["session"]["prompt"]>[0]

export type TaskNotification = {
  sessionID: string
  description: string
  agent: string
  status: "completed" | "failed" | "cancelled"
  error?: string
  resultPreview?: string
  duration?: number
}

const MAX_PREVIEW_LENGTH = 100

export function buildNotificationMessage(task: TaskNotification): string {
  const lines = [
    `<system_reminder>`,
    `Delegated task completed:`,
    `- Task: ${task.description}`,
    `- Agent: ${task.agent}`,
    `- Status: ${task.status}`,
  ]

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

  if (task.duration !== undefined) {
    lines.push(`- Duration: ${task.duration}ms`)
  }

  lines.push(`</system_reminder>`)

  return lines.join("\n")
}

export function formatToastMessage(task: TaskNotification): string {
  const icon =
    task.status === "completed" ? "✓" : task.status === "failed" ? "✗" : "⊘"
  return `${icon} ${task.description} ${task.status} (${task.agent})`
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
