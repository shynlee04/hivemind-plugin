import type { TaskStatus } from "./types.js"

export const VALID_TASK_STATUSES: TaskStatus[] = ["pending", "queued", "running", "completed", "failed", "error", "cancelled", "interrupt"]

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending:    ["queued", "cancelled"],
  queued:     ["running", "failed", "cancelled"],
  running:    ["completed", "failed", "error", "cancelled", "interrupt"],
  completed:  [],
  failed:     [],
  error:      [],
  cancelled:  [],
  interrupt:  ["running", "queued"],
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export function isTerminal(status: TaskStatus): boolean {
  return status === "completed" || status === "failed" || status === "error" || status === "cancelled"
}
