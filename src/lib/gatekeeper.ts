/**
 * Gatekeeper - Hard programmatic enforcement for session state validation.
 *
 * US-016: Text checklists are ignored by LLMs. This provides programmatic enforcement.
 *
 * Design:
 *   1. Pure TypeScript - no OpenCode SDK dependencies
 *   2. Validates BrainState against governance rules
 *   3. Returns actionable suggestions for violations
 */

import type { BrainState } from "../schemas/brain-state.js"

export interface GatekeeperViolation {
  code: string
  message: string
  severity: "critical" | "warning" | "advisory"
  suggestion: string
}

export interface GatekeeperResult {
  passed: boolean
  violations: GatekeeperViolation[]
  summary: string
}

/**
 * Validate session state against governance rules.
 *
 * Checks:
 *   1. HAS_ACTION_FOCUS - Action-level hierarchy focus exists
 *   2. PENDING_FAILURE_ACK - No unacknowledged subagent failures
 *   3. FILES_UNCOMMITTED - Files touched but not committed
 *   4. DRIFT_THRESHOLD - Drift score below acceptable threshold
 *   5. SESSION_TOO_LONG - Session exceeds max turns
 */
export function validateSessionState(
  brain: BrainState,
  options: {
    maxDriftScore?: number
    maxTurns?: number
  } = {}
): GatekeeperResult {
  const { maxDriftScore = 40, maxTurns = 400 } = options
  const violations: GatekeeperViolation[] = []

  // Check 1: Has action-level focus?
  if (!brain.hierarchy.action || brain.hierarchy.action.trim() === "") {
    violations.push({
      code: "HAS_ACTION_FOCUS",
      message: "Action-level focus is missing",
      severity: "critical",
      suggestion: "Call map_context with level='action' to set current task focus",
    })
  }

  // Check 2: Pending failure ack?
  if (brain.pending_failure_ack) {
    violations.push({
      code: "PENDING_FAILURE_ACK",
      message: "Pending subagent failure not acknowledged",
      severity: "critical",
      suggestion: "Call export_cycle or map_context with blocked status to acknowledge failure",
    })
  }

  // Check 3: Files touched without commit?
  if (brain.metrics.files_touched.length > 0) {
    violations.push({
      code: "FILES_UNCOMMITTED",
      message: `Files touched but not committed: ${brain.metrics.files_touched.join(", ")}`,
      severity: "warning",
      suggestion: "Force an atomic git commit for touched files before stopping",
    })
  }

  // Check 4: Drift threshold exceeded?
  if (brain.metrics.drift_score < maxDriftScore) {
    violations.push({
      code: "DRIFT_THRESHOLD",
      message: `Drift score (${brain.metrics.drift_score}) below threshold (${maxDriftScore})`,
      severity: "advisory",
      suggestion: "Use map_context to checkpoint and reset drift",
    })
  }

  // Check 5: Session too long?
  if (brain.metrics.turn_count > maxTurns) {
    violations.push({
      code: "SESSION_TOO_LONG",
      message: `Session has ${brain.metrics.turn_count} turns (max: ${maxTurns})`,
      severity: "warning",
      suggestion: "Consider using compact_session to archive and reset",
    })
  }

  const passed = violations.filter(v => v.severity === "critical").length === 0
  const criticalCount = violations.filter(v => v.severity === "critical").length
  const warningCount = violations.filter(v => v.severity === "warning").length
  const advisoryCount = violations.filter(v => v.severity === "advisory").length

  let summary = passed
    ? "Gatekeeper passed"
    : `Gatekeeper blocked: ${criticalCount} critical, ${warningCount} warnings, ${advisoryCount} advisory`

  return {
    passed,
    violations,
    summary,
  }
}

/**
 * Format violations as a user-friendly checklist.
 */
export function formatViolationsAsChecklist(violations: GatekeeperViolation[]): string {
  if (violations.length === 0) {
    return "✅ All gatekeeper checks passed"
  }

  const lines: string[] = ["## 🛡️ Gatekeeper Checklist (Pre-Stop)", ""]

  for (const v of violations) {
    const icon = v.severity === "critical" ? "🚫" : v.severity === "warning" ? "⚠️" : "💡"
    lines.push(`${icon} [ ] **${v.code}**: ${v.message}`)
    lines.push(`   → ${v.suggestion}`)
    lines.push("")
  }

  return lines.join("\n")
}

/**
 * Get a quick pass/fail status without full details.
 */
export function quickGatecheck(brain: BrainState): {
  passed: boolean
  criticalCount: number
  warningCount: number
} {
  const result = validateSessionState(brain)
  return {
    passed: result.passed,
    criticalCount: result.violations.filter(v => v.severity === "critical").length,
    warningCount: result.violations.filter(v => v.severity === "warning").length,
  }
}
