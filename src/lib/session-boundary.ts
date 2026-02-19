/**
 * Session Boundary Manager — pure recommendation helpers.
 * Decides when a fresh session is recommended at natural boundaries.
 * 
 * V3.0 Design:
 * - Defensive guards (DON'T split when): context >= 80%, has delegations, low user turns
 * - Trigger conditions (SPLIT when): compaction >= 2 AND hierarchy complete
 * - user_turn_count counts user response cycles (not tool calls)
 */

export interface SessionBoundaryState {
  turnCount: number
  userTurnCount: number
  contextPercent: number
  hierarchyComplete: boolean
  isMainSession: boolean
  hasDelegations: boolean
  compactionCount: number
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
 * 
 * Defensive guards (return false if ANY apply):
 * - Not main session (subagent context)
 * - Has active delegations
 * - Context >= 80% (too late for clean handoff)
 * - User turns < 30 (not enough session substance)
 * 
 * Trigger conditions (return true if BOTH apply):
 * - Compaction count >= 2 (approaching 3rd compact)
 * - Hierarchy has completed phase/epic
 */
export function shouldCreateNewSession(
  state: SessionBoundaryState
): SessionBoundaryRecommendation {
  // === DEFENSIVE GUARDS (don't split) ===
  
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

  // V3.0: context >= 80% is DEFENSIVE (don't split when near capacity)
  // The innate compaction handles overflow - we don't need to split pre-emptively
  if (state.contextPercent >= 80) {
    return {
      recommended: false,
      reason: `Context usage is ${state.contextPercent}% (too high for clean session handoff). Let innate compaction handle it.`,
    }
  }

  // V3.0: Use user_turn_count (user response cycles) not tool calls
  if (state.userTurnCount < 30) {
    return {
      recommended: false,
      reason: `User turn threshold not met (${state.userTurnCount}/30)`,
    }
  }

  // === TRIGGER CONDITIONS ===
  
  // V3.0: Split when approaching 3rd compaction AND hierarchy complete
  if (state.compactionCount >= 2 && state.hierarchyComplete) {
    return {
      recommended: true,
      reason: `Natural boundary: ${state.compactionCount} compactions, completed phase/epic, ${state.userTurnCount} user turns`,
    }
  }

  // Legacy path: allow split on hierarchy complete even without compactions
  // (for sessions that don't trigger compaction)
  if (state.hierarchyComplete && state.userTurnCount >= 30) {
    return {
      recommended: true,
      reason: `Natural boundary reached (${state.userTurnCount} user turns, completed phase/epic detected)`,
    }
  }

  return {
    recommended: false,
    reason: "No natural boundary detected yet",
  }
}
