/**
 * Session Boundary Manager — pure recommendation helpers.
 * Decides when a fresh session is recommended at natural boundaries.
 */

export interface SessionBoundaryState {
  turnCount: number
  contextPercent: number
  hierarchyComplete: boolean
  isMainSession: boolean
  hasDelegations: boolean
}

export interface SessionBoundaryRecommendation {
  recommended: boolean
  reason: string
}

/**
 * Estimates context usage percentage from turn count and compact threshold.
 */
export function estimateContextPercent(
  turnCount: number,
  compactThreshold: number
): number {
  const safeThreshold = Math.max(1, compactThreshold)
  const percent = Math.round((Math.max(0, turnCount) / safeThreshold) * 100)
  return Math.min(100, percent)
}

/**
 * Returns whether a fresh session should be recommended.
 * Rules:
 * - Main session only (exclude delegated/subagent contexts)
 * - Session should still have headroom (context < 80%)
 * - Natural boundary reached (completed phase/epic)
 * - Turn count should be substantial (30+)
 */
export function shouldCreateNewSession(
  state: SessionBoundaryState
): SessionBoundaryRecommendation {
  if (!state.isMainSession) {
    return {
      recommended: false,
      reason: "Boundary recommendation only applies to the main session",
    }
  }

  if (state.hasDelegations) {
    return {
      recommended: false,
      reason: "Active delegations detected; finish delegation flow before creating a new session",
    }
  }

  if (state.contextPercent >= 80) {
    return {
      recommended: false,
      reason: `Context usage is ${state.contextPercent}% (must be below 80% for a clean handoff boundary)`,
    }
  }

  if (state.turnCount < 30) {
    return {
      recommended: false,
      reason: `Turn threshold not met (${state.turnCount}/30)`,
    }
  }

  if (!state.hierarchyComplete) {
    return {
      recommended: false,
      reason: "No completed phase/epic boundary detected yet",
    }
  }

  return {
    recommended: true,
    reason: `Natural boundary reached (${state.turnCount} turns, ${state.contextPercent}% context, completed phase/epic detected)`,
  }
}
