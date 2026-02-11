/**
 * Hierarchy Schema
 * 3-level context hierarchy: trajectory → tactic → action
 */

export type HierarchyLevel = "trajectory" | "tactic" | "action";
export type ContextStatus = "pending" | "active" | "complete" | "blocked";

// Dead interface removed: ContextMap
// Preserved in git history — re-add when hierarchy mapping is needed.

export interface HierarchyState {
  trajectory: string;
  tactic: string;
  action: string;
}

export function createHierarchyState(
  trajectory = "",
  tactic = "",
  action = ""
): HierarchyState {
  return { trajectory, tactic, action };
}

export function updateHierarchyLevel(
  state: HierarchyState,
  level: HierarchyLevel,
  content: string
): HierarchyState {
  return { ...state, [level]: content };
}

// Dead function removed: validateHierarchyTransition
// Preserved in git history — re-add when hierarchy validation is needed.

export function getLevelDepth(level: HierarchyLevel): number {
  const depths: Record<HierarchyLevel, number> = {
    trajectory: 1,
    tactic: 2,
    action: 3,
  };
  return depths[level];
}
