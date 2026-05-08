/**
 * @fileoverview Gate Decision types and classification for the control plane
 * gatekeeper. Defines the decision types, blocking semantics, and classification
 * utilities used by the gatekeeper to route user messages.
 *
 * Phase 61 — CP-03, CP-04
 */

// ---------------------------------------------------------------------------
// Gate Decision Type enum
// ---------------------------------------------------------------------------

/**
 * Possible gate decision outcomes, ordered by severity.
 */
export enum GateDecisionType {
  /** Allow the message through — no issues detected. */
  ALLOW = "allow",
  /** Warn but allow — non-blocking advisory. */
  WARN = "warn",
  /** Defer decision — needs more context or async resolution. */
  DEFER = "defer",
  /** Block the message — hard deny from a blocking gate. */
  BLOCK = "block",
  /** Deny with explicit reason — hard deny from policy enforcement. */
  DENY = "deny",
}

// ---------------------------------------------------------------------------
// Gate Decision Record
// ---------------------------------------------------------------------------

/**
 * Record of a single gate's evaluation decision.
 */
export interface GateDecisionRecord {
  /** The rule or policy that was evaluated. */
  rule: string
  /** Evaluation context provided to the decision function. */
  context: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Classification functions
// ---------------------------------------------------------------------------

/**
 * Determines whether a gate decision type is blocking.
 *
 * @param decision - The gate decision type to check.
 * @returns True if the decision blocks the message.
 *
 * @example
 * ```ts
 * if (isBlockingDecision(result.decision)) {
 *   console.error("Blocked:", result.reason)
 * }
 * ```
 */
export function isBlockingDecision(decision: GateDecisionType): boolean {
  return decision === GateDecisionType.BLOCK || decision === GateDecisionType.DENY
}

/**
 * Classifies a gate decision from an evaluation context.
 *
 * @param record - The decision record with rule and context.
 * @returns Classified decision with blocking flag.
 *
 * @example
 * ```ts
 * const result = classifyGateDecision({
 *   rule: "manualStateWritesForbidden",
 *   context: { toolName: "write-file" },
 * })
 * console.log(result.decision, result.blocking)
 * ```
 */
export function classifyGateDecision(record: GateDecisionRecord): {
  decision: GateDecisionType
  reason: string
  blocking: boolean
} {
  const { rule, context } = record

  // manualStateWritesForbidden: block direct state file writes
  if (rule === "manualStateWritesForbidden") {
    const toolName = context.toolName as string | undefined
    const toolArgs = context.toolArgs as Record<string, unknown> | undefined

    if (toolName === "write-file" || toolName === "edit-file") {
      const filePath = typeof toolArgs?.path === "string" ? toolArgs.path : ""
      if (isStateFilePath(filePath)) {
        return {
          decision: GateDecisionType.DENY,
          reason: `[Harness] Direct writes to state files are forbidden (Q6: manualStateWritesForbidden). Path: ${filePath}`,
          blocking: true,
        }
      }
    }
    return { decision: GateDecisionType.ALLOW, reason: "No state write detected", blocking: false }
  }

  // Default: allow unknown rules
  return { decision: GateDecisionType.ALLOW, reason: `Rule "${rule}" has no classifier`, blocking: false }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a file path points to a harness internal state file.
 */
function isStateFilePath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/")
  return (
    normalized.includes(".hivemind/state/") ||
    normalized.endsWith("session-continuity.json") ||
    normalized.endsWith("delegations.json")
  )
}
