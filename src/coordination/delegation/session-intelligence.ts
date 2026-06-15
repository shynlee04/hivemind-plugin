/**
 * Session stacking intelligence — proactive session discovery and stacking recommendations.
 *
 * Provides intelligence for front-facing agents to prefer stacking onto existing
 * sessions (completed, failed, aborted, cancelled) instead of creating new ones.
 * The OpenCode SDK supports stacking via `task_id` / `parentSessionId` as long as
 * the session ID is valid — this works both within a delegation tree and across
 * independent sessions.
 *
 * Read-only (CQRS read-side). No mutation authority.
 * @module coordination/delegation/session-intelligence
 */

import type { Delegation, DelegationStatus } from "./types.js"

/** Statuses that indicate a session is terminal but valid for stacking new work onto. */
const STACKABLE_STATUSES: ReadonlySet<DelegationStatus> = new Set<DelegationStatus>([
  "completed",
  "error",
  "timeout",
  "aborted",
  "cancelled",
])

/** Statuses that indicate a session is still active and can be resumed in-place. */
const RESUMABLE_STATUSES: ReadonlySet<DelegationStatus> = new Set<DelegationStatus>([
  "dispatched",
  "running",
])

/**
 * A session that is available for stacking new work onto.
 * Terminal sessions (completed/error/timeout) are all stackable as long as
 * the session ID exists and is valid in the SDK.
 */
export interface StackableSession {
  /** The child session ID to stack onto. */
  childSessionId: string
  /** The agent that ran in this session. */
  agent: string
  /** Terminal status of the session. */
  status: DelegationStatus
  /** When the session was created. */
  createdAt: number
  /** When the session reached terminal state. */
  completedAt?: number
  /** Original delegation ID. */
  delegationId: string
  /** Ready-to-use command for the `task` tool. */
  taskCommand: string
  /** Ready-to-use command for the `delegate-task` tool. */
  delegateTaskCommand: string
  /** Human-readable reason why this session is stackable. */
  reason: string
  /** Error message if the session failed — useful for retry context. */
  error?: string
  /** Last known output excerpt. */
  finalMessageExcerpt?: string
}

/**
 * A retry recommendation produced after a delegation fails.
 * Contains everything the calling agent needs to retry by stacking.
 */
export interface RetryRecommendation {
  /** The failed session to stack onto. */
  childSessionId: string
  /** Agent to use for retry. */
  agent: string
  /** Pre-formatted retry prompt that references the original task. */
  retryPrompt: string
  /** Ready-to-use `task` tool invocation. */
  taskCommand: string
  /** Ready-to-use `delegate-task` tool invocation. */
  delegateTaskCommand: string
  /** Original error that caused the failure. */
  originalError?: string
  /** Banner message for the agent. */
  guidance: string
}

/**
 * Finds all sessions that are available for stacking new work onto.
 *
 * Scans delegation records for terminal sessions (completed, error, timeout)
 * and returns them ranked by recency (most recent first).
 *
 * @param delegations - All known delegation records (in-memory + persisted + session-tracker).
 * @param agentFilter - Optional agent name filter to match specific agents.
 * @param parentSessionFilter - Optional parent session filter for scoping.
 * @returns Ranked list of stackable sessions.
 */
export function findStackableSessions(
  delegations: Delegation[],
  agentFilter?: string,
  parentSessionFilter?: string,
): StackableSession[] {
  const stackable: StackableSession[] = []

  for (const d of delegations) {
    if (!STACKABLE_STATUSES.has(d.status)) continue
    if (!d.childSessionId) continue
    if (agentFilter && d.agent !== agentFilter) continue
    if (parentSessionFilter && d.parentSessionId !== parentSessionFilter) continue

    stackable.push({
      childSessionId: d.childSessionId,
      agent: d.agent,
      status: d.status,
      createdAt: d.createdAt,
      completedAt: d.completedAt,
      delegationId: d.id,
      taskCommand: buildTaskCommand(d),
      delegateTaskCommand: buildDelegateTaskCommand(d),
      reason: buildStackableReason(d),
      error: d.error,
      finalMessageExcerpt: d.finalMessageExcerpt,
    })
  }

  // Sort by recency — most recent first
  stackable.sort((a, b) => (b.completedAt ?? b.createdAt) - (a.completedAt ?? a.createdAt))

  return stackable
}

/**
 * Finds all sessions that are still active (dispatched/running) and can be resumed.
 *
 * @param delegations - All known delegation records.
 * @param parentSessionFilter - Optional parent session filter.
 * @returns Active sessions that can be resumed.
 */
export function findResumableSessions(
  delegations: Delegation[],
  parentSessionFilter?: string,
): StackableSession[] {
  const resumable: StackableSession[] = []

  for (const d of delegations) {
    if (!RESUMABLE_STATUSES.has(d.status)) continue
    if (!d.childSessionId) continue
    if (parentSessionFilter && d.parentSessionId !== parentSessionFilter) continue

    resumable.push({
      childSessionId: d.childSessionId,
      agent: d.agent,
      status: d.status,
      createdAt: d.createdAt,
      completedAt: d.completedAt,
      delegationId: d.id,
      taskCommand: buildTaskCommand(d),
      delegateTaskCommand: buildDelegateTaskCommand(d),
      reason: `Session is still ${d.status} — resume instead of creating new`,
      error: d.error,
      finalMessageExcerpt: d.finalMessageExcerpt,
    })
  }

  resumable.sort((a, b) => b.createdAt - a.createdAt)
  return resumable
}

