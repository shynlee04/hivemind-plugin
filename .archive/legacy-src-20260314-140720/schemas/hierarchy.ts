/**
 * Hierarchy Schema
 * 3-level context hierarchy: trajectory → tactic → action
 */

export type HierarchyLevel = "trajectory" | "tactic" | "action";
export type ContextStatus = "pending" | "active" | "complete" | "blocked";

export const MAX_HIERARCHY_LENGTH = 200;
export const MAX_HIERARCHY_WORDS = 30;

// Dead interface removed: ContextMap
// Preserved in git history — re-add when hierarchy mapping is needed.

export interface HierarchyState {
  trajectory: string;
  tactic: string;
  action: string;
}

/**
 * Normalize hierarchy text to bounded, compact values.
 */
export function validateHierarchyString(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/);
  const byWords = words.length > MAX_HIERARCHY_WORDS
    ? `${words.slice(0, MAX_HIERARCHY_WORDS).join(" ")}...`
    : trimmed;

  if (byWords.length <= MAX_HIERARCHY_LENGTH) return byWords;

  const maxContentLength = Math.max(0, MAX_HIERARCHY_LENGTH - 3);
  return `${byWords.slice(0, maxContentLength).trimEnd()}...`;
}

export function createHierarchyState(
  trajectory = "",
  tactic = "",
  action = ""
): HierarchyState {
  return {
    trajectory: validateHierarchyString(trajectory),
    tactic: validateHierarchyString(tactic),
    action: validateHierarchyString(action),
  };
}

export function updateHierarchyLevel(
  state: HierarchyState,
  level: HierarchyLevel,
  content: string
): HierarchyState {
  return { ...state, [level]: validateHierarchyString(content) };
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
