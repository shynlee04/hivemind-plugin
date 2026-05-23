/**
 * Pure formatting functions for TUI delegation notifications.
 *
 * Converts delegation completion data into compact notification strings
 * for thin-line injection, toast display, and full system reminder blocks.
 * No side effects, no SDK calls, no state — pure functions only.
 */

import type { DelegationNotificationType } from "./types.js"

export interface NotificationFormatOptions {
  delegationId: string
  agent: string
  status: "completed" | "error" | "timeout" | "cancelled" | "running"
  elapsedMs: number
  toolCount?: number
  summaryPreview?: string
  /** Path to working directory or result file */
  path?: string
  /** List of modified/created files detected by completion detector */
  fileChanges?: string[]
  /** ISO 8601 completion timestamp */
  completedAt?: string
}

const STATUS_ICONS: Record<string, string> = {
  completed: "✅",
  error: "❌",
  timeout: "⏰",
  cancelled: "⊘",
  running: "🔄",
}

/**
 * Format a full system reminder block for session prompt delivery.
 * Wraps output in <system_reminder> tags with all available fields.
 */
export function formatDelegationNotification(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  const tools = opts.toolCount != null ? String(opts.toolCount) : "n/a"
  const summary = opts.summaryPreview ? ` | ${opts.summaryPreview}` : ""
  const path = opts.path ? ` | path=${opts.path}` : ""
  const files = opts.fileChanges ? ` | files=${opts.fileChanges.length}` : ""
  const timestamp = opts.completedAt ? ` | at=${opts.completedAt}` : ""
  return `<system_reminder>[DT:${opts.delegationId}] ${icon} ${opts.status} | agent=${opts.agent} | ${formatDuration(opts.elapsedMs)} | tools=${tools}${path}${files}${timestamp}${summary}</system_reminder>`
}

/**
 * Format a compact thin-line string for TUI prompt append.
 * Omits summary preview to keep the line short and scannable.
 */
export function formatCompactLine(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  const tools = opts.toolCount != null ? String(opts.toolCount) : "n/a"
  const path = opts.path ? ` | path=${opts.path}` : ""
  const files = opts.fileChanges ? ` | files=${opts.fileChanges.length}` : ""
  return `[DT:${opts.delegationId}] ${icon} ${opts.status} | ${formatDuration(opts.elapsedMs)} | tools=${tools} | agent=${opts.agent}${path}${files}`
}

/**
 * Format a toast-style notification line.
 * Minimal format suitable for transient UI toast displays.
 */
export function formatToastLine(opts: NotificationFormatOptions): string {
  const icon = STATUS_ICONS[opts.status] ?? "?"
  return `${icon} [DT:${opts.delegationId}] ${opts.agent} — ${formatDuration(opts.elapsedMs)}`
}

/**
 * Format a duration in milliseconds into a human-readable string.
 * <1000ms → "Xms", <60s → "X.Xs", <60m → "Xm Ys", >=60m → "Xh Ym"
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
}

export interface FailureNotificationOptions {
  delegationId: string
  agent: string
  failureLevel: number
  elapsedSeconds: number
  actionCount: number
  isExecutedRunning: boolean
}

/**
 * Format a failure checkpoint notification line.
 *
 * Distinguishes between sessions that ran tools but stalled
 * (executed-running-fail) and sessions that never executed (fail-from-threshold).
 */
export function formatFailureNotification(opts: FailureNotificationOptions): string {
  if (opts.isExecutedRunning) {
    return `[DT:${opts.delegationId}] ⚠ Stall failure (level ${opts.failureLevel}) | agent=${opts.agent} | last actions=${opts.actionCount} at ${opts.elapsedSeconds}s`
  }
  return `[DT:${opts.delegationId}] ❌ Execution failure | agent=${opts.agent} | no actions recorded`
}

/**
 * Format a final failure notification (level 4, 300s).
 */
export function formatFinalFailure(opts: FailureNotificationOptions): string {
  return `[DT:${opts.delegationId}] 🛑 Final failure | agent=${opts.agent} | level=${opts.failureLevel} | elapsed=${opts.elapsedSeconds}s | actions=${opts.actionCount}`
}

/**
 * Format an urgent failure notification that requires the orchestrator to respond.
 *
 * For early failures (30s/60s/120s checkpoints) where no actions were detected,
 * this creates a prompt that the orchestrator MUST respond to with a decision:
 * resume, change-agent, steer, or cancel.
 */
export function formatUrgentFailureNotification(opts: FailureNotificationOptions): string {
  const title = opts.isExecutedRunning
    ? `Delegation ${opts.delegationId} (${opts.agent}) appears stalled`
    : `Delegation ${opts.delegationId} (${opts.agent}) did not execute`

  const actions = opts.isExecutedRunning
    ? "Suggested actions: resume, change agent, adjust prompt, or cancel."
    : "Suggested actions: cancel (agent may be unavailable), change agent, or adjust prompt and retry."

  return `<system_reminder>
[DT:${opts.delegationId}] ⚠️  ${title}
  Level: ${opts.failureLevel} | Elapsed: ${opts.elapsedSeconds}s
  Actions recorded: ${opts.actionCount}
  ${actions}
</system_reminder>
`
}

/**
 * Map a DelegationNotificationType to the corresponding status string
 * used by the formatter functions.
 */
export function typeToStatus(type: DelegationNotificationType): "completed" | "error" | "timeout" | "cancelled" | "running" {
  switch (type) {
    case "success":
      return "completed"
    case "failure":
      return "error"
    case "timeout":
      return "timeout"
    case "progress":
      return "running"
  }
}
