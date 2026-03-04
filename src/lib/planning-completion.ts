export interface PlanCompletionCheckInput {
  parent_id?: string
  children: Array<{
    id: string
    status: string
  }>
  terminal_statuses?: string[]
}

export interface PlanCompletionCheckResult {
  can_transition_to_completed: boolean
  blocking_child_ids: string[]
  blocking_statuses: string[]
  rule_version: string
}

const RULE_VERSION = "1.0.0"
const DEFAULT_TERMINAL_STATUSES = ["complete", "done", "closed", "skipped", "cancelled"]

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase()
}

/**
 * Check whether a parent plan can transition to completed state.
 *
 * @description A parent is eligible only when all children are in terminal statuses.
 * Default terminal statuses: complete, done, closed, skipped, cancelled.
 *
 * @param input - Parent/children completion check input
 * @returns Deterministic completion eligibility result
 */
export function checkPlanCompletionEligibility(
  input: PlanCompletionCheckInput,
): PlanCompletionCheckResult {
  const configuredTerminals = input.terminal_statuses ?? DEFAULT_TERMINAL_STATUSES
  const terminalSet = new Set(configuredTerminals.map((status) => normalizeStatus(status)))

  const blocking = input.children.filter((child) => !terminalSet.has(normalizeStatus(child.status)))
  const blockingStatusesSeen = new Set<string>()

  const blockingStatuses: string[] = []
  for (const child of blocking) {
    const normalized = normalizeStatus(child.status)
    if (!blockingStatusesSeen.has(normalized)) {
      blockingStatusesSeen.add(normalized)
      blockingStatuses.push(normalized)
    }
  }

  return {
    can_transition_to_completed: blocking.length === 0,
    blocking_child_ids: blocking.map((child) => child.id),
    blocking_statuses: blockingStatuses,
    rule_version: RULE_VERSION,
  }
}