/**
 * Builds a retry recommendation for a failed delegation.
 * Produces a structured recommendation with ready-to-use commands
 * that stack onto the failed session instead of creating a new one.
 *
 * @param delegation - The failed delegation record.
 * @param customRetryPrompt - Optional custom prompt for the retry. Defaults to continuation prompt.
 * @returns A complete retry recommendation, or null if the delegation isn't retryable.
 */
export function getRetryRecommendation(
  delegation: Delegation,
  customRetryPrompt?: string,
): RetryRecommendation | null {
  if (!STACKABLE_STATUSES.has(delegation.status)) return null
  if (!delegation.childSessionId) return null

  const retryPrompt = customRetryPrompt ?? buildRetryPrompt(delegation)

  return {
    childSessionId: delegation.childSessionId,
    agent: delegation.agent,
    retryPrompt,
    taskCommand: `task({ subagent_type: "${delegation.agent}", task_id: "${delegation.childSessionId}", prompt: "${escapeForJson(retryPrompt)}" })`,
    delegateTaskCommand: `delegate-task({ agent: "${delegation.agent}", prompt: "${escapeForJson(retryPrompt)}", stackOnSessionId: "${delegation.childSessionId}" })`,
    originalError: delegation.error,
    guidance: `⚠️ STACK-ON RECOMMENDED: Previous delegation ${delegation.id} (agent: ${delegation.agent}) ended with status "${delegation.status}". Stack onto session ${delegation.childSessionId} to preserve context instead of creating a new session.`,
  }
}

/**
 * Builds the properly formatted context JSON for stacking onto a session
 * via the `delegate-task` tool's `context` parameter.
 *
 * @param sessionId - The session ID to stack onto.
 * @returns JSON string for the `context` parameter.
 */
export function buildStackOnContext(sessionId: string): string {
  return JSON.stringify({ parentSessionId: sessionId })
}

/**
 * Generates a stacking guidance banner for tool output.
 * Used by delegation-status list and find-stackable actions to proactively
 * inform agents about stackable sessions.
 *
 * @param stackableCount - Number of stackable sessions found.
 * @param resumableCount - Number of resumable sessions found.
 * @returns Human-readable guidance banner.
 */
export function buildStackingGuidanceBanner(stackableCount: number, resumableCount: number): string {
  const parts: string[] = []

  if (resumableCount > 0) {
    parts.push(`🔄 ${resumableCount} active session(s) can be RESUMED — do NOT create new delegations for these agents`)
  }
  if (stackableCount > 0) {
    parts.push(`📌 ${stackableCount} terminal session(s) available for STACKING — prefer stack-on over new dispatch to preserve context`)
  }
  if (parts.length === 0) {
    parts.push("No stackable or resumable sessions found — new dispatch is appropriate")
  }

  return parts.join("\n")
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Build a ready-to-use `task` tool command string. */
function buildTaskCommand(d: Delegation): string {
  return `task({ subagent_type: "${d.agent}", task_id: "${d.childSessionId}", prompt: "Continue from where you left off. Previous status: ${d.status}" })`
}

/** Build a ready-to-use `delegate-task` tool command string. */
function buildDelegateTaskCommand(d: Delegation): string {
  return `delegate-task({ agent: "${d.agent}", prompt: "Continue from where you left off. Previous status: ${d.status}", stackOnSessionId: "${d.childSessionId}" })`
}

/** Build a human-readable reason why a session is stackable. */
function buildStackableReason(d: Delegation): string {
  switch (d.status) {
    case "completed":
      return "Session completed — stack to add follow-up work"
    case "error":
      return `Session failed${d.error ? `: ${d.error.slice(0, 100)}` : ""} — stack to retry with preserved context`
    case "timeout":
      return "Session timed out — stack to continue where it left off"
    default:
      return `Session in ${d.status} state — stackable`
  }
}

/** Build a retry prompt for a failed delegation. */
function buildRetryPrompt(d: Delegation): string {
  const taskSummary = d.prompt
    ? d.prompt.length > 200
      ? `${d.prompt.slice(0, 200)}...`
      : d.prompt
    : "(no original prompt recorded)"

  const errorContext = d.error
    ? `\nPrevious error: ${d.error.length > 300 ? d.error.slice(0, 300) + "..." : d.error}`
    : ""

  return [
    `[RETRY - STACKED ON PREVIOUS SESSION]`,
    `Previous delegation ${d.id} ended with status: ${d.status}${errorContext}`,
    `Original task: ${taskSummary}`,
    `Continue and complete the original task. You have access to all previous context from this session.`,
  ].join("\n")
}

/** Escape a string for safe embedding in a JSON-like command template. */
function escapeForJson(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")
}
