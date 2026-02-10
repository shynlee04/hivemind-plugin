/**
 * Hierarchy Schema
 * 3-level context hierarchy: trajectory → tactic → action
 */

export type HierarchyLevel = "trajectory" | "tactic" | "action";
export type ContextStatus = "pending" | "active" | "complete" | "blocked";

export interface ContextMap {
  level: HierarchyLevel;
  content: string;
  status: ContextStatus;
  timestamp: number;
}

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

export function validateHierarchyTransition(
  current: HierarchyLevel | "complete",
  next: HierarchyLevel
): boolean {
  const levels: HierarchyLevel[] = ["trajectory", "tactic", "action"];
  const currentIndex = levels.indexOf(current as HierarchyLevel);
  const nextIndex = levels.indexOf(next);
  
  // Allow same level or moving down (more specific)
  // Allow moving up only if current is complete
  return nextIndex >= currentIndex || current === "complete";
}

export function getLevelDepth(level: HierarchyLevel): number {
  const depths: Record<HierarchyLevel, number> = {
    trajectory: 1,
    tactic: 2,
    action: 3,
  };
  return depths[level];
}
