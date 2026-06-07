import type { DelegationMeta, RootBudget, SessionStats } from "./types.js"

// ---------------------------------------------------------------------------
// TaskStateManager — encapsulates all in-process session/budget state.
// New for V3: also tracks the subagent registry (OMO Pattern 10).
// ---------------------------------------------------------------------------

export class TaskStateManager {
  private readonly rootBudgets = new Map<string, RootBudget>()
  private readonly sessionToRoot = new Map<string, string>()
  private readonly sessionStats = new Map<string, SessionStats>()
  private readonly sessionDelegationMeta = new Map<string, DelegationMeta>()
  private readonly subagentSessions = new Map<string, Set<string>>()

  // -------------------------------------------------------------------------
  // Session stats
  // -------------------------------------------------------------------------

  ensureStats(sessionID: string): SessionStats {
    let stats = this.sessionStats.get(sessionID)
    if (!stats) {
      stats = {
        total: 0,
        byTool: {},
        loop: { signature: "", count: 0 },
        warnings: [],
      }
      this.sessionStats.set(sessionID, stats)
    }
    return stats
  }

  getStats(sessionID: string): SessionStats | undefined {
    return this.sessionStats.get(sessionID)
  }

  addWarning(sessionID: string, warning: string): void {
    const stats = this.ensureStats(sessionID)
    if (stats.warnings.length < 25) {
      stats.warnings.push(warning)
    }
  }

  resetStats(sessionID: string): SessionStats {
    const stats = this.ensureStats(sessionID)
    stats.total = 0
    stats.byTool = {}
    stats.loop = { signature: "", count: 0 }
    stats.warnings = []
    return stats
  }

  // -------------------------------------------------------------------------
  // Root budget tracking
  // -------------------------------------------------------------------------

  private ensureRootBudget(rootID: string): RootBudget {
    let budget = this.rootBudgets.get(rootID)
    if (!budget) {
      budget = {
        descendants: new Set<string>(),
        reserved: 0,
      }
      this.rootBudgets.set(rootID, budget)
    }
    return budget
  }

  getRootBudget(rootID: string): RootBudget | undefined {
    return this.rootBudgets.get(rootID)
  }

  reserveDescendant(rootID: string, maxDescendantsPerRoot: number): number {
    const budget = this.ensureRootBudget(rootID)
    const total = budget.descendants.size + budget.reserved
    if (total >= maxDescendantsPerRoot) {
      throw new Error(
        `[Hivemind] Root session ${rootID} exceeded descendant budget (${maxDescendantsPerRoot})`
      )
    }
    budget.reserved += 1
    return total + 1
  }

  commitDescendant(rootID: string, sessionID: string): number {
    const budget = this.ensureRootBudget(rootID)
    budget.reserved = Math.max(0, budget.reserved - 1)
    budget.descendants.add(sessionID)
    this.sessionToRoot.set(sessionID, rootID)
    return budget.descendants.size + budget.reserved
  }

  rollbackReservation(rootID: string): void {
    const budget = this.rootBudgets.get(rootID)
    if (!budget) {
      return
    }
    budget.reserved = Math.max(0, budget.reserved - 1)
  }

  // -------------------------------------------------------------------------
  // Session-to-root mapping
  // -------------------------------------------------------------------------

  setSessionRoot(sessionID: string, rootID: string): void {
    this.sessionToRoot.set(sessionID, rootID)
  }

  getSessionRoot(sessionID: string): string | undefined {
    return this.sessionToRoot.get(sessionID)
  }

  inheritRootFromParent(sessionID: string, parentID: string): void {
    const rootID = this.sessionToRoot.get(parentID) ?? parentID
    this.sessionToRoot.set(sessionID, rootID)
  }

  // -------------------------------------------------------------------------
  // Delegation metadata
  // -------------------------------------------------------------------------

  getDelegationMeta(sessionID: string): DelegationMeta | undefined {
    return this.sessionDelegationMeta.get(sessionID)
  }

  setDelegationMeta(sessionID: string, meta: DelegationMeta): void {
    this.sessionDelegationMeta.set(sessionID, meta)
  }

  hydrateDelegationState(sessionID: string, meta: DelegationMeta): void {
    this.sessionDelegationMeta.set(sessionID, meta)
    this.sessionToRoot.set(sessionID, meta.rootID)
    const budget = this.ensureRootBudget(meta.rootID)
    budget.descendants.add(sessionID)
  }

  // -------------------------------------------------------------------------
  // Subagent registry (OMO Pattern 10)
  // -------------------------------------------------------------------------

  registerSubagent(parentID: string, childID: string): void {
    let children = this.subagentSessions.get(parentID)
    if (!children) {
      children = new Set<string>()
      this.subagentSessions.set(parentID, children)
    }
    children.add(childID)
  }

  getSubagents(parentID: string): Set<string> {
    return this.subagentSessions.get(parentID) ?? new Set<string>()
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  forgetSession(sessionID: string): void {
    this.sessionStats.delete(sessionID)
    this.sessionDelegationMeta.delete(sessionID)
    const rootID = this.sessionToRoot.get(sessionID)
    if (rootID) {
      const budget = this.rootBudgets.get(rootID)
      if (budget) {
        budget.descendants.delete(sessionID)
        if (budget.descendants.size === 0 && budget.reserved === 0) {
          this.rootBudgets.delete(rootID)
        }
      }
    }
    this.sessionToRoot.delete(sessionID)
    this.subagentSessions.delete(sessionID)
  }

  clear(): void {
    this.rootBudgets.clear()
    this.sessionToRoot.clear()
    this.sessionStats.clear()
    this.sessionDelegationMeta.clear()
    this.subagentSessions.clear()
  }
}

// ---------------------------------------------------------------------------
// Singleton — shared process-wide state store
// ---------------------------------------------------------------------------

export const taskState = new TaskStateManager()

// ---------------------------------------------------------------------------
// Backward-compatible wrapper functions (thin delegation to singleton)
// All existing callers continue to work unchanged.
// ---------------------------------------------------------------------------

export function ensureSessionStats(sessionID: string): SessionStats {
  return taskState.ensureStats(sessionID)
}

export function getSessionStats(sessionID: string): SessionStats | undefined {
  return taskState.getStats(sessionID)
}

export function addWarning(sessionID: string, warning: string): void {
  taskState.addWarning(sessionID, warning)
}

export function reserveDescendant(
  rootID: string,
  maxDescendantsPerRoot: number
): number {
  return taskState.reserveDescendant(rootID, maxDescendantsPerRoot)
}

export function commitDescendant(rootID: string, sessionID: string): number {
  return taskState.commitDescendant(rootID, sessionID)
}

export function rollbackReservation(rootID: string): void {
  taskState.rollbackReservation(rootID)
}

export function forgetSession(sessionID: string): void {
  taskState.forgetSession(sessionID)
}

export function getDelegationMeta(
  sessionID: string
): DelegationMeta | undefined {
  return taskState.getDelegationMeta(sessionID)
}

export function setDelegationMeta(
  sessionID: string,
  meta: DelegationMeta
): void {
  taskState.setDelegationMeta(sessionID, meta)
}

export function hydrateDelegationState(
  sessionID: string,
  meta: DelegationMeta
): void {
  taskState.hydrateDelegationState(sessionID, meta)
}

export function inheritRootFromParent(
  sessionID: string,
  parentID: string
): void {
  taskState.inheritRootFromParent(sessionID, parentID)
}
