import type { Delegation, DelegationStatus } from "./types.js"

/** Resume strategy determined by inspecting a persisted delegation record. */
export type ResumeStrategy =
  | { action: "reuse"; sessionId: string; reason: string }
  | { action: "stack-on"; sessionId: string; reason: string }
  | { action: "fresh"; reason: string }

/** Terminal statuses that prevent in-place resume but still allow stacking. */
const TERMINAL_STATUSES: ReadonlySet<DelegationStatus> = new Set<DelegationStatus>([
  "completed",
  "error",
  "timeout",
])

/**
 * REQ-RC-01: Determines whether a persisted delegation can be resumed,
 * stacked onto, or needs a fresh dispatch.
 *
 * Strategy priority:
 * 1. `reuse`    — Session is non-terminal AND resumable AND still exists
 * 2. `stack-on` — Session is terminal BUT still exists in the SDK; new work
 *                 can be attached as a child. The SDK accepts stacking via
 *                 `task_id` / `parentSessionId` for any valid session ID.
 * 3. `fresh`    — Session no longer exists or is not resumable
 *
 * @param delegation - The persisted delegation record to evaluate.
 * @param sessionExists - Whether the child session still exists in the host runtime.
 * @returns A ResumeStrategy indicating reuse, stack-on, or fresh dispatch with a reason.
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
      action: "stack-on",
      sessionId: delegation.childSessionId,
      reason: `delegation status=${delegation.status} is terminal but session exists — stack new work onto it to preserve context`,
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

/**
 * Builds a context-preserving prompt for stacking onto a terminal session.
 * Unlike buildContinuationPrompt (for resuming interrupted work), this
 * acknowledges the previous session's terminal state and frames the new
 * work as a follow-up or retry.
 *
 * @param delegation - The terminal delegation to stack onto.
 * @param customPrompt - Optional custom prompt. If omitted, builds a retry prompt.
 * @returns A stack-on prompt that preserves context from the original session.
 */
export function buildStackOnPrompt(delegation: Delegation, customPrompt?: string): string {
  const taskSummary = delegation.prompt
    ? delegation.prompt.length > 200
      ? `${delegation.prompt.slice(0, 200)}...`
      : delegation.prompt
    : "(no original prompt recorded)"

  const errorContext = delegation.error
    ? `\nPrevious error: ${delegation.error.length > 300 ? delegation.error.slice(0, 300) + "..." : delegation.error}`
    : ""

  const statusLabel = delegation.status === "completed" ? "completed successfully"
    : delegation.status === "error" ? "failed with error"
    : delegation.status === "timeout" ? "timed out"
    : `reached ${delegation.status}`

  if (customPrompt) {
    return [
      `[STACKED ON SESSION ${delegation.childSessionId}]`,
      `Previous delegation ${delegation.id} (agent: ${delegation.agent}) ${statusLabel}.${errorContext}`,
      `Original task: ${taskSummary}`,
      ``,
      customPrompt,
    ].join("\n")
  }

  return [
    `[RETRY - STACKED ON SESSION ${delegation.childSessionId}]`,
    `Previous delegation ${delegation.id} (agent: ${delegation.agent}) ${statusLabel}.${errorContext}`,
    `Original task: ${taskSummary}`,
    `You have access to all previous context from this session.`,
    `Continue and complete the original task.`,
  ].join("\n")
}
