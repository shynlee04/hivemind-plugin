export type TaskStatus = "pending" | "queued" | "running" | "completed" | "error" | "cancelled" | "interrupt"

export const VALID_TASK_STATUSES: TaskStatus[] = ["pending", "queued", "running", "completed", "error", "cancelled", "interrupt"]

export const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending:    ["queued", "cancelled"],
  queued:     ["running", "cancelled"],
  running:    ["completed", "error", "cancelled", "interrupt"],
  completed:  [],
  error:      [],
  cancelled:  [],
  interrupt:  ["running", "queued"],
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to)
}

export function isTerminal(status: TaskStatus): boolean {
  return status === "completed" || status === "error" || status === "cancelled"
}
