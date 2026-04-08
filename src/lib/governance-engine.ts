import { getGovernancePersistenceState, recordGovernancePersistenceState } from "./continuity.js"
import type {
  GovernanceAction,
  GovernanceCondition,
  GovernancePersistenceState,
  GovernanceRule,
  GovernanceScope,
  GovernanceViolation,
} from "./types.js"

type GovernanceEvaluationContext = {
  scope: GovernanceScope
  sessionID: string
  toolName?: string
  args?: unknown
}

type GovernanceMatch = {
  ruleID: string
  message: string
}

type GovernanceEscalationMatch = GovernanceMatch & {
  escalation: NonNullable<GovernanceAction["escalation"]>
}

export type GovernanceEvaluationResult = {
  warnings: GovernanceMatch[]
  escalations: GovernanceEscalationMatch[]
  blocks: GovernanceMatch[]
}

export type InjectionGovernanceBlockState = {
  blockedInjections: string[]
  reasonByInjectionID: Record<string, string>
}

export type GovernanceMutation =
  | {
      type: "upsert"
      source: string
      rule: {
        id: string
        scope: GovernanceScope
        condition: GovernanceCondition
        action: GovernanceAction
      }
    }
  | {
      type: "remove"
      source: string
      ruleID: string
    }

function createViolationID(): string {
  return `gov-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function normalizeStringList(value: unknown, field: string): string[] | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!Array.isArray(value) || value.length === 0 || value.some((entry) => !isNonEmptyString(entry))) {
    throw new Error(`[Harness] Invalid governance rule: ${field} must be a non-empty string array.`)
  }

  return value.map((entry) => entry.trim())
}

function validateCondition(condition: GovernanceCondition): GovernanceCondition {
  const normalized: GovernanceCondition = {
    toolNames: normalizeStringList(condition.toolNames, "condition.toolNames"),
    sessionIDs: normalizeStringList(condition.sessionIDs, "condition.sessionIDs"),
  }

  if (!normalized.toolNames && !normalized.sessionIDs) {
    throw new Error("[Harness] Invalid governance rule: at least one condition matcher is required.")
  }

  return normalized
}

function validateAction(action: GovernanceAction): GovernanceAction {
  if (!isNonEmptyString(action.message)) {
    throw new Error("[Harness] Invalid governance rule: action.message is required.")
  }

  if (action.type === "escalate") {
    if (!action.escalation) {
      throw new Error("[Harness] Invalid governance rule: escalate actions require escalation metadata.")
    }

    if (!["parent", "session"].includes(action.escalation.channel)) {
      throw new Error("[Harness] Invalid governance rule: escalation.channel must be parent or session.")
    }

    if (!["low", "medium", "high"].includes(action.escalation.severity)) {
      throw new Error("[Harness] Invalid governance rule: escalation.severity must be low, medium, or high.")
    }
  }

  return {
    type: action.type,
    message: action.message.trim(),
    escalation: action.escalation ? { ...action.escalation } : undefined,
  }
}

function sanitizeRule(input: GovernanceMutation & { type: "upsert" }): GovernanceRule {
  const { rule, source } = input
  if (!isNonEmptyString(rule.id)) {
    throw new Error("[Harness] Invalid governance rule: id is required.")
  }

  if (rule.scope !== "tool.execute.before") {
    throw new Error("[Harness] Invalid governance rule: unsupported scope.")
  }

  if (!isNonEmptyString(source)) {
    throw new Error("[Harness] Invalid governance mutation: source is required.")
  }

  const now = Date.now()
  const existing = loadGovernanceRules().find((entry) => entry.id === rule.id)

  return {
    id: rule.id.trim(),
    scope: rule.scope,
    condition: validateCondition(rule.condition),
    action: validateAction(rule.action),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    source: source.trim(),
  }
}

function matchesCondition(condition: GovernanceCondition, context: GovernanceEvaluationContext): boolean {
  if (condition.toolNames && (!context.toolName || !condition.toolNames.includes(context.toolName))) {
    return false
  }

  if (condition.sessionIDs && !condition.sessionIDs.includes(context.sessionID)) {
    return false
  }

  return true
}

function appendViolation(rule: GovernanceRule, context: GovernanceEvaluationContext): void {
  const state = getGovernancePersistenceState()
  const violation: GovernanceViolation = {
    id: createViolationID(),
    ruleID: rule.id,
    scope: rule.scope,
    sessionID: context.sessionID,
    toolName: context.toolName,
    actionType: rule.action.type,
    message: rule.action.message,
    escalation: rule.action.escalation ? { ...rule.action.escalation } : undefined,
    createdAt: Date.now(),
  }

  recordGovernancePersistenceState({
    ...state,
    violations: [...state.violations, violation],
  })
}

function persistRules(nextRules: GovernanceRule[]): GovernancePersistenceState {
  const state = getGovernancePersistenceState()
  return recordGovernancePersistenceState({
    ...state,
    rules: nextRules,
  })
}

export function loadGovernanceRules(): GovernanceRule[] {
  return getGovernancePersistenceState().rules
}

export function listGovernanceViolations(): GovernanceViolation[] {
  return getGovernancePersistenceState().violations
}

export function mutateGovernanceRule(mutation: GovernanceMutation): GovernancePersistenceState {
  const currentRules = loadGovernanceRules()

  if (mutation.type === "remove") {
    return persistRules(currentRules.filter((rule) => rule.id !== mutation.ruleID))
  }

  const sanitized = sanitizeRule(mutation)
  const nextRules = currentRules.filter((rule) => rule.id !== sanitized.id)
  nextRules.push(sanitized)
  nextRules.sort((left, right) => left.id.localeCompare(right.id))
  return persistRules(nextRules)
}

export function evaluateGovernance(context: GovernanceEvaluationContext): GovernanceEvaluationResult {
  const result: GovernanceEvaluationResult = {
    warnings: [],
    escalations: [],
    blocks: [],
  }

  for (const rule of loadGovernanceRules()) {
    if (rule.scope !== context.scope) {
      continue
    }

    if (!matchesCondition(rule.condition, context)) {
      continue
    }

    appendViolation(rule, context)

    if (rule.action.type === "warn") {
      result.warnings.push({ ruleID: rule.id, message: rule.action.message })
      continue
    }

    if (rule.action.type === "escalate" && rule.action.escalation) {
      result.escalations.push({
        ruleID: rule.id,
        message: rule.action.message,
        escalation: { ...rule.action.escalation },
      })
      continue
    }

    result.blocks.push({ ruleID: rule.id, message: rule.action.message })
  }

  return result
}

export function buildInjectionGovernanceState(args: {
  sessionID: string
  injectionIDs: readonly string[]
}): InjectionGovernanceBlockState | undefined {
  const blocks: GovernanceMatch[] = []

  for (const rule of loadGovernanceRules()) {
    if (rule.scope !== "tool.execute.before") {
      continue
    }

    if (!matchesCondition(rule.condition, {
      scope: "tool.execute.before",
      sessionID: args.sessionID,
    })) {
      continue
    }

    if (rule.action.type !== "block") {
      continue
    }

    blocks.push({ ruleID: rule.id, message: rule.action.message })
  }

  if (blocks.length === 0) {
    return undefined
  }

  const reason = blocks.map((block) => block.message).join(" ")
  return {
    blockedInjections: [...args.injectionIDs],
    reasonByInjectionID: Object.fromEntries(args.injectionIDs.map((id) => [id, reason])),
  }
}
