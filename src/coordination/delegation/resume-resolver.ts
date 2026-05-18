import type { Delegation, DelegationStatus } from "./types.js"

/** Resume strategy determined by inspecting a persisted delegation record. */
export type ResumeStrategy =
  | { action: "reuse"; sessionId: string; reason: string }
  | { action: "fresh"; reason: string }

/** Terminal statuses that prevent session reuse. */
const TERMINAL_STATUSES: ReadonlySet<DelegationStatus> = new Set<DelegationStatus>([
  "completed",
  "error",
  "timeout",
])

/**
 * REQ-RC-01: Determines whether a persisted delegation can be resumed or needs a fresh dispatch.
 *
 * Checks three conditions:
 * 1. recoveryGuarantee === "resumable"
 * 2. Session still exists (not deleted — caller verifies via sessionExists)
 * 3. Status is not terminal
 *
 * @param delegation - The persisted delegation record to evaluate.
 * @param sessionExists - Whether the child session still exists in the host runtime.
 * @returns A ResumeStrategy indicating reuse or fresh dispatch with a reason.
 */
export function resolveResumeStrategy(
  delegation: Delegation,
  sessionExists: boolean,
): ResumeStrategy {
  if (delegation.recoveryGuarantee !== "resumable") {
    return {
      action: "fresh",
      reason: `recoveryGuarantee=${delegation.recoveryGuarantee ?? "undefined"} is not resumable`,
    }
  }

  if (!sessionExists) {
    return {
      action: "fresh",
      reason: `child session ${delegation.childSessionId} no longer exists`,
    }
  }

  if (TERMINAL_STATUSES.has(delegation.status)) {
    return {
      action: "fresh",
      reason: `delegation status=${delegation.status} is terminal`,
    }
  }

  return {
    action: "reuse",
    sessionId: delegation.childSessionId,
    reason: `resumable delegation in status=${delegation.status}`,
  }
}

/**
 * REQ-RC-01: Builds a continuation prompt that references the original task
 * without repeating the full prompt payload.
 *
 * @param delegation - The delegation to build a continuation prompt for.
 * @returns A concise continuation prompt referencing the original task and current state.
 */
export function buildContinuationPrompt(delegation: Delegation): string {
  const taskSummary = delegation.prompt
    ? delegation.prompt.length > 200
      ? `${delegation.prompt.slice(0, 200)}...`
      : delegation.prompt
    : "(no original prompt recorded)"
  const elapsedMs = Date.now() - delegation.createdAt
  const elapsedSec = Math.round(elapsedMs / 1000)

  return [
    `[DELEGATION RESUME] Continuing delegated task.`,
    `id=${delegation.id} agent=${delegation.agent} status=${delegation.status}`,
    `Original task: ${taskSummary}`,
    `Elapsed: ${elapsedSec}s | Messages observed: ${delegation.lastMessageCount}`,
    `Continue from where you left off.`,
  ].join("\n")
}
