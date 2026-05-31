import type { GovernanceRule, GovernanceViolation } from "../../shared/types.js"
import { readGovernanceState, writeGovernanceState } from "../governance/persistence.js"

export interface EvaluationResult {
  blocked: boolean
  blocks: string[]
  warnings: string[]
  escalations: Array<{ ruleId: string; escalation?: Record<string, unknown> }>
}

/**
 * Checks an incoming tool call against the active governance rules in configs.json.
 * If a rule matches, its action is processed (block, warn, or escalate),
 * and the violation is recorded in the continuity store.
 *
 * @param toolName - Name of the tool being executed
 * @param sessionID - ID of the calling session
 * @param rules - List of active governance rules
 * @returns Result containing blocked flag, blocks, warnings, and escalations.
 */
export function evaluateGovernance(
  toolName: string,
  sessionID: string,
  rules: GovernanceRule[],
): EvaluationResult {
  const result: EvaluationResult = {
    blocked: false,
    blocks: [],
    warnings: [],
    escalations: [],
  }

  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return result
  }

  const matchedViolations: GovernanceViolation[] = []

  for (const rule of rules) {
    if (!rule.enabled) {
      continue
    }

    let toolMatched = false
    let sessionMatched = false
    let criteriaChecked = 0

    if (rule.condition.toolNames && Array.isArray(rule.condition.toolNames) && rule.condition.toolNames.length > 0) {
      criteriaChecked++
      if (rule.condition.toolNames.includes(toolName)) {
        toolMatched = true
      }
    }

    if (rule.condition.sessionIDs && Array.isArray(rule.condition.sessionIDs) && rule.condition.sessionIDs.length > 0) {
      criteriaChecked++
      if (rule.condition.sessionIDs.includes(sessionID)) {
        sessionMatched = true
      }
    }

    let matches = false
    if (criteriaChecked === 1) {
      matches = toolMatched || sessionMatched
    } else if (criteriaChecked === 2) {
      matches = toolMatched && sessionMatched
    }

    if (matches) {
      const actionType = rule.action?.type
      const detail = `Rule ${rule.id} triggered on tool ${toolName} for session ${sessionID}`

      if (actionType === "block") {
        result.blocked = true
        result.blocks.push(detail)
      } else if (actionType === "warn") {
        result.warnings.push(detail)
      } else if (actionType === "escalate") {
        result.escalations.push({
          ruleId: rule.id,
          escalation: rule.action.escalation,
        })
      }

      matchedViolations.push({
        ruleId: rule.id,
        sessionID,
        timestamp: Date.now(),
        detail,
        escalation: rule.action.escalation,
      })
    }
  }

  if (matchedViolations.length > 0) {
    try {
      const state = readGovernanceState()
      state.violations.push(...matchedViolations)
      writeGovernanceState(state)
    } catch (err) {
      console.error(`[Harness] Failed to record governance violations: ${err}`)
    }
  }

  return result
}
