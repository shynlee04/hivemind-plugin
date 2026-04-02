import type { DelegationMeta, RootBudget, SessionStats } from "./types.js"

const rootBudgets = new Map<string, RootBudget>()
const sessionToRoot = new Map<string, string>()
const sessionStats = new Map<string, SessionStats>()
const sessionDelegationMeta = new Map<string, DelegationMeta>()

export function ensureSessionStats(sessionID: string): SessionStats {
  let stats = sessionStats.get(sessionID)
  if (!stats) {
    stats = {
      total: 0,
      byTool: {},
      loop: { signature: "", count: 0 },
      warnings: [],
    }
    sessionStats.set(sessionID, stats)
  }
  return stats
}

export function addWarning(sessionID: string, warning: string): void {
  const stats = ensureSessionStats(sessionID)
  if (stats.warnings.length < 25) {
    stats.warnings.push(warning)
  }
}

function ensureRootBudget(rootID: string): RootBudget {
  let budget = rootBudgets.get(rootID)
  if (!budget) {
    budget = {
      descendants: new Set<string>(),
      reserved: 0,
    }
    rootBudgets.set(rootID, budget)
  }
  return budget
}

export function reserveDescendant(rootID: string, maxDescendantsPerRoot: number): number {
  const budget = ensureRootBudget(rootID)
  const total = budget.descendants.size + budget.reserved
  if (total >= maxDescendantsPerRoot) {
    throw new Error(`[Harness] Root session ${rootID} exceeded descendant budget (${maxDescendantsPerRoot})`)
  }
  budget.reserved += 1
  return total + 1
}

export function commitDescendant(rootID: string, sessionID: string): number {
  const budget = ensureRootBudget(rootID)
  budget.reserved = Math.max(0, budget.reserved - 1)
  budget.descendants.add(sessionID)
  sessionToRoot.set(sessionID, rootID)
  return budget.descendants.size + budget.reserved
}

export function rollbackReservation(rootID: string): void {
  const budget = rootBudgets.get(rootID)
  if (!budget) {
    return
  }
  budget.reserved = Math.max(0, budget.reserved - 1)
}

export function forgetSession(sessionID: string): void {
  sessionStats.delete(sessionID)
  sessionDelegationMeta.delete(sessionID)
  const rootID = sessionToRoot.get(sessionID)
  if (!rootID) {
    return
  }
  const budget = rootBudgets.get(rootID)
  if (budget) {
    budget.descendants.delete(sessionID)
    if (budget.descendants.size === 0 && budget.reserved === 0) {
      rootBudgets.delete(rootID)
    }
  }
  sessionToRoot.delete(sessionID)
}

export function getSessionStats(sessionID: string): SessionStats | undefined {
  return sessionStats.get(sessionID)
}

export function getDelegationMeta(sessionID: string): DelegationMeta | undefined {
  return sessionDelegationMeta.get(sessionID)
}

export function setDelegationMeta(sessionID: string, meta: DelegationMeta): void {
  sessionDelegationMeta.set(sessionID, meta)
}

export function hydrateDelegationState(sessionID: string, meta: DelegationMeta): void {
  sessionDelegationMeta.set(sessionID, meta)
  sessionToRoot.set(sessionID, meta.rootID)
  const budget = ensureRootBudget(meta.rootID)
  budget.descendants.add(sessionID)
}

export function inheritRootFromParent(sessionID: string, parentID: string): void {
  const rootID = sessionToRoot.get(parentID) ?? parentID
  sessionToRoot.set(sessionID, rootID)
}
