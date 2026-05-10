import { getGovernancePersistenceState, recordGovernancePersistenceState } from "../../task-management/continuity/index.js"

type CategoryGateaskInput = {
  callerSessionId: string
  requestedAgent?: string
  requestedCategory?: string
  surface: string
  askReason: string
}

/**
 * Persist compact category-gate denial evidence through the continuity governance writer.
 *
 * @param input - Bounded denial metadata; prompt text and tool output are intentionally excluded.
 * @returns True when evidence was written, false when persistence failed safely.
 */
export function recordCategoryGateask(input: CategoryGateaskInput): boolean {
  try {
    const state = getGovernancePersistenceState()
    recordGovernancePersistenceState({
      ...state,
      violations: [
        ...state.violations,
        {
          ruleId: "category-gate",
          sessionID: input.callerSessionId,
          timestamp: Date.now(),
          detail: input.askReason,
          escalation: {
            requestedAgent: input.requestedAgent,
            requestedCategory: input.requestedCategory,
            surface: input.surface,
          },
        },
      ],
    })
    return true
  } catch {
    return false
  }
}
